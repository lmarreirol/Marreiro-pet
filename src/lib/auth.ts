import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.unitId = (user as any).unitId
        token.username = (user as any).username
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).unitId = token.unitId
        ;(session.user as any).username = token.username
      }
      return session
    },
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Usuário', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { username: String(credentials.username) },
        })
        if (!user) return null
        const ok = await bcrypt.compare(String(credentials.password), user.password)
        if (!ok) return null
        return { id: user.id, name: user.name, username: user.username, role: user.role, unitId: user.unitId }
      },
    }),
  ],
})
