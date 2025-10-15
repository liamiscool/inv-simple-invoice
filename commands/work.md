You are an AI assistant specialized in executing GitHub issues for the inv project.
  The issue already contains research, planning, and acceptance criteria - your job
   is to implement it efficiently.

  Given issue reference:
  <issue_reference>
  #$ARGUMENTS
  </issue_reference>

  Repository: https://github.com/liamiscool/inv-simple-invoice

  ## Execution Process:

### Note: When making changes, carefully preserve existing functionality. Always test thoroughly
  to avoid breaking working features. Refer to CLAUDE.md for architecture-specific details about:
  - Framework patterns and conventions
  - Database schema and RLS policies
  - API endpoints and webhooks
  - Deployment configuration

  ### 1. Load the issue context:
  - Fetch the specific GitHub issue details (title, description, acceptance criteria)
  - Review current project board status
  - Check any existing comments or progress updates

  ### 2. Quick codebase sync:
  - Examine current state of relevant files mentioned in the issue
  - Identify any changes since the issue was created
  - Confirm the implementation approach is still valid

  ### 3. Project management:
  - Assign yourself to the issue: `gh issue edit [ISSUE_NUMBER] --add-assignee @me`
  - Add progress comment: `gh issue comment [ISSUE_NUMBER] --body "🏗️ Implementation started"`
  - Track progress with issue comments

  ### 4. Execute implementation:
  - Follow the acceptance criteria as your checklist
  - Implement changes using existing patterns from the codebase
  - Maintain TypeScript types and follow project conventions (see CLAUDE.md)
  - Test all affected user flows and edge cases
  - Verify existing functionality still works as expected
  - Run automated tests if available

  ### 5. Progress tracking:
  - Add progress comments: `gh issue comment [ISSUE_NUMBER] --body "✅ [Specific step completed]"`
  - Update the issue with any discoveries or changes needed
  - When complete: `gh issue comment [ISSUE_NUMBER] --body "🎉 Implementation complete - ready for review"`
  - Final verification: `gh issue comment [ISSUE_NUMBER] --body "✅ Verified and ready for production"`

  ### 6. Management commands:
  ```bash
  # Start work (move to In Progress)
  gh issue edit [ISSUE_NUMBER] --add-assignee @me
  gh issue comment [ISSUE_NUMBER] --body "🏗️ Implementation started"
  
  # Progress tracking via comments only
  # (Project board integration requires additional setup)
  
  # Progress updates
  gh issue comment [ISSUE_NUMBER] --body "✅ [Specific step completed]"

  # Move to Review status when implementation complete
  gh issue comment [ISSUE_NUMBER] --body "🎉 Implementation complete - ready for review"
  
  # Move to Done when verified
  gh issue comment [ISSUE_NUMBER] --body "✅ Verified and ready for production"
  gh issue close [ISSUE_NUMBER] --reason completed
  ```

  ### 7. Issue Status Management:
  ```bash
  # View issue details
  gh issue view [ISSUE_NUMBER]
  
  # List all open issues
  gh issue list --state open
  
  # Search for related issues (use relevant search term)
  gh issue list --search "keyword" --state all
  ```

  ### 8. Simplified Workflow Commands:
  ```bash
  # All-in-one start command
  start_work() {
    ISSUE_NUM=$1
    gh issue edit $ISSUE_NUM --add-assignee @me
    gh issue comment $ISSUE_NUM --body "🏗️ Implementation started"
    echo "Started work on issue #$ISSUE_NUM"
  }
  
  # All-in-one completion command  
  complete_work() {
    ISSUE_NUM=$1
    gh issue comment $ISSUE_NUM --body "🎉 Implementation complete - ready for review"
    echo "Marked issue #$ISSUE_NUM as complete"
  }
  
  # Usage: start_work 7, complete_work 7
  ```
  Usage:

  - /work #2 - Execute issue #2
  - /work 2 - Execute issue #2 (short form)

  Focus Areas:

  - Speed: Use existing issue research/planning
  - Quality: Follow framework patterns and TypeScript conventions
  - Testing: Verify affected features and user flows work correctly
  - Tracking: Keep issue comments updated with progress
  - Completion: Ensure all acceptance criteria are met

  Key areas to always verify:
  - Core business logic remains intact
  - Database queries and data integrity
  - UI/UX functionality across different states
  - API endpoints and external integrations
  - Deployment compatibility