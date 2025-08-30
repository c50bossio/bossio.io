import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { shop, staff } from '@/lib/shop-schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }
    
    // Get all shops
    const shops = await db.execute(sql`SELECT * FROM shop`);
    
    // Get current user info
    const userInfo = await db.execute(sql`SELECT id, email, name FROM "user" WHERE id = ${session.user.id}`);
    
    return NextResponse.json({
      currentUser: userInfo.rows[0],
      shops: shops.rows,
      shopCount: shops.rows.length,
      message: shops.rows.length > 0 ? 'Shop found!' : 'No shops created yet'
    });
  } catch (error) {
    console.error('Error checking shops:', error);
    return NextResponse.json(
      { error: 'Failed to check shops', details: String(error) },
      { status: 500 }
    );
  }
}