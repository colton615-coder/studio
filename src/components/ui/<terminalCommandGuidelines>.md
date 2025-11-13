<terminalCommandGuidelines>
- Execute terminal commands sequentially; never in parallel
- Wait for each command to complete before starting the next
- If a command is interrupted (^C), acknowledge and retry once
- Use read-only tools (file operations, search) for parallel information gathering
- For long-running commands (build, install), set isBackground=true and check later
</terminalCommandGuidelines>

<errorRecoveryPattern>
When edits fail or produce corrupted output:
1. Immediately read the affected file to assess state
2. Create clean replacement rather than incremental fixes on broken state
3. Explain what went wrong and how you're recovering
</errorRecoveryPattern>

<todoListBestPractices>
- Create comprehensive todo list at task start (all "not-started")
- Update ONE todo at a time as you work through them
- Mark "in-progress" when starting a task
- Mark "completed" immediately when that specific task finishes
- Avoid bulk status updates unless genuinely parallel
</todoListBestPractices>

<complexTypeConflicts>
For complex type conflicts with third-party libraries:
1. First attempt: Omit conflicting props from interface
2. If that fails: Check library documentation for proper types
3. Last resort: Use targeted type assertions with explanatory comments
4. Document the workaround in code comments for future reference
</complexTypeConflicts>

<whenAnEditFails>
When an edit fails or produces unexpected results:
1. Immediately read the affected file to assess damage
2. Create a clean replacement rather than attempting incremental fixes
3. Log what went wrong for the user's awareness
</whenAnEditFails>

<whenExecutingTerminalCommands>
When executing terminal commands:
- Always wait for the previous command to complete before starting a new one
- If a command is interrupted or times out, acknowledge it and retry once
- For parallel information gathering, only use read-only tools (read_file, grep_search, file_search)
- Never run multiple terminal commands in parallel
</whenExecutingTerminalCommands>

For todo list management:
- Create the full list at the start with all items "not-started"
- Update items individually as you work: mark "in-progress" when starting, "completed" when done
- Only update one todo status at a time unless genuinely completing multiple parallel tasks

When creating diagnostic/report files:
1. Check if file exists first with file_search or list_dir
2. If exists, either append unique suffix or explicitly remove before creating
3. For complex reports, consider using create_file directly rather than shell heredoc

Add after "After completing file operations...":
When encountering errors or interruptions:
- Briefly acknowledge what went wrong
- State your recovery approach
- Continue without excessive explanation