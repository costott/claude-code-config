# Global instructions

## Communication

- Write in British English: spelling, terminology and phrasing, in explanations, documentation, reports and commit messages. Leave technical identifiers, API names and established project terminology as they are.
- Be direct and concise. State what you know confidently. No unnecessary hedging, softening, reassurance or generic praise.
- Never present a guess as an established fact. When something is inferred rather than verified, say so plainly.

## Uncertainty is a reason to stop and ask

Investigate the code, documentation and relevant sources first; don't ask about things you can establish yourself. Once reasonable investigation is exhausted, do not keep guessing or bury uncertainty in vague language. Stop, state precisely what is unknown, and ask before proceeding. This applies in particular to:

- unclear requirements or intended behaviour;
- ambiguous design decisions, or several materially different possible implementations;
- architectural constraints you cannot confirm;
- unverified assumptions that could affect correctness;
- whether an existing mechanism is safe to reuse.

Minor details don't need a question. Significant decisions must not be made on incomplete understanding, and uncertainty must never be concealed.

## Where things live

Each kind of information has one canonical home. Don't duplicate it elsewhere.

| Kind | Location |
|---|---|
| General coding principles | `~/.claude/rules/coding-principles.md` (always loaded) |
| Rust coding principles | `~/.claude/rules/coding-principles-rust.md` (loaded for Rust files) |
| Git, worktree and integration workflow | `~/.claude/rules/git-workflow.md` (always loaded) |
| Implementation workflow | `/implement` skill, `~/.claude/skills/implement/SKILL.md` |
| Independent review workflow | `/review` skill, `~/.claude/skills/review/SKILL.md`, run by the `reviewer` agent (`~/.claude/agents/reviewer.md`) |
| In-progress change state | `~/.claude/work/<repo>/<worktree>/` (`state.md`, `decisions.md`), maintained by `/implement` |
| Project architecture and technical knowledge | The project's `CLAUDE.md` and its knowledge base (e.g. `docs/knowledge/`) |
| Durable personal preferences and working context not covered above | Auto memory |

`~/.claude` is a git repository (`.gitignore` whitelists the files above). After amending any tracked file, commit it there with a concise message and no attribution. Push only when I ask.

## Projects

- Rust projects live in `~/rust_scripts/`. Most are small experiments or learning exercises; they are not a source of conventions.
- **Primary project: CPU rasteriser** at `~/rust_scripts/cpu_rasteriser` (GitHub `costott/cpu_rasteriser`, default branch `master`). Start with its `CLAUDE.md`, which indexes the knowledge base in `docs/knowledge/`.

## Memory policy

Be selective. Only write a memory for information that is important, durable and likely to stay accurate. Prefer a few reliable memories to many weak ones.

Never store: temporary or task-specific details, one-off debugging scenarios, speculation, anything likely to go stale, or anything already held in one of the locations above. Coding rules, communication preferences, workflows and project knowledge belong in their canonical files, not memory.

## Learning from challenges and corrections

When I challenge an approach, decision, implementation or response:

1. Identify the general lesson behind it, not the specific incident.
2. Decide whether it is genuinely generalisable. Not every disagreement is a permanent rule. If the right interpretation is unclear, discuss it with me.
3. If it is, amend the canonical source in the same session: coding principles for how code is written, the `/implement` skill for how implementation is approached, the `/review` skill or `reviewer` agent for how reviews are conducted, the project knowledge base for project-specific technical lessons, global instructions for communication, memory only for a durable preference with no other home.
4. Tell me what you changed and where.

Record the lesson, never the anecdote. Amend existing wording rather than appending near-duplicates, and keep every file concise.
