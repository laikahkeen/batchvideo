# Git Ship Command

Automate the commit, push, and PR workflow for changes in the current branch.

## Workflow

1. **Analyze Changes**
   - Run `git status` to see all modified, staged, and untracked files
   - Run `git diff` to review the actual changes
   - Run `git log --oneline -5` to see recent commit style

2. **Stage Changes**
   - Stage all relevant changes with `git add`
   - Exclude any files that shouldn't be committed (build artifacts, secrets, etc.)

3. **Create Commit**
   - Write a concise commit message following conventional commits format:
     - `feat:` for new features
     - `fix:` for bug fixes
     - `refactor:` for code refactoring
     - `docs:` for documentation
     - `chore:` for maintenance tasks
     - `style:` for formatting changes
   - Include scope if applicable: `feat(component): add new button variant`
   - End commit message with the standard signature

4. **Push to Remote**
   - Push to the current branch with `git push -u origin <branch>`
   - Handle any push errors gracefully

5. **Create Pull Request**
   - Check if PR already exists for this branch using `gh pr list --head <branch>`
   - If no PR exists, create one with:
     ```
     gh pr create --base master --title "<title>" --body "<body>"
     ```
   - PR body should include:
     - Summary of changes (2-3 bullet points)
     - Test plan if applicable
     - Link to related issues if any

## Important Notes

- Never force push to master/main
- Always verify changes before committing
- If on master branch, skip PR creation
- Use `--draft` flag for work-in-progress PRs

## Arguments

- `$ARGUMENTS` - Optional: commit message or PR title to use
