INSERT INTO projects (user_id, name) SELECT id, 'Test Project' FROM users WHERE email = 'test@example.com' RETURNING *; SELECT * FROM projects;
