# Claude Code Workflow Options

**Last Updated:** 2025-10-16
**Issue:** File locking conflicts when running two Claude Code sessions simultaneously

---

## The Problem

When two Claude Code sessions access the same files concurrently, you get:
- 400 errors from file locks
- Race conditions on file writes
- Git conflicts
- Inconsistent state

---

## Option 1: Two-Session Split (Safest) ✅ **CURRENT IMPLEMENTATION**

### Overview
Maintain two separate Claude Code sessions with strict file access boundaries and locking mechanism.

### Session 1: "Planner" (Read-Only)
**Purpose:** Research, analyze, create GitHub issues

**Allowed Actions:**
- ✅ Read any file in the repository
- ✅ Use `/issue` slash command
- ✅ Run read-only bash commands (`ls`, `cat`, `grep`, `git log`, `gh issue list`)
- ✅ Search and analyze codebase
- ✅ Draft issue content in markdown

**Forbidden Actions:**
- ❌ Write or edit files
- ❌ Run bash commands that modify state (`git commit`, `npm install`, etc.)
- ❌ Create GitHub issues directly (only draft them)
- ❌ Run `/work` command

**Workflow:**
1. Open Planner session
2. Use `/issue <description>` to research and draft issue
3. Planner outputs comprehensive GitHub issue markdown
4. Copy/paste to create issue manually OR let Developer session create it

### Session 2: "Developer" (Read/Write)
**Purpose:** Implement GitHub issues, commit code, push changes

**Allowed Actions:**
- ✅ Read any file
- ✅ Write/edit files
- ✅ Use `/work #N` slash command
- ✅ Run all bash commands
- ✅ Create commits and push
- ✅ Create GitHub issues via CLI
- ✅ Update project board

**Forbidden Actions:**
- ❌ Run when another Developer session is active (enforced by lock file)

**Workflow:**
1. Open Developer session (closes Planner if needed)
2. Check for lock file (automatic)
3. Use `/work #N` to implement issue
4. Commit, test, push
5. Close session (removes lock file)

### Safety Mechanism: Lock File

**Location:** `.claude-lock` in project root

**How it works:**
1. Developer session creates `.claude-lock` on startup
2. Check prevents second Developer session from starting
3. Lock file deleted on session exit (automatic via `trap`)
4. Stale locks can be manually removed if session crashes

**Implementation:**
See updated `commands/work.md` for lock file code.

### Pros & Cons

✅ **Pros:**
- Clear separation of concerns
- Parallel planning while implementing
- Prevents file conflicts automatically
- Can keep Planner open for quick research

❌ **Cons:**
- Need to manage two chat windows
- Lock file coordination required
- Slightly more complex setup
- Must remember which session does what

---

## Option 2: Single Session with Modes (Simpler)

### Overview
Use one Claude Code session that switches between planning and development modes via slash commands.

### Workflow
```bash
# Planning mode (read-only internally)
/issue Add dark mode to templates
# → Creates comprehensive GitHub issue

# Development mode (write enabled)
/work #11
# → Implements issue #11, commits, pushes

# Back to planning
/issue Implement bulk email sending
# → Plans next feature
```

### Pros & Cons

✅ **Pros:**
- No file locking issues (single session)
- Simpler mental model
- One conversation history
- No coordination needed
- Faster context switching

❌ **Cons:**
- Can't plan next feature while implementing current one
- Context length grows (mitigated by 200k token limit)
- Need to finish one task before starting another

---

## Option 3: Concurrent with File Coordination (Complex)

### Overview
Two sessions with explicit file ownership - each session only touches specific directories.

### File Ownership Rules

**Planner Session:**
- `commands/*.md`
- `.github/**/*`
- `docs/**/*`
- `*.md` (root level)
- Read-only access to `src/`

**Developer Session:**
- `src/**/*`
- `supabase/**/*`
- Config files (`package.json`, `tsconfig.json`, etc.)
- Read access to documentation

### Pros & Cons

✅ **Pros:**
- Parallel work possible
- No lock file needed if rules followed

❌ **Cons:**
- Complex rules to remember
- Easy to violate boundaries accidentally
- Still risk conflicts on shared files (git, package-lock, etc.)
- Error-prone

**Verdict:** Not recommended - too complex for marginal benefit.

---

## Implementation Status

**Currently Implemented:** Option 1 (Two-Session Split)

**Setup Steps:**
1. Lock file mechanism added to `commands/work.md`
2. Documentation updated in `CLAUDE.md`
3. Clear guidelines for each session type

**To Use:**
- Planner: Read-only exploration and issue drafting
- Developer: Implementation work (one at a time)
- Lock file automatically prevents conflicts

---

## Switching to Different Option

### To Switch to Option 2 (Single Session):
1. Remove lock file check from `commands/work.md`
2. Update documentation to clarify single-session usage
3. Close all existing sessions
4. Open single session and use slash commands

### To Switch to Option 3 (File Coordination):
1. Not recommended - use Option 1 or 2 instead
2. If insisting: Add file ownership checks to both commands
3. Document file boundaries clearly
4. Good luck 😅

---

## Best Practices

### For Option 1 (Current):
1. **Planner session:** Keep open for quick lookups, close when doing implementation
2. **Developer session:** Only one at a time, verify lock file removed on exit
3. **Lock file issues:** If stale, manually delete `.claude-lock`
4. **Session crashes:** Check for and remove orphaned lock files

### General Tips:
1. **Context length:** Summarize and create new sessions periodically
2. **Git hygiene:** Always commit from Developer session, never Planner
3. **Testing:** Run tests in Developer session only
4. **Research:** Planner can analyze any code, just can't modify it

---

## Troubleshooting

### "Another session is active" error
```bash
# Check if lock file exists
ls -la .claude-lock

# If stale (previous session crashed), remove it
rm .claude-lock

# Verify it's gone
ls -la .claude-lock
```

### File conflicts despite lock file
- Ensure Planner session isn't writing files
- Check both sessions are following role boundaries
- Consider switching to Option 2 (single session)

### Lock file not auto-deleting
- Check `trap` command in work.md is present
- Manually delete after each session if needed
- May indicate session termination issue

---

## Future Improvements

Potential enhancements:
1. **Lock file with PID:** Track which session owns lock
2. **Timeout mechanism:** Auto-expire stale locks after 1 hour
3. **Session registry:** Track multiple named sessions
4. **Git branch per session:** Auto-create branches for isolation

Not implemented yet - current system works for 95% of cases.

---

## Questions?

See `CLAUDE.md` for general project guidance.
See `commands/issue.md` for Planner workflow.
See `commands/work.md` for Developer workflow.
