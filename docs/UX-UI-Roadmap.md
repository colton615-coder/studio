# UX/UI Roadmap (Phase 1)

Low-risk, high-impact visual and motion polish with zero business-logic changes.

## Goals
- Sleek, professional, provocative, abstract aesthetic
- Consistent motion and depth across the app
- Zero regressions; fully type-safe and a11y-aware

## Deliverables
- Motion tempo tokens in `src/lib/motion.ts` (durations + spring presets)
- `PrismCard` in `src/components/ui/prism-card.tsx` (glossy surface, inner glow, noise)
- Ambient background in `src/components/ui/ambient-background.tsx` (opt‑in, reduced-motion aware)
- Wiring limited to dashboards; feature-flag capable if needed

## Visual & Motion System
- Timing scale: xs 120ms, s 180ms, m 260ms, l 380ms, xl 520ms; springs ~ `{ stiffness: 200, damping: 24 }`
- Depth: chromatic neu shadows, soft ambient key light, subtle noise overlay
- Sheen & particles aligned to reduced-motion; amplitude and frequency scaled down

## Navigation & Feedback
- BottomNavBar: morphing active indicator (easeInOut), route-tinted
- Success micro-particles per module (finance: upward; habits: ember)

## Accessibility & Safety
- All motion honors `prefers-reduced-motion`
- AA contrast on small text and chart axes
- Optional feature flags for gradual rollout

## Success Criteria
- No new console errors in production
- 0 failing tests, typechecks, lints
- Lighthouse PWA ≥ 90; Performance ≥ 90 (route dependent)

## Out of Scope
- Business logic changes
- Data model/schema updates

