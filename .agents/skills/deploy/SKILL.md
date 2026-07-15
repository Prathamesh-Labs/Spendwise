---
name: deploy
description: >-
  Executes the deployment pipeline: runs tests, compiles the production build,
  and pushes the code to the staging branch.
---

# Deploy Skill

This custom skill defines the workflow for deploying the financial tracker to the staging area. Follow these steps exactly when triggered by a deploy request.

## Workflow Instructions

### 1. Pre-deployment Workspace Check
Verify that the workspace is clean before starting the deployment:
- Propose `git status` in the terminal.
- If there are uncommitted changes, stop and ask the user to commit or stash them first.

### 2. Run Tests
Ensure all application tests pass:
- Inspect `package.json` in the workspace root to see if a `"test"` script exists under `"scripts"`.
- If a `"test"` script is present, run:
  ```bash
  npm run test
  ```
  Verify that the tests complete with exit code 0.
- If no `"test"` script is defined, print a warning to the user indicating that no tests are configured, and proceed to the build phase.

### 3. Build Production Bundle
Compile the client application for production:
- Run:
  ```bash
  npm run build
  ```
- Verify that the build succeeds without error codes and compiles output assets into the `dist/` directory.

### 4. Push to Staging
Push the compiled codebase to the staging area:
- Check if there is an active remote repository configuration (`git remote -v`).
- Run the git command to push the local `main` branch to the remote `staging` branch:
  ```bash
  git push origin main:staging
  ```
- If origin does not exist or fails, suggest creating a local `staging` branch and checking it out, or ask the user for their staging remote URL.
