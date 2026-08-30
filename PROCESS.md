# Process overview

## What I built

Wake is a wordless pointer/touch game: a lantern chases wisps through a
graveyard, and every route the player has already walked returns as a
lethal wraith retracing it.

## The moments that mattered

1. **Human playtest at 1920×1080 and 390×844.** I personally played the
   finished game at both marking viewports, not just the earlier automated
   smoke check. At both sizes it was understandable without any
   instructions, playable, and felt fair — I found no gameplay-rule or
   difficulty problem worth changing.
   Evidence: [`87008f6`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-mukulsharma0260-alt/commit/87008f6) — playable loop.

2. **Playtest-driven refinement.** Rather than manufacture a gameplay
   problem to justify a change, I compared one small visual refinement:
   walked wraith-path opacity from `.11` to `.15`. After replaying, I
   preferred `.15` — accumulated paths were easier to read strategically
   without becoming distracting. No gameplay constants or rules changed.
   `pnpm check` passed: typecheck, build, all 27 tests.
   Evidence: [`0a29479`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-mukulsharma0260-alt/commit/0a29479).

3. **Directing and correcting the agent.** The first attempted opacity edit
   duplicated both the old and new `strokeStyle` lines instead of replacing
   one with the other. I rejected it, requested an exact single
   substitution instead, verified exactly one `.15` line remained, then
   reran checks before committing.
   Evidence: [`0a29479`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-mukulsharma0260-alt/commit/0a29479).
