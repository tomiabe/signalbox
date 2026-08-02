import type { SimResult } from '../engine/types'

const KEY_STORAGE = 'signalbox-key'
const BASE_STORAGE = 'signalbox-api-base'

export function getConfigured(): { key: string; base: string } | null {
  const key = localStorage.getItem(KEY_STORAGE)?.trim()
  return key ? { key, base: localStorage.getItem(BASE_STORAGE) || 'https://api.openai.com/v1' } : null
}

export function setKey(key: string, base: string) {
  localStorage.setItem(KEY_STORAGE, key.trim())
  localStorage.setItem(BASE_STORAGE, base.trim())
}

const SYSTEM_PROMPT = `You are SMELTR, a verification coach inside a hardware design workspace.
You explain simulation failures to engineers with precision. Be concise, technical, and calm.
Refer to check names and concrete numbers already present in the conversation. Do not invent checks.`

async function callLLM(messages: { role: string; content: string }[]): Promise<string> {
  const cfg = getConfigured()
  if (!cfg) throw new Error('no-key')
  const res = await fetch(`${cfg.base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`llm ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
}

// --- Offline fallback: deterministic, referenced to the actual sim numbers.

export interface Diagnosis {
  diagnosis: 'failed'
  headline: string
  rootCause: string
  evidence: { checkId: string; cycles: string; note: string }[]
  fix: string
  // Cycle regions that explain the failure, to spotlight in the timeline.
  spans: { checkId: string; label: string; start: number; end: number }[]
}

export function spansFor(sim: SimResult): Diagnosis['spans'] {
  const t = sim.trace
  if (!t.length) return []

  // Longest contiguous starvation window (drive tb_starvation_window).
  let sStart = -1
  let sLen = 0
  let cur = -1
  let len = 0
  for (let i = 0; i < t.length; i++) {
    if (t[i].producerState === 'stalled') {
      if (cur === -1) cur = i
      len++
      if (len > sLen) {
        sLen = len
        sStart = cur
      }
    } else {
      cur = -1
      len = 0
    }
  }

  // First dropped-beat region (drive tb_credit_integrity).
  const firstDrop = t.findIndex((c) => c.beatStuck)
  let dropEnd = firstDrop
  if (firstDrop >= 0) {
    dropEnd = firstDrop
    while (dropEnd + 1 < t.length && t[dropEnd + 1].beatStuck) dropEnd++
  }

  const spans: Diagnosis['spans'] = []
  if (sStart >= 0)
    spans.push({ checkId: 'tb_starvation_window', label: 'starvation window', start: sStart, end: sStart + sLen - 1 })
  if (firstDrop >= 0)
    spans.push({ checkId: 'tb_credit_integrity', label: 'credit leak at RMW', start: firstDrop, end: dropEnd })
  spans.push({ checkId: 'tb_throughput', label: 'full run', start: 0, end: t.length - 1 })
  return spans
}

export function buildLocalDiagnosis(sim: SimResult, remedy: string): Diagnosis {
  const integrity = sim.checks.find((c) => c.id === 'tb_credit_integrity')
  const stall = sim.checks.find((c) => c.id === 'tb_no_starvation')
  const through = sim.checks.find((c) => c.id === 'tb_throughput')

  return {
    diagnosis: 'failed',
    headline: 'TB_CREDIT_INTEGRITY fails: credits leak on the RMW path.',
    rootCause:
      "An RMW beat accepted while the FIFO is within two slots of full is dropped on a misaligned write strobe. It is never drained by the consumer, so its credit is never returned. Over a bursty window this silently depletes available credits.",
    evidence: [
      {
        checkId: 'tb_credit_integrity',
        cycles: `RMW path · ${integrity?.detail?.actual ?? 'n/a'}`,
        note: 'Credits are deducted once, but the beat is not latched, so the consumer never drains it and never returns the credit.',
      },
      {
        checkId: 'tb_no_starvation',
        cycles: `observed ${stall?.detail?.actual ?? 'n/a'}`,
        note: 'Once credits dry up, the producer stalls until the consumer returns credits on other, correctly-drained beats — this is why the failure is transient and self-healing.',
      },
      {
        checkId: 'tb_throughput',
        cycles: `sustained ${through?.pass ? 'ok' : 'below target'}`,
        note: `${through?.pass ? 'Throughput holds, so the trigger is conditional, not constant.' : 'Throughput drags from repeated starvation windows.'}`,
      },
    ],
    fix: remedy,
    spans: spansFor(sim),
  }
}

export async function generateDiagnosis(
  sim: SimResult,
  remedy: string,
  intent: string,
): Promise<Diagnosis> {
  const cfg = getConfigured()
  if (!cfg) return buildLocalDiagnosis(sim, remedy)

  const summary = sim.checks
    .map((c) => `- ${c.name} [${c.pass ? 'PASS' : 'FAIL'}] ${c.detail?.actual ?? ''}`)
    .join('\n')
  try {
    const raw = await callLLM([
      {
        role: 'user',
        content: `Intent: ${intent}\nRemedy: ${remedy}\n\nSimulation checks:\n${summary}\n\nReturn a concise diagnosis: headline, root cause, 3 evidence lines referencing real check ids, and one recommended fix.`,
      },
    ])
    return {
      diagnosis: 'failed',
      headline: raw.split('\n')[0] || 'Simulation did not converge.',
      rootCause: raw,
      evidence: [],
      fix: remedy,
      spans: spansFor(sim),
    }
  } catch {
    return buildLocalDiagnosis(sim, remedy)
  }
}

export { KEY_STORAGE, BASE_STORAGE }