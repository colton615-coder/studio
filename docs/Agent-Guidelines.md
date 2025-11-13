# Agent Execution Guidelines

These guidelines codify reliable execution patterns used in this repository.

## Terminal Command Guidelines
- Execute terminal commands sequentially; never in parallel.
- Wait for each command to complete before starting the next.
- If a command is interrupted (Ctrl+C) or times out, acknowledge and retry once.
- For parallel information gathering, only use read-only tools (file reads, searches).
- For long-running commands (build, install), run in background and poll later.

## Error Recovery Pattern
When edits fail or produce corrupted output:
1. Immediately read the affected file to assess state.
2. Prefer a clean replacement over incremental fixes on a broken file.
3. Explain what went wrong and your recovery approach.

## Todo List Best Practices
- Create the full list at task start with all items "not-started".
- Update one todo at a time: mark "in-progress" when starting, "completed" when finished.
- Avoid bulk status updates unless tasks truly ran in parallel.

## Complex Type Conflicts (3rd‑party libs)
1. First attempt: Omit conflicting props from interfaces.
2. Next: Consult library typings/docs for correct types.
3. Last resort: Use targeted type assertions with a brief comment.
4. Leave a note for future refactors if a workaround remains.

## Creating Diagnostic/Report Files
1. Check if the file exists first.
2. If it exists, append a unique suffix or explicitly remove before recreating.
3. Prefer using repository file tools over shell heredocs when practical.

## On Errors or Interruptions
- Briefly acknowledge what went wrong.
- State the recovery approach.
- Continue without excessive verbosity.
