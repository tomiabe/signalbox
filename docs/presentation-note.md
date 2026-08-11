# SignalBox Presentation Note

## One-line explanation

SignalBox is an evidence workspace for AI-generated engineering work.

## Slightly longer version

When an AI system generates or changes a technical design, a human should not have to trust the result blindly. SignalBox shows the original intent, the derived rules, the replay, the failure evidence, the diagnosis, the proposed patch, and the final verification.

## What type of software it is

SignalBox is a concept for AI-assisted hardware and engineering design software. More specifically, it explores the review and evidence layer around generated technical work.

It is not a general chatbot, a code editor, or a full chip-design platform. It is closer to an evidence workspace for simulation, verification, diagnosis, patching, and re-verification.

## Where it fits

AI-native hardware design platforms often need to take users from design intent to working hardware. That larger journey can include intent, specifications, RTL/design generation, simulation, verification, synthesis, and hardware deployment.

SignalBox focuses on one part of that journey: the evidence and review layer.

```text
AI produces or changes a design
        ↓
Simulation / replay
        ↓
Evidence packet
        ↓
Human review
        ↓
Patch
        ↓
Re-verification
```

## The product problem

The question SignalBox asks is:

> How does a human know that an AI-generated technical system deserves to be trusted?

That is different from asking:

> Can AI generate a chip design?

SignalBox does not try to solve chip generation. It explores the user experience around trust, inspection, and verification.

## Who would use it

- Hardware engineers reviewing generated designs.
- Verification engineers inspecting failed checks, traces, and waveforms.
- AI/ML engineers reviewing model evals, regression behaviour, and provenance.
- Product teams building technical engineering tools.
- Technical leads who need a readable review packet instead of raw logs.

## How to demo it

1. Open the live demo.
2. Start on the Packet view and explain that this is the review packet: the intent, contract, evidence sources, and provenance.
3. Click Run simulation.
4. Move through the Evidence view and show that the trace and waveform are not decorative charts. They are inspectable evidence.
5. Open Review findings.
6. Show the failed checks, machine note, and proposed patch.
7. Click Apply patch and verify.
8. Show that the same checks turn green.

## Plain-English analogy

Imagine an AI writes instructions for an automated factory. You would not run the real factory just because the AI sounds confident. You would want a controlled test, a record of what happened, proof of where it failed, and confirmation that the fix worked. SignalBox is that review room.

## What this shows about Tomi

- Product thinking for complex technical workflows.
- Frontend implementation skill.
- Ability to translate engineering systems into clear interfaces.
- Understanding of AI trust, evidence, provenance, and verification.
- Design taste for serious technical software.
- Ability to build a product-shaped prototype, not just a static mockup.

## Suggested outreach framing

> I have been thinking about the human verification layer for AI-native engineering tools. I built SignalBox as a small working concept: an evidence workspace where intent, replay, traces, diagnosis, patching, and re-verification stay connected. It is not an attempt to build a full hardware design engine. It is an exploration of how users might inspect and trust the work that engine produces.
