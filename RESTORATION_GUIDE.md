# RESTORATION_GUIDE (Paddle Approval Revert)

This document contains step-by-step instructions to revert the temporary SaaS-only layout and restore Bishal's full developer portfolio once Paddle approves the checkout domain.

---

## 📋 Context
* **Current Active Branch:** `paddle-approval` (contains layout modifications hiding portfolio, experience, client services, and blogs).
* **Target Branch:** `main` (contains the complete portfolio, blog, testimonials, plus the newly added Refund Policy and footer links).

---

## 🛠️ Step-by-Step Restoration Procedure

When the user says **"I am approved! Read the restoration plan and restore my site"**, execute the following steps:

### Step 1: Switch Back to Main Branch
Run the following commands in the project directory:
```powershell
git checkout main
```

### Step 2: Ensure Latest Code is Pulled
Sync any remote changes from GitHub:
```powershell
git pull origin main
```

### Step 3: Redeploy Main Branch to Vercel Production
Deploy the pristine `main` branch back to the live domain:
```powershell
npx vercel --prod --yes
```

---

## 🔍 Verification Checklist

Verify the following after the deployment completes successfully:
1. Open [https://www.bishalcodes.com](https://www.bishalcodes.com) in your browser.
2. Confirm the home page renders all portfolio sections:
   - [x] About Me
   - [x] Tech Skills
   - [x] Custom Services
   - [x] Client Testimonials
   - [x] Timeline / Experience
   - [x] Blogs
3. Confirm that the new legal link is still working:
   - [x] [https://www.bishalcodes.com/legal/refund-policy](https://www.bishalcodes.com/legal/refund-policy)
4. Confirm that the navbar and footer display the full set of links.
