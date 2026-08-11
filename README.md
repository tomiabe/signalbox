# SignalBox

**Evidence infrastructure for AI-generated engineering systems.** SignalBox starts from plain-language intent, runs a deterministic replay, exposes the evidence behind a failure, and verifies a scoped fix.

[Live demo](https://tomiabe.github.io/signalbox/)

> Don't trust the output. Trace the evidence.

The point of the project is not to build a chip-design engine. It is a product-shaped portfolio case study about the human side of AI-native engineering: how a reviewer decides whether machine-generated work deserves trust.

## What it does

SignalBox turns an intent into a review packet and walks through the loop in one workspace:

1. **Intent**: the original plain-English request.
2. **Contract**: the specific rules the system must satisfy.
3. **Replay**: a deterministic run with the same seed every time.
4. **Evidence**: trace spans, waveform signals, checks, and provenance.
5. **Diagnosis**: a machine note grounded in the replay.
6. **Patch**: a scoped proposed fix.
7. **Verification**: the same checks re-run until the packet converges.

The LLM never decides whether the system passed. It can only interpret the run and explain the evidence. The simulator and checks are deterministic code.

## Where it fits

SignalBox is one part of a larger AI-native engineering platform.

A Chipforge-like system might cover:

```text
Intent -> Specification -> Design generation -> Simulation -> Evidence -> Patch -> Re-verification -> Synthesis -> Hardware
```

SignalBox focuses on the trust layer in the middle:

```text
Simulation -> Evidence -> Diagnosis -> Patch -> Re-verification
```

That makes it useful as a product-design exploration for the review experience: how a human understands and trusts what an AI-generated engineering system did.

## Current scenarios

- **Hardware replay**: a bus/FIFO backpressure bug where a read-modify-write beat leaks credits and starves a producer.
- **Peripheral channel replay**: a wait-stated byte-channel case that preserves every beat after the fix.
- **Model eval replay**: a checkpoint evaluation case where reasoning score, instruction adherence, and training-data provenance are reviewed as an evidence packet.

The hardware scenario is the flagship because deterministic simulation makes the evidence problem easy to feel. The underlying loop is broader: it applies to AI-generated systems where correctness can be expressed as testable contracts and backed by reproducible evidence.

## Key features

- Plain-English explanation drawer for non-specialist reviewers.
- Seeded simulation engine with reproducible traces.
- Evidence graph tying intent, model, replay, evidence, and review into one packet.
- Cycle scrubber with failure span chips.
- SVG waveform viewer synced to the selected cycle.
- Verification panel with expected vs actual results.
- Local deterministic diagnosis when no API key is configured.
- Exportable evidence packet containing intent, contract, provenance, checks, diagnosis, patch, and trace data.
- Light and dark mode with a restrained engineering UI.

## Built with

- **Vue 3** with `<script setup>`
- **Vite**
- **TypeScript**
- **Pinia**
- `lucide-vue-next`
- `@fontsource-variable/geist`

## Getting started

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

The dev server runs at `http://localhost:5173` by default.

## Optional AI diagnosis

SignalBox works fully offline through a local fallback diagnosis. To enable live model-generated notes, open **Settings** with `Cmd+K` and add an OpenAI-compatible base URL and API key. The key is stored in `localStorage` and only sent to the base URL you provide.

## Project structure

```text
signalbox/
├── src/
│   ├── engine/
│   │   ├── simulate.ts
│   │   ├── scenarios.ts
│   │   └── types.ts
│   ├── lib/
│   │   └── llm.ts
│   ├── stores/
│   │   └── workspace.ts
│   ├── components/
│   │   ├── MainStage.vue
│   │   ├── PipelineView.vue
│   │   ├── ResultsPanel.vue
│   │   ├── SpecRail.vue
│   │   ├── TimelineView.vue
│   │   ├── TopApp.vue
│   │   ├── WaveformView.vue
│   │   └── SettingsModal.vue
│   └── styles/
│       ├── tokens.css
│       └── ui.css
└── vite.config.ts
```

## Why this exists

SignalBox is a design-engineering exploration for companies building serious AI systems, especially systems like Chipforge where intent, generated artifacts, simulation, formal evidence, provenance, and verification have to stay connected.

The portfolio thesis is simple:

**AI-generated engineering work needs an evidence layer a human can inspect.**

## Presentation line

> I designed and built a working concept for the human verification layer of an AI-native engineering platform. The point is not to replace the hardware engine. It is to make the engine's work reviewable, explainable, and trustworthy.
