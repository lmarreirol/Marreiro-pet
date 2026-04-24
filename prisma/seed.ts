import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'Marreiro@2024'

const MARREIRO_UNITS = [
  { unitKey: 'caucaia',    name: 'Caucaia',       city: 'Caucaia',       address: 'Caucaia - CE' },
  { unitKey: 'pecem',      name: 'Pecém',         city: 'São Gonçalo do Amarante', address: 'Pecém - CE' },
  { unitKey: 'taiba',      name: 'Taíba',         city: 'São Gonçalo do Amarante', address: 'Taíba - CE' },
  { unitKey: 'saogoncalo', name: 'São Gonçalo',   city: 'São Gonçalo do Amarante', address: 'São Gonçalo do Amarante - CE' },
]

const MARREIRO_SERVICES = ['grooming', 'vet', 'adoption', 'blog', 'delivery']

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
  // 1. Create Marreiro Pet tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'marreiro-pet' },
    update: {},
    create: {
      slug: 'marreiro-pet',
      name: 'Marreiro Pet',
      primaryColor: '#f97316',
      plan: 'ENTERPRISE',
      active: true,
    },
  })
  console.log(`✓ Tenant: ${tenant.name} (${tenant.slug})`)

  // 2. Create tenant units
  for (const u of MARREIRO_UNITS) {
    await prisma.tenantUnit.upsert({
      where: { tenantId_unitKey: { tenantId: tenant.id, unitKey: u.unitKey } },
      update: {},
      create: { tenantId: tenant.id, ...u },
    })
    console.log(`  ✓ Unit: ${u.name}`)
  }

  // 3. Create tenant services
  for (const svc of MARREIRO_SERVICES) {
    await prisma.tenantService.upsert({
      where: { tenantId_serviceType: { tenantId: tenant.id, serviceType: svc } },
      update: {},
      create: { tenantId: tenant.id, serviceType: svc, enabled: true },
    })
  }
  console.log(`  ✓ Services: ${MARREIRO_SERVICES.join(', ')}`)

  // 4. Backfill tenantId on all existing records
  const [appts, usrs, pets, posts, profs, avail] = await Promise.all([
    prisma.appointment.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.user.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.adoptionPet.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.blogPost.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.professional.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.availability.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
  ])
  console.log(`\n  Backfilled tenantId:`)
  console.log(`    Appointments: ${appts.count}`)
  console.log(`    Users: ${usrs.count}`)
  console.log(`    AdoptionPets: ${pets.count}`)
  console.log(`    BlogPosts: ${posts.count}`)
  console.log(`    Professionals: ${profs.count}`)
  console.log(`    Availability: ${avail.count}`)

  // 5. Create/update user accounts
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { tenantId: tenant.id },
      create: { ...u, password: hash, tenantId: tenant.id },
    })
    console.log(`✓ ${u.name} (${u.username})`)
  }

  console.log('\nTodos os usuários criados com senha: ' + DEFAULT_PASSWORD)
}

main().catch(console.error).finally(() => prisma.$disconnect())
