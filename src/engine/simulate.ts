import type { BeatType, Check, Cycle, Scenario, SimResult } from './types'

// Deterministic PRNG (mulberry32). Same seed -> identical trace every run.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CREDIT_CAP = 12
// RMW beats occupy two FIFO slots; single beats occupy one. Credits are 1 per
// beat regardless of width, so read-modify-write traffic stresses the FIFO.
const SLOTS: Record<BeatType, number> = { awa: 1, data: 1, rmw: 2 }

/**
 * Producer -> FIFO -> consumer datapath with credit backpressure.
 *
 * MODEL: each produced beat spends 1 credit; each drained beat returns exactly
 * 1 credit. FIFO storage is a separate concern: an RMW beat occupies two slots.
 * A beat only drains once it is fully resident AND the consumer is idle.
 *
 * THE BUG ("incomplete read-modify-write"): when an RMW beat is issued while
 * the FIFO is near full, the write strobe misaligns. The beat spends its credit
 * but is never latched, so it never drains and its credit is never returned.
 * Repeated under bursty load this silently erodes the credit pool until the
 * producer starves — then recovers as periodically a correct drain returns a
 * credit. Self-healing and conditional, so hard to spot on a single run.
 */
export function simulate(scenario: Scenario): SimResult {
  const rnd = mulberry32(scenario.seed)
  const trace: Cycle[] = []

  let credits = CREDIT_CAP
  let occupancy = 0
  const fifo: { slots: number }[] = []

  let produced = 0
  let leaked = 0
  let stalled = 0
  let run = 0
  let maxRun = 0
  let maxOccupancy = 0

  const MAX_CAP = scenario.capacity

  for (let cycle = 0; cycle < scenario.cycles; cycle++) {
    const ce: Cycle = {
      cycle,
      producerState: 'producing',
      credits,
      creditCap: credits >= CREDIT_CAP,
      fifoFree: MAX_CAP - occupancy,
      occupancy,
      producerBeat: null,
      consumerPop: false,
      beatStuck: false,
      missedCredit: false,
      events: [],
    }

    // --- Consumer drains the head beat once it is fully resident.
    if (fifo.length && occupancy >= fifo[0].slots) {
      occupancy -= fifo[0].slots
      fifo.shift()
      credits = Math.min(CREDIT_CAP, credits + 1)
      ce.consumerPop = true
      ce.events.push('consumer drained beat')
    }

    // --- Starvation detection (before the producer acts this cycle).
    if (credits <= 0) {
      ce.producerState = 'stalled'
      stalled++
      run++
      maxRun = Math.max(maxRun, run)
    } else {
      run = 0
    }

    // --- Producer: a bursty master. It pushes up to `burst` beats per cycle to
    //     build the interleaving that surfaces the bug.
    let budget = scenario.burst
    for (let i = 0; i < budget && credits > 0; i++) {
      const roll = rnd()
      const type: BeatType = roll < scenario.readBurst ? 'rmw' : roll < scenario.readBurst + 0.4 ? 'data' : 'awa'
      const slots = SLOTS[type]
      const nearFull = occupancy + slots > MAX_CAP - 3

      if (type === 'rmw' && nearFull && !scenario.fixed) {
        credits -= scenario.leak
        leaked += scenario.leak
        ce.beatStuck = true
        ce.missedCredit = true
        ce.events.push('RMW dropped on misaligned write strobe')
      } else if (credits >= 1 && occupancy + slots <= MAX_CAP) {
        credits -= 1
        fifo.push({ slots })
        occupancy += slots
        produced++
        ce.producerBeat = type
        ce.events.push(`produced ${type.toUpperCase()}`)
      }
    }

    maxOccupancy = Math.max(maxOccupancy, occupancy)
    ce.credits = credits
    ce.occupancy = occupancy
    trace.push(ce)
  }

  const observedThroughput = produced / scenario.cycles
  const checks = runChecks(scenario, maxRun, observedThroughput, leaked)

  return {
    trace,
    checks,
    converged: checks.every((c) => c.pass),
    iterations: scenario.fixed ? 2 : 1,
    maxOccupancy,
    totalBeats: produced,
    observedThroughput,
    stalledCycles: stalled,
    capacity: MAX_CAP,
  }
}

function runChecks(
  scenario: Scenario,
  maxRun: number,
  observedThroughput: number,
  leaked: number,
): Check[] {
  const sustainedOk = observedThroughput >= scenario.targetRate
  const stallOk = maxRun < 6
  const integrityOk = leaked === 0

  return [
    {
      id: 'tb_throughput',
      name: 'sustained throughput',
      desc: 'Producer sustains burst + steady state above the target rate.',
      pass: sustainedOk,
      detail: {
        cycles: 'full run',
        actual: `${(observedThroughput / scenario.targetRate * 100).toFixed(0)}% of target`,
        expected: `≥ 100% of target`,
      },
    },
    {
      id: 'tb_starvation_window',
      name: 'no starvation window',
      desc: 'Producer never stalls for more than 5 consecutive cycles.',
      pass: stallOk,
      detail: {
        cycles: 'max consecutive stall',
        actual: `${maxRun} cycles`,
        expected: '< 6 cycles',
      },
    },
    {
      id: 'tb_credit_integrity',
      name: 'credit integrity',
      desc: 'Every accepted beat returns its credit. No beat drops unconsumed.',
      pass: integrityOk,
      detail: {
        cycles: 'read-modify-write path',
        actual: `${leaked} dropped / un-returned`,
        expected: '0 dropped / un-returned',
      },
    },
  ]
}