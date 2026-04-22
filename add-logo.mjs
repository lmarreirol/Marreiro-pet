import { Jimp } from 'jimp'

// Reprocessa o original sem fundo
const hero = await Jimp.read('./public/hero.png')
const logo = await Jimp.read('./public/marreiro-logo-full.png')

const heroW = hero.bitmap.width
const heroH = hero.bitmap.height

// Redimensiona logo para 120px de largura
const logoTargetW = 120
const logoRatio = logo.bitmap.height / logo.bitmap.width
logo.resize({ w: logoTargetW, h: Math.round(logoTargetW * logoRatio) })

// Posiciona no centro inferior da boia
const x = Math.round((heroW - logo.bitmap.width) / 2)
const y = Math.round(heroH * 0.78)

hero.composite(logo, x, y)
await hero.write('./public/hero.png')
console.log('Logo inserida!')
