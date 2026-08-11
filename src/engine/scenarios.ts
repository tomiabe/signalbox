import type { Scenario } from './types'

export interface ScenarioPreset {
  scenario: Scenario
  intent: string
  known: string[]
  evidence: string[]
  provenance: string[]
  fixedDesc: string
}

export const presets: ScenarioPreset[] = [
  {
    intent:
      'Design a bus that moves data from a memory-hungry master into a slow consumer FIFO. Keep the master producing under bursty load, never let it stall, and never drop a beat.',
    known: [
      'Master bursts 6 beats every ~8 cycles',
      'RMW beats consume 2 FIFO slots',
      'FIFO capacity 8 slots, credit-capped backpressure',
      'Consumer drains one beat per cycle when data is present',
    ],
    evidence: [
      'testbench: tb_throughput, tb_starvation_window, tb_credit_integrity',
      'trace: 140 deterministic cycles, seed 4137',
      'artifact: FIFO occupancy, credits, accepted beats, dropped RMW markers',
    ],
    provenance: [
      'Source: public bus-handshake pattern',
      'License: synthetic model, no vendor IP',
      'Governance: deterministic run can be replayed offline',
    ],
    fixedDesc:
      '// align RMW write strobe so a consumed beat is always latched\nassign s_axi_wready = ~rd_dropped; // never leak a credit',
    scenario: {
      id: 'bus-rd-fifo',
      name: 'bus_axi_lite/f2d',
      summary: 'bursty master to credit-capped FIFO to slow consumer',
      fixed: false,
      seed: 4137,
      cycles: 140,
      burst: 8,
      burstEvery: 4,
      readBurst: 0.55,
      targetRate: 0.5,
      capacity: 8,
      leak: 3,
    },
  },
  {
    intent:
      'Turn a shared peripheral bus into a lossless flow, so a fast producer never over-runs a slow, wait-stated consumer. Preserve every beat and keep the channel alive under a mix of read-modify-write and plain data.',
    known: [
      'Producer emits mixed RMW + data bursts',
      'FIFO capacity 8 slots, credit-capped backpressure',
      'Both sides are rate-limited by wait-states',
      'A dropped lock must never silently eat its credit',
    ],
    evidence: [
      'testbench: tb_throughput, tb_starvation_window, tb_credit_integrity',
      'trace: 150 deterministic cycles, seed 7',
      'artifact: wait-state overlap, credit return, dropped lock markers',
    ],
    provenance: [
      'Source: synthetic peripheral-bus workload',
      'License: generated fixture for portfolio use',
      'Governance: no scraped standard text or private RTL',
    ],
    fixedDesc:
      '// latch the gack when the pipe is full-proximate\nassign back_flushed = ram_ready && ~rd_overlap; // credit always returns',
    scenario: {
      id: 'bus-overlap',
      name: 'us_bvme/byte-en',
      summary: 'shared peripheral bus to lossless byte channel',
      fixed: false,
      seed: 7,
      cycles: 150,
      burst: 8,
      burstEvery: 5,
      readBurst: 0.62,
      targetRate: 0.5,
      capacity: 8,
      leak: 3,
    },
  },
  {
    intent:
      'Evaluate model checkpoint checkpoint_r32_v4 performance on hardware reasoning and long-context specification retrieval. Overall score must be >= 90% and training data provenance must be fully verified and free of licensing violations.',
    known: [
      'Model checkpoint: checkpoint_r32_v4',
      'Test suite: 160 general reasoning & retrieval tasks',
      'Baseline capability threshold: 90% accuracy',
      'Compliance rules: zero unlicensed code extraction',
    ],
    evidence: [
      'testbench: tb_overall_score, tb_instruction_adherence, tb_provenance_clean',
      'trace: 160 evaluations, mock seed 812',
      'artifact: accuracy curve, license validation log, bias markers',
    ],
    provenance: [
      'Source: internal training evaluation framework',
      'License: open source benchmark sets',
      'Governance: audit log tracks model performance across epochs',
    ],
    fixedDesc:
      '# exclude legacy forum archive to clean training data\ncrawler.add_seed(gov_licensed_standards); # verify provenance',
    scenario: {
      id: 'eval-regression',
      name: 'eval_runner/spec_llm',
      summary: 'eval checkpoint verification: instruction following and retrieval',
      fixed: false,
      seed: 812,
      cycles: 160,
      burst: 8,
      burstEvery: 4,
      readBurst: 0.48,
      targetRate: 0.5,
      capacity: 8,
      leak: 3,
    },
  },
]

export function defaultPreset(): ScenarioPreset {
  return presets[0]
}

export function toScenario(p: ScenarioPreset, fixed: boolean): Scenario {
  return { ...p.scenario, fixed }
}
