# Vehicle Load Simulator (Next.js + Tailwind + TypeScript)

## Setup
1. `npx create-next-app@latest vehicle-sim --typescript --eslint --tailwind --app --src-dir`
2. `cd vehicle-sim`
3. Replace generated files with the files in this project.
4. `npm run dev`

## What it does
- Live vehicle selector, speed slider (0-120 km/h), and drive-state toggle.
- Computes RPM + gear via deterministic piecewise heuristics.
- Computes thermal/mechanical/aerodynamic/total workload percentages (0-100).
- Renders minimalist horizontal bars with no charting library.

## Optional sanity run
After building TypeScript output for `src/lib/physicsCore.ts`, call `runSanityCheck()` to print a compact table and PASS/FAIL calibration checks.
