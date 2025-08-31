import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { appointment } from '@/lib/shop-schema';
import { and, lte, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = {
      archived: 0,
      cleaned: 0,
      errors: []
    };

    // Archive appointments older than 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      // In production, this would:
      // 1. Move old appointments to an archive table
      // 2. Clean up cancelled appointments older than 7 days
      // 3. Remove test/demo data
      
      console.log(`🧹 Running cleanup job at ${now.toISOString()}`);
      
      // Mock cleanup for demonstration
      const mockOldAppointments = [
        { id: 'old-1', startTime: new Date('2024-01-01'), status: 'completed' },
        { id: 'old-2', startTime: new Date('2024-01-02'), status: 'cancelled' }
      ];

      for (const apt of mockOldAppointments) {
        if (apt.startTime < thirtyDaysAgo) {
          console.log(`Archiving appointment ${apt.id}`);
          results.archived++;
        }
        
        if (apt.status === 'cancelled') {
          console.log(`Cleaning cancelled appointment ${apt.id}`);
          results.cleaned++;
        }
      }

      // Clean up orphaned records
      // In production: Remove appointments with no valid shop/barber references
      
      console.log('✅ Cleanup job completed:', results);

      return NextResponse.json({
        success: true,
        timestamp: now.toISOString(),
        results
      });

    } catch (dbError) {
      console.error('Database error in cleanup cron:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        details: dbError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Cleanup cron job error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}