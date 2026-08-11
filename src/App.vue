<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import TopApp from './components/TopApp.vue'
import SpecRail from './components/SpecRail.vue'
import MainStage from './components/MainStage.vue'
import SettingsModal from './components/SettingsModal.vue'
import { useWorkspaceStore } from './stores/workspace'

type MobilePane = 'packet' | 'evidence' | 'review'

const ws = useWorkspaceStore()
const settingsOpen = ref(false)
const mobilePane = ref<MobilePane>('packet')

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && settingsOpen.value) settingsOpen.value = false
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    settingsOpen.value = !settingsOpen.value
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

watch(
  () => ws.result,
  (result) => {
    if (!result) mobilePane.value = 'packet'
  },
)
</script>

<template>
  <div class="shell">
    <TopApp @open-settings="settingsOpen = true" />
    <nav class="mobile-flow" aria-label="Mobile workspace sections">
      <button :class="{ active: mobilePane === 'packet' }" @click="mobilePane = 'packet'">Packet</button>
      <button :class="{ active: mobilePane === 'evidence' }" @click="mobilePane = 'evidence'">Evidence</button>
      <button :class="{ active: mobilePane === 'review' }" :disabled="!ws.result" @click="mobilePane = 'review'">Review</button>
    </nav>
    <div class="layout" :data-mobile-pane="mobilePane">
      <SpecRail @ran="mobilePane = 'evidence'" />
      <MainStage :mobile-pane="mobilePane" @show-review="mobilePane = 'review'" />
    </div>
    <SettingsModal v-if="settingsOpen" @close="settingsOpen = false" />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-0);
  background-image:
    linear-gradient(180deg, color-mix(in srgb, var(--accent-softer) 55%, transparent), transparent 210px),
    linear-gradient(90deg, color-mix(in srgb, var(--border) 34%, transparent) 1px, transparent 1px),
    linear-gradient(180deg, color-mix(in srgb, var(--border) 34%, transparent) 1px, transparent 1px);
  background-size: auto, 42px 42px, 42px 42px;
}
.layout {
  flex: 1;
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  min-height: 0;
}
.mobile-flow {
  display: none;
}
@media (max-width: 980px) {
  .shell {
    height: auto;
  }
  .mobile-flow {
    position: sticky;
    top: 56px;
    z-index: 24;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg-0) 92%, transparent);
    backdrop-filter: blur(14px);
  }
  .mobile-flow button {
    height: 34px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-1);
    color: var(--text-2);
    font-size: 12px;
    font-weight: 600;
  }
  .mobile-flow button.active {
    border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .mobile-flow button:disabled {
    opacity: 0.45;
  }
  .layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    overflow-y: auto;
    min-height: auto;
  }
  .layout[data-mobile-pane='packet'] :deep(.stage) {
    display: none;
  }
  .layout[data-mobile-pane='evidence'] :deep(.rail),
  .layout[data-mobile-pane='review'] :deep(.rail) {
    display: none;
  }
}
@media (max-width: 640px) {
  .mobile-flow {
    top: 52px;
  }
}
</style>
