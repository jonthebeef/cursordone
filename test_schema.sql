INSERT INTO users (email) VALUES ('test@example.com') RETURNING *; SELECT * FROM users;
