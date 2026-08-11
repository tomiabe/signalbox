<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CheckCircle2, CircleAlert, Download, FileCheck2, Loader2, RefreshCw, Sparkles, XCircle } from 'lucide-vue-next'
import { useWorkspaceStore } from '../stores/workspace'
import type { Diagnosis } from '../lib/llm'

const ws = useWorkspaceStore()
const applying = ref(false)
const reloading = ref(false)
const isEval = computed(() => ws.preset.scenario.id === 'eval-regression')
const successCopy = computed(() =>
  isEval.value
    ? 'All checks pass. The evaluation replay is deterministic, the data sources are governed, and the evidence packet can be reviewed without trusting the model blindly.'
    : 'All checks pass. The replay is deterministic, the patch is scoped, and the evidence packet can be reviewed without trusting the model blindly.',
)

async function applyFix() {
  if (ws.running || reloading.value) return
  applying.value = true
  try {
    await ws.run(true)
  } finally {
    applying.value = false
  }
}

async function rerun() {
  if (ws.running || applying.value) return
  reloading.value = true
  try {
    await ws.run(false)
  } finally {
    reloading.value = false
  }
}

watch(
  () => ws.stage,
  () => {
    applying.value = false
    reloading.value = false
  },
)

function dx(): Diagnosis | null {
  return ws.diagnosis
}

function exportPacket() {
  if (!ws.result) return

  const lines = [
    'SignalBox Evidence Packet',
    `scenario: ${ws.preset.scenario.name}`,
    `id: ${ws.preset.scenario.id}`,
    `status: ${ws.result.converged ? 'verified' : 'needs review'}`,
    `seed: ${ws.preset.scenario.seed}`,
    `cycles: ${ws.result.trace.length}`,
    '',
    'Intent',
    ws.preset.intent,
    '',
    'Derived Contract',
    ...ws.preset.known.map((item) => `- ${item}`),
    '',
    'Evidence Artifacts',
    ...ws.preset.evidence.map((item) => `- ${item}`),
    '',
    'Provenance',
    ...ws.preset.provenance.map((item) => `- ${item}`),
    '',
    'Verification',
    ...ws.result.checks.map((check) => {
      const actual = check.detail ? ` actual=${check.detail.actual}; expected=${check.detail.expected}` : ''
      return `- ${check.id}: ${check.pass ? 'PASS' : 'FAIL'};${actual} ${check.desc}`
    }),
    '',
    'Machine Diagnosis',
    dx()?.headline ?? (ws.result.converged ? 'All checks pass.' : 'No diagnosis available.'),
    dx()?.rootCause ?? '',
    '',
    'Proposed Patch',
    ws.preset.fixedDesc,
    '',
    'Trace',
    'cycle,state,beat,occupancy,credits,events',
    ...ws.result.trace.map((c) => [
      c.cycle,
      c.producerState,
      c.producerBeat ?? 'none',
      c.occupancy,
      c.credits,
      c.events.join('|') || 'none',
    ].join(',')),
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `signalbox_evidence_${ws.preset.scenario.id}.txt`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <aside v-if="ws.result" class="results" aria-label="Evidence review">
    <section class="panel checks" aria-label="Verification checks">
      <div class="sec-head">
        <span class="sec-title"><FileCheck2 :size="14" /> Verification</span>
        <span class="mono sec-hint">{{ ws.result.checks.filter((c) => c.pass).length }}/{{ ws.result.checks.length }} pass</span>
      </div>

      <div class="check-list">
        <article v-for="c in ws.result.checks" :key="c.id" class="check" :class="{ pass: c.pass }">
          <div class="c-status">
            <CheckCircle2 v-if="c.pass" :size="16" aria-hidden="true" />
            <XCircle v-else :size="16" aria-hidden="true" />
            <span class="visually-hidden">{{ c.pass ? 'Passed' : 'Failed' }}: {{ c.name }}</span>
          </div>
          <div class="c-main">
            <div class="c-title-row">
              <span class="c-name mono">{{ c.id }}</span>
              <span class="c-pill">{{ c.pass ? 'pass' : 'fail' }}</span>
            </div>
            <p>{{ c.desc }}</p>
            <div v-if="c.detail" class="c-meta">
              <span><em>expected</em>{{ c.detail.expected }}</span>
              <span :class="{ bad: !c.pass }"><em>actual</em>{{ c.detail.actual }}</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section v-if="!ws.result.converged && ws.stage === 'diagnose'" class="panel diagnosis" aria-label="Diagnosis">
      <div class="dx-head">
        <span class="dx-icon"><Sparkles :size="15" /></span>
        <div class="dx-title-wrap">
          <span class="dx-kicker">Machine note</span>
          <h3 class="dx-title">{{ dx()?.headline }}</h3>
        </div>
      </div>

      <p class="dx-body">{{ dx()?.rootCause }}</p>

      <div v-if="dx()?.evidence?.length" class="dx-evidence">
        <div v-for="(e, i) in dx()?.evidence" :key="i" class="ev">
          <span class="ev-key mono">{{ e.checkId }}</span>
          <span class="ev-cycles mono">{{ e.cycles }}</span>
          <span class="ev-note">{{ e.note }}</span>
        </div>
      </div>

      <div class="dx-fix">
        <div class="dx-fix-label"><CircleAlert :size="13" /> Proposed patch</div>
        <pre class="dx-fix-code mono">{{ ws.preset.fixedDesc }}</pre>
      </div>

      <div class="dx-actions">
        <button class="btn btn-accent" :disabled="ws.running || applying || reloading" @click="applyFix">
          <span v-if="applying || ws.running"><Loader2 class="spin" :size="15" /></span>
          <Sparkles v-else :size="15" />
          <template v-if="applying">Re-verifying</template>
          <template v-else>Apply patch and verify</template>
        </button>
        <button class="btn btn-ghost" :disabled="ws.running || applying || reloading" @click="rerun">
          <span v-if="reloading"><Loader2 class="spin" :size="15" /></span>
          <RefreshCw v-else :size="15" />
          {{ reloading ? 'Re-running' : 'Re-run failing case' }}
        </button>
        <button class="btn btn-outline" :disabled="ws.running || applying || reloading" @click="exportPacket">
          <Download :size="15" />
          Export packet
        </button>
      </div>
    </section>

    <section v-else-if="ws.result.converged" class="panel converged">
      <div class="cv-check">
        <CheckCircle2 :size="22" />
      </div>
      <div>
        <h3 class="cv-title">Verified in {{ ws.result.iterations }} iterations</h3>
        <p class="cv-sub">{{ successCopy }}</p>
        <button class="btn btn-outline compare" :disabled="ws.running || applying || reloading" @click="rerun">
          <span v-if="reloading"><Loader2 class="spin" :size="15" /></span>
          <RefreshCw v-else :size="15" />
          Restore failing packet
        </button>
        <button class="btn btn-outline compare" :disabled="ws.running || applying || reloading" @click="exportPacket">
          <Download :size="15" />
          Export packet
        </button>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.results {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-1);
  padding: 14px;
}
.sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.sec-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-1);
}
.sec-hint {
  font-size: 11.5px;
  color: var(--text-2);
}
.check-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.check {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-2);
}
.check.pass {
  border-color: color-mix(in srgb, var(--signal-green) 28%, var(--border));
}
.c-status {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  color: var(--err);
  background: var(--signal-red-soft);
}
.check.pass .c-status {
  color: var(--ok);
  background: var(--signal-green-soft);
}
.c-main {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}
.c-title-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}
.c-name {
  font-size: 12px;
  font-weight: 650;
  color: var(--text-0);
  overflow-wrap: anywhere;
}
.c-pill {
  padding: 2px 7px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  color: var(--text-2);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.check.pass .c-pill {
  color: var(--ok);
  background: var(--signal-green-soft);
  border-color: transparent;
}
.check:not(.pass) .c-pill {
  color: var(--err);
  background: var(--signal-red-soft);
  border-color: transparent;
}
.c-main p {
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-1);
}
.c-meta {
  display: grid;
  gap: 5px;
  padding-top: 9px;
  border-top: 1px solid var(--border);
}
.c-meta span {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 11.5px;
  color: var(--text-1);
}
.c-meta em {
  font-style: normal;
  color: var(--text-2);
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.05em;
}
.c-meta .bad {
  color: var(--err);
}
.diagnosis {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dx-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.dx-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--accent-strong);
  background: var(--accent-soft);
  flex-shrink: 0;
}
.dx-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dx-kicker {
  font-size: 10.5px;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent-strong);
}
.dx-title {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0;
  line-height: 1.35;
}
.dx-body {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-1);
}
.dx-evidence {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ev {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 10px;
  padding: 10px 11px;
  border-radius: var(--radius-md);
  background: var(--bg-2);
  border: 1px solid var(--border);
}
.ev-key {
  font-size: 11px;
  font-weight: 650;
  color: var(--err);
}
.ev-cycles {
  font-size: 10.5px;
  color: var(--text-2);
  text-align: right;
}
.ev-note {
  grid-column: 1 / -1;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-1);
}
.dx-fix {
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  padding: 11px 13px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-2);
}
.dx-fix-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--accent-strong);
}
.dx-fix-code {
  font-size: 12px;
  color: var(--text-1);
  white-space: pre-wrap;
  line-height: 1.6;
  margin: 0;
}
.dx-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dx-actions .btn {
  flex: 1 1 150px;
}
.converged {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  border-color: color-mix(in srgb, var(--signal-green) 34%, var(--border));
  background: var(--signal-green-soft);
}
.cv-check {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: var(--ok);
  background: var(--bg-1);
  flex-shrink: 0;
  border: 1px solid var(--signal-green-soft);
}
.cv-title {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0;
}
.cv-sub {
  font-size: 13px;
  color: var(--text-1);
  margin-top: 3px;
  line-height: 1.5;
}
.compare {
  margin-top: 12px;
}
.spin {
  animation: sb-spin 0.8s linear infinite;
}

@media (max-width: 520px) {
  .panel {
    padding: 12px;
  }
  .check {
    grid-template-columns: 1fr;
  }
  .c-status {
    width: 28px;
    height: 28px;
  }
  .c-title-row,
  .c-meta span {
    align-items: flex-start;
    flex-direction: column;
  }
  .dx-actions {
    display: grid;
    grid-template-columns: 1fr;
  }
  .dx-actions .btn,
  .compare {
    width: 100%;
  }
  .converged {
    flex-direction: column;
  }
}
</style>
