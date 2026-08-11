<script setup lang="ts">
import { computed } from 'vue'
import { Activity, CheckCircle2, GitCompareArrows, Play, ShieldAlert, Terminal } from 'lucide-vue-next'
import { useWorkspaceStore } from '../stores/workspace'
import PipelineView from './PipelineView.vue'
import TimelineView from './TimelineView.vue'
import ResultsPanel from './ResultsPanel.vue'

const ws = useWorkspaceStore()
const props = defineProps<{ mobilePane?: 'packet' | 'evidence' | 'review' }>()
const emit = defineEmits<{ (e: 'show-review'): void }>()

const phase = computed(() => {
  if (ws.running) return 'running'
  if (ws.result && ws.result.converged) return 'converged'
  if (ws.result) return 'review'
  return 'idle'
})

const header = computed(() => {
  switch (phase.value) {
    case 'running':
      return ws.fixed ? 'Patch verification in progress' : 'Replay in progress'
    case 'converged':
      return 'Verified evidence'
    case 'review':
      return 'Failure under review'
    default:
      return 'Intent to replayable evidence'
  }
})

const metrics = computed(() => {
  const isEval = ws.preset.scenario.id === 'eval-regression'
  if (!ws.result) {
    return [
      { label: isEval ? 'tasks' : 'trace', value: isEval ? `${ws.preset.scenario.cycles}` : `${ws.preset.scenario.cycles} cyc` },
      { label: 'seed', value: `${ws.preset.scenario.seed}` },
      { label: 'checks', value: '3' },
      { label: 'mode', value: 'ready' },
    ]
  }

  return [
    { label: isEval ? 'score' : 'throughput', value: `${(ws.result.observedThroughput / ws.preset.scenario.targetRate * (isEval ? 90 : 100)).toFixed(0)}%` },
    { label: isEval ? 'stalls' : 'stalled', value: `${ws.result.stalledCycles} cyc` },
    { label: 'iteration', value: `${ws.result.iterations}` },
    { label: 'mode', value: ws.result.converged ? 'verified' : 'inspect' },
  ]
})

</script>

<template>
  <main class="stage" :data-mobile-pane="props.mobilePane">
    <div class="stage-head">
      <div class="sh-left">
        <span class="sh-name mono">{{ ws.preset.scenario.name }}</span>
        <span class="sh-sub">{{ ws.preset.scenario.summary }}</span>
      </div>
      <span class="sh-phase" :class="phase">
        <CheckCircle2 v-if="phase === 'converged'" :size="13" />
        <span class="mini-dot" v-else-if="phase === 'running'"></span>
        {{ header }}
      </span>
    </div>

    <div class="metric-row" aria-label="Run metrics">
      <div v-for="m in metrics" :key="m.label" class="metric" :class="{ emphasis: m.label === 'mode' }">
        <span>{{ m.label }}</span>
        <strong class="mono">{{ m.value }}</strong>
      </div>
    </div>

    <div class="stage-body">
      <div v-if="phase === 'idle'" class="empty">
        <Terminal :size="26" class="empty-ic" />
        <h3>Open an evidence trail for a system that might lie by omission</h3>
        <p>
          The workspace turns intent into a deterministic replay, then gives the
          reviewer checks, trace spans, provenance, and a fix loop they can trust.
        </p>
        <div class="empty-steps" aria-label="Review loop">
          <span><Activity :size="14" /> simulate</span>
          <span><ShieldAlert :size="14" /> inspect</span>
          <span><GitCompareArrows :size="14" /> verify</span>
        </div>
        <button class="btn btn-accent" @click="ws.run(false)">
          <Play :size="15" /> Run evidence replay
        </button>
      </div>

      <div v-else-if="phase === 'running'" class="running" aria-live="polite">
        <div class="run-glance">
          <PipelineView :result="null" :scenario-id="ws.preset.scenario.id" />
        </div>
        <div class="run-log">
          <div class="log-head mono">{{ ws.fixed ? 'signalbox verify.log' : 'signalbox sim.log' }} seed={{ ws.preset.scenario.seed }}</div>
          <div class="log-lines mono">
            <div class="ll">{{ ws.fixed ? 'Applying proposed patch' : 'Deriving evidence contract from intent' }}</div>
            <div class="ll dim">{{ ws.fixed ? 'Replaying fixed packet with same seed' : 'Loading deterministic fixture' }}</div>
            <div class="ll dim">{{ ws.fixed ? 'Re-running checks against original contract' : 'Collecting trace, checks, and provenance' }}</div>
            <div class="ll active">
              <span class="clock-mini" aria-hidden="true"></span>
              {{ ws.fixed ? 'Verifying' : 'Running' }} cycle <b>{{ ws.progress }}</b>/{{ ws.preset.scenario.cycles }}
            </div>
          </div>
          <div
            class="prog"
            role="progressbar"
            aria-label="Evidence replay progress"
            :aria-valuenow="ws.progress"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span class="prog-fill" :style="{ width: ws.progress + '%' }"></span>
          </div>
        </div>
      </div>

      <div v-else class="review">
        <div class="evidence-surface">
          <PipelineView :result="ws.result" :scenario-id="ws.preset.scenario.id" />
          <TimelineView :result="ws.result" :spans="ws.diagnosis?.spans" />
        </div>
        <div class="review-pane">
          <ResultsPanel />
        </div>
      </div>
    </div>

    <div v-if="phase === 'review'" class="stage-foot">
      <button v-if="phase === 'review'" class="btn btn-accent mobile-review-btn" @click="emit('show-review')">
        Review findings
      </button>
    </div>
  </main>
</template>

<style scoped>
.stage {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 22px 36px;
  min-width: 0;
  overflow: auto;
}
.stage-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.sh-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}
.sh-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-0);
}
.sh-sub {
  font-size: 12px;
  color: var(--text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sh-phase {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
}
.sh-phase.converged { color: var(--ok); }
.sh-phase.running { color: var(--accent-strong); }
.mini-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-strong);
  animation: sb-pulse 1.2s infinite;
}
@keyframes sb-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.metric-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-1) 82%, transparent);
}
.metric span {
  color: var(--text-3);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.metric strong {
  color: var(--text-0);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.metric.emphasis {
  border-color: color-mix(in srgb, var(--accent) 34%, var(--border));
}
.stage-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 34px 26px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--signal-cyan-soft) 70%, transparent), transparent 55%),
    var(--bg-1);
  max-width: 680px;
}
.empty-ic {
  color: var(--signal-cyan);
}
.empty h3 {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.25;
}
.empty p {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--text-1);
  max-width: 560px;
}
.empty-steps {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.empty-steps span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--bg-2);
  color: var(--text-2);
  font-size: 12px;
}
.running {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}
.run-glance,
.run-log {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-1);
}
.run-glance {
  padding: 18px;
}
.run-log {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 12px;
}
.log-head {
  font-size: 11px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.log-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-1);
}
.log-lines .dim { color: var(--text-3); }
.log-lines .active {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-0);
}
.clock-mini {
  width: 9px;
  height: 9px;
  border: 2px solid var(--border-strong);
  border-top-color: var(--accent-strong);
  border-radius: 50%;
  animation: sb-spin 0.7s linear infinite;
  display: inline-block;
}
.prog {
  height: 5px;
  border-radius: 3px;
  background: var(--bg-3);
  overflow: hidden;
}
.prog-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--signal-cyan), var(--accent-strong));
  border-radius: 3px;
  transition: width 0.1s linear;
}
.review {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  gap: 16px;
  align-items: start;
}
.evidence-surface {
  padding: 18px;
  margin-bottom: 34px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-1) 88%, transparent);
  min-width: 0;
}
.stage-foot {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.mobile-review-btn {
  display: none;
}
@media (max-width: 900px) {
  .running,
  .review {
    grid-template-columns: 1fr;
  }
  .metric-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 980px) {
  .stage[data-mobile-pane='evidence'] .review-pane {
    display: none;
  }
  .stage[data-mobile-pane='review'] .evidence-surface {
    display: none;
  }
  .stage[data-mobile-pane='review'] .review {
    grid-template-columns: 1fr;
  }
  .stage[data-mobile-pane='evidence'] .mobile-review-btn {
    display: inline-flex;
  }
}
@media (max-width: 520px) {
  .stage {
    padding: 16px 14px 40px;
  }
  .stage-head {
    align-items: flex-start;
  }
  .sh-left {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
  .sh-sub {
    white-space: normal;
  }
  .run-glance,
  .evidence-surface {
    padding: 14px;
    margin-bottom: 36px;
  }
  .empty {
    padding: 24px 18px;
  }
  .empty h3 {
    font-size: 18px;
  }
  .empty-steps {
    width: 100%;
  }
  .empty-steps span {
    flex: 1 1 120px;
    justify-content: center;
  }
  .metric-row {
    grid-template-columns: 1fr;
  }
  .sh-sub {
    white-space: normal;
  }
  .stage-foot {
    display: grid;
    grid-template-columns: 1fr;
  }
  .stage-foot .btn {
    width: 100%;
  }
}
</style>
