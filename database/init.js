import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'postgres' // Connect to default postgres database first
});

const initDatabase = async () => {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME]
    );

    if (dbCheck.rows.length === 0) {
      // Create database
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`✅ Database '${process.env.DB_NAME}' created`);
    } else {
      console.log(`✅ Database '${process.env.DB_NAME}' already exists`);
    }

    await client.end();

    // Connect to the new database and create tables
    const dbClient = new Client({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    await dbClient.connect();

    // Create users table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        gender CHAR(1) NOT NULL CHECK (gender IN ('m', 'f', 'o')),
        mobile_no VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created/verified');

    // Create company_profile table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS company_profile (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        website VARCHAR(255),
        industry VARCHAR(100) NOT NULL,
        founded_date DATE,
        description TEXT,
        logo_url VARCHAR(500),
        banner_url VARCHAR(500),
        social_links TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Company profile table created/verified');

    // Create indexes
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_company_profile_owner_id ON company_profile(owner_id)
    `);
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_company_profile_industry ON company_profile(industry)
    `);
    console.log('✅ Indexes created/verified');

    await dbClient.end();
    console.log('✅ Database initialization completed successfully');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

initDatabase();