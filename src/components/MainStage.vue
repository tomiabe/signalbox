<script setup lang="ts">
import { computed } from 'vue'
import { Play, Terminal, CheckCircle2 } from 'lucide-vue-next'
import { useWorkspaceStore } from '../stores/workspace'
import PipelineView from './PipelineView.vue'
import TimelineView from './TimelineView.vue'
import ResultsPanel from './ResultsPanel.vue'

const ws = useWorkspaceStore()

const phase = computed(() => {
  if (ws.running) return 'running'
  if (ws.result && ws.result.converged) return 'converged'
  if (ws.result) return 'review'
  return 'idle'
})

const header = computed(() => {
  switch (phase.value) {
    case 'running':
      return 'SMELTR · simulating'
    case 'converged':
      return 'Verified design'
    case 'review':
      return 'Simulation · iteration 1'
    default:
      return 'From intent to verified bus'
  }
})

function restart() {
  ws.reset()
}
</script>

<template>
  <div class="stage">
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

    <div class="stage-body">
      <!-- Idle: explain the run -->
      <div v-if="phase === 'idle'" class="empty">
        <Terminal :size="26" class="empty-ic" />
        <h3>Turn intent into an inspectable datapath</h3>
        <p>
          Describe the system on the left, then run the simulation. SignalBox
          builds a deterministic model, watches it fail under a backpressure bug,
          and walks you to a verified fix.
        </p>
        <button class="btn btn-accent" @click="ws.run(false)">
          <Play :size="15" /> Run the first simulation
        </button>
      </div>

      <!-- Running: animated pipeline + live log -->
      <div v-else-if="phase === 'running'" class="running" aria-live="polite">
        <div class="run-glance card">
          <PipelineView :result="null" />
        </div>
        <div class="run-log card">
          <div class="log-head mono">signalbox · sim.log --seed {{ ws.preset.scenario.seed }}</div>
          <div class="log-lines mono">
            <div class="ll">Deriving dataflow from intent…</div>
            <div class="ll dim">Parsing &quot;credit-capped backpressure&quot;</div>
            <div class="ll dim">Structuring RMW path</div>
            <div class="ll active"><span class="clock-mini" aria-hidden="true"></span>Running cycle <b>{{ ws.progress }}</b>/{{
              ws.preset.scenario.cycles }}</div>
          </div>
          <div class="prog"><span class="prog-fill" :style="{ width: ws.progress + '%' }"></span></div>
        </div>
      </div>

      <!-- Review / converged: show model + timeline + checks -->
      <div v-else class="review">
        <div class="rv-top">
          <div class="card model-card">
            <PipelineView :result="ws.result" />
            <hr class="divider" />
            <TimelineView :result="ws.result" :spans="ws.diagnosis?.spans" />
          </div>
        </div>
        <ResultsPanel />
      </div>
    </div>

    <div v-if="phase === 'review' || phase === 'converged'" class="stage-foot">
      <button class="btn btn-outline" @click="restart">
        Reset run
      </button>
    </div>
  </div>
</template>

<style scoped>
.stage {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 22px 22px;
  min-width: 0;
  overflow-x: hidden;
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
.stage-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.stage { max-width: 100%; }

.idle {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 34px 26px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-1);
  max-width: 560px;
}
.empty-ic {
  color: var(--accent-strong);
}
.idle h3 {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.idle p {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--text-1);
}

.running {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 14px;
  min-height: 320px;
  align-items: start;
}
.run-head {
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
  background: linear-gradient(90deg, var(--accent), var(--accent-strong));
  border-radius: 3px;
  transition: width 0.1s linear;
}

.review {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.model-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.stage-foot {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .running {
    grid-template-columns: 1fr;
  }
}
</style>