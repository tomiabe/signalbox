import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SimResult } from '../engine/types'
import { simulate } from '../engine/simulate'
import { generateDiagnosis, type Diagnosis, getConfigured } from '../lib/llm'
import { presets, type ScenarioPreset } from '../engine/scenarios'

export type Stage = 'spec' | 'simulate' | 'diagnose' | 'converged'
export type SimStatus = 'idle' | 'running' | 'done'

export const useWorkspaceStore = defineStore('workspace', () => {
  const preset = ref<ScenarioPreset>(presets[0])
  const fixed = ref(false)
  const status = ref<SimStatus>('idle')
  const stage = ref<Stage>('spec')
  const result = ref<SimResult | null>(null)
  const diagnosis = ref<Diagnosis | null>(null)
  const progress = ref(0)
  const hasKey = ref(!!getConfigured())

  const running = computed(() => status.value === 'running')

  async function run(applyFix: boolean) {
    if (status.value === 'running') return
    fixed.value = applyFix
    status.value = 'running'
    stage.value = 'simulate'
    progress.value = 0

    await new Promise<void>((resolve) => {
      const iv = setInterval(() => {
        progress.value = Math.min(100, progress.value + 4)
        if (progress.value >= 100) {
          clearInterval(iv)
          resolve()
        }
      }, 16)
    })

    const sim = simulate({ ...preset.value.scenario, fixed: applyFix })
    status.value = 'done'
    result.value = sim

    if (sim.converged) {
      stage.value = 'converged'
      diagnosis.value = null
    } else {
      stage.value = 'diagnose'
      diagnosis.value = null
      diagnosis.value = await generateDiagnosis(sim, preset.value.fixedDesc, preset.value.intent)
    }
  }

  function reset() {
    status.value = 'idle'
    stage.value = 'spec'
    result.value = null
    diagnosis.value = null
    progress.value = 0
  }

  function setPreset(id: string) {
    const next = presets.find((p) => p.scenario.id === id)
    if (!next) return
    preset.value = next
    reset()
  }

  function refreshKey() {
    hasKey.value = !!getConfigured()
  }

  return {
    presets,
    preset,
    fixed,
    status,
    stage,
    result,
    diagnosis,
    progress,
    running,
    hasKey,
    run,
    setFixed: (v: boolean) => {
      fixed.value = v
    },
    reset,
    setPreset,
    refreshKey,
  }
})