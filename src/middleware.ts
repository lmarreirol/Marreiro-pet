import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoginPage = req.nextUrl.pathname === '/admin/login'
  if (!isLoginPage && !req.auth) {
    return Response.redirect(new URL('/admin/login', req.url))
  }
})

export const config = { matcher: ['/admin/:path*'] }
