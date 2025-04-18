import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key';


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'expense_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        passcode VARCHAR(255) NOT NULL,
        created_by INT,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        team_id INT,
        user_id INT,
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        PRIMARY KEY (team_id, user_id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INT,
        amount DECIMAL(10,2) NOT NULL,
        description VARCHAR(255) NOT NULL,
        paid_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (paid_by) REFERENCES users(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expense_id INT,
        user_id INT,
        amount DECIMAL(10,2) NOT NULL,
        paid BOOLEAN DEFAULT FALSE,
        paid_at TIMESTAMP NULL,
        FOREIGN KEY (expense_id) REFERENCES expenses(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    connection.release();
  }
}

initDatabase().catch(console.error);

app.use(cors());
app.use(express.json());


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};


app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    const token = jwt.sign({ id: result.insertId, username }, JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username }, JWT_SECRET);
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/api/teams', authenticateToken, async (req, res) => {
  const { name, passcode } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO teams (name, passcode, created_by) VALUES (?, ?, ?)',
      [name, passcode, req.user.id]
    );

    await connection.query(
      'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
      [result.insertId, req.user.id]
    );

    await connection.commit();
    res.json({ id: result.insertId, name, passcode });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed to create team' });
  } finally {
    connection.release();
  }
});

app.post('/api/teams/join', authenticateToken, async (req, res) => {
  const { teamId, passcode } = req.body;
  try {
    const [teams] = await pool.query(
      'SELECT * FROM teams WHERE id = ? AND passcode = ?',
      [teamId, passcode]
    );

    if (!teams.length) {
      return res.status(404).json({ error: 'Team not found or invalid passcode' });
    }

    await pool.query(
      'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
      [teamId, req.user.id]
    );

    res.json({ message: 'Joined team successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Already a member of this team' });
  }
});

app.get('/api/teams/search', authenticateToken, async (req, res) => {
  const { query } = req.query;
  try {
    const [teams] = await pool.query(
      'SELECT id, name FROM teams WHERE name LIKE ?',
      [`%${query}%`]
    );
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search teams' });
  }
});


app.post('/api/expenses', authenticateToken, async (req, res) => {
  const { teamId, amount, description } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [expenseResult] = await connection.query(
      'INSERT INTO expenses (team_id, amount, description, paid_by) VALUES (?, ?, ?, ?)',
      [teamId, amount, description, req.user.id]
    );

    const [members] = await connection.query(
      'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?',
      [teamId]
    );

    const memberCount = members[0].count;
    const splitAmount = amount / memberCount;

    // Create payment records for each team member
    const [teamMembers] = await connection.query(
      'SELECT user_id FROM team_members WHERE team_id = ?',
      [teamId]
    );

    for (const member of teamMembers) {
      await connection.query(
        'INSERT INTO payments (expense_id, user_id, amount, paid) VALUES (?, ?, ?, ?)',
        [expenseResult.insertId, member.user_id, splitAmount, member.user_id === req.user.id]
      );
    }

    await connection.commit();
    res.json({ id: expenseResult.insertId, amount, description });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed to create expense' });
  } finally {
    connection.release();
  }
});

app.post('/api/expenses/:expenseId/pay', authenticateToken, async (req, res) => {
  const { expenseId } = req.params;

  try {
    const [result] = await pool.query(
      `UPDATE payments 
       SET paid = TRUE, paid_at = CURRENT_TIMESTAMP 
       WHERE expense_id = ? AND user_id = ? AND paid = FALSE`,
      [expenseId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Payment not found or already paid' });
    }

    res.json({ message: 'Payment successful' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

app.get('/api/teams/:teamId/expenses', authenticateToken, async (req, res) => {
  const { teamId } = req.params;
  try {
    const [expenses] = await pool.query(
      `SELECT 
        e.*, 
        u.username as paid_by_username,
        p.paid as user_paid,
        p.amount as user_share
       FROM expenses e 
       JOIN users u ON e.paid_by = u.id 
       LEFT JOIN payments p ON e.id = p.expense_id AND p.user_id = ?
       WHERE e.team_id = ?`,
      [req.user.id, teamId]
    );
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});