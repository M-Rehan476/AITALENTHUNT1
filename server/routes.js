import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import db from './database.js';
import { generateToken, authMiddleware, verifiedMiddleware, adminMiddleware } from './auth.js';

const router = Router();

// ===== AUTH ROUTES =====
router.post('/auth/register', async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ error: 'All fields are required' });

    const existing = await db.execute({ sql: 'SELECT id FROM profiles WHERE email = ?', args: [email] });
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    await db.execute({
      sql: 'INSERT INTO profiles (id, full_name, email, password_hash, role, is_verified, can_post_jobs) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, full_name, email, hash, 'recruiter', 0, 0],
    });
    res.json({ message: 'Your account has been submitted for admin approval. You\'ll be notified once verified.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = await db.execute({ sql: 'SELECT * FROM profiles WHERE email = ?', args: [email] });
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, is_verified: user.is_verified, can_post_jobs: user.can_post_jobs } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== JOBS ROUTES =====
router.get('/jobs', authMiddleware, verifiedMiddleware, async (req, res) => {
  try {
    const result = await db.execute("SELECT j.*, p.full_name as posted_by_name FROM jobs j LEFT JOIN profiles p ON j.posted_by = p.id WHERE j.is_active = 1 ORDER BY j.created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jobs', authMiddleware, verifiedMiddleware, async (req, res) => {
  try {
    if (!req.user.can_post_jobs && req.user.role !== 'admin') return res.status(403).json({ error: 'Job posting is not enabled for your account.' });

    const { title, company, location, job_type, description, requirements, salary_range } = req.body;
    if (!title || !company || !location || !job_type) return res.status(400).json({ error: 'Title, company, location, and job type are required' });

    const id = randomUUID();
    await db.execute({
      sql: 'INSERT INTO jobs (id, title, company, location, job_type, description, requirements, salary_range, posted_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, title, company, location, job_type, description || '', requirements || '', salary_range || '', req.user.id],
    });
    res.json({ id, message: 'Job posted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/jobs/:id', authMiddleware, verifiedMiddleware, async (req, res) => {
  try {
    const result = await db.execute({ sql: "SELECT j.*, p.full_name as posted_by_name FROM jobs j LEFT JOIN profiles p ON j.posted_by = p.id WHERE j.id = ?", args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/jobs/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { is_active } = req.body;
    await db.execute({ sql: 'UPDATE jobs SET is_active = ? WHERE id = ?', args: [is_active ? 1 : 0, req.params.id] });
    res.json({ message: 'Job updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CANDIDATES ROUTES =====
router.post('/candidates', authMiddleware, verifiedMiddleware, async (req, res) => {
  try {
    const { full_name, email, phone, linkedin_url, skills, experience_years, notes, job_id } = req.body;
    if (!full_name || !email || !job_id) return res.status(400).json({ error: 'Name, email, and job are required' });

    const id = randomUUID();
    await db.execute({
      sql: 'INSERT INTO candidates (id, full_name, email, phone, linkedin_url, skills, experience_years, notes, submitted_by, job_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, full_name, email, phone || '', linkedin_url || '', skills || '', experience_years || 0, notes || '', req.user.id, job_id],
    });
    await db.execute({
      sql: 'INSERT INTO pipeline_stages (id, candidate_id, job_id, stage, notes, updated_by) VALUES (?, ?, ?, ?, ?, ?)',
      args: [randomUUID(), id, job_id, 'Submitted', 'Candidate submitted', req.user.id],
    });
    res.json({ id, message: 'Candidate submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/candidates/my', authMiddleware, verifiedMiddleware, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT c.*, j.title as job_title, ps.stage as current_stage
        FROM candidates c
        LEFT JOIN jobs j ON c.job_id = j.id
        LEFT JOIN pipeline_stages ps ON ps.candidate_id = c.id
        WHERE c.submitted_by = ?
        ORDER BY c.created_at DESC`,
      args: [req.user.id],
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/candidates/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT c.*, j.title as job_title, p.full_name as recruiter_name, ps.stage as current_stage
      FROM candidates c
      LEFT JOIN jobs j ON c.job_id = j.id
      LEFT JOIN profiles p ON c.submitted_by = p.id
      LEFT JOIN pipeline_stages ps ON ps.candidate_id = c.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/candidates/:id', authMiddleware, verifiedMiddleware, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT c.*, j.title as job_title, ps.stage as current_stage, ps.notes as stage_notes
        FROM candidates c
        LEFT JOIN jobs j ON c.job_id = j.id
        LEFT JOIN pipeline_stages ps ON ps.candidate_id = c.id
        WHERE c.id = ?`,
      args: [req.params.id],
    });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Candidate not found' });
    const candidate = result.rows[0];
    if (req.user.role !== 'admin' && candidate.submitted_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== PIPELINE ROUTES =====
router.get('/pipeline/my', authMiddleware, verifiedMiddleware, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT ps.*, c.full_name as candidate_name, c.email as candidate_email, j.title as job_title
        FROM pipeline_stages ps
        JOIN candidates c ON ps.candidate_id = c.id
        JOIN jobs j ON ps.job_id = j.id
        WHERE c.submitted_by = ?
        ORDER BY ps.updated_at DESC`,
      args: [req.user.id],
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pipeline/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT ps.*, c.full_name as candidate_name, c.email as candidate_email, j.title as job_title, p.full_name as recruiter_name
      FROM pipeline_stages ps
      JOIN candidates c ON ps.candidate_id = c.id
      JOIN jobs j ON ps.job_id = j.id
      JOIN profiles p ON c.submitted_by = p.id
      ORDER BY ps.updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/pipeline/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { stage, notes } = req.body;
    if (stage) {
      await db.execute({ sql: 'UPDATE pipeline_stages SET stage = ?, notes = ?, updated_by = ?, updated_at = datetime("now") WHERE id = ?', args: [stage, notes || '', req.user.id, req.params.id] });
    }
    res.json({ message: 'Pipeline updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ADMIN ROUTES =====
router.get('/admin/recruiters', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT p.*, COUNT(c.id) as candidate_count
      FROM profiles p
      LEFT JOIN candidates c ON c.submitted_by = p.id
      WHERE p.role = 'recruiter'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/recruiters/pending', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM profiles WHERE role = 'recruiter' AND is_verified = 0 ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/recruiters/:id/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { is_verified } = req.body;
    await db.execute({ sql: 'UPDATE profiles SET is_verified = ? WHERE id = ?', args: [is_verified ? 1 : 0, req.params.id] });
    res.json({ message: 'Verification status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/recruiters/:id/posting', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { can_post_jobs } = req.body;
    await db.execute({ sql: 'UPDATE profiles SET can_post_jobs = ? WHERE id = ?', args: [can_post_jobs ? 1 : 0, req.params.id] });
    res.json({ message: 'Posting permission updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/recruiters/:id/profile', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const profile = await db.execute({ sql: 'SELECT * FROM profiles WHERE id = ?', args: [req.params.id] });
    if (profile.rows.length === 0) return res.status(404).json({ error: 'Recruiter not found' });

    const jobs = await db.execute({ sql: 'SELECT * FROM jobs WHERE posted_by = ? ORDER BY created_at DESC', args: [req.params.id] });
    const candidates = await db.execute({
      sql: `SELECT c.*, j.title as job_title, ps.stage as current_stage
        FROM candidates c
        LEFT JOIN jobs j ON c.job_id = j.id
        LEFT JOIN pipeline_stages ps ON ps.candidate_id = c.id
        WHERE c.submitted_by = ?
        ORDER BY c.created_at DESC`,
      args: [req.params.id],
    });

    res.json({ profile: profile.rows[0], jobs: jobs.rows, candidates: candidates.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
