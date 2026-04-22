import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'Marreiro@2024'

const users = [
  // Admins
  { name: 'Lucas Marreiro', username: 'lucas', role: 'ADMIN' as const, unitId: null },
  { name: 'Karla Marreiro', username: 'karla', role: 'ADMIN' as const, unitId: null },
  // Caucaia
  { name: 'Juliana', username: 'juliana', role: 'RECEPTIONIST' as const, unitId: 'caucaia' },
  { name: 'Israel', username: 'israel', role: 'RECEPTIONIST' as const, unitId: 'caucaia' },
  { name: 'Eduarda', username: 'eduarda', role: 'RECEPTIONIST' as const, unitId: 'caucaia' },
  // Pecém
  { name: 'Grazie', username: 'grazie', role: 'RECEPTIONIST' as const, unitId: 'pecem' },
  { name: 'Christian', username: 'christian', role: 'RECEPTIONIST' as const, unitId: 'pecem' },
  { name: 'Vitória', username: 'vitoria', role: 'RECEPTIONIST' as const, unitId: 'pecem' },
  // Taíba
  { name: 'Erica', username: 'erica', role: 'RECEPTIONIST' as const, unitId: 'taiba' },
  { name: 'Andressa', username: 'andressa', role: 'RECEPTIONIST' as const, unitId: 'taiba' },
  // São Gonçalo
  { name: 'Carla', username: 'carla', role: 'RECEPTIONIST' as const, unitId: 'saogoncalo' },
  { name: 'Zianny', username: 'zianny', role: 'RECEPTIONIST' as const, unitId: 'saogoncalo' },
  { name: 'Wallace', username: 'wallace', role: 'RECEPTIONIST' as const, unitId: 'saogoncalo' },
]

async function main() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, password: hash },
    })
    console.log(`✓ ${u.name} (${u.username})`)
  }
  console.log('\nTodos os usuários criados com senha: ' + DEFAULT_PASSWORD)
}

main().catch(console.error).finally(() => prisma.$disconnect())
