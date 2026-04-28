import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data.db',
});

export async function initDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'recruiter',
      is_verified INTEGER DEFAULT 0,
      can_post_jobs INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      job_type TEXT NOT NULL,
      description TEXT,
      requirements TEXT,
      salary_range TEXT,
      posted_by TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (posted_by) REFERENCES profiles(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      linkedin_url TEXT,
      skills TEXT,
      experience_years INTEGER,
      notes TEXT,
      submitted_by TEXT,
      job_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (submitted_by) REFERENCES profiles(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      stage TEXT DEFAULT 'Submitted',
      notes TEXT,
      updated_by TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    )
  `);

  const adminCheck = await db.execute("SELECT id FROM profiles WHERE email = 'admin@aitalenthunt.com'");
  if (adminCheck.rows.length === 0) {
    const hash = await bcrypt.hash('Admin@1234', 10);
    await db.execute({
      sql: 'INSERT INTO profiles (id, full_name, email, password_hash, role, is_verified, can_post_jobs) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [randomUUID(), 'Admin', 'admin@aitalenthunt.com', hash, 'admin', 1, 1],
    });
  }

  const jobCheck = await db.execute("SELECT id FROM jobs LIMIT 1");
  if (jobCheck.rows.length === 0) {
    const adminRow = await db.execute("SELECT id FROM profiles WHERE email = 'admin@aitalenthunt.com'");
    const adminId = adminRow.rows[0].id;

    const jobs = [
      { title: 'Software Engineer', company: 'AI Talent Hunt', location: 'San Francisco, CA', job_type: 'Full-time', description: 'Build and maintain scalable web applications using modern frameworks and cloud infrastructure.', requirements: '3+ years experience with React, Node.js, TypeScript. Familiarity with AWS or GCP.', salary_range: '$120,000 - $160,000' },
      { title: 'Product Manager', company: 'AI Talent Hunt', location: 'New York, NY', job_type: 'Full-time', description: 'Lead product strategy, roadmap, and cross-functional execution for AI-powered recruitment tools.', requirements: '5+ years in product management. Experience with B2B SaaS products.', salary_range: '$130,000 - $170,000' },
      { title: 'Data Analyst', company: 'AI Talent Hunt', location: 'Remote', job_type: 'Full-time', description: 'Analyze recruitment data, build dashboards, and provide actionable insights to improve hiring outcomes.', requirements: '2+ years with SQL, Python, and BI tools. Strong analytical mindset.', salary_range: '$90,000 - $120,000' },
    ];

    for (const j of jobs) {
      await db.execute({
        sql: 'INSERT INTO jobs (id, title, company, location, job_type, description, requirements, salary_range, posted_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [randomUUID(), j.title, j.company, j.location, j.job_type, j.description, j.requirements, j.salary_range, adminId],
      });
    }
  }

  const recruiterCheck = await db.execute("SELECT id FROM profiles WHERE role = 'recruiter' LIMIT 1");
  if (recruiterCheck.rows.length === 0) {
    const hash1 = await bcrypt.hash('Recruiter1@123', 10);
    const hash2 = await bcrypt.hash('Recruiter2@123', 10);
    const r1Id = randomUUID();
    const r2Id = randomUUID();
    await db.execute({ sql: 'INSERT INTO profiles (id, full_name, email, password_hash, role, is_verified, can_post_jobs) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [r1Id, 'Sarah Johnson', 'sarah@example.com', hash1, 'recruiter', 1, 1] });
    await db.execute({ sql: 'INSERT INTO profiles (id, full_name, email, password_hash, role, is_verified, can_post_jobs) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [r2Id, 'Mike Chen', 'mike@example.com', hash2, 'recruiter', 1, 0] });

    const jobs = await db.execute("SELECT id FROM jobs WHERE is_active = 1");
    const jobIds = jobs.rows.map(r => r.id);

    const candidates = [
      { name: 'Alice Williams', email: 'alice@email.com', phone: '555-0101', linkedin: 'https://linkedin.com/in/alicew', skills: 'React, TypeScript, Node.js', exp: 5, notes: 'Strong frontend skills', recruiter: r1Id, job: jobIds[0], stage: 'Interview' },
      { name: 'Bob Martinez', email: 'bob@email.com', phone: '555-0102', linkedin: 'https://linkedin.com/in/bobm', skills: 'Python, SQL, Tableau', exp: 3, notes: 'Great data background', recruiter: r1Id, job: jobIds[2], stage: 'Screening' },
      { name: 'Carol Davis', email: 'carol@email.com', phone: '555-0103', linkedin: 'https://linkedin.com/in/carold', skills: 'Product Strategy, Agile, Jira', exp: 7, notes: 'Experienced PM', recruiter: r2Id, job: jobIds[1], stage: 'Technical' },
      { name: 'David Kim', email: 'david@email.com', phone: '555-0104', linkedin: 'https://linkedin.com/in/davidk', skills: 'Java, Spring Boot, AWS', exp: 4, notes: 'Backend specialist', recruiter: r2Id, job: jobIds[0], stage: 'Submitted' },
      { name: 'Eva Brown', email: 'eva@email.com', phone: '555-0105', linkedin: 'https://linkedin.com/in/evab', skills: 'React, GraphQL, Docker', exp: 6, notes: 'Full-stack capable', recruiter: r1Id, job: jobIds[0], stage: 'Offer' },
    ];

    for (const c of candidates) {
      const cId = randomUUID();
      await db.execute({
        sql: 'INSERT INTO candidates (id, full_name, email, phone, linkedin_url, skills, experience_years, notes, submitted_by, job_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [cId, c.name, c.email, c.phone, c.linkedin, c.skills, c.exp, c.notes, c.recruiter, c.job],
      });
      await db.execute({
        sql: 'INSERT INTO pipeline_stages (id, candidate_id, job_id, stage, notes, updated_by) VALUES (?, ?, ?, ?, ?, ?)',
        args: [randomUUID(), cId, c.job, c.stage, 'Initial stage', c.recruiter],
      });
    }
  }

  console.log('Database initialized successfully');
}

export default db;
