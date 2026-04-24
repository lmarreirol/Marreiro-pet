import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role
        token.unitId = (user as Record<string, unknown>).unitId
        token.username = (user as Record<string, unknown>).username
        token.tenantId = (user as Record<string, unknown>).tenantId
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).role = token.role
        ;(session.user as unknown as Record<string, unknown>).unitId = token.unitId
        ;(session.user as unknown as Record<string, unknown>).username = token.username
        ;(session.user as unknown as Record<string, unknown>).tenantId = token.tenantId
      }
      return session
    },
    authorized({ auth }) {
      return !!auth
    },
  },
  providers: [],
}
