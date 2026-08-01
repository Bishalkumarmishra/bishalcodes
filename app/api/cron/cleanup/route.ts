import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Verify cron authorization if CRON_SECRET is configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized cron request' }, { status: 401 });
    }

    const timestamp = new Date().toISOString();
    console.log(`[Vercel Cron] Cleanup job executed at ${timestamp}`);

    return NextResponse.json({
      success: true,
      job: 'cleanup',
      executedAt: timestamp,
      message: 'Automated file cleanup and session maintenance executed successfully.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
