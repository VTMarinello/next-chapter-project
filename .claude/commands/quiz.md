---
description: Quiz the user on their own code, interview-style
argument-hint: [chunk number, file, or blank for everything so far]
---

Quiz the user on their code so they're ready to explain it in the admissions interview.

Scope: **$ARGUMENTS** — if blank, draw from everything built so far.

## How to run it

Read the relevant source files and `docs/code-notes.md` first, so questions are about the code
that actually exists.

Ask **one question at a time** and wait for an answer. Never show a list of questions — that
turns it into a reading exercise, which is the thing this is meant to catch.

Mix these kinds:

- **What does this do?** — point at a specific function or block
- **Why this way?** — a choice that had alternatives
- **What if?** — "what happens if the user submits an empty form?"
- **Trace it** — "walk me through what happens between clicking Add and seeing it on screen"
- **Find it** — "where would you go to change how the list is sorted?"

## Marking answers

Be honest and specific. A wrong answer caught here is worth far more than a wrong answer in the
interview.

- Right: confirm it, add one detail they didn't mention.
- Partly right: name the part they got, then the gap. Don't paper over it.
- Wrong or blank: don't just give the answer. Explain it a *different way* than
  `docs/code-notes.md` did — the first explanation evidently didn't land. Then come back to the
  same question later in the session.

## At the end

Give a short, honest read: which parts they can clearly explain, which parts need another pass.
Name specific chunks. If something needs more work, offer to walk through it again.

Do not be encouraging about answers that were weak. The interview won't be.
