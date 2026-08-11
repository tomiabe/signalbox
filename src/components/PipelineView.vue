<script setup lang="ts">
import { computed } from 'vue'
import { Braces, ClipboardCheck, Cpu, DatabaseZap, FileWarning, ShieldCheck } from 'lucide-vue-next'
import type { SimResult } from '../engine/types'

const props = defineProps<{ result: SimResult | null }>()

const cap = computed(() => Math.max(1, props.result?.capacity ?? 8))
const occ = computed(() => props.result ? Math.round(props.result.maxOccupancy) : 0)
const pct = computed(() => Math.min(100, Math.round((occ.value / cap.value) * 100)))
const beats = computed(() => props.result?.totalBeats ?? 0)
const stalled = computed(() => props.result?.stalledCycles ?? 0)

const steps = computed(() => [
  { key: 'intent', label: 'Intent', sub: 'plain language', icon: Braces, state: 'ok' },
  { key: 'model', label: 'Model', sub: `${cap.value} slot FIFO`, icon: Cpu, state: props.result ? 'ok' : 'idle' },
  { key: 'replay', label: 'Replay', sub: props.result ? `${beats.value} beats` : 'pending', icon: DatabaseZap, state: props.result ? 'ok' : 'idle' },
  {
    key: 'evidence',
    label: 'Evidence',
    sub: props.result ? `${stalled.value} stalled cycles` : 'not collected',
    icon: props.result?.converged ? ShieldCheck : FileWarning,
    state: props.result?.converged ? 'ok' : props.result ? 'fail' : 'idle',
  },
  { key: 'review', label: 'Review', sub: props.result?.converged ? 'verified' : props.result ? 'needs patch' : 'waiting', icon: ClipboardCheck, state: props.result?.converged ? 'ok' : props.result ? 'fail' : 'idle' },
])
</script>

<template>
  <section class="pipe" aria-label="Evidence pipeline">
    <div class="pipe-head">
      <div>
        <span class="eyebrow mono">evidence graph</span>
        <h2>Intent, model, replay, and review stay tied to one packet.</h2>
      </div>
      <div class="meter" role="img" :aria-label="`${occ} of ${cap} FIFO slots occupied at peak`">
        <span class="meter-label">peak FIFO</span>
        <span class="meter-bar"><i :style="{ width: pct + '%' }"></i></span>
        <span class="meter-value mono">{{ occ }}/{{ cap }}</span>
      </div>
    </div>

    <div class="flow">
      <article v-for="(step, idx) in steps" :key="step.key" class="node" :data-state="step.state">
        <component :is="step.icon" :size="17" />
        <span class="n-name">{{ step.label }}</span>
        <span class="n-sub mono">{{ step.sub }}</span>
        <i v-if="idx < steps.length - 1" class="connector" aria-hidden="true"></i>
      </article>
    </div>
  </section>
</template>

<style scoped>
.pipe {
  display: flex;
  flex-direction: column;
  gap: 16px;
  container-type: inline-size;
}
.pipe-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}
.eyebrow {
  display: block;
  margin-bottom: 5px;
  color: var(--signal-cyan);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.pipe h2 {
  font-size: 18px;
  line-height: 1.3;
  font-weight: 650;
  letter-spacing: 0;
  max-width: 560px;
}
.meter {
  display: grid;
  grid-template-columns: auto 86px auto;
  align-items: center;
  gap: 8px;
  min-width: 220px;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-2);
}
.meter-label {
  font-size: 11px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.meter-bar {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--bg-3);
  overflow: hidden;
}
.meter-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--signal-cyan), var(--signal-green));
}
.meter-value {
  font-size: 12px;
  color: var(--text-0);
}
.flow {
  display: grid;
  grid-template-columns: repeat(5, minmax(118px, 1fr));
  gap: 10px;
}
.node {
  position: relative;
  min-height: 106px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-2);
  color: var(--text-2);
}
.node svg {
  color: var(--text-3);
}
.node[data-state='ok'] {
  border-color: color-mix(in srgb, var(--signal-green) 28%, var(--border));
  background: color-mix(in srgb, var(--signal-green-soft) 48%, var(--bg-2));
}
.node[data-state='ok'] svg {
  color: var(--ok);
}
.node[data-state='fail'] {
  border-color: color-mix(in srgb, var(--signal-red) 30%, var(--border));
  background: color-mix(in srgb, var(--signal-red-soft) 54%, var(--bg-2));
}
.node[data-state='fail'] svg {
  color: var(--err);
}
.n-name {
  font-size: 13px;
  font-weight: 650;
  color: var(--text-0);
}
.n-sub {
  font-size: 10.5px;
  color: var(--text-3);
  overflow-wrap: anywhere;
}
.connector {
  position: absolute;
  right: -10px;
  top: 50%;
  width: 10px;
  height: 1px;
  background: var(--border-strong);
}
@container (max-width: 680px) {
  .flow {
    grid-template-columns: repeat(3, minmax(118px, 1fr));
  }
  .connector {
    display: none;
  }
}
@container (max-width: 420px) {
  .pipe-head {
    flex-direction: column;
  }
  .meter {
    width: 100%;
    min-width: 0;
  }
  .flow {
    grid-template-columns: 1fr;
  }
}
</style>
