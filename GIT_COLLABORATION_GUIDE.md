# 🤝 PatentIntel.AI — Complete Team Git & GitHub Collaboration Guide

> **Target Audience:** Madhu (Lead Code Reviewer & Repository Owner), Harish (Collaborator), and Mouneesh (Collaborator).

---

## ❓ Question 1: Can Madhu (Lead Reviewer) Work Directly on `main`?

### Short Answer:
**Yes, as the Repository Owner, Madhu can work directly on `main` OR on task branches.**

### Detailed Recommendation for Madhu:

| Workflow | How it Works | When to Use |
| :--- | :--- | :--- |
| **Option A: Direct to `main`** *(Fastest)* | Madhu commits and pushes directly to `main`. | Best for quick bug fixes, documentation, or small tweaks. |
| **Option B: Feature Branches** *(Safest - Recommended)* | Madhu creates a branch (e.g., `feat/madhu-patent-parser`), tests it, and merges it to `main`. | Best for large features so `main` stays stable for Harish & Mouneesh to pull clean code. |

---

## ❓ Question 2: How Do Harish & Mouneesh Access Madhu's Repository & Create PRs?

### Step-by-Step Collaborator Access Flow:

```
1. Madhu invites Harish & Mouneesh under GitHub Settings -> Collaborators
                               │
                               ▼
2. Harish & Mouneesh accept invitation email / notification
                               │
                               ▼
3. Harish & Mouneesh clone Madhu's repo:
   git clone https://github.com/Madhuarvind/PatentIntel.AI.git
                               │
                               ▼
4. Harish & Mouneesh create a feature branch, write code & push:
   git checkout -b feat/harish-wipo-translator
   git push -u origin feat/harish-wipo-translator
                               │
                               ▼
5. Harish & Mouneesh visit https://github.com/Madhuarvind/PatentIntel.AI
   Click "Compare & pull request" -> Assign Madhu as Reviewer!
                               │
                               ▼
6. Madhu gets notified -> Reviews -> Approves -> Merges into MAIN!
```

---

## 🔑 Step 0: How Madhu Invites Harish & Mouneesh as Collaborators

Before Harish and Mouneesh can push branches to Madhu's repository, Madhu must grant them access:

1. Madhu opens **`https://github.com/Madhuarvind/PatentIntel.AI`** in browser.
2. Click **Settings** (top right tab of repository).
3. On the left sidebar under **Access**, click **Collaborators**.
4. Click **Add people** button.
5. Type Harish's GitHub username / email $\rightarrow$ Click **Add to repository**.
6. Type Mouneesh's GitHub username / email $\rightarrow$ Click **Add to repository**.
7. Harish & Mouneesh receive an email invitation to accept.

---

## 💻 Step-by-Step Guide for Collaborators (Harish & Mouneesh)

Once invited, Harish and Mouneesh follow these exact commands on their laptops:

### 1. Clone Madhu's Repository
```bash
git clone https://github.com/Madhuarvind/PatentIntel.AI.git
cd "Major Project 2"
npm install
```

### 2. Always Pull Latest `main` Before New Tasks
```bash
git checkout main
git pull origin main
```

### 3. Create Task Branch
```bash
git checkout -b feat/harish-wipo-translator
```

### 4. Write Code & Test Build
```bash
npm run dev    # Test in browser http://localhost:5173
npm run build  # Verify zero TypeScript compile errors
```

### 5. Commit & Push Branch to Madhu's Repo
```bash
git add .
git commit -m "feat: implement WIPO multilingual claim translation"
git push -u origin feat/harish-wipo-translator
```

### 6. Create Pull Request on Madhu's Repo
1. Open **`https://github.com/Madhuarvind/PatentIntel.AI`** in browser.
2. GitHub automatically shows a yellow banner:  
   👉 **`feat/harish-wipo-translator had recent pushes 1 minute ago`** $\rightarrow$ Click **Compare & pull request**.
3. Fill in:
   - **Title**: `feat: implement WIPO multilingual claim translation`
   - **Description**: Summary of features added.
4. On the right sidebar under **Reviewers**, select **`Madhuarvind`**.
5. Click **Create pull request**.

---

## 🔍 Step-by-Step Guide for Lead Code Reviewer (Madhu)

When Harish or Mouneesh opens a PR, Madhu performs the review:

1. Open **`https://github.com/Madhuarvind/PatentIntel.AI/pulls`**.
2. Click on the open Pull Request (e.g. `#4 feat: implement WIPO multilingual claim translation`).
3. Check the bottom of the page:
   - ✅ **Green Check**: GitHub Actions CI build passed cleanly!
4. Click **Files changed** tab to inspect code added (`+ green`) and removed (`- red`).
5. Click **Review changes** button:
   - Select **Approve** $\rightarrow$ Click **Submit review**.
6. Click **Merge pull request** $\rightarrow$ Click **Confirm merge**.
7. Code is now merged into `main`!

---

## ⚡ Resolving Merge Conflicts (When 2 People Edit Same File)

If GitHub shows a conflict warning:

1. Harish or Mouneesh runs locally:
   ```bash
   git checkout main && git pull origin main
   git checkout feat/harish-wipo-translator
   git merge main
   ```
2. Open VS Code $\rightarrow$ VS Code highlights conflicts in red. Select `Accept Current Change` or `Accept Incoming Change`.
3. Push conflict fix:
   ```bash
   git add .
   git commit -m "fix: resolve merge conflicts with main"
   git push origin feat/harish-wipo-translator
   ```
4. PR on GitHub turns green ✅!

---

## 🛠️ Quick Git Command Reference Table

| Action | Command |
| :--- | :--- |
| **Clone Repo** | `git clone https://github.com/Madhuarvind/PatentIntel.AI.git` |
| **Check Branch** | `git status` |
| **Get Latest Main** | `git checkout main && git pull origin main` |
| **Create Feature Branch** | `git checkout -b feat/feature-name` |
| **Commit Changes** | `git add . && git commit -m "feat: your message"` |
| **Push Branch** | `git push -u origin feat/feature-name` |
| **Delete Branch** | `git branch -d feat/feature-name` |
