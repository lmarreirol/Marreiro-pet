import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === '1'
  const slug = searchParams.get('slug')

  if (slug) {
    const post = await prisma.blogPost.findUnique({ where: { slug } })
    if (!post || (!post.published && !all)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(post)
  }

  const posts = await prisma.blogPost.findMany({
    where: all ? undefined : { published: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const body = await req.json()
  const { title, slug, tag, excerpt, content, coverColor, readTime, published } = body
  if (!title || !slug || !tag || !excerpt || !content) {
    return NextResponse.json({ error: 'Campos obrigatórios: title, slug, tag, excerpt, content' }, { status: 400 })
  }
  const post = await prisma.blogPost.create({
    data: { title, slug, tag, excerpt, content, coverColor: coverColor ?? 'orange', readTime: readTime ?? '5 min', published: published ?? false },
  })
  return NextResponse.json(post, { status: 201 })
}
