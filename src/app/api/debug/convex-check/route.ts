import { NextResponse } from 'next/server'

export async function GET() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const deploymentName = process.env.CONVEX_DEPLOYMENT || 'production'

  return NextResponse.json({
    convexUrl,
    deploymentName,
    env: process.env.NODE_ENV,
  })
}
