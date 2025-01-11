---
title: Create Supabase database schema
status: todo
priority: high
epic: system-rebuild
dependencies: []
tags:
  - database
  - supabase
  - schema
created: '2025-01-10'
ref: TSK-060
---
Design and create the database schema for Supabase to support the required functionality. Include the following:

1. **Users Table**:
   - Fields: `id (uuid)`, `email`, `created_at`, `beta (boolean)`, `subscription_status (text)`
   - Constraints: `id` is primary key, `email` is unique.

2. **Optional Projects Table**:
   - Fields: `id (uuid)`, `user_id (foreign key)`, `name`, `created_at`
   - Constraints: `id` is primary key, `user_id` references `users(id)`.

3. Write and apply migrations using Supabase CLI or SQL editor.

Deliverable:
- A fully functional database schema accessible via the Supabase dashboard.
- SQL scripts or migrations stored in version control.
