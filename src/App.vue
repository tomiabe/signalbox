<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import TopApp from './components/TopApp.vue'
import SpecRail from './components/SpecRail.vue'
import MainStage from './components/MainStage.vue'
import SettingsModal from './components/SettingsModal.vue'

const settingsOpen = ref(false)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && settingsOpen.value) settingsOpen.value = false
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    settingsOpen.value = !settingsOpen.value
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="shell">
    <TopApp @open-settings="settingsOpen = true" />
    <div class="layout">
      <SpecRail />
      <MainStage />
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
@media (max-width: 980px) {
  .shell {
    height: auto;
  }
  .layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    overflow-y: auto;
    min-height: auto;
  }
}
</style>
