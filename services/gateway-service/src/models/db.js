const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
    connectionString: config.databaseUrl,
});

async function initDb() {
    let retries = 5;
    while (retries) {
        try {
            await pool.query('SELECT NOW()');
            console.log('Connected to auth_db database successfully.');
            break;
        } catch (err) {
            console.error(`Database connection failed. Retries left: ${retries - 1}. Error:`, err.message);
            retries -= 1;
            await new Promise(res => setTimeout(res, 2000));
        }
    }

    if (retries === 0) {
        console.error('Could not connect to postgres database. Exiting.');
        process.exit(1);
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            profile_details JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Ensure status column exists
    await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
    `);

    // Ensure image_url column exists
    await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_attendance (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            status VARCHAR(50) NOT NULL DEFAULT 'present',
            checkin_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, date)
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id SERIAL PRIMARY KEY,
            user_id INT,
            email VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            action VARCHAR(255) NOT NULL,
            details TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INT,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS traffic_logs (
            id SERIAL PRIMARY KEY,
            method VARCHAR(10) NOT NULL,
            path VARCHAR(255) NOT NULL,
            status_code INT NOT NULL,
            payload_size INT DEFAULT 0,
            response_time INT DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS user_click_metrics (
            id SERIAL PRIMARY KEY,
            element_id VARCHAR(100) NOT NULL,
            page VARCHAR(100) NOT NULL,
            user_ip VARCHAR(50),
            country VARCHAR(100) DEFAULT 'Unknown',
            city VARCHAR(100) DEFAULT 'Unknown',
            latitude NUMERIC,
            longitude NUMERIC,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log('Checking and seeding default users...');
    const bcrypt = require('bcryptjs');
    const checkUserExist = async (email, role, defaultPass, fName, lName, details) => {
        const res = await pool.query('SELECT COUNT(*) FROM users WHERE email = $1', [email]);
        if (parseInt(res.rows[0].count) === 0) {
            const hash = await bcrypt.hash(defaultPass, 10);
            await pool.query(
                'INSERT INTO users (email, password_hash, role, first_name, last_name, profile_details) VALUES ($1, $2, $3, $4, $5, $6)',
                [email, hash, role, fName, lName, JSON.stringify(details)]
            );
            console.log(`Seeded default ${role} user: ${email}`);
        }
    };
    await checkUserExist('admin@asst.edu', 'admin', 'admin123', 'System', 'Admin', { department: 'Administration' });
    await checkUserExist('teacher@asst.edu', 'teacher', 'teacher123', 'John', 'Doe', { department: 'Computer Science', designation: 'Professor' });
    await checkUserExist('student@asst.edu', 'student', 'student123', 'Alex', 'Smith', { roll_number: 'ASST-2026-0042', grade: '12th', major: 'Software Engineering' });
    await checkUserExist('cafe@asst.edu', 'cafe_operator', 'cafe123', 'Cafe', 'Operator', { shop_name: 'ASST Main Cafeteria' });
    await checkUserExist('library@asst.edu', 'librarian', 'library123', 'Library', 'Librarian', { desk: 'Main Circulation Desk' });
}

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
    initDb
};
