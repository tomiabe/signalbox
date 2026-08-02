<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckCircle2, XCircle, Loader2, Sparkles, RefreshCw, ListChecks } from 'lucide-vue-next'
import { useWorkspaceStore } from '../stores/workspace'
import type { Diagnosis } from '../lib/llm'

const ws = useWorkspaceStore()

const applying = ref(false)

async function applyFix() {
  if (ws.running) return
  applying.value = true
  try {
    await ws.run(true)
  } finally {
    applying.value = false
  }
}

async function rerun() {
  if (ws.running) return
  await ws.run(false)
}

watch(
  () => ws.stage,
  () => {
    applying.value = false
  },
)

function dx(): Diagnosis | null {
  return ws.diagnosis
}
</script>

<template>
  <div v-if="ws.result" class="results">
    <!-- Checks row -->
    <section class="checks" aria-label="Simulation checks">
      <div class="sec-head">
        <span class="sec-title"><ListChecks :size="14" /> checks</span>
        <span class="mono sec-hint">{{ ws.result.checks.filter((c) => c.pass).length }}/{{ ws.result.checks.length }} pass</span>
      </div>
      <div class="check-grid">
        <article v-for="c in ws.result.checks" :key="c.id" class="check" :class="{ pass: c.pass }">
          <div class="c-top">
            <span class="c-status">
              <CheckCircle2 v-if="c.pass" :size="16" aria-hidden="true" />
              <XCircle v-else :size="16" aria-hidden="true" />
              <span class="visually-hidden">{{ c.pass ? 'Passed' : 'Failed' }}: {{ c.name }}</span>
            </span>
            <div class="c-main">
              <span class="c-name mono">{{ c.id }}</span>
              <span class="c-desc">{{ c.desc }}</span>
            </div>
          </div>
          <div v-if="c.detail" class="c-meta">
            <span class="c-row"><em>expected</em>{{ c.detail.expected }}</span>
            <span class="c-row" :class="{ bad: !c.pass }"><em>actual</em>{{ c.detail.actual }}</span>
          </div>
        </article>
      </div>
    </section>

    <!-- Diagnosis (post-run, only on failure) -->
    <section v-if="!ws.result.converged && ws.stage === 'diagnose'" class="diagnosis" aria-label="Diagnosis">
      <div class="dx-head">
        <span class="dx-icon"><Sparkles :size="15" /></span>
        <div class="dx-title-wrap">
          <span class="dx-kicker">AI diagnosis</span>
          <h3 class="dx-title">{{ dx()?.headline }}</h3>
        </div>
      </div>
      <p class="dx-body">{{ dx()?.rootCause }}</p>

      <div v-if="dx()?.evidence?.length" class="dx-evidence">
        <div v-for="(e, i) in dx()?.evidence" :key="i" class="ev">
          <span class="ev-key mono">{{ e.checkId }}</span>
          <div class="ev-txt">
            <span class="ev-cycles mono">{{ e.cycles }}</span>
            <span class="ev-note">{{ e.note }}</span>
          </div>
        </div>
      </div>

      <div class="dx-fix">
        <div class="dx-fix-label">proposed fix · register the write strobe</div>
        <div class="dx-fix-code mono">{{ ws.preset.fixedDesc }}</div>
      </div>

      <div class="dx-actions">
        <button class="btn btn-accent" :disabled="ws.running || applying" @click="applyFix">
          <span v-if="applying || ws.running"><Loader2 class="spin" :size="15" /></span>
          <Sparkles v-else :size="15" />
          <template v-if="applying">Re-verifying…</template>
          <template v-else>Apply fix &amp; re-verify</template>
        </button>
        <button class="btn btn-ghost" :disabled="ws.running" @click="rerun">
          <RefreshCw :size="15" />
          Re-run unfixed
        </button>
      </div>
    </section>

    <!-- Converged -->
    <section v-else-if="ws.result.converged" class="converged">
      <div class="cv-check">
        <CheckCircle2 :size="22" />
      </div>
      <div>
        <h3 class="cv-title">Verified · converged in {{ ws.result.iterations }} iterations</h3>
        <p class="cv-sub">All {{ ws.result.checks.length }} checks pass. Datapath is backpressure-safe and credit-consistent.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  color: var(--text-2);
}
.sec-hint {
  font-size: 11.5px;
  color: var(--text-3);
}
.check-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}
.check {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-1);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.2s var(--ease-out);
}
.check.pass {
  border-color: var(--signal-green-soft);
}
.c-top {
  display: flex;
  gap: 10px;
}
.c-status {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  flex-shrink: 0;
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
  gap: 2px;
  min-width: 0;
}
.c-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-0);
}
.c-desc {
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-2);
}
.c-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  font-size: 11.5px;
}
.c-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--text-1);
}
.c-row em {
  font-style: normal;
  color: var(--text-3);
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.05em;
  padding-top: 1px;
}
.c-row.bad {
  color: var(--err);
}

.diagnosis {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-1);
  padding: 18px;
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
  border-radius: 9px;
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
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent-strong);
}
.dx-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
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
  display: flex;
  gap: 10px;
  padding: 9px 11px;
  border-radius: var(--radius-md);
  background: var(--bg-2);
  border: 1px solid var(--border);
}
.ev-key {
  font-size: 11px;
  font-weight: 600;
  color: var(--err);
  background: var(--signal-red-soft);
  padding: 3px 7px;
  border-radius: 5px;
  height: fit-content;
  flex-shrink: 0;
}
.ev-txt {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--text-1);
}
.ev-cycles {
  font-size: 10.5px;
  color: var(--text-3);
}
.dx-fix {
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  padding: 11px 13px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg-2);
}
.dx-fix-label {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--accent-strong);
}
.dx-fix-code {
  font-size: 12px;
  color: var(--text-1);
  white-space: pre-wrap;
  line-height: 1.6;
}
.dx-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.converged {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--signal-green-soft);
  background: var(--signal-green-soft);
}
.cv-check {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: var(--ok);
  background: var(--bg-1);
  flex-shrink: 0;
  border: 1px solid var(--signal-green-soft);
}
.cv-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.cv-sub {
  font-size: 13px;
  color: var(--text-1);
  margin-top: 3px;
  line-height: 1.5;
}
.spin {
  animation: sb-spin 0.8s linear infinite;
}
</style>