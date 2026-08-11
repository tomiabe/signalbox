// Core domain types for the deterministic SignalBox simulation engine.

export type BeatType = 'awa' | 'rmw' | 'data'

export type ProducerState = 'producing' | 'stalled'

export interface Cycle {
  cycle: number
  producerState: ProducerState
  credits: number
  creditCap: boolean
  fifoFree: number
  occupancy: number
  producerBeat: BeatType | null
  consumerPop: boolean
  beatStuck: boolean
  missedCredit: boolean
  events: string[]
}

export interface CheckDetail {
  cycles: string
  actual: string
  expected: string
}

export interface Check {
  id: string
  name: string
  desc: string
  pass: boolean
  detail?: CheckDetail
}

export interface SimResult {
  scenarioId: string
  trace: Cycle[]
  checks: Check[]
  converged: boolean
  iterations: number
  maxOccupancy: number
  totalBeats: number
  observedThroughput: number
  stalledCycles: number
  capacity: number
}

export interface Scenario {
  id: string
  name: string
  summary: string
  fixed: boolean
  seed: number
  cycles: number
  burst: number
  burstEvery: number
  readBurst: number
  targetRate: number
  capacity: number
  leak: number
}

export interface DiffMarker {
  cycle: number
  label: string
}
