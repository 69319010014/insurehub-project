const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// 1. ตั้งค่า SQLite Database
const db = new sqlite3.Database('./insurehub.db', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite Database.');
});

// สร้างตารางข้อมูลใน Database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user',
    quota INTEGER DEFAULT 5
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    title TEXT,
    category TEXT,
    price REAL,
    coverage REAL,
    repair_type TEXT,
    is_promoted INTEGER DEFAULT 0,
    status TEXT DEFAULT 'approved'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    email TEXT,
    plan_title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sponsors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    contact TEXT,
    phone TEXT,
    note TEXT,
    status TEXT DEFAULT 'pending'
  )`);
});

// 2. ตั้งค่า Nodemailer สำหรับส่งอีเมลหาลูกค้า
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'YOUR_GMAIL@gmail.com',
    pass: process.env.GMAIL_PASS || 'YOUR_APP_PASSWORD'
  }
});

async function sendEmailToCustomer(customerData) {
  if (!customerData.email) return;
  
  const mailOptions = {
    from: '"PaloInSure" <no-reply@paloinsure.com>',
    to: customerData.email,
    subject: `ขอบคุณที่สนใจแผนประกันภัย ${customerData.plan_title} - PaloInSure`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #1B4D3E; border-radius: 8px;">
        <h2 style="color: #1B4D3E;">สวัสดีคุณ ${customerData.name}</h2>
        <p>ขอบคุณที่สนใจแผนประกันภัยกับทาง <b>PaloInSure</b> ทางเราได้รับคำขอใบเสนอราคาเรียบร้อยแล้ว</p>
        <div style="background: #f4f6f5; padding: 15px; border-left: 4px solid #1B4D3E; margin: 15px 0;">
          <p style="margin: 4px 0;"><b>แผนประกันภัยที่สนใจ:</b> ${customerData.plan_title}</p>
          <p style="margin: 4px 0;"><b>เบอร์ติดต่อกลับ:</b> ${customerData.phone}</p>
        </div>
        <p>เจ้าหน้าที่ของเราจะทำการตรวจสอบรายละเอียดและติดต่อกลับโดยเร็วที่สุดครับ</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Email send error:', err);
  }
}

// 3. REST APIs
// --- PLANS ---
app.get('/api/plans', (req, res) => {
  db.all(`SELECT * FROM plans`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/plans', (req, res) => {
  const { company, title, category, price, coverage, repair_type, is_promoted, status } = req.body;
  db.run(
    `INSERT INTO plans (company, title, category, price, coverage, repair_type, is_promoted, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [company, title, category, price, coverage, repair_type, is_promoted || 0, status || 'approved'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// --- USERS ---
app.get('/api/users', (req, res) => {
  db.all(`SELECT * FROM users`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/users/:id', (req, res) => {
  const { name, email, phone, role, quota } = req.body;
  db.run(
    `UPDATE users SET name = ?, email = ?, phone = ?, role = ?, quota = ? WHERE id = ?`,
    [name, email, phone, role, quota, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/api/users/:id', (req, res) => {
  db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// --- LEADS ---
app.get('/api/leads', (req, res) => {
  db.all(`SELECT * FROM leads ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/leads', (req, res) => {
  const { name, phone, email, plan_title } = req.body;
  db.run(
    `INSERT INTO leads (name, phone, email, plan_title) VALUES (?, ?, ?, ?)`,
    [name, phone, email, plan_title],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      sendEmailToCustomer({ name, phone, email, plan_title });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// --- SPONSORS ---
app.get('/api/sponsors', (req, res) => {
  db.all(`SELECT * FROM sponsors`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/sponsors', (req, res) => {
  const { company, contact, phone, note } = req.body;
  db.run(
    `INSERT INTO sponsors (company, contact, phone, note) VALUES (?, ?, ?, ?)`,
    [company, contact, phone, note],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});