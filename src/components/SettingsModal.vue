<script setup lang="ts">
import { ref } from 'vue'
import { X, Sparkles, Lock, Globe } from 'lucide-vue-next'
import { getConfigured, setKey } from '../lib/llm'
import { useWorkspaceStore } from '../stores/workspace'

const ws = useWorkspaceStore()
const emit = defineEmits<{ (e: 'close'): void }>()

const cfg = getConfigured()
const key = ref(cfg?.key ?? '')
const base = ref(cfg?.base ?? 'https://api.openai.com/v1')
const saved = ref(true)

function save() {
  try {
    setKey(key.value, base.value)
    saved.value = true
  } catch {
    saved.value = false
  }
  ws.refreshKey()
}

function clear() {
  key.value = ''
  try {
    setKey('', base.value)
  } catch {}
  saved.value = true
  ws.refreshKey()
}
</script>

<template>
  <div class="backdrop" @click="emit('close')"></div>
  <div class="modal card" role="dialog" aria-modal="true" aria-label="Model settings">
    <div class="m-head">
      <div class="m-icon"><Sparkles :size="16" /></div>
      <div class="m-title">
        <h3>AI diagnosis</h3>
        <p class="m-sub">Optional. Without a key, SignalBox uses a deterministic local coach.</p>
      </div>
      <button class="btn btn-icon btn-ghost" aria-label="Close" @click="emit('close')">
        <X :size="16" />
      </button>
    </div>

    <div class="m-body">
      <div class="field">
        <label><Lock :size="12" /> API key</label>
        <input v-model="key" class="input mono" type="password" autocomplete="off" spellcheck="false"
          placeholder="sk-… or Env: OPENAI_API_KEY" />
        <p class="m-note">Stored only in this browser's localStorage. Never a request header in metadata.</p>
      </div>

      <div class="field">
        <label><Globe :size="12" /> Base URL <span class="m-opt">(OpenAI-compatible)</span></label>
        <input v-model="base" class="input mono" type="text" spellcheck="false" />
      </div>

      <div v-if="!saved" class="m-err">Ready but couldn't persist to localStorage.</div>
    </div>

    <div class="m-foot">
      <button class="btn btn-ghost" @click="clear">
        <Key :size="15" /> Clear key
      </button>
      <div class="spacer"></div>
      <button class="btn btn-outline" @click="emit('close')">Cancel</button>
      <button class="btn btn-accent" @click="save">Save</button>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 40;
  animation: sb-fade 0.18s var(--ease-out);
}
@keyframes sb-fade {
  from { opacity: 0; }
}
.modal {
  position: fixed;
  z-index: 50;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(460px, calc(100vw - 32px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-2);
}
.m-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--border);
}
.m-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: var(--accent-strong);
  background: var(--accent-soft);
  flex-shrink: 0;
}
.m-title {
  flex: 1;
}
.m-title h3 {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0;
}
.m-sub {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 2px;
}
.m-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}
.m-note {
  font-size: 11.5px;
  color: var(--text-3);
  line-height: 1.5;
}
.m-err {
  font-size: 12px;
  color: var(--err);
}
.m-opt {
  font-weight: 450;
  color: var(--text-3);
}
.m-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}
.spacer {
  flex: 1;
}
</style>
