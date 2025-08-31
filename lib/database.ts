import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { config } from 'dotenv';
import * as authSchema from './better-auth-schema';
import * as shopSchema from './shop-schema';

config({ path: '.env.local' });

// Allow build-time operation without database
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL must be set in production');
}

// Initialize Neon serverless connection with fallback for build
const sql = databaseUrl ? neon(databaseUrl) : null;

// Combine schemas
const combinedSchema = { ...authSchema, ...shopSchema };

// Create Drizzle database instance with schema
export const db = sql ? drizzle(sql, { schema: combinedSchema }) : null;

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as connected`;
    return result.length > 0 && result[0].connected === 1;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Database initialization for first-time setup
export async function initializeDatabase(): Promise<void> {
  try {
    // Test connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to database');
    }

    console.log('✅ Database connection established');
    
    // Enable required extensions
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
    
    console.log('✅ Database extensions enabled');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export default db;