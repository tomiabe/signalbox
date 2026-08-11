<script setup lang="ts">
import { X } from 'lucide-vue-next'

const emit = defineEmits<{ (e: 'close'): void }>()

const sections = [
  {
    title: 'What SignalBox is showing',
    body: 'SignalBox shows the review step after an AI has generated or changed a technical design. It helps a human ask: what did the AI think it was building, what evidence was collected, what failed, and did the fix actually work?',
  },
  {
    title: 'What type of software this is',
    body: 'SignalBox is a concept for AI-assisted hardware and engineering design software. It sits near simulation, verification, and review: the part of the workflow where engineers inspect whether a generated design is actually safe to trust.',
  },
  {
    title: 'Who would use it',
    body: 'The primary users are hardware engineers, verification engineers, AI/ML engineers working on model evals, and product teams building technical design tools. A less technical stakeholder could also use it to understand the status of a review packet without reading raw logs.',
  },
  {
    title: 'Where it fits',
    body: 'In a larger hardware design platform, SignalBox would live after a design or patch has been generated and before that work is accepted. It helps connect simulation results, waveforms, failed checks, diagnosis, proposed fixes, and re-verification.',
  },
  {
    title: 'How to demo it',
    body: 'Start in Packet, run the evidence replay, inspect the failed evidence, open Review, apply the patch, and show that the same checks turn green. The important idea is not that the AI made a design. It is that the human can inspect why the design should be trusted.',
  },
]

const terms = [
  ['Intent', 'The original request: what the user asked the system to build or check.'],
  ['Contract', 'The rules the system must satisfy. In plain English: the promise the output has to keep.'],
  ['Replay', 'A repeatable test run. Same setup, same result, every time.'],
  ['Trace', 'A timeline of what happened during the run. It lets the reviewer inspect moments instead of reading a wall of logs.'],
  ['Waveform', 'A signal timeline used in hardware work. It shows when parts of the system were active, blocked, full, or ready.'],
  ['FIFO', 'A small queue. First item in, first item out. Here it represents a place where data waits before being consumed.'],
  ['Credit', 'A permission token. If credits run out, the producer has to stop sending data.'],
  ['Patch', 'A small proposed change meant to fix the failure.'],
  ['Verification', 'Running the checks again to prove the fix worked.'],
  ['Provenance', 'Where the data or evidence came from, and whether it is allowed to be used.'],
]
</script>

<template>
  <div class="gloss-backdrop" @click="emit('close')"></div>
  <aside class="glossary" role="dialog" aria-modal="true" aria-label="SignalBox explanation">
    <header class="g-head">
      <div>
        <span class="g-kicker mono">plain English</span>
        <h2>What is SignalBox?</h2>
      </div>
      <button class="btn btn-icon btn-ghost" aria-label="Close explanation" @click="emit('close')">
        <X :size="16" />
      </button>
    </header>

    <div class="g-body">
      <section v-for="section in sections" :key="section.title" class="g-section">
        <h3>{{ section.title }}</h3>
        <p>{{ section.body }}</p>
      </section>

      <section class="g-section">
        <h3>Useful terms</h3>
        <dl class="term-list">
          <div v-for="[term, explanation] in terms" :key="term" class="term">
            <dt>{{ term }}</dt>
            <dd>{{ explanation }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.gloss-backdrop {
  position: fixed;
  inset: 0;
  z-index: 45;
  background: rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(2px);
}
.glossary {
  position: fixed;
  top: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 55;
  width: min(460px, calc(100vw - 24px));
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-1);
  box-shadow: var(--shadow-2);
  overflow: hidden;
}
.g-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}
.g-kicker {
  display: block;
  margin-bottom: 5px;
  color: var(--signal-cyan);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.g-head h2 {
  font-size: 18px;
  line-height: 1.25;
  font-weight: 650;
}
.g-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow-y: auto;
}
.g-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.g-section h3 {
  font-size: 13px;
  font-weight: 650;
}
.g-section p,
.term dd {
  color: var(--text-1);
  font-size: 13px;
  line-height: 1.55;
}
.term-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.term {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-2);
}
.term dt {
  color: var(--text-0);
  font-size: 12px;
  font-weight: 650;
}
.term dd {
  margin: 0;
}
@media (max-width: 520px) {
  .glossary {
    inset: 8px;
    width: auto;
  }
  .term {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
