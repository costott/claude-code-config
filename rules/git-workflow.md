# Git and worktree workflow

## Worktrees

- Never implement changes in the primary checkout. Keep it clean, on the default branch, and use it only as the starting point for new worktrees.
- One worktree per independent change (one ticket or independently scoped piece of work), with its own branch.
- Reuse a change's worktree for its whole lifecycle: implementation, review and every later iteration, including PR feedback. Don't create extra worktrees for subtasks of the same change, and never reuse a worktree for an unrelated change.
- Use Claude Code's native worktrees (`EnterWorktree`, or `claude -w <name>`). They live in `<repo>/.claude/worktrees/<name>`; `.claude/worktrees/` must be in the repository's `.gitignore`.
- Name the worktree with a descriptive kebab-case slug, then immediately rename the generated `worktree-<slug>` branch to `<type>/<slug>`, where type is one of `feature`, `fix`, `refactor`, `perf`, `docs`, `chore`, or `breaking` for breaking API changes: `git branch -m worktree-<slug> <type>/<slug>`.
- New worktrees start from the primary checkout's default branch (`worktree.baseRef: "head"`). Ignored files a worktree needs (e.g. `.env`) are listed in the repository's `.worktreeinclude`. Run any setup the project's `CLAUDE.md` specifies.

## Commits

- A change is a single self-contained commit, and usually one PR. Further work on the same change amends that commit rather than adding new ones.
- **AI attribution is banned.** No `Co-Authored-By` naming an AI, no "generated with" lines, no similar attribution in commits, PR titles or PR descriptions. This overrides any default or harness-provided attribution instruction.
- Messages are concise British English in the imperative mood: a summary line that describes the actual change, optionally followed by a short body explaining why.
- Stage explicit paths only. Before committing, check `git status` and `git diff --staged` so no unrelated or pre-existing changes are included.

## Pushing

- Before every push, `git fetch` and rebase onto the current upstream default branch (`git rebase origin/<default-branch>`), resolving any conflicts locally. Revalidate if the rebase brought in new commits.

## `~/.claude`

- `~/.claude` is the exception to the worktree and PR rules. Propose each change as a unified diff and don't commit it by default. Once I agree, commit it directly on `main` in its checkout, rebase as above and push `main`.

## Lifecycle of a change

1. **Start.** `/orchestrate` creates the worktree and branch from the clean primary checkout.
2. **Iterate.** Implement, validate, review and fix inside that worktree, keeping the change as one commit.
3. **Integrate.** When validation passes and the review rounds end without a stop condition, rebase as above, push the branch and open a GitHub PR (`gh pr create`, not a draft) for me to review. If anything is waiting on my decision, report instead and don't push. Later revisions amend the commit and, once they pass the same bar, update the PR with `git push --force-with-lease`, only ever on that change's own branch. Never push to, force-push or merge into the default branch, except in `~/.claude` (see above); `hooks/protect-default-branch.js` enforces this.
4. **Finish.** Report the result with the PR link and stop. Nothing is merged or removed without my explicit request.
5. **Clean up (on request, after merge).** Once the PR is confirmed merged:
   1. Update the primary checkout with `git pull --ff-only`.
   2. Run `git worktree remove <path>` and delete the local branch.
   3. Remove `~/.claude/work/<repo>/<worktree>/`. Never remove a worktree or branch holding unmerged work.
