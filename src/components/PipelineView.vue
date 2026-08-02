<script setup lang="ts">
import { computed } from 'vue'
import type { SimResult } from '../engine/types'

const props = defineProps<{ result: SimResult | null }>()

const cap = computed(() => Math.max(1, props.result?.capacity ?? 8))
const occ = computed(() => props.result ? Math.round(props.result.maxOccupancy) : 0)
const pct = computed(() => Math.min(100, Math.round((occ.value / cap.value) * 100)))
const pctFree = computed(() => Math.max(0, 100 - pct.value))

const beats = computed(() => props.result?.totalBeats ?? 0)
const stalled = computed(() => props.result?.stalledCycles ?? 0)
</script>

<template>
  <div class="pipe" aria-label="Producer to FIFO to consumer datapath">
    <div class="node master">
      <span class="node-ring mr" aria-hidden="true"></span>
      <div class="node-body">
        <span class="n-name">master</span>
        <span class="n-sub mono">bursty producer</span>
      </div>
      <div v-if="stalled > 0" class="n-badge err">stalled</div>
    </div>

    <div class="link" aria-hidden="true"><span class="link-label mono">vld/rdy</span></div>

    <div class="node fifo">
      <span class="node-ring fi" aria-hidden="true"></span>
      <div class="node-body">
        <span class="n-name">FIFO</span>
        <span class="n-sub mono">depth {{ cap }}</span>
      </div>
      <div class="fifo-meter" :title="`${occ}/${cap} slots occupied`" role="img" :aria-label="`${occ} of ${cap} FIFO slots occupied`">
        <span class="fm-used" :style="{ flexBasis: pct + '%' }"></span>
        <span class="fm-free" :style="{ flexBasis: pctFree + '%' }"></span>
      </div>
      <div class="n-badge">
        <i class="counting">{{ occ }}</i>/{{ cap }}
      </div>
    </div>

    <div class="link v2" aria-hidden="true"><span class="link"></span></div>

    <div class="node consumer">
      <span class="node-ring cr" aria-hidden="true"></span>
      <div class="node-body">
        <span class="n-name">consumer</span>
        <span class="n-sub mono">drains {{ beats }} beats</span>
      </div>
    </div>

    <div class="credits" aria-label="Available credits">
      <span class="credits-label">credits</span>
      <span class="credits-val mono">{{ result?.trace?.[0]?.credits ?? '–' }}</span>
    </div>
  </div>
</template>

<style scoped>
.pipe {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  position: relative;
  padding-bottom: 8px;
}
.node {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  padding: 14px 16px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-2);
  min-width: 130px;
  position: relative;
}
.node-ring {
  width: 30px;
  height: 30px;
  border-radius: 50%;
}
.mr { background: var(--accent-soft); border: 1px solid var(--accent); box-shadow: 0 0 0 4px var(--accent-softer); }
.fi { background: var(--signal-green-soft); border: 1px solid var(--signal-green); box-shadow: 0 0 0 4px var(--signal-green-soft); }
.cr { background: var(--border); border: 1px solid var(--border-strong); }
.node-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.n-name {
  font-size: 13px;
  font-weight: 600;
}
.n-sub {
  font-size: 10.5px;
  color: var(--text-3);
}
.n-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.n-badge.err {
  color: var(--err);
  background: var(--signal-red-soft);
}
.n-badge:not(.err) {
  color: var(--text-2);
  background: var(--bg-1);
  border: 1px solid var(--border);
}
.n-badge .counting { font-style: normal; font-weight: 700; color: var(--signal-green); }
.fifo-meter {
  display: flex;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: var(--border);
  margin-top: 2px;
}
.fm-used { background: var(--signal-green); transition: flex-basis 0.4s var(--ease-out); }
.fm-free { background: var(--bg-3); }
.link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 0 0 44px;
  height: 2px;
  background: var(--border-strong);
  border-radius: 2px;
  position: relative;
  opacity: 0.7;
}
.link.v2 { opacity: 0.5; }
.link .link { flex: 0 0 12px; width: 12px; height: 2px; background: var(--accent-strong); opacity: 1; }
.credits {
  position: absolute;
  right: 4px;
  bottom: -2px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0px;
}
.credits-label { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; }
.credits-val { font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: var(--text-0); }
</style>