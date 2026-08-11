<script setup lang="ts">
import { computed, ref } from 'vue'
import { Play, RotateCcw, FileText, ChevronDown, ChevronRight, Database, Fingerprint, GitBranch } from 'lucide-vue-next'
import { useWorkspaceStore } from '../stores/workspace'

const ws = useWorkspaceStore()
const expanded = ref(false)
const passCount = computed(() => ws.result?.checks.filter((c) => c.pass).length ?? 0)
</script>

<template>
  <aside class="rail">
    <div class="rail-head">
      <span class="rail-title">Review packet</span>
      <span class="rail-hint mono">intent.json</span>
    </div>

    <div class="scenario">
      <label class="scenario-label" for="scenario-select">Scenario</label>
      <select id="scenario-select" class="input scenario-select" :disabled="ws.running" :value="ws.preset.scenario.id"
        @change="ws.setPreset(($event.target as HTMLSelectElement).value)">
        <option v-for="p in ws.presets" :key="p.scenario.id" :value="p.scenario.id">
          {{ p.scenario.name }}
        </option>
      </select>
    </div>

    <div
      class="packet-status"
      :class="{ verified: ws.result?.converged, failed: ws.result && !ws.result.converged }"
      aria-live="polite"
    >
      <div>
        <span class="status-kicker mono">{{ ws.result ? `${passCount}/${ws.result.checks.length} checks` : 'not run' }}</span>
        <strong>{{ ws.result?.converged ? 'Verified' : ws.result ? 'Needs review' : 'Ready for evidence' }}</strong>
      </div>
      <Fingerprint :size="18" aria-hidden="true" />
    </div>

    <label class="scenario-label" for="intent-input">User intent</label>
    <textarea
      id="intent-input"
      class="textarea intent"
      :model-value="ws.preset.intent"
      :disabled="ws.running"
      spellcheck="false"
    ></textarea>

    <div class="known-wrap">
      <button class="known-toggle" @click="expanded = !expanded" :aria-expanded="expanded">
        <ChevronDown v-if="expanded" :size="14" />
        <ChevronRight v-else :size="14" />
        <span>Derived contract</span>
        <span class="mono count-n">{{ ws.preset.known.length }}</span>
      </button>
      <ul v-if="expanded" class="known-list">
        <li v-for="(k, i) in ws.preset.known" :key="i">
          <span class="bullet" aria-hidden="true"></span>{{ k }}
        </li>
      </ul>
      <div v-else class="known-empty">
        Contract derived from intent. Expand to inspect before running.
      </div>
    </div>

    <section class="mini-panel" aria-label="Evidence artifacts">
      <div class="mini-title"><Database :size="13" aria-hidden="true" /> Evidence artifacts</div>
      <ul>
        <li v-for="item in ws.preset.evidence" :key="item">{{ item }}</li>
      </ul>
    </section>

    <section class="mini-panel" aria-label="Provenance">
      <div class="mini-title"><GitBranch :size="13" aria-hidden="true" /> Provenance</div>
      <ul>
        <li v-for="item in ws.preset.provenance" :key="item">{{ item }}</li>
      </ul>
    </section>

    <div class="rail-actions">
      <button class="btn btn-accent run" :disabled="ws.running" @click="ws.run(false)">
        <Play v-if="!ws.running" :size="15" />
        <span v-else class="spinner" />
        {{ ws.running ? 'Running' : 'Run simulation' }}
      </button>
      <button class="btn btn-ghost" aria-label="Reset simulation" :disabled="ws.running" @click="ws.reset()">
        <RotateCcw :size="15" />
      </button>
    </div>

    <p class="rail-note mono">
      <FileText :size="13" /> replayable trace, no external data
    </p>
  </aside>
</template>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-right: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg-0) 94%, transparent);
  color: var(--text-0);
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.rail-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.scenario {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}
.scenario::after {
  content: '';
  position: absolute;
  right: 13px;
  bottom: 13px;
  width: 7px;
  height: 7px;
  border-right: 1.5px solid var(--text-2);
  border-bottom: 1.5px solid var(--text-2);
  transform: rotate(45deg);
  pointer-events: none;
}
.scenario-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-1);
}
.scenario-select {
  appearance: none;
  -webkit-appearance: none;
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  padding-right: 38px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.scenario-select option {
  font-family: var(--font-sans);
}
.rail-hint {
  color: var(--text-1);
  font-size: 11px;
}
.rail-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
}
.rail-step {
  color: var(--text-3);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.intent {
  min-height: 118px;
}
.packet-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-1);
  color: var(--text-1);
}
.packet-status strong {
  display: block;
  margin-top: 2px;
  font-size: 14px;
  color: var(--text-0);
}
.packet-status svg {
  color: var(--signal-cyan);
}
.packet-status.verified {
  border-color: color-mix(in srgb, var(--signal-green) 34%, var(--border));
  background: var(--signal-green-soft);
}
.packet-status.failed {
  border-color: color-mix(in srgb, var(--signal-red) 30%, var(--border));
  background: var(--signal-red-soft);
}
.status-kicker {
  color: var(--text-1);
  font-size: 11px;
}
.spec-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.known-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  background: none;
  border: none;
  color: var(--text-1);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 0;
  border-radius: 6px;
  text-align: left;
}
.known-toggle:hover {
  color: var(--text-0);
}
.count-n {
  margin-left: auto;
  color: var(--text-3);
}
.known-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-2);
}
.known-list li {
  display: flex;
  gap: 8px;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--text-1);
}
.bullet {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: var(--signal-cyan);
  flex-shrink: 0;
  margin-top: 5px;
}
.known-empty {
  font-size: 12px;
  color: var(--text-3);
  padding: 8px 4px;
}
.rail-actions {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}
.run {
  flex: 1;
}
.rail-note {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
  font-size: 11px;
  margin-top: auto;
}
.mini-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-1) 74%, transparent);
}
.mini-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 650;
  color: var(--text-1);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.mini-panel ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 0;
}
.mini-panel li {
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-0);
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 980px) {
  .rail {
    border-right: none;
    border-bottom: 1px solid var(--border);
    overflow: visible;
  }
}

@media (max-width: 520px) {
  .rail {
    padding: 14px;
    gap: 12px;
  }
  .rail-head {
    align-items: flex-start;
    gap: 8px;
  }
  .rail-hint {
    overflow-wrap: anywhere;
  }
  .packet-status {
    align-items: flex-start;
  }
  .rail-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40px;
  }
  .rail-note {
    align-items: flex-start;
    line-height: 1.4;
  }
}
</style>
