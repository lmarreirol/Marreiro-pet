import { test } from '@playwright/test'

const BASE = 'http://localhost:3000'
const TEST_EMAIL = 'TESTUSER8018147770162312166@testuser.com'
const TEST_PASSWORD = 'g8EDRU2v7G'

test('fluxo completo de agendamento + pagamento MP', async ({ page }) => {
  page.setDefaultTimeout(20000)

  await page.goto(BASE)
  await page.waitForTimeout(1000)

  // Escopo no formulário de grooming
  const form = page.locator('.grooming-form')

  // 1. Porte Pequeno
  await form.locator('button.size-card', { hasText: 'Pequeno' }).click()

  // 2. Pacote Banho Tradicional
  await form.locator('button.pkg-card', { hasText: 'Banho Tradicional' }).click()
  await page.screenshot({ path: 'tests/01-pacote.png' })

  // 3. Continuar → Extras
  await form.locator('button.btn-gr-next', { hasText: 'Continuar' }).click()
  await page.waitForTimeout(400)

  // 4. Pula extras → Unidade & Profissional
  await form.locator('button.btn-gr-next', { hasText: 'Continuar' }).click()
  await page.waitForTimeout(400)

  // 5. Seleciona unidade Caucaia (dentro do form)
  await form.locator('button.tile', { hasText: 'Caucaia' }).first().click()

  // 6. Seleciona profissional Victor
  await form.locator('button.pro-card', { hasText: 'Victor' }).click()
  await page.screenshot({ path: 'tests/02-unidade-pro.png' })

  // 7. Continuar → Data & Hora
  await form.locator('button.btn-gr-next', { hasText: 'Continuar' }).click()
  await page.waitForTimeout(400)

  // 8. Segunda data disponível (amanhã — evita bloqueio de horários passados de hoje)
  await form.locator('button.date-cell:not([disabled])').nth(1).click()
  await page.waitForTimeout(1500)

  // 9. Primeiro horário disponível
  await form.locator('button.time-slot:not([disabled])').first().click()
  await page.screenshot({ path: 'tests/03-data-hora.png' })

  // 10. Continuar → Dados
  await form.locator('button.btn-gr-next', { hasText: 'Continuar' }).click()
  await page.waitForTimeout(400)

  // 11. Preenche dados via placeholder exato
  await form.locator('input[placeholder="Ex: Mel"]').fill('Rex')
  await form.locator('input[placeholder="Ex: Ana Silva"]').fill('Lucas Marreiro')
  await form.locator('input[placeholder="(85) 9 9999-9999"]').fill('85999999999')
  await form.locator('input[placeholder="000.000.000-00"]').fill('12345678909')
  await page.screenshot({ path: 'tests/04-dados.png' })

  // 12. Pagar
  await form.locator('button.btn-gr-next', { hasText: 'Pagar' }).click()
  console.log('✅ Clicou em Pagar')

  // 13. Aguarda MP
  await page.waitForURL(/mercadopago\.com/, { timeout: 20000 })
  console.log('✅ Redirecionou para MP:', page.url().slice(0, 80))
  await page.waitForTimeout(5000)

  // Aceita cookies se aparecer
  await page.locator('button', { hasText: 'Aceitar cookies' }).click({ timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'tests/05-mp-loaded.png', fullPage: true })
  console.log('📄 URL MP:', page.url().slice(0, 80))

  // 14. Clica em Cartão de crédito (sem conta MP)
  await page.getByRole('button', { name: 'Cartão Crédito ou pré-pago' }).click()
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'tests/06-mp-cartao.png', fullPage: true })
  console.log('📄 URL cartão:', page.url().slice(0, 80))

  // 15. Encontra o iframe com o formulário e preenche os campos
  await page.waitForTimeout(2000)
  let cardFrame = page.mainFrame()
  for (const f of page.frames()) {
    const hasCard = await f.locator('input[placeholder="0000 0000 0000 0000"]').count()
    if (hasCard > 0) { cardFrame = f; break }
  }
  console.log('🖼 Frame do cartão:', cardFrame.url().slice(0, 60))

  const typeIn = async (placeholder: string, value: string) => {
    const input = cardFrame.locator(`input[placeholder="${placeholder}"]`)
    await input.click({ force: true })
    await input.pressSequentially(value, { delay: 80 })
  }

  await typeIn('0000 0000 0000 0000', '5031433215406351')
  await typeIn('Ex.: Maria Lopes', 'APRO')
  await typeIn('MM/AA', '1125')
  await typeIn('000', '123')
  await typeIn('999.999.999-99', '12345678909')
  await page.screenshot({ path: 'tests/07-mp-cartao-preenchido.png', fullPage: true })

  // 16. Clica em Continuar/Pagar
  await page.getByRole('button', { name: /continuar|pagar/i }).last().click()
  console.log('✅ Clicou em Continuar')
  await page.waitForTimeout(8000)
  await page.screenshot({ path: 'tests/08-mp-resultado.png', fullPage: true })
  console.log('📄 URL final:', page.url().slice(0, 100))
  console.log('✅ Teste concluído!')
})
