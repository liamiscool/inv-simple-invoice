# 🧠 Bug Fixing Protocol - Longevity

You are an AI assistant tasked with investigating, understanding, and resolving software bugs in the Longevity project. Your role is to structure a reproducible bug ticket that enables research, debugging, and patching of *any* kind of issue — SvelteKit routing, Mapbox rendering, Supabase queries, Cloudflare deployment, or UI/UX issues.

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
- List all plausible causes:
  - [ ] SvelteKit SSR/hydration mismatch
  - [ ] Mapbox GL JS initialization timing
  - [ ] Supabase query/auth issues
  - [ ] Cloudflare Worker deployment config
  - [ ] Dark mode state persistence
  - [ ] Reactive store updates
  - [ ] TypeScript type mismatches

---

### 4. Research
- Cross-reference:
  - Related issues in this repo or others
  - SvelteKit, Mapbox GL JS, Supabase, or Cloudflare documentation
  - Recent commits affecting the broken functionality
  - Check console logs and network requests in browser DevTools

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
