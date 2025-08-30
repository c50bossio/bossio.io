import { NextRequest, NextResponse } from 'next/server';
import { runFullReminderWorkflow, sendDailyReminders, sendUrgentReminders } from '@/lib/reminder-scheduler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'full' } = body;

    let result;

    switch (type) {
      case '24h':
        result = await sendDailyReminders();
        break;
      case '2h':
        result = await sendUrgentReminders();
        break;
      case 'full':
      default:
        result = await runFullReminderWorkflow();
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in reminder API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send reminders' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check reminder status or manually trigger
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'trigger') {
    // Manual trigger for testing
    try {
      const result = await runFullReminderWorkflow();
      return NextResponse.json({
        success: true,
        message: 'Reminders sent successfully',
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to send reminders' 
        },
        { status: 500 }
      );
    }
  }

  // Return reminder system status
  return NextResponse.json({
    success: true,
    message: 'Reminder system is active',
    endpoints: {
      POST: 'Send reminders (body: { type: "24h" | "2h" | "full" })',
      'GET?action=trigger': 'Manually trigger full reminder workflow'
    },
    timestamp: new Date().toISOString()
  });
}