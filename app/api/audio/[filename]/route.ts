import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const SOUNDS_DIR = '/tmp/sounds'

const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.m4a': 'audio/mp4',
  '.webm': 'audio/webm',
}

export async function GET(_: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const filename = params.filename
    // Basic path traversal prevention
    const safe = path.basename(filename)
    const filepath = path.join(SOUNDS_DIR, safe)

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const ext = path.extname(safe).toLowerCase()
    const mimeType = MIME_TYPES[ext] || 'audio/mpeg'
    const buffer = await readFile(filepath)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Accept-Ranges': 'bytes',
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
