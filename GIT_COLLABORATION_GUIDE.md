# 🤝 PatentIntel.AI — Complete Team Git & GitHub Collaboration Guide

> **Target Audience:** Madhu (Lead Code Reviewer & Repository Maintainer), Harish (Collaborator), and Mouneesh (Collaborator).

---

## 📌 1. Team Roles & Workflow Overview

```
                                      MAIN BRANCH (Production-Ready)
                                       =============================
                                                     │
       ┌─────────────────────────────────────────────┴─────────────────────────────────────────────┐
       │                                                                                           │
       ▼ (Harish creates branch)                                                                   ▼ (Mouneesh creates branch)
feat/harish-wipo-translator                                                                feat/mouneesh-claim-synthesizer
───────────────────────────                                                                ───────────────────────────────
1. Write code                                                                              1. Write code
2. Commit & Push to GitHub                                                                 2. Commit & Push to GitHub
3. Open PR -> Assign Madhu                                                                 3. Open PR -> Assign Madhu
       │                                                                                           │
       ▼                                                                                           ▼
┌───────────────────────────┐                                                              ┌───────────────────────────┐
│ Madhu Reviews & Approves  │                                                              │ Madhu Reviews & Approves  │
└─────────────┬─────────────┘                                                              └─────────────┬─────────────┘
              │                                                                                           │
              ▼                                                                                           ▼
       Merges into MAIN                                                                           Merges into MAIN
```

### Team Responsibilities:
- 👑 **Madhu (Lead / Maintainer)**: Controls `main` branch protection, reviews code in Pull Requests, requests changes or approves code, handles merges into `main`.
- 💻 **Harish & Mouneesh (Collaborators)**: Work on assigned feature branches, write clean code, push branches to GitHub, open Pull Requests for Madhu's review.

---

## 🚀 2. Workflow for Collaborators (Harish & Mouneesh)

Follow these 5 steps for **every new feature or task**:

### Step 1: Update Local `main` Branch
Before starting new work, always pull the latest code from GitHub:
```bash
git checkout main
git pull origin main
```

### Step 2: Create a New Feature Branch
Name your branch based on your task name (e.g., `feat/harish-wipo-translator` or `feat/mouneesh-claim-synthesizer`):
```bash
git checkout -b feat/your-feature-name
```

### Step 3: Write Code & Verify Build
Make your changes, test in browser (`http://localhost:5173`), and verify that the build succeeds:
```bash
npm run build
```

### Step 4: Stage, Commit, and Push to GitHub
```bash
# 1. Stage modified and new files
git add .

# 2. Commit with descriptive message
git commit -m "feat: implement WIPO claim translation language detection"

# 3. Push feature branch to GitHub origin
git push -u origin feat/your-feature-name
```

### Step 5: Open a Pull Request (PR) on GitHub
1. Open the GitHub repository: `https://github.com/Madhuarvind/PatentIntel.AI`
2. You will see a banner: **"feat/your-feature-name had recent pushes 1 minute ago"** → Click **Compare & pull request**.
3. Set Title & Description of what you implemented.
4. On the right sidebar under **Reviewers**, select **Madhu (`Madhuarvind`)**.
5. Click **Create pull request**.

---

## 🔍 3. Workflow for Lead Code Reviewer (Madhu)

As the Lead Maintainer, follow these steps to review and merge team PRs:

### Step 1: Open the Pull Request on GitHub
1. Go to `https://github.com/Madhuarvind/PatentIntel.AI/pulls`.
2. Click on the Pull Request submitted by Harish or Mouneesh.

### Step 2: Check Automated GitHub Actions CI Status
- Look at the bottom of the PR page:
  - ✅ **Green Check mark ("Build & Verify Production Bundle passed")**: Code compiles with zero TypeScript errors on Linux & Windows!
  - ❌ **Red Cross**: Click **Details** to see compiler errors and ask collaborator to fix them.

### Step 3: Review Code Changes ("Files changed" Tab)
- Click the **Files changed** tab at the top of the PR.
- Review line-by-line additions (`+ green`) and deletions (`- red`).
- **Add Comments**: Hover over any line of code, click the `+` icon, and leave feedback (e.g., *"Please add error handling here"*).

### Step 4: Submit Review Decision
1. Click **Review changes** (top right button).
2. Select one of three options:
   - 💬 **Comment**: General feedback without approving yet.
   - 🔄 **Request changes**: Asks collaborator to update code before merging.
   - ✅ **Approve**: Code is verified and ready for production!
3. Click **Submit review**.

### Step 5: Merge the Pull Request into `main`
1. Click the green **Merge pull request** button (or select **Squash and merge**).
2. Click **Confirm merge**.
3. Click **Delete branch** on GitHub to keep repository clean.

---

## ⚡ 4. Resolving Merge Conflicts (Step-by-Step)

### What is a Merge Conflict?
A merge conflict happens when Harish and Mouneesh edit the **same file on the same line**. Git doesn't know which version to keep, so it asks you to resolve it!

### How a Collaborator Resolves Conflicts:
If GitHub says *"This branch has conflicts that must be resolved"*, Harish or Mouneesh should run these commands locally on their laptop:

```bash
# 1. Switch to main and get latest merged code
git checkout main
git pull origin main

# 2. Switch back to your feature branch
git checkout feat/your-feature-name

# 3. Merge main into your feature branch
git merge main
```

- VS Code will highlight conflicted files in RED with options:
  - `Accept Current Change` (Keep your code)
  - `Accept Incoming Change` (Keep code from main)
  - `Accept Both Changes`
- Choose the correct code, save the file.
- Finish the conflict resolution:
```bash
git add .
git commit -m "fix: resolve merge conflicts with main"
git push origin feat/your-feature-name
```
- GitHub PR will automatically update to green ✅!

---

## 🛠️ 5. Cheat Sheet: Daily Git Command Table

| Action | Command |
| :--- | :--- |
| **Check Current Branch & Status** | `git status` |
| **See List of Branches** | `git branch -a` |
| **Pull Latest `main` Code** | `git checkout main && git pull origin main` |
| **Create New Feature Branch** | `git checkout -b feat/feature-name` |
| **Switch to Existing Branch** | `git checkout feat/feature-name` |
| **Save Code Changes** | `git add . && git commit -m "feat: your message"` |
| **Push Branch to GitHub** | `git push -u origin feat/feature-name` |
| **Delete Local Branch** | `git branch -d feat/feature-name` |
| **Undo Uncommitted Changes** | `git restore .` |
