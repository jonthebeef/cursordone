INSERT INTO projects (user_id, name) SELECT id, 'Test Project' FROM users WHERE email = 'test@example.com' RETURNING *; SELECT p.*, u.email FROM projects p JOIN users u ON p.user_id = u.id;
