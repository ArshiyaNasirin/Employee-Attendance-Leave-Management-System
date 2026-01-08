const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('attendance.db');

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'employee',
    department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Attendance table
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date DATE,
    punch_in TIME,
    punch_out TIME,
    total_hours REAL,
    status TEXT DEFAULT 'present',
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Leave requests table
  db.run(`CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    leave_type TEXT,
    start_date DATE,
    end_date DATE,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Create default admin user
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (employee_id, name, email, password, role, department) 
          VALUES ('EMP001', 'Admin User', 'admin@company.com', ?, 'admin', 'IT')`, [adminPassword]);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      }, JWT_SECRET);
      
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          employee_id: user.employee_id 
        } 
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Get all employees (Admin only)
app.get('/api/employees', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  db.all('SELECT id, employee_id, name, email, department, created_at FROM users WHERE role = "employee"', (err, employees) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(employees);
  });
});

// Add new employee (Admin only)
app.post('/api/employees', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { employee_id, name, email, password, department } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run('INSERT INTO users (employee_id, name, email, password, department) VALUES (?, ?, ?, ?, ?)',
    [employee_id, name, email, hashedPassword, department], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to create employee' });
      res.json({ id: this.lastID, message: 'Employee created successfully' });
    });
});

// Punch in/out
app.post('/api/attendance/punch', authenticateToken, (req, res) => {
  const { type } = req.body; // 'in' or 'out'
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0];
  
  if (type === 'in') {
    db.run('INSERT INTO attendance (user_id, date, punch_in) VALUES (?, ?, ?)',
      [req.user.id, today, currentTime], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to punch in' });
        res.json({ message: 'Punched in successfully', time: currentTime });
      });
  } else {
    db.get('SELECT * FROM attendance WHERE user_id = ? AND date = ? AND punch_out IS NULL',
      [req.user.id, today], (err, record) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!record) return res.status(400).json({ error: 'No punch-in record found' });
        
        const punchIn = new Date(`${today} ${record.punch_in}`);
        const punchOut = new Date(`${today} ${currentTime}`);
        const totalHours = (punchOut - punchIn) / (1000 * 60 * 60);
        
        db.run('UPDATE attendance SET punch_out = ?, total_hours = ? WHERE id = ?',
          [currentTime, totalHours.toFixed(2), record.id], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to punch out' });
            res.json({ message: 'Punched out successfully', time: currentTime, totalHours: totalHours.toFixed(2) });
          });
      });
  }
});

// Get attendance records
app.get('/api/attendance', authenticateToken, (req, res) => {
  const userId = req.user.role === 'admin' ? req.query.user_id || req.user.id : req.user.id;
  
  db.all('SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC LIMIT 30',
    [userId], (err, records) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(records);
    });
});

// Submit leave request
app.post('/api/leave-requests', authenticateToken, (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  
  db.run('INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, leave_type, start_date, end_date, reason], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to submit leave request' });
      res.json({ id: this.lastID, message: 'Leave request submitted successfully' });
    });
});

// Get leave requests
app.get('/api/leave-requests', authenticateToken, (req, res) => {
  let query, params;
  
  if (req.user.role === 'admin') {
    query = `SELECT lr.*, u.name as employee_name, u.employee_id 
             FROM leave_requests lr 
             JOIN users u ON lr.user_id = u.id 
             ORDER BY lr.applied_at DESC`;
    params = [];
  } else {
    query = 'SELECT * FROM leave_requests WHERE user_id = ? ORDER BY applied_at DESC';
    params = [req.user.id];
  }
  
  db.all(query, params, (err, requests) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(requests);
  });
});

// Approve/reject leave request (Admin only)
app.put('/api/leave-requests/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { status } = req.body;
  
  db.run('UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ?',
    [status, req.user.id, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update leave request' });
      res.json({ message: 'Leave request updated successfully' });
    });
});

// Dashboard analytics
app.get('/api/dashboard', authenticateToken, (req, res) => {
  if (req.user.role === 'admin') {
    // Admin dashboard
    const queries = [
      'SELECT COUNT(*) as total_employees FROM users WHERE role = "employee"',
      'SELECT COUNT(*) as present_today FROM attendance WHERE date = date("now") AND punch_in IS NOT NULL',
      'SELECT COUNT(*) as pending_leaves FROM leave_requests WHERE status = "pending"',
      'SELECT AVG(total_hours) as avg_hours FROM attendance WHERE date >= date("now", "-7 days")'
    ];
    
    Promise.all(queries.map(query => 
      new Promise((resolve, reject) => {
        db.get(query, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      })
    )).then(results => {
      res.json({
        totalEmployees: results[0].total_employees,
        presentToday: results[1].present_today,
        pendingLeaves: results[2].pending_leaves,
        avgHours: results[3].avg_hours || 0
      });
    }).catch(err => {
      res.status(500).json({ error: 'Database error' });
    });
  } else {
    // Employee dashboard
    const queries = [
      `SELECT COUNT(*) as days_present FROM attendance WHERE user_id = ${req.user.id} AND date >= date("now", "-30 days")`,
      `SELECT SUM(total_hours) as total_hours FROM attendance WHERE user_id = ${req.user.id} AND date >= date("now", "-30 days")`,
      `SELECT COUNT(*) as pending_leaves FROM leave_requests WHERE user_id = ${req.user.id} AND status = "pending"`
    ];
    
    Promise.all(queries.map(query => 
      new Promise((resolve, reject) => {
        db.get(query, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      })
    )).then(results => {
      res.json({
        daysPresent: results[0].days_present,
        totalHours: results[1].total_hours || 0,
        pendingLeaves: results[2].pending_leaves
      });
    }).catch(err => {
      res.status(500).json({ error: 'Database error' });
    });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});