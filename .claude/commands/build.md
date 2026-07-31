---
description: Build one chunk from PLAN.md, then explain it in plain language
argument-hint: <chunk number or name>
---

Build chunk **$ARGUMENTS** from `PLAN.md`.

Run these in order. Do not skip the explain step. **Every chunk ends in its own commit** — the
course requires a history that shows the project evolving, and that cannot depend on the user
remembering to ask.

1. **Check the chunk exists.** Read `PLAN.md`. If `$ARGUMENTS` doesn't match a chunk, list the
   available chunks and stop. If the plan is still empty, say so — planning comes first.

2. **Build it.** Launch the `builder` subagent with the chunk description. It implements only
   that chunk.

3. **Explain it.** Launch the `explainer` subagent on the files the builder touched. It reads
   the finished code fresh. Append its output to `docs/code-notes.md` (create the file with a
   `# Code Notes` heading if it doesn't exist).

4. **Commit and push.** Automatically, without being asked. Follow the rules in
   `.claude/commands/commit.md`: review the actual diff, check nothing sensitive is included,
   stage only this chunk's files, write a one-line present-tense message, commit, push.

   Two exceptions — stop and ask the user first if either applies:
   - The explainer flagged something clearly broken or wrong
   - The diff contains anything that looks sensitive

   Committing before the quiz is deliberate. The quiz changes the user's understanding, not the
   code, and an interactive step must never be what stands between work and a saved commit.

5. **Show the user.** Present the explanation in the conversation — don't just tell them a file
   was written. Then ask the three interview questions the explainer produced, one at a time,
   and wait for answers. Where an answer is shaky, re-explain that piece differently rather
   than repeating the same words.

   If the quiz reveals the code should change, change it and make a second commit. A history
   showing a fix after a rethink is *better* evidence than one clean commit — it's what
   "iteration" looks like to a reviewer.

6. **Update `PLAN.md`.** Set the chunk's status to `committed` and record the commit message in
   its row.

7. **Point at what's next.** Name the next chunk.

If the builder reports something it was unsure about, or the explainer flags something fragile,
surface that to the user rather than burying it. Those moments are worth capturing for
`prompt-history.md`.
