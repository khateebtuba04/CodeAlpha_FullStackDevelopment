const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, run, get, all } = require('./db');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'socialmedia_secret_key_2024';

app.use(cors());
app.use(express.json());

// ─── Auth Middleware ───────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields required' });

  const existing = get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
  if (existing) return res.status(400).json({ error: 'Username or email already taken' });

  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hash]);
    const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username, id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username, id: user.id });
});

// ─── Post Routes ──────────────────────────────────────────────────────────────
app.get('/api/feed', auth, (req, res) => {
  const posts = all(`
    SELECT p.id, p.content, p.created_at, u.username, p.user_id,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as liked_by_me,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
    FROM posts p JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC LIMIT 50
  `, [req.user.id]);
  res.json(posts);
});

app.post('/api/posts', auth, (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  const result = run('INSERT INTO posts (user_id, content) VALUES (?, ?)', [req.user.id, content.trim()]);
  const post = get(`
    SELECT p.id, p.content, p.created_at, u.username, p.user_id,
      0 as likes_count, 0 as liked_by_me, 0 as comments_count
    FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?
  `, [result.lastInsertRowid]);
  res.json(post);
});

app.delete('/api/posts/:id', auth, (req, res) => {
  const post = get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not your post' });
  run('DELETE FROM comments WHERE post_id = ?', [req.params.id]);
  run('DELETE FROM likes WHERE post_id = ?', [req.params.id]);
  run('DELETE FROM posts WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ─── Like Routes ──────────────────────────────────────────────────────────────
app.post('/api/posts/:id/like', auth, (req, res) => {
  const existing = get('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (existing) {
    run('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ liked: false });
  } else {
    run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [req.params.id, req.user.id]);
    res.json({ liked: true });
  }
});

// ─── Comment Routes ───────────────────────────────────────────────────────────
app.get('/api/posts/:id/comments', auth, (req, res) => {
  const comments = all(`
    SELECT c.id, c.content, c.created_at, u.username FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ? ORDER BY c.created_at ASC
  `, [req.params.id]);
  res.json(comments);
});

app.post('/api/posts/:id/comments', auth, (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Comment required' });
  const result = run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [req.params.id, req.user.id, content.trim()]);
  const comment = get('SELECT c.id, c.content, c.created_at, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [result.lastInsertRowid]);
  res.json(comment);
});

// ─── User / Profile Routes ────────────────────────────────────────────────────
app.get('/api/users/:username', auth, (req, res) => {
  const user = get(`
    SELECT u.id, u.username, u.bio, u.created_at,
      (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
      (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
      (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
      (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
    FROM users u WHERE u.username = ?
  `, [req.user.id, req.params.username]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.get('/api/users/:username/posts', auth, (req, res) => {
  const user = get('SELECT id FROM users WHERE username = ?', [req.params.username]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const posts = all(`
    SELECT p.id, p.content, p.created_at, u.username, p.user_id,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as liked_by_me,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ? ORDER BY p.created_at DESC
  `, [req.user.id, user.id]);
  res.json(posts);
});

app.post('/api/users/:username/follow', auth, (req, res) => {
  const target = get('SELECT id FROM users WHERE username = ?', [req.params.username]);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

  const existing = get('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, target.id]);
  if (existing) {
    run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, target.id]);
    res.json({ following: false });
  } else {
    run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.user.id, target.id]);
    res.json({ following: true });
  }
});

app.get('/api/users', auth, (req, res) => {
  const users = all(`
    SELECT u.id, u.username,
      (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
      (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
    FROM users u WHERE u.id != ? LIMIT 10
  `, [req.user.id, req.user.id]);
  res.json(users);
});

app.patch('/api/profile', auth, (req, res) => {
  const { bio } = req.body;
  run('UPDATE users SET bio = ? WHERE id = ?', [bio || '', req.user.id]);
  res.json({ success: true });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
getDb().then(() => {
  app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});
