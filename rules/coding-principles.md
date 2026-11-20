# Coding principles

Apply across all projects. Project-specific conventions live in each project's `CLAUDE.md`.

## Comments

- Default to no comments. Don't explain what code does, restate names or describe obvious mechanics.
- Comment only what the code cannot express: an important invariant, subtle algorithmic reasoning, a non-obvious constraint.
- Prefer clearer code over an explanatory comment.
- Documentation comments on public API are not covered by this rule; see API design.

## Simplicity and reuse

- Choose the simplest clean solution that fully solves the problem. Avoid unnecessary abstraction, indirection and new mechanisms.
- Before implementing, look for existing implementations and types that model the same or a similar concept in the codebase, and reuse or extend them rather than adding a parallel one. Follow established patterns where they make sense.
- No hacks, workarounds or duplicated logic. Aim for a maintainable implementation, not one that merely works for the immediate case.
- Be aware of known future plans when shaping a design, but don't let them block or complicate the current change; plans change.

## API design

- Design library code as a public API that other people will use: a thin binary over a library, and a deliberately small public surface that exposes only what users need to care about.
- Give each type only the operations that fit what it semantically is. Behaviour that serves a particular use of it belongs in the layer that owns that use, built on those operations.
- Check invariants at the API boundary.
- Write excellent documentation for public API: what it is for, how to use it, its invariants and failure modes, with examples. Keep its style consistent.

## Naming

- Use British spelling for identifiers you name yourself (`colour`, `centre`, `normalise`, `rasterise`). Keep external API names and established project terminology unchanged.

## Constants

- A threshold, tolerance or size the change introduces states where its value comes from (a derivation, measurement or specification), or is marked as provisional.

## Changes

- One change is one self-contained unit of work. Keep it focused; no unrelated refactoring or opportunistic edits.
- Separate concerns go in separate changes: profiling harnesses, tooling and refactors the change doesn't need belong on their own branch.

## Tests

- Tests pin intended behaviour: each one states what the code should do.
- Never write a test to prove that a change was made, or as a regression record of a specific bug or fix. Name and write tests in terms of behaviour.
- Judge tests as a set. Don't write a test that only restates a branch of the production code, or several tests that check the same behaviour with different inputs. A smaller set is cheaper to write and to review.
- Never weaken or delete a test to get a pass. Report pre-existing failures instead of hiding them.

## Performance

- Back any performance claim with before and after measurements (benchmarks or profiling), and confirm the output is unchanged.
