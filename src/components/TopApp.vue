<script setup lang="ts">
import { computed } from 'vue'
import { Moon, Sun, Settings2, CircleDot } from 'lucide-vue-next'

const theme = computed(() =>
  document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
)

function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  try {
    localStorage.setItem('signalbox-theme', next)
  } catch {}
}

const emit = defineEmits<{ (e: 'open-settings'): void }>()
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">
        <CircleDot :size="16" :stroke-width="2.2" />
      </span>
      <span class="brand-name">signalbox</span>
      <span class="brand-sub mono">ns</span>
    </div>

    <div class="topbar-center">
      <span class="live chip" status="accent">
        <span class="dot"></span>
        smeltr · live
      </span>
    </div>

    <div class="topbar-right">
      <button class="btn btn-icon btn-ghost" aria-label="Settings" title="Configure model"
        @click="emit('open-settings')">
        <Settings2 />
      </button>
      <button class="btn btn-icon btn-ghost" aria-label="Toggle theme" :title="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
        @click="toggleTheme">
        <template v-if="theme === 'dark'"><Sun :size="16" /></template>
        <template v-else><Moon :size="16" /></template>
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-0);
  position: sticky;
  top: 0;
  z-index: 30;
}
.brand {
  display: flex;
  align-items: center;
  gap: 9px;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: var(--accent-soft);
  color: var(--accent-strong);
}
.brand-name {
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.01em;
}
.brand-sub {
  color: var(--text-3);
  font-size: 11px;
  border-left: 1px solid var(--border);
  padding-left: 9px;
}
.topbar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.live .dot {
  background: var(--accent-strong);
  animation: sb-pulse 2s infinite;
}
@keyframes sb-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@media (max-width: 640px) {
  .brand-name { display: none; }
  .topbar-center { position: static; transform: none; margin-left: auto; margin-right: auto; }
}
</style>