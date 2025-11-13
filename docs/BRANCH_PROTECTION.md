# Branch Protection Rules Setup

This document outlines the branch protection rules that should be enabled for the `main` branch to ensure code quality, stability, and proper review processes.

## Overview

Branch protection rules prevent direct pushes to `main` and enforce quality gates through pull requests, automated checks, and required reviews. This keeps the main branch stable and ensures all changes are surgical and well-reviewed.

## Accessing Branch Protection Settings

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule**
4. In "Branch name pattern", enter: `main`

## Required Settings

### Pull Request Requirements

- ✅ **Require a pull request before merging**
  - Require approvals: **1**
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (critical paths are defined in `.github/CODEOWNERS`)

### Status Checks

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks** (from `.github/workflows/ci.yml`):
    - `lint`
    - `typecheck`
    - `test`
    - `build`

### Additional Requirements

- ✅ **Require conversation resolution before merging**
  - All review comments must be resolved before the PR can be merged

- ✅ **Require linear history**
  - Either enable "Require linear history" OR configure repository settings to only allow "Squash and merge"
  - This prevents merge commits and keeps history clean

### Push Restrictions

- ✅ **Restrict who can push to matching branches**
  - Select: **Restrict pushes that create matching branches**
  - Add: Repository administrators only
  - This ensures only admins can bypass the PR process in emergencies

## Optional (Recommended) Settings

### Commit Signing

- ✅ **Require signed commits**
  - Ensures all commits are cryptographically signed
  - Provides authenticity and tamper protection
  - See [GitHub's documentation on commit signing](https://docs.github.com/en/authentication/managing-commit-signature-verification)

### Force Push Protection

- ✅ **Do not allow force pushes**
  - Prevents rewriting history on the protected branch
  - Already enabled by default when branch protection is active

- ✅ **Do not allow deletions**
  - Prevents accidental deletion of the main branch
  - Recommended to keep enabled

### CODEOWNERS

The `.github/CODEOWNERS` file defines which users or teams must review changes to specific paths:

- Firebase configuration and security rules
- Core application layouts
- Authentication and Firebase client code
- CI/CD workflows
- Build and configuration files
- Documentation

When "Require review from Code Owners" is enabled, PRs touching these paths will automatically request review from the specified owners.

## CI Workflow Integration

The `.github/workflows/ci.yml` workflow provides the required status checks:

- **lint**: Runs ESLint on TypeScript/TSX files
- **typecheck**: Validates TypeScript types
- **test**: Runs the test suite with Vitest
- **build**: Creates a production build

These checks run automatically on:
- Pull requests targeting `main`
- Direct pushes to `main` (when allowed)

## Repository Settings

In addition to branch protection, configure these repository-level settings:

1. **Settings** → **General** → **Pull Requests**:
   - ✅ Allow squash merging (recommended default)
   - ❌ Allow merge commits (disable for linear history)
   - ⚠️ Allow rebase merging (optional, but requires discipline)
   - ✅ Always suggest updating pull request branches
   - ✅ Automatically delete head branches

2. **Settings** → **General** → **Merge button**:
   - Set default to "Squash and merge" for consistency

## Verification

After enabling branch protection:

1. Try to push directly to `main` - should be blocked
2. Create a test PR - should require:
   - All 4 CI checks to pass
   - At least 1 approval
   - Code owner review for protected paths
   - All conversations resolved
3. Verify the PR enforces linear history (only squash merge available)

## First Protected Merge

The documentation PR (#7) contains no runtime changes and serves as an ideal first protected merge to validate:
- CI workflows execute correctly
- Review requirements are enforced
- Merge process works as expected

## Emergency Bypass

Only repository administrators can:
- Push directly to `main` (if absolutely necessary)
- Merge PRs without all checks passing (not recommended)

Use admin privileges sparingly and only in genuine emergencies. Document any bypass in the commit message or PR.

## Maintenance

- Review and update CODEOWNERS as the codebase evolves
- Add new CI checks to the workflow as needed
- Periodically audit branch protection settings
- Keep Node.js and action versions up to date in workflows

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [About Code Owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
