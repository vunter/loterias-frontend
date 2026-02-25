import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8081'
const MAX_BODY_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_PATH_PREFIXES = [
  'concursos', 'dashboard', 'estatisticas', 'apostas',
  'analise', 'export', 'especiais', 'time-coracao',
  'financeiro', 'ordem-sorteio', 'admin'
]

function isAllowedPath(pathSegments: string[]): boolean {
  if (pathSegments.length === 0) return false
  if (pathSegments.some(s => s.includes('..') || s.includes('\0') || s.includes('\\'))) return false
  const first = pathSegments[0].toLowerCase()
  return ALLOWED_PATH_PREFIXES.includes(first)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  if (!isAllowedPath(path)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const targetPath = `/api/${path.join('/')}`
  const url = new URL(request.url)
  const queryString = url.search

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(`${BACKEND_URL}${targetPath}${queryString}`, { signal: controller.signal })

    const contentType = response.headers.get('content-type') || ''
    
    // Handle CSV downloads - pass through as binary to preserve UTF-8
    if (contentType.includes('text/csv')) {
      const buffer = await response.arrayBuffer()
      const contentDisposition = response.headers.get('content-disposition')
      
      return new NextResponse(buffer, {
        status: response.status,
        headers: {
          'Content-Type': 'text/csv; charset=UTF-8',
          ...(contentDisposition && { 'Content-Disposition': contentDisposition }),
        },
      })
    }

    // Handle JSON responses — read body once as text, then parse
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: response.status })
    } catch {
      return new NextResponse(text, { status: response.status })
    }
  } catch (error) {
    logger.error({ err: error }, 'Backend proxy error')
    return NextResponse.json(
      { error: 'Backend unavailable' },
      { status: 503 }
    )
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  if (!isAllowedPath(path)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const targetPath = `/api/${path.join('/')}`
  const url = new URL(request.url)
  const queryString = url.search

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10)
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
    }

    const body = request.headers.get('content-type')?.includes('application/json')
      ? await request.json().catch(() => undefined)
      : undefined

    const response = await fetch(`${BACKEND_URL}${targetPath}${queryString}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(body && { 'Content-Type': 'application/json' }),
      },
      ...(body && { body: JSON.stringify(body) }),
      signal: controller.signal,
    })

    const contentType = response.headers.get('content-type') || ''
    const respText = await response.text()
    if (contentType.includes('application/json') || respText.startsWith('{') || respText.startsWith('[')) {
      try {
        const data = JSON.parse(respText)
        return NextResponse.json(data, { status: response.status })
      } catch {
        return new NextResponse(respText, { status: response.status })
      }
    }
    return new NextResponse(respText, { status: response.status })
  } catch (error) {
    logger.error({ err: error }, 'Backend proxy error')
    return NextResponse.json(
      { error: 'Backend unavailable' },
      { status: 503 }
    )
  } finally {
    clearTimeout(timeout)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  if (!isAllowedPath(path)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const targetPath = `/api/${path.join('/')}`
  const url = new URL(request.url)
  const queryString = url.search

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(`${BACKEND_URL}${targetPath}${queryString}`, {
      method: 'DELETE',
      signal: controller.signal,
    })
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: response.status })
    } catch {
      return new NextResponse(text, { status: response.status })
    }
  } catch (error) {
    logger.error({ err: error }, 'Backend proxy error')
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 })
  } finally {
    clearTimeout(timeout)
  }
}
