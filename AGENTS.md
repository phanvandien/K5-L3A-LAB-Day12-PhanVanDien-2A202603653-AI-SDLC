# Agent instructions

- Read `docs/spec/phase-1-3.md` and the relevant ADR before changing gameplay.
- Keep simulation deterministic and at fixed 60 Hz; do not put rendering logic in `src/sim.js`.
- Current contract is 1.2. Entry point: `node src/headless.js --seed 42 --night 1 --ticks 600 --out out.jsonl`.
- Run the scenario suite with `node tools/verify.js`; update/add a scenario for each gameplay feature change.
- Output JSONL must stay machine-readable. Do not hand-edit generated proof output.
- Do not claim browser playability, FPS, or visual requirements are verified unless they were observed on the running game.
- Keep secrets, API keys and `.env` out of Git.
