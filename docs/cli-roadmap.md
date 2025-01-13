---
title: CLI Roadmap
description: How we get to release
type: architecture
tags:
  - cli
  - roadmap
created: '2025-01-12T10:50:50.780Z'
dependencies: []
---
# Technical Roadmap: CursorDone CLI Distribution (Including Closed Beta)

This roadmap outlines how to bring **CursorDone** to developers as an **npm-distributed CLI**, manage ongoing updates, and integrate **Supabase** for auth/storage alongside **Stripe** for paid subscriptions. It also details how to handle a **Closed Beta** phase without immediate payment requirements.

---

## Phase 0: Supabase Setup (Closed Beta Focus)

### 0.1 Create a Supabase Project
1. **Sign Up / Create New Supabase Project**  
   - Go to [supabase.com](https://supabase.com/) and create a new project.  
2. **Enable Auth**  
   - Configure “Email/Password” or “OAuth Providers” (e.g., GitHub, Google).  
   - Take note of your Supabase credentials (URL, public anon key, service role key).
3. **Set Up Database Tables**  
   - **Users**: Store user profile info, including a `beta` boolean field.  
   - **Projects** (optional in beta): Track per-project usage if needed.
4. **Add Environment Variables**  
   - In your Next.js / CLI project, store Supabase credentials in `.env` (e.g., `SUPABASE_URL`, `SUPABASE_KEY`).

### 0.2 Closed Beta Without Stripe
- **Rationale**:  
  - You can skip payment setup during the closed beta to streamline onboarding for up to 100 testers.  
  - **No Stripe Integration** is required yet; only user auth and a `beta` flag to allow free usage.

---

## Phase 1: CLI Foundation

### 1.1 Separate CLI Logic from Next.js Code
- **Actions**:
  - Create a `cli/` folder with commands (`login`, `init`, `start`).
  - Keep Next.js code in `app/` (and shared code in `lib/`).

### 1.2 Basic CLI Commands & Structure
- **Actions**:
  - Implement:
    - `cursordone login` (auth with Supabase)
    - `cursordone init` (create `tasks/`, `epics/`)
    - `cursordone start` (run local Next.js server)
  - Test each command to confirm correct behavior.

### 1.3 Build Configuration
- **Actions**:
  - Add a `bin` entry in `package.json`:
    ```json
    {
      "name": "cursordone",
      "version": "0.1.0",
      "bin": {
        "cursordone": "./dist/cli/index.js"
      },
      "scripts": {
        "build:cli": "tsc -p cli/tsconfig.json",
        "build:web": "next build"
      }
    }
    ```
  - Ensure compiled output goes to `./dist/cli`.

---

## Phase 2: Integration & Obfuscation

### 2.1 Local Next.js UI Integration
- **Actions**:
  - Verify `cursordone start` launches a Next.js server on `localhost:<port>`.
  - Confirm the local app can read/write `.md` files in `tasks/` and `epics/`.

### 2.2 Code Minimization / Obfuscation
- **Actions**:
  - (Optional) Use [ncc](https://github.com/vercel/ncc) or similar to bundle & minify CLI code.
  - Keep any truly sensitive logic on the server side (Supabase calls).

---

## Phase 3: Closed Beta Launch

### 3.1 Supabase Auth & Beta Flag
- **Actions**:
  - In Supabase, mark beta testers as `beta = true`.
  - Skip subscription checks or payment logic for these users.

### 3.2 Distribute the CLI
- **Actions**:
  - Publish a beta version to npm:
    ```bash
    npm version prerelease
    npm publish --tag beta
    ```
  - Invite up to 100 testers to install via:
    ```bash
    npm install -g cursordone@beta
    ```
  - The CLI:
    - `cursordone login` → Supabase token  
    - `cursordone init` → sets up `.md` structure  
    - `cursordone start` → local UI

### 3.3 Gather Feedback
- **Actions**:
  - Use Slack/Discord or a feedback form for direct user feedback.
  - Track any usage data if desired (only minimal, privacy-respecting).

---

## Phase 4: Payment & Licensing (Post-Beta)

> **Note**: You do **not** need Stripe during the closed beta. Only build it when you're ready to charge for CursorDone.

### 4.1 Stripe Setup
1. **Stripe Account**:
   - Create an account at [stripe.com](https://stripe.com/).
   - Add a subscription product, e.g., £10/month.
2. **Webhooks**:
   - Configure a webhook endpoint (in Next.js or a serverless function) to handle subscription events.
3. **Integrate with Supabase**:
   - When a subscription is created/updated/canceled, update the user’s status in the `Users` table.

### 4.2 License Enforcement
- **Actions**:
  - On `cursordone start`, check user’s subscription status in Supabase.
  - If unsubscribed, show a paywall or prompt the user to subscribe.

---

## Phase 5: Build & Deployment

### 5.1 Local Build Scripts
- **Actions**:
  - `npm run build:cli` → compiles TypeScript CLI.
  - `npm run build:web` → builds Next.js.  
  - Or a combined script: `"build": "npm run build:cli && npm run build:web"`.

### 5.2 CI/CD Integration
- **Actions**:
  - Use GitHub Actions (or similar) to:
    - `npm install`, `npm run build`, `npm test`
    - Publish to npm on merges to `main` or tags.
  - Example snippet:
    ```yaml
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish --access public
    ```

---

## Phase 6: Update Mechanisms

### 6.1 Auto-Update with npm
- **Actions**:
  - Integrate [update-notifier](https://www.npmjs.com/package/update-notifier) in CLI code:
    ```js
    import updateNotifier from 'update-notifier';
    import pkg from '../../package.json';

    updateNotifier({ pkg }).notify();
    ```
  - Prompts users to update via `npm install -g cursordone`.

### 6.2 UI Toast Notifications
- **Actions**:
  - On `cursordone start`, Next.js checks the latest version from npm.
  - Displays a toast: “New version available. Run `npm i -g cursordone` to upgrade.”

---

## Phase 7: Public Launch & Maintenance

### 7.1 End Beta → Stripe Payments
- **Actions**:
  - Once you decide to charge for the product:
    - Flip the `beta` flags off or remove them.
    - Require a paid subscription to use beyond a certain point.

### 7.2 Open Sign-Ups
- **Actions**:
  - Publicly advertise.  
  - Anyone can sign up, pay via Stripe, and log in with Supabase.

### 7.3 Ongoing Maintenance
- **Actions**:
  - Increment version in `package.json` for new features and fixes.
  - Publish updates to npm, prompting users to upgrade.
  - Respond to user issues and subscription churn.

---

## Timeline Summary

- **Phase 0 (Closed Beta Setup):** Configure Supabase auth, database, Beta flags.  
- **Phase 1 (CLI Foundation):** Implement core `login`, `init`, `start` commands.  
- **Phase 2 (Integration & Obfuscation):** Ensure Next.js local UI works, minimize code.  
- **Phase 3 (Closed Beta Launch):** Invite testers, gather feedback, no payment required.  
- **Phase 4 (Payment & Licensing):** Set up Stripe and enforce subscription checks post-beta.  
- **Phase 5 (Build & Deployment):** Finalize CI/CD pipelines for continuous updates.  
- **Phase 6 (Update Mechanisms):** Implement update-notifier and in-app toasts.  
- **Phase 7 (Public Launch & Maintenance):** Transition to paid subscriptions and iterate based on user feedback.

**Key Takeaway**: You **do not** need Stripe for the closed beta. Focus on Supabase auth and a `beta` flag to let testers use the CLI for free. Stripe and payment enforcement can come after the beta concludes.
