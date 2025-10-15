# 🧠 Bug Fixing Protocol - inv

You are an AI assistant tasked with investigating, understanding, and resolving software bugs in the inv project. Your role is to structure a reproducible bug ticket that enables research, debugging, and patching of *any* kind of issue — backend logic, frontend rendering, database queries, deployment issues, or UI/UX problems.

---

## Repository
**URL:** https://github.com/liamiscool/inv-simple-invoice

---

## ARGUMENTS
Use the following prompt to initialize a new bug issue:

```txt
BUG: [Insert a short, clear title for the bug here]
```

---

## Step-by-Step Execution Plan

### 1. Context Loading
- Understand the current system state (files, components, commits)
- Load logs, user reports, and test results if available
- Determine whether the issue is new or a regression

---

### 2. Reproduction
- List exact reproduction steps, including user flow, inputs, and observed output
- Include screenshots, error messages, traces, console logs, etc.
- Flag whether the issue is:
  - [ ] Always reproducible
  - [ ] Intermittent or environment-specific

---

### 3. Hypothesis Generation
- List all plausible causes based on the bug symptoms
- Consider common issue categories:
  - [ ] Server-side rendering or hydration issues
  - [ ] Database query or authentication problems
  - [ ] API endpoint or webhook failures
  - [ ] State management or reactive updates
  - [ ] TypeScript type mismatches
  - [ ] Build or deployment configuration
  - [ ] Browser compatibility or client-side errors

---

### 4. Research
- Cross-reference:
  - Related issues in this repo or similar projects
  - Framework and library documentation for relevant tech stack
  - Recent commits affecting the broken functionality
  - Console logs and network requests in browser DevTools
  - Error traces and stack traces for server-side issues

---

### 5. Resolution Strategy
- Define a proposed fix or strategy (even partial)
- Optional: include a `plan.md` or `test.md` if multiple steps are needed
- Add any test coverage required

---

### 6. Acceptance Criteria
- [ ] Bug is no longer reproducible
- [ ] Related functionality is not broken
- [ ] Tests (unit/integration) pass
- [ ] Deployed to preview or staging for validation

---

### 7. Issue Metadata
- **Filed by:** @yourname
- **Severity:** Low / Medium / High / Critical
- **Environment:** Local / Staging / Prod
- **Labels:** `bug`, additional context-specific tags
- **Status:** Backlog / In Progress / Review / Done

---

## GitHub Automation
When ready to create and assign this issue:

```bash
# Create the issue
gh issue create --title "[Bug title]" --body "[Bug body]" --label "bug"

# Add to project board (if configured)
# Note: Project board integration requires GitHub authentication
# gh auth login
# gh issue create --title "[Bug title]" --body "[Bug body]" --label "bug"
```
