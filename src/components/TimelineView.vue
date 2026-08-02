<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { Crosshair } from 'lucide-vue-next'
import type { SimResult } from '../engine/types'
import type { Diagnosis } from '../lib/llm'

const props = defineProps<{
  result: SimResult | null
  spans?: Diagnosis['spans']
}>()

const sel = ref<number | null>(null)
const hover = ref<number | null>(null)
const focus = ref<number | null>(null) // index of the active span
const scroller = ref<HTMLElement | null>(null)

const trace = computed(() => props.result?.trace ?? [])
const cap = computed(() => Math.max(1, props.result?.maxOccupancy ?? 1))

// Map a cycle index to its span kind ('' if none).
function kindAt(i: number): string | undefined {
  if (!props.spans) return undefined
  for (const s of props.spans) if (i >= s.start && i <= s.end) return s.checkId
  return undefined
}

function band(cycleIdx: number) {
  const i = cycleIdx
  const t = trace.value[i]
  const hl = kindAt(i) ?? ''
  if (!t) return { class: 'idle', pct: 6, hl: '' }
  const pct = Math.max(4, Math.round((t.occupancy / cap.value) * 100))
  let cls = 'idle'
  if (t.producerState === 'stalled') cls = 'stall'
  else if (t.beatStuck) cls = 'drop'
  else if (t.consumerPop) cls = 'drain'
  else if (t.producerBeat) cls = 'produce'
  return { class: cls, pct, hl }
}

const idx = computed(() => sel.value ?? hover.value ?? trace.value.length - 1)
const activeCycle = computed(() => trace.value[idx.value] ?? null)

const focusSpan = computed(() => (focus.value != null && props.spans ? props.spans[focus.value] : null))

watch(focusSpan, async (s) => {
  if (s && scroller.value) {
    await nextTick()
    const total = trace.value.length || 1
    const ratio = s.start / total
    const raw = scroller.value.scrollWidth - scroller.value.clientWidth
    scroller.value.scrollTo({ left: raw * ratio - 40, behavior: 'smooth' })
    sel.value = s.start
  }
})

function setFocus(tagIdx: number) {
  focus.value = tagIdx
}

function clear() {
  focus.value = null
  sel.value = null
}

function spanLabel(c: (typeof trace.value)[number] | null) {
  if (!c) return '–'
  if (c.producerState === 'stalled') return 'stalled · backpressure'
  if (c.missedCredit) return 'credit leak'
  if (c.producerBeat) return 'producing'
  return 'idle'
}
</script>

<template>
  <div class="tl">
    <div class="tl-head">
      <div class="legend">
        <span class="lg"><i class="sw produce" /></span>produces
        <span class="lg"><i class="sw drain" /></span>drains
        <span class="lg"><i class="sw drop" /></span>dropped
        <span class="lg"><i class="sw stall" /></span>stalled
      </div>
      <div class="tl-tools">
        <template v-if="spans && spans.length">
          <button
            v-for="(s, i) in spans"
            :key="s.checkId"
            class="span-chip"
            :class="{ on: focus === i }"
            :aria-pressed="focus === i"
            @click="focus === i ? clear() : setFocus(i)"
          >
            <Crosshair :size="11" />
            {{ s.label }}
          </button>
        </template>
        <span class="tl-hint mono">{{ trace.length }} cyc</span>
      </div>
    </div>

    <div
      ref="scroller"
      class="tl-body"
      role="group"
      aria-label="Simulation timeline, one column per clock cycle"
    >
      <button
        v-for="(t, i) in trace"
        :key="t.cycle"
        class="cell"
        :class="[band(i).class, { hl: band(i).hl }]"
        :data-hl="band(i).hl"
        :style="{ height: band(i).pct + '%' }"
        :title="`cycle ${t.cycle}: ${t.producerState} · occupancy ${t.occupancy} · credits ${t.credits}`"
        :aria-label="`cycle ${t.cycle}: ${t.producerState}, occupancy ${t.occupancy}, credits ${t.credits}`"
        @mouseenter="hover = i"
        @mouseleave="hover = null"
        @click="sel = i"
      ></button>
    </div>

    <div class="tl-foot mono">
      <span>c</span><b class="cnum">{{ activeCycle ? activeCycle.cycle : '–' }}</b>
      <span class="sep">·</span>
      <span>occ</span><b>{{ activeCycle ? activeCycle.occupancy : '–' }}<i>/{{ cap }}</i></b>
      <span class="sep">·</span>
      <span>cred</span><b>{{ activeCycle ? activeCycle.credits : '–' }}</b>
      <span class="sep">·</span>
      <span class="active" :title="activeCycle ? activeCycle.events.join(', ') : ''">
        {{ spanLabel(activeCycle) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
export default { inheritAttrs: false }
</script>

<style scoped>
.tl {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.legend,
.tl-tools {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-2);
}
.lg .sw {
  width: 9px;
  height: 9px;
  border-radius: 3px;
}
.produce { background: var(--accent-strong); }
.drain { background: var(--signal-green); }
.drop { background: var(--signal-amber); }
.stall { background: var(--signal-red); }
.idle { background: var(--border); }
.tl-hint {
  font-size: 11px;
  color: var(--text-3);
}
.span-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 9px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-strong);
  background: var(--bg-2);
  color: var(--text-2);
  font-size: 11px;
  font-weight: 550;
  cursor: pointer;
  transition: all 0.14s var(--ease-out);
}
.span-chip:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}
.span-chip[aria-pressed='true'] {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent-strong);
}
.tl-body {
  display: flex;
  align-items: flex-end;
  gap: 1.5px;
  height: 96px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 8px 8px 0;
  background: var(--bg-1);
  overflow-x: auto;
  overflow-y: hidden;
  min-width: 0;
  scrollbar-width: thin;
}
.cell {
  border: none;
  padding: 0;
  min-width: 3px;
  flex: 1 1 0;
  border-radius: 2px 2px 0 0;
  cursor: pointer;
  transition: filter 0.1s var(--ease-out), transform 0.1s var(--ease-out), box-shadow 0.1s var(--ease-out);
}
.cell:hover {
  filter: brightness(1.25);
  transform: translateY(-1px);
}
.cell.hl {
  outline: 2px solid var(--accent-strong);
  outline-offset: 1px;
}
.tl-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--text-2);
  padding: 0 2px;
}
.tl-foot b {
  color: var(--text-0);
  font-weight: 550;
}
.tl-foot b i {
  font-style: normal;
  color: var(--text-3);
  font-weight: 450;
}
.tl-foot .active {
  color: var(--accent-strong);
}
.sep {
  color: var(--border-strong);
}
</style>