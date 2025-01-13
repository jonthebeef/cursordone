---
title: CursorDone Product Requirements Document
description: >-
  A local-first task management tool combining a CLI and web GUI, designed for
  developers using AI-powered IDEs to streamline workflows and manage tasks
  securely and efficiently.
type: documentation
tags:
  - prd
  - web ui
  - cli
created: '2025-01-12T10:46:34.458Z'
dependencies: []
---
## 1. Overview

Product Name: **CursorDone**

CursorDone is a lightweight, local-first task management system designed for developers working with AI-powered IDEs. The product provides a combination of **CLI commands**, a** localhost web GUI**, and integration with AI agents to streamline task workflows. It enables developers to organize tasks and epics in markdown files, manage them through a browser-based interface, and allow the AI in their IDE to execute tasks efficiently within the project’s context.

---
## 2. Purpose & Goals

### 1. Local-First Task Management
- Enable developers to manage tasks using `.md` files stored alongside their code in version control.
- Provide a localhost web interface (Next.js) for visual task and epic management.
- Allow CLI commands to initialize and maintain projects.

### 2. Assist Developers in AI Workflows
- Give developers tools to provide their AI agents with structured context for task execution.
- Help maintain focus for AI tools (e.g., preventing “off-track” behavior).

### 3. Secure Distribution
- Protect proprietary logic with a compiled CLI and minified Next.js build.
- Retain critical licensing and authentication logic in a cloud environment.

### 4. Subscription Model
- Transition from a closed beta (100 testers) to a paid subscription model (£10/month per user/project).
- Use Supabase for user management and Stripe for payments.

### 5. Developer-Friendly Experience
- Combine the convenience of a CLI with a powerful web-based task interface.
- Integrate with IDEs to create a seamless workflow for managing tasks with the help of AI.

---
## 3. Target Audience & Users

### Indie Developers
- Need tools to manage tasks locally and provide their AI with structured workflows.

### Small Teams
- Require lightweight task management solutions that integrate with version control and local development environments.

### Open-Source Developers
- Seek non-intrusive tools for organizing issues and features without external dependencies.

---

## 4. Key Features & Requirements

### 4.1 Hybrid CLI + Web GUI

#### 1. CLI Commands
- **`cursordone login`**: Authenticate via Supabase (OAuth/email).
- **`cursordone init`**: Initialize project folders (`tasks/`, `epics/`) and configs.
- **`cursordone start`**: Launch the web GUI on `localhost:<port>`.

#### 2. Web GUI
- Localhost interface for managing tasks and epics visually.
- Real-time updates as `.md` files are edited or committed.
- Support for task dependencies, priority levels, and status tracking.

#### 3. AI Integration
- Use `.md` front matter for structured metadata to guide IDE-based AI agents.
- Synchronize updates between the AI and local tasks.

---

### 4.2 Local Markdown Handling

- **Tasks and Epics in Markdown**
  - Files stored locally under `tasks/` and `epics/`, with metadata in YAML front matter.
  - Version-controllable to align with codebase changes.
- **Real-Time Sync**
  - Local GUI reflects changes instantly when `.md` files are updated.

---

### 4.3 Cloud Components

#### 1. Supabase Integration
- User authentication and beta flagging.
- Subscription tracking integrated with Stripe.

#### 2. Stripe Integration
- Payment management and subscription enforcement.
- License validation via cloud APIs.

---

### 4.4 Security & IP Protection

- **Compiled Distribution**
  - CLI and web builds distributed as compiled binaries/minified code.
- **Cloud Licensing**
  - Licensing and subscription checks handled via secure APIs.

---
## 5. User Flows

### 5.1 Closed Beta Flow
1. **Sign Up**: User registers on the CursorDone site and gets flagged as a Beta user.
2. **Install CLI**: User installs via npm, binary, or brew.
3. **Initialize Project**: Runs `cursordone init` to set up folders and configs.
4. **Launch GUI**: Runs `cursordone start` to access the web interface.
5. **Collaborate with AI**: Uses IDE AI agent alongside the localhost GUI for efficient task execution.

### 5.2 Paid Flow (Post-Beta)
1. **Subscription Setup**: User selects a paid plan on the CursorDone website.
2. **Subscription Validation**: Subscription status is checked via Supabase when the CLI or web GUI is launched.
3. **Task Management**: Users manage tasks visually in the web GUI or directly through the CLI.

### User Onboarding Flow

1. **Sign Up:** Register on the CursorDone website and log in.
2. **Install CLI:** Use `npm`, binary, or `brew` to install the CLI.
3. **Initialize Project:** Run `cursordone init` to set up folders and configurations.
4. **Launch GUI:** Use `cursordone start` to open the web-based interface.
5. **First Task:** Create and manage your first task via the web GUI or CLI.

---

## 6. Constraints & Assumptions

### 1. Local-First Data
- All task data remains on the user’s machine; only minimal metadata is stored in the cloud.

### 2. Internet Requirements
- Necessary for authentication, subscription checks, and updates.

### 3. Offline Mode
- Consider partial offline functionality, allowing basic task edits without cloud verification.
- CursorDone will support partial offline functionality, allowing users to view and edit tasks locally without cloud connectivity. Changes made offline will be cached and synchronized with the cloud upon reconnection. This ensures uninterrupted task management during network outages while maintaining data consistency.

---

## 7. Timeline & Milestones

### 1. Alpha Release
- Basic CLI and web GUI with local markdown task management.
- Supabase integration for user authentication.

### 2. Beta Launch
- Closed beta with 100 testers.
- Feedback loop via Discord/Slack.

### 3. Subscription Rollout
- Stripe integration for paid users.
- License enforcement in CLI and GUI.

### 4. Public Release
- Transition Beta users to paid plans.
- Open sign-ups for general users.

---

## 8. Success Metrics

- **Task Completion Rates:** Percentage of tasks marked as done within a project.
- **Retention Rates:** Weekly and monthly active users post-beta.
- **Feedback Loop:** Number of actionable insights from user surveys and feedback sessions.
- **Revenue:** Average revenue per user (ARPU) and subscription renewals.

---

## 9. Open Questions

1. **Offline Mode**: How much functionality should be available offline?
2. **Team Collaboration**: Should we support multi-user projects in the future?
- While not initially supported, team collaboration is a future consideration. This feature may include multi-user access to shared repositories and real-time updates for task management across teams.
3. **Distribution**: What additional CLI/web distribution methods should we prioritize?

---

## 10. Conclusion

CursorDone differentiates itself by combining:
1. A local-first, file-based task management system.
2. Integration with AI-powered IDEs to optimize developer workflows.
3. A hybrid CLI and web GUI approach for ultimate convenience and flexibility.

Competitors often focus on purely cloud-based or standalone local solutions, lacking AI and CLI/web hybrid integration.

CursorDone aims to bridge the gap between developers, AI-powered IDEs, and task management. By offering a combination of CLI, web GUI, and AI integration, it creates a local-first solution that is lightweight, secure, and developer-friendly. With a phased rollout, we will refine the experience based on feedback and expand into broader use cases post-launch.
