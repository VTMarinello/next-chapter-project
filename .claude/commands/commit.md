---
description: Commit the current chunk with a course-style message, and push
allowed-tools: Bash(git *), Read, Edit
---

Commit the work in progress.

1. **Look before committing.** Run `git status` and `git diff` (and `git diff --staged`). Read
   what actually changed — don't assume it matches what was planned.

2. **Check for things that shouldn't ship.** No keys, tokens, passwords, or personal
   information. If anything looks sensitive, stop and ask.

3. **Stage the relevant files.** Not `git add .` blindly — stage what belongs to this chunk.
   If unrelated changes are sitting in the tree, mention them rather than sweeping them in.

4. **Write the message.** One line, present tense, describing the change in plain terms. Match
   the course's examples:

   ```
   Create homepage
   Add habit form
   Display habits
   Fix validation bug
   Improve layout
   ```

   No body paragraphs. No "feat:" prefixes. If one line can't cover it, the commit is probably
   two commits — say so.

5. **Commit, then push** to `main` if a remote is configured. If there's no remote yet, commit
   locally and say what's still needed to push.

6. **Update `PLAN.md`** — set the chunk's status to `committed` and record the commit message
   in its row.

Report the commit message used and confirm the push landed. If the push failed, say so and show
the error — don't report success you didn't verify.
