<script setup lang="ts">
import { computed } from 'vue'
import type { Cycle, SimResult } from '../engine/types'

const props = defineProps<{
  result: SimResult | null
  selected: number | null
  hovered: number | null
}>()

const emit = defineEmits<{
  select: [index: number | null]
  hover: [index: number | null]
}>()

const trace = computed(() => props.result?.trace ?? [])
const width = 1000
const height = 214
const left = 96
const right = 28
const laneHeight = 38
const laneGap = 8
const plotWidth = computed(() => width - left - right)
const col = computed(() => plotWidth.value / Math.max(1, trace.value.length - 1))

const cursorIdx = computed(() => props.selected ?? props.hovered)
const cursorX = computed(() => cursorIdx.value == null ? null : left + cursorIdx.value * col.value)

const tracks = computed(() => [
  {
    id: 'valid',
    label: props.result?.scenarioId === 'eval-regression' ? 'task' : 'valid',
    sub: props.result?.scenarioId === 'eval-regression' ? 'case emitted' : 'producer beat',
    color: 'var(--accent-strong)',
    kind: 'digital',
    value: (c: Cycle) => c.producerBeat ? 1 : 0,
  },
  {
    id: 'ready',
    label: props.result?.scenarioId === 'eval-regression' ? 'accepted' : 'ready',
    sub: props.result?.scenarioId === 'eval-regression' ? 'case scored' : 'consumer pop',
    color: 'var(--signal-green)',
    kind: 'digital',
    value: (c: Cycle) => c.consumerPop ? 1 : 0,
  },
  {
    id: 'load',
    label: props.result?.scenarioId === 'eval-regression' ? 'queue' : 'fifo',
    sub: props.result?.scenarioId === 'eval-regression' ? 'eval backlog' : 'occupancy',
    color: 'var(--signal-amber)',
    kind: 'level',
    value: (c: Cycle) => c.occupancy,
    max: Math.max(1, props.result?.capacity ?? 8),
  },
  {
    id: 'budget',
    label: props.result?.scenarioId === 'eval-regression' ? 'clean' : 'credits',
    sub: props.result?.scenarioId === 'eval-regression' ? 'provenance budget' : 'available',
    color: 'var(--signal-cyan)',
    kind: 'level',
    value: (c: Cycle) => c.credits,
    max: 12,
  },
])

function yFor(trackIndex: number, value: number, max = 1) {
  const top = 18 + trackIndex * (laneHeight + laneGap)
  const low = top + laneHeight - 5
  const high = top + 7
  const ratio = Math.max(0, Math.min(1, value / max))
  return low - ratio * (low - high)
}

function stepPath(trackIndex: number, value: (c: Cycle) => number, max = 1) {
  const rows = trace.value
  if (!rows.length) return ''

  let d = `M ${left} ${yFor(trackIndex, value(rows[0]), max)}`
  for (let i = 1; i < rows.length; i++) {
    const x = left + i * col.value
    const prevY = yFor(trackIndex, value(rows[i - 1]), max)
    const nextY = yFor(trackIndex, value(rows[i]), max)
    d += ` H ${x} V ${nextY}`
    if (Math.abs(prevY - nextY) < 0.001) d += ''
  }
  return d
}

function laneMid(trackIndex: number) {
  return 18 + trackIndex * (laneHeight + laneGap) + laneHeight / 2
}

function selectCycle(index: number) {
  emit('select', props.selected === index ? null : index)
}
</script>

<template>
  <section v-if="trace.length" class="wave" aria-label="Signal waveform evidence">
    <div class="wave-head">
      <div>
        <span class="wave-kicker mono">waveform evidence</span>
        <h3>Signals stay linked to the selected cycle.</h3>
      </div>
      <span class="wave-hint mono">{{ cursorIdx == null ? 'hover a cycle' : `cycle ${trace[cursorIdx]?.cycle ?? '-'}` }}</span>
    </div>

    <div class="wave-scroll">
      <svg
        class="wave-svg"
        :viewBox="`0 0 ${width} ${height}`"
        :width="width"
        :height="height"
        role="img"
        aria-label="Four signal tracks showing producer activity, consumer acceptance, occupancy, and credits"
      >
        <g v-for="(track, i) in tracks" :key="track.id">
          <line class="lane-rule" :x1="left" :x2="width - right" :y1="laneMid(i)" :y2="laneMid(i)" />
          <text class="lane-label" x="18" :y="laneMid(i) - 3">{{ track.label }}</text>
          <text class="lane-sub" x="18" :y="laneMid(i) + 12">{{ track.sub }}</text>
          <path
            class="wave-line"
            :d="stepPath(i, track.value, track.kind === 'level' ? track.max : 1)"
            :stroke="track.color"
          />
        </g>

        <g class="markers" aria-hidden="true">
          <line
            v-for="t in trace.filter((c) => c.missedCredit || c.producerState === 'stalled')"
            :key="t.cycle"
            class="event-line"
            :class="{ stall: t.producerState === 'stalled' }"
            :x1="left + t.cycle * col"
            :x2="left + t.cycle * col"
            y1="14"
            :y2="height - 22"
          />
        </g>

        <line
          v-if="cursorX != null"
          class="cursor"
          :x1="cursorX"
          :x2="cursorX"
          y1="10"
          :y2="height - 18"
        />

        <rect
          v-for="(t, i) in trace"
          :key="`hit-${t.cycle}`"
          class="hit"
          :x="left + i * col - col / 2"
          y="0"
          :width="Math.max(5, col)"
          :height="height"
          :aria-label="`cycle ${t.cycle}`"
          @mouseenter="emit('hover', i)"
          @mouseleave="emit('hover', null)"
          @click="selectCycle(i)"
        />
      </svg>
    </div>
  </section>
</template>

<style scoped>
.wave {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wave-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.wave-kicker {
  display: block;
  margin-bottom: 5px;
  color: var(--text-3);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.wave h3 {
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
  letter-spacing: 0;
}
.wave-hint {
  color: var(--text-2);
  font-size: 11.5px;
}
.wave-scroll {
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--bg-2) 74%, transparent), transparent),
    var(--bg-1);
  overflow-x: hidden;
  overflow-y: hidden;
}
.wave-svg {
  display: block;
  width: 100%;
  height: auto;
  min-height: 172px;
}
.lane-rule {
  stroke: var(--border);
  stroke-width: 1;
  stroke-dasharray: 2 5;
}
.lane-label {
  fill: var(--text-0);
  font-size: 11px;
  font-weight: 650;
  text-transform: uppercase;
}
.lane-sub {
  fill: var(--text-3);
  font-size: 10px;
}
.wave-line {
  fill: none;
  stroke-width: 1.8;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.event-line {
  stroke: var(--signal-amber);
  stroke-width: 1;
  opacity: 0.28;
}
.event-line.stall {
  stroke: var(--signal-red);
  opacity: 0.2;
}
.cursor {
  stroke: var(--text-0);
  stroke-width: 1;
  opacity: 0.72;
}
.hit {
  fill: transparent;
  cursor: crosshair;
}

@media (max-width: 520px) {
  .wave-head {
    align-items: flex-start;
  }
  .wave-scroll {
    margin-left: -2px;
    margin-right: -2px;
  }
}
</style>
