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
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-0);
}
.layout {
  flex: 1;
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  min-height: 0;
}
@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    overflow-y: auto;
  }
}
</style>