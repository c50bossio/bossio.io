// Script to create Better Auth tables properly
import { db } from './database';
import { sql } from 'drizzle-orm';

async function createTables() {
  console.log('Creating Better Auth tables...');
  
  try {
    // Drop existing conflicting tables
    await db.execute(sql`DROP TABLE IF EXISTS users, shops, services, clients, appointments, analytics CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS session, account, verification CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "user" CASCADE`);
    
    // Create user table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        name TEXT,
        email TEXT NOT NULL UNIQUE,
        email_verified BOOLEAN NOT NULL DEFAULT false,
        image TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create session table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        expires_at TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        ip_address TEXT,
        user_agent TEXT,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
      )
    `);
    
    // Create account table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        account_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        access_token TEXT,
        refresh_token TEXT,
        id_token TEXT,
        access_token_expires_at TIMESTAMP,
        refresh_token_expires_at TIMESTAMP,
        scope TEXT,
        password TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create verification table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Better Auth tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createTables();