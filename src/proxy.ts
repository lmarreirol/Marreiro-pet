import { NextRequest, NextResponse } from 'next/server'

export default function proxy(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname === '/admin/login'
  if (isLoginPage) return NextResponse.next()

  const sessionCookie =
    req.cookies.get('__Secure-authjs.session-token') ??
    req.cookies.get('authjs.session-token')

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
