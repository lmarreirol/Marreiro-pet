const { chromium } = require('@playwright/test')

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setViewportSize({ width: 390, height: 844 }) // iPhone 14
  await page.goto('http://localhost:3000')
  await page.waitForLoadState('networkidle')

  // Verifica elementos fora da tela (overflow horizontal)
  const issues = await page.evaluate(() => {
    const results = []
    const bodyWidth = document.body.offsetWidth
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect()
      if (rect.right > bodyWidth + 5 && rect.width > 0 && rect.height > 0) {
        results.push({
          tag: el.tagName,
          class: el.className?.toString?.().slice(0, 60),
          text: el.textContent?.trim().slice(0, 50),
          right: Math.round(rect.right),
          bodyWidth,
          overflow: Math.round(rect.right - bodyWidth)
        })
      }
    })
    return results
  })

  console.log('\n=== ELEMENTOS FORA DA TELA (mobile 390px) ===\n')
  if (issues.length === 0) {
    console.log('Nenhum elemento fora da tela!')
  } else {
    const seen = new Set()
    issues.forEach(i => {
      const key = i.class + i.text
      if (!seen.has(key)) {
        seen.add(key)
        console.log(`TAG: ${i.tag} | overflow: +${i.overflow}px`)
        console.log(`  class: ${i.class}`)
        console.log(`  texto: ${i.text}`)
        console.log()
      }
    })
  }

  await browser.close()
}

main().catch(console.error)
