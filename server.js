const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// ใช้ Port จากระบบ Cloud Hosting หากไม่มีจะใช้ Port 3000
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ให้ Express ให้บริการไฟล์ Static (เช่น index.html, css, js) จากโฟลเดอร์ปัจจุบัน
app.use(express.static(path.join(__dirname)));

// 1. เชื่อมต่อฐานข้อมูล SQLite
const dbPath = path.join(__dirname, 'insurehub.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err.message);
  else console.log(`Connected to SQLite Database at: ${dbPath}`);
});

// 2. สร้างตารางข้อมูลและใส่ข้อมูลเริ่มต้น (Seed Data)
db.serialize(() => {
  // ตารางผู้ใช้งาน
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT,
    password TEXT,
    quota INTEGER,
    status TEXT
  )`);

  db.run(`ALTER TABLE users ADD COLUMN password TEXT`, () => {});

  // ตารางแผนประกันภัย (มีสถานะอนุมัติ status)
  db.run(`CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    title TEXT,
    category TEXT,
    price REAL,
    coverage REAL,
    repair TEXT,
    deductible TEXT,
    isPromoted INTEGER,
    status TEXT DEFAULT 'approved'
  )`);

  db.run(`ALTER TABLE plans ADD COLUMN status TEXT DEFAULT 'approved'`, () => {});

  // ตาราง Lead ลูกค้า
  db.run(`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    name TEXT,
    phone TEXT,
    plan TEXT,
    status TEXT
  )`);

  // ตารางคำขอผู้สนับสนุน (Sponsor/Partner)
  db.run(`CREATE TABLE IF NOT EXISTS sponsors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    company TEXT,
    name TEXT,
    phone TEXT,
    note TEXT,
    status TEXT
  )`);

  // ใส่ข้อมูลตัวอย่างหากตารางว่างเปล่า
  db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO users (name, email, phone, role, password, quota, status) VALUES 
        ('คุณอนันต์ สุขใจ', 'anan@email.com', '081-111-2222', 'user', '1234', 0, 'active'),
        ('คุณพรทิพย์ มั่งคั่ง', 'porntip@email.com', '089-333-4444', 'user', '1234', 0, 'active'),
        ('ตัวแทน บริษัทเมืองไทยประกัน', 'agent.muangthai@email.com', '082-555-6666', 'agent', '1234', 5, 'active'),
        ('ผู้ดูแลระบบสูงสุด', 'admin@insurehub.com', '02-000-0000', 'admin', 'admin123', 999, 'active')`);
    }
  });

  db.get("SELECT COUNT(*) AS count FROM plans", (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO plans (company, title, category, price, coverage, repair, deductible, isPromoted, status) VALUES 
        ('วิริยะประกันภัย', 'ประกันรถยนต์ ชั้น 1 Pro', 'car1', 15500, 500000, 'ซ่อมห้าง (ศูนย์)', '0 บาท (ไม่มี)', 1, 'approved'),
        ('กรุงเทพประกันภัย', 'ประกันอัคคีภัย คุ้มครองบ้าน 360', 'fire', 2800, 2000000, 'ชดเชยเงินสดตามเงื่อนไข', '0 บาท (ไม่มี)', 0, 'approved'),
        ('เอไอเอ (AIA)', 'ประกันชีวิตตลอดชีพ 99/20', 'life_whole', 24000, 1000000, 'ชดเชยเงินสดตามเงื่อนไข', '-', 1, 'approved'),
        ('เมืองไทยประกันภัย', 'ประกันรถยนต์ ชั้น 1 สบายใจ', 'car1', 12900, 400000, 'ซ่อมอู่', '3,000 บาท', 0, 'pending')`);
    }
  });

  db.get("SELECT COUNT(*) AS count FROM leads", (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO leads (date, name, phone, plan, status) VALUES 
        ('08/09/2026', 'คุณสมชาย ใจดี', '081-234-XXXX', 'วิริยะประกันภัย Pro', 'รอติดต่อไป'),
        ('07/09/2026', 'คุณวิภา รักดี', '089-987-XXXX', 'วิริยะประกันภัย Pro', 'ปิดการขายสำเร็จ')`);
    }
  });

  db.get("SELECT COUNT(*) AS count FROM sponsors", (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO sponsors (date, company, name, phone, note, status) VALUES 
        ('08/09/2026', 'บริษัท อลิอันซ์ ประกันภัย จำกัด', 'คุณวิทยา รุ่งเรือง', '086-777-8888', 'ต้องการนำเสนอแผนประกันสุขภาพกลุ่ม', 'pending'),
        ('07/09/2026', 'โบรกเกอร์ พรีเมียม เซอร์วิส', 'คุณนภา วงศ์สว่าง', '084-999-0000', 'ขอเชื่อมต่อ API ประกันรถยนต์', 'approved')`);
    }
  });
});

// ==================== REST API ENDPOINTS ====================

// --- PLANS API ---
app.get('/api/plans', (req, res) => {
  db.all("SELECT * FROM plans ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/plans', (req, res) => {
  const { company, title, category, price, coverage, repair, status } = req.body;
  const planStatus = status || 'pending';
  const sql = `INSERT INTO plans (company, title, category, price, coverage, repair, deductible, isPromoted, status) VALUES (?, ?, ?, ?, ?, ?, '0 บาท', 0, ?)`;
  
  db.run(sql, [company, title, category, price, coverage, repair, planStatus], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, company, title, category, price, coverage, repair, status: planStatus });
  });
});

app.put('/api/plans/:id', (req, res) => {
  const { company, title, category, price, coverage, repair, status } = req.body;
  const sql = `UPDATE plans SET 
    company = COALESCE(?, company), 
    title = COALESCE(?, title), 
    category = COALESCE(?, category), 
    price = COALESCE(?, price), 
    coverage = COALESCE(?, coverage), 
    repair = COALESCE(?, repair), 
    status = COALESCE(?, status) 
    WHERE id = ?`;

  db.run(sql, [company, title, category, price, coverage, repair, status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'อัปเดตข้อมูลแผนประกันภัยสำเร็จ' });
  });
});

app.delete('/api/plans/:id', (req, res) => {
  db.run("DELETE FROM plans WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- USERS API ---
app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { name, email, phone, role, password, quota, status } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อ อีเมล และรหัสผ่าน' });
  }

  db.run(
    `INSERT INTO users (name, email, phone, role, password, quota, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, phone || '', role || 'user', password, quota || 5, status || 'active'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'สร้างผู้ใช้งานสำเร็จ' });
    }
  );
});

app.put('/api/users/:id', (req, res) => {
  const { name, email, phone, role, quota, status } = req.body;
  db.run(
    `UPDATE users SET name = ?, email = ?, phone = ?, role = ?, quota = ?, status = ? WHERE id = ?`,
    [name, email, phone, role, quota, status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
    }
  );
});

app.delete('/api/users/:id', (req, res) => {
  db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'ลบผู้ใช้งานสำเร็จ' });
  });
});

// --- AUTH API ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    return res.json({ success: true, user: { id: 0, name: 'Super Admin', role: 'admin' } });
  }
  if (username === 'agent' && password === '1234') {
    return res.json({ success: true, user: { id: 0, name: 'Partner / Agent', role: 'agent' } });
  }

  db.get(
    `SELECT * FROM users WHERE (email = ? OR phone = ?) AND password = ?`,
    [username, username, password],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (user) {
        if (user.status === 'suspended') {
          return res.status(403).json({ error: 'บัญชีนี้ถูกระงับการใช้งาน' });
        }
        res.json({ success: true, user });
      } else {
        res.status(401).json({ error: 'อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง' });
      }
    }
  );
});

// --- LEADS API ---
app.get('/api/leads', (req, res) => {
  db.all("SELECT * FROM leads ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/leads', (req, res) => {
  const { name, phone, plan } = req.body;
  const date = new Date().toLocaleDateString('th-TH');
  db.run("INSERT INTO leads (date, name, phone, plan, status) VALUES (?, ?, ?, ?, 'รอติดต่อไป')", [date, name, phone, plan], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, date, name, phone, plan, status: 'รอติดต่อไป' });
  });
});

// --- SPONSORS API ---
app.get('/api/sponsors', (req, res) => {
  db.all("SELECT * FROM sponsors ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/sponsors', (req, res) => {
  const { company, name, phone, note } = req.body;
  const date = new Date().toLocaleDateString('th-TH');
  db.run("INSERT INTO sponsors (date, company, name, phone, note, status) VALUES (?, ?, ?, ?, ?, 'pending')", [date, company, name, phone, note], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.put('/api/sponsors/:id/status', (req, res) => {
  const { status, company, name, phone } = req.body;
  db.run("UPDATE sponsors SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    if (status === 'approved' && company) {
      const email = 'partner@' + company.replace(/\s+/g, '').toLowerCase() + '.com';
      db.run("INSERT INTO users (name, email, phone, role, password, quota, status) VALUES (?, ?, ?, 'agent', '1234', 5, 'active')", [name + ` (${company})`, email, phone]);
    }
    res.json({ success: true });
  });
});

// ให้บริการหน้า index.html เมื่อเปิด Root URL (/)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});