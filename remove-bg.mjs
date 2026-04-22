import { Jimp } from 'jimp'

const img = await Jimp.read('./public/hero.png')
const width = img.bitmap.width
const height = img.bitmap.height
const data = img.bitmap.data
const visited = new Uint8Array(width * height)

function isNearWhite(idx) {
  return data[idx] > 200 && data[idx+1] > 200 && data[idx+2] > 200
}

function floodFill(startX, startY) {
  const stack = [[startX, startY]]
  while (stack.length) {
    const [x, y] = stack.pop()
    if (x < 0 || x >= width || y < 0 || y >= height) continue
    const pos = y * width + x
    if (visited[pos]) continue
    visited[pos] = 1
    const idx = pos * 4
    if (!isNearWhite(idx)) continue
    data[idx + 3] = 0
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1])
  }
}

// Flood fill dos 4 cantos
floodFill(0, 0)
floodFill(width-1, 0)
floodFill(0, height-1)
floodFill(width-1, height-1)

await img.write('./public/hero.png')
console.log('Fundo removido com flood fill!')
