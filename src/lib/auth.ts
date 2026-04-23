import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { authConfig } from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
