import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
  '/articles(.*)',
  '/api/webhook(.*)',
  '/api/webhooks(.*)',
  '/api/public(.*)',
])

// TEMPORARY: Allow all routes on localhost for development
const isLocalhost = (request: Request) => {
  const url = new URL(request.url)
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
}

export default clerkMiddleware(async (auth, request) => {
  // Skip auth on localhost for development
  if (isLocalhost(request)) {
    return
  }
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
