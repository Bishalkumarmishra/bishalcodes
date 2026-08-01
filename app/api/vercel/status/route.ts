import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const vercelToken = process.env.VERCEL_BEARER_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID || process.env.NEXT_PUBLIC_VERCEL_PROJECT_ID;
    
    // Check basic runtime environment details
    const isVercelEnvironment = !!process.env.VERCEL;
    const environmentName = process.env.VERCEL_ENV || 'local';
    const region = process.env.VERCEL_REGION || 'local-dev';
    const gitCommitSha = process.env.VERCEL_GIT_COMMIT_SHA || 'dev-head';

    if (!vercelToken) {
      return NextResponse.json({
        success: true,
        connected: false,
        environment: {
          isVercel: isVercelEnvironment,
          env: environmentName,
          region,
          gitCommitSha: gitCommitSha.substring(0, 7),
        },
        message: 'Set VERCEL_BEARER_TOKEN environment variable to enable live Vercel API metrics & deployment status.'
      });
    }

    // Call live Vercel REST API for deployment info
    const res = await fetch(`https://api.vercel.com/v6/deployments?limit=5${projectId ? `&projectId=${projectId}` : ''}`, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({
        success: false,
        connected: false,
        environment: {
          isVercel: isVercelEnvironment,
          env: environmentName,
          region,
          gitCommitSha: gitCommitSha.substring(0, 7),
        },
        message: err.error?.message || 'Failed to query Vercel API'
      });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      connected: true,
      environment: {
        isVercel: isVercelEnvironment,
        env: environmentName,
        region,
        gitCommitSha: gitCommitSha.substring(0, 7),
      },
      deployments: (data.deployments || []).map((d: any) => ({
        uid: d.uid,
        name: d.name,
        url: d.url,
        state: d.state,
        created: d.created,
        creator: d.creator?.username || d.creator?.email,
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Status query failed'
    }, { status: 500 });
  }
}
