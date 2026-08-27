# COMP4020 prototype

Your starter repo for a COMP4020 prototype: a static site in HTML/CSS/TypeScript
that builds to plain HTML/CSS/JS and deploys to GitHub Pages. The deployed site
is what gets marked, not this repo.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so the deployed head is the only place a broken one shows up.

## The checks

`pnpm check` runs them, and `pnpm check:evidence` is the extra gate before you
ship. CI runs the same plus links, secrets and the deploy.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

## This file is yours

A starting point, not a rulebook: what you add to it is the harness, and the
harness is assessed. This file and the sensors you wire into `check` carry
across the course --- both come with you into next week's repo. The prototype
doesn't: source, and the tests answering this week's published spec, stay
behind. `spec/README.md` draws the line.

## Carried-forward conventions

Rules that stuck across prior weeks and generalise beyond any one brief. They
apply only where they do not conflict with the current published brief;
reconcile them against this week's spec before reuse rather than carrying
them forward blindly.

### Interaction

- Multi-input support (mouse, touch, keyboard) is the default; a single input
  mode is only acceptable when the brief specifically designs around it, as
  Wake's pointer/touch-only lantern does.
- Do not narrow to a single input mode by accident.
- The control must start responding without delay; deliberate physical lag in
  the response itself (Wake's lantern eases toward the pointer, it doesn't
  snap) is a mechanic, not a violation of this.
- Meaning can be carried by colour and motion together when the brief's own
  legibility contract says so (Wake: warm+moving = player/target, cold+moving
  = lethal wraith, dim+static = scenery) --- a deliberate exception, not the
  default.
- Any restart/reset affordance must be wordless if the brief requires a
  wordless restart (Wake does): no button, overlay or text --- the next
  pointer movement after death is the only reset there is.
- Interaction state must survive viewport resizing.

### Accessibility and resilience

- Must work at 390x844 and 1920x1080.
- No horizontal overflow at the mobile marking viewport.
- Visible focus states, where focusable elements actually exist.
- prefers-reduced-motion may damp decorative motion only (fog drift, film
  grain, screen shake) --- required gameplay motion (lantern, wisp, wraiths)
  must never be disabled or altered by it.

### Agent behaviour

- Verify formulas and numerical claims before accepting them.
- If a model/test/design assumption is wrong, correct the rule or test before
  retrying implementation.
- Do not modify course-provided invariant tests to make implementation pass.
- Run the relevant checks before declaring a stage complete.
- Do not silently broaden scope.

### Safe recovery after malformed agent edits

- If an agent produces a malformed or risky large edit, do not repeatedly
  accept variants of the same broken edit.
- Stage risky rewrites in a temporary file first when appropriate.
- Before copying staged work into src/, verify expected selectors/IDs and
  ensure obsolete and replacement versions are not both present.
- Run focused syntax/style checks and the relevant tests before accepting the
  recovered version.
- When a failure reveals a reusable process lesson, update CLAUDE.md before
  continuing.
