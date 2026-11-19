# claude-code-config

My personal development environment for [Claude Code](https://claude.com/claude-code). It aims for good engineering outcomes on minimal tokens: little context loaded by default, an explicit workflow for each change, and an independent review.

## Principles

- **One canonical home per kind of information.** Communication preferences, coding principles, workflows, project knowledge and memory each live in exactly one place and aren't duplicated.
- **Load selectively.** Only `CLAUDE.md` and the general rules load every session. Rust rules load only when Rust files are involved. Project knowledge bases are indexed, and only the relevant documents get read.
- **Stop and ask rather than guess.** Material uncertainty is raised explicitly instead of being buried in confident output.
- **Learn from corrections.** When a correction reveals a general lesson, the lesson is written into the canonical file it belongs to. The individual incident isn't recorded.
- **Independent review.** Changes are reviewed by a separate, cheaper, read-only model. It reports findings only and never fixes anything, so its output stays small and the implementing session stays responsible for the code.

## Layout

| Path | Purpose |
|---|---|
| `CLAUDE.md` | Global instructions: communication, uncertainty, where things live, memory policy, learning from corrections |
| `rules/coding-principles.md` | Language-agnostic coding principles (always loaded) |
| `rules/coding-principles-rust.md` | Rust principles, loaded only for `*.rs` and `Cargo.toml` (`paths:` frontmatter) |
| `rules/git-workflow.md` | Worktree-per-change policy, commit rules, change lifecycle |
| `skills/implement/` | `/implement`: scope, design, implement, validate, review and commit one change in its own worktree |
| `skills/review/` | `/review`: assembles a self-contained brief and hands it to the reviewer agent |
| `agents/reviewer.md` | Sonnet reviewer with `Read`/`Grep`/`Glob`/`Bash`; returns a findings-only report |
| `hooks/readonly-git.js` | `PreToolUse` hook that restricts the reviewer's Bash to read-only git commands |
| `statusline.js` | Status line showing prompt-cache warmth and context usage in tokens |

## Workflow

1. **`/implement <change>`** creates a native worktree from the default branch and renames its branch to `<type>/<slug>`. It reads the project's knowledge-base index, scopes and designs the change (asking about anything unresolved), then implements and validates it.
2. **`/review`** gives the reviewer the requirements, design decisions, validation results and the worktree path. The reviewer inspects the real diff itself, read-only.
3. Findings are addressed and the change is reviewed again. It is committed as **one self-contained commit**, amended on later iterations, and nothing carries AI attribution.
4. Pushing, opening a PR and cleaning up the worktree happen only on explicit request.

Each change keeps short `state.md` and `decisions.md` files in `~/.claude/work/<repo>/<worktree>/`. A fresh session can then resume from a couple of short files instead of re-reading a transcript.

## Installation

This repository is `~/.claude` itself. Its `.gitignore` ignores everything except the files above, so credentials, history, transcripts and per-change state can never be committed.

```sh
git clone <this repo> ~/.claude   # or, into an existing ~/.claude: git init, add the remote, git fetch, git checkout -f main
```

`settings.json` is machine-specific, so it isn't tracked. The workflow relies on these keys:

```json
{
  "attribution": { "commit": "", "pr": "", "sessionUrl": false },
  "worktree": { "baseRef": "head" },
  "statusLine": { "type": "command", "command": "node \"$HOME/.claude/statusline.js\"" }
}
```

`CLAUDE.md` lists my own projects. Replace that section with yours.

## Roadmap

- **Parallel changes.** Light orchestration for running several independent changes at once, with one worktree and session each and a summary of their states. The constraint is that it must stay cheap. A heavyweight orchestrator would defeat the purpose of this setup.
- **Lifecycle skills.** Turn the "integrate" (push and PR) and "clean up after merge" steps into skills, rather than leaving them as rules.
- **Staleness checks.** A small script that lists knowledge-base documents whose `sources` changed after their `verified` commit.
