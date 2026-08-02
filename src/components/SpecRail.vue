<script setup lang="ts">
import { ref } from 'vue'
import { Play, RotateCcw, FileText, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { useWorkspaceStore } from '../stores/workspace'

const ws = useWorkspaceStore()
const expanded = ref(false)
</script>

<template>
  <aside class="rail">
    <div class="rail-head">
      <span class="rail-title">intent</span>
      <span class="rail-hint mono">spec</span>
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

    <label class="visually-hidden" for="intent-input">Describe the system you want in plain language</label>
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
        <span>Derived spec</span>
        <span class="mono count-n">{{ ws.preset.known.length }}</span>
      </button>
      <ul v-if="expanded" class="known-list">
        <li v-for="(k, i) in ws.preset.known" :key="i">
          <span class="bullet" aria-hidden="true"></span>{{ k }}
        </li>
      </ul>
      <div v-else class="known-empty">
        Spec derived from intent. Expand to inspect.
      </div>
    </div>

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
      <FileText :size="13" /> signals.ts · verif mesh
    </p>
  </aside>
</template>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 16px;
  border-right: 1px solid var(--border);
  background: var(--bg-0);
  min-width: 0;
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
}
.scenario-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-3);
}
.scenario-select {
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
}
.scenario-select option {
  font-family: var(--font-sans);
}
.rail-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.rail-step {
  color: var(--text-3);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.intent {
  min-height: 96px;
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
  background: var(--accent);
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
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>