# SignalBox

**A design-verification workspace.** Turn plain-language requirements into inspectable, deterministic hardware models — simulate, fail, diagnose, fix, and converge. Built as a portfolio piece to show what a design engineer brings to complex, data-heavy, AI-assisted systems.

> **AI for interpretation; deterministic code for execution and verification.**
> The simulator is a seeded, side-effect-free cycle trace, so a given run is perfectly reproducible. The LLM never influences the outcome — it only reads the trace and interprets it.

## What it does

SignalBox takes an English-language design intent, derives a spec from it, and runs a deterministic datapath simulation of a *hardware backpressure* bug. It walks the full verification loop in a single screen:

1. **Describe** — a plain-English intent becomes a structured derived spec.
2. **Simulate** — a seeded cycle-trace datapath runs the design.
3. **Fail** — the run collapses under a real, deterministic bug.
4. **Diagnose** — AI diagnoses the failure with an evidence-backed trace (or a robust local fallback).
5. **Fix** — apply the fix and re-run.
6. **Re-verify** — the checks re-run against the same contract.
7. **Converged** — green banner once the design passes.

### The bug under the hood

A **credit/backpressure leak**: on a misaligned read-modify-write strobe, a beat is consumed but never latched — a credit silently never returns. Over time the effective credit pool erodes and starves the producer. That is why the bug only shows up under *bursty* load and not steady state:

- **Unfixed**: throughput collapses to ~8–9%, and the producer hits a 128-cycle starvation stall.
- **Fixed**: the design converges to ~104–105% (data always drained, never a beat dropped).

Two seeded presets ship in the box (`bus_axi_lite/f2d`, `us_bvme/byte-en`) and both verify to converge once fixed.

## Built with

- **Vue 3** (`<script setup>`) + **Vite** + **TypeScript** (strict, `vue-tsc -b`)
- **Pinia** for the workspace state machine (`Stage`, `SimStatus`, `run/reset/setPreset`)
- `lucide-vue-next` icons, `@fontsource-variable/geist`, a full light/dark token system
- A deterministic simulation engine (`src/engine/`), mulberry32-seeded, no math randomness
- An OpenAI-compatible LLM client (`src/lib/llm.ts`) with a built-in deterministic mock so the app is 100% functional without an API key

## Getting started

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run typecheck  # vue-tsc --noEmit
npm run build      # typecheck + production build
npm run preview    # serve the built app
```

### Optional: live AI diagnosis

SignalBox works fully offline via a local fallback diagnosis. To enable the LLM, open **Settings** (`Esc` or `Cmd+K`) and add an OpenAI-compatible base URL and API key. The key is stored only in `localStorage`, never sent anywhere but the base URL you enter.

## Project structure

```
signalbox/
├── public/signalbox.svg
├── src/
│   ├── engine/          # deterministic sim engine + scenario presets (the source of truth)
│   │   ├── simulate.ts   # seeded cycle trace + capacity/backpressure checks
│   │   ├── scenarios.ts  # scenario presets, intents, fixed descriptions
│   │   └── types.ts
│   ├── lib/llm.ts        # OpenAI-compatible client + coalesced local diagnosis + trace spans
│   ├── stores/workspace.ts   # Pinia state machine orchestrating the loop
│   ├── components/
│   │   ├── TopApp.vue        # brand, theme toggle, settings
│   │   ├── SpecRail.vue      # intent → derived spec accordion + preset switcher
│   │   ├── MainStage.vue     # idle / running / review phases + run summary
│   │   ├── PipelineView.vue  # producer→FIFO→consumer visual + occupancy meter
│   │   ├── TimelineView.vue  # cycle-scrubbable trace, hover, span highlight/auto-scroll
│   │   └── ResultsPanel.vue  # checks, diagnosis + evidence, fix block, converged banner
│   └── styles/           # tokens.css (light/dark), ui.css (primitives)
└── vite.config.ts
```

## Design notes

- **Design review pass** — the UI was run through the Rams a11y/design review; findings (via `aria-label` on icon-only controls, `sr-only` pass/fail status, chip keyboard `aria-pressed`, `prefers-reduced-motion` overrides) were applied.
- **Light/dark** — full token system keyed on `data-theme`; the timeline and occupancy meter stay legible in both.
- **Determinism everywhere** — the sim seed, the trace, and the check thresholds are all fixed, so the demo converges identically every run.

## Why this exists

This project demonstrates the *product-design skill* that a company like EzzyBills or Chipforge cares about: taking a complex, nondeterministic system (backpressure, credit pools, RMW beats) and making it **inspectable, explainable, and converge-on-a-fix** for a human — the same shape of problem as AI document extraction, approval workflows, and integration logic.