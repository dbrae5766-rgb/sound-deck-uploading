import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const SOUNDS_DIR = '/tmp/sounds'
const DB_PATH = '/tmp/sounds-db.json'

async function ensureDir() {
  if (!existsSync(SOUNDS_DIR)) {
    await mkdir(SOUNDS_DIR, { recursive: true })
  }
}

async function readDB(): Promise<any[]> {
  try {
    const data = await readFile(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeDB(sounds: any[]) {
  await writeFile(DB_PATH, JSON.stringify(sounds, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    await ensureDir()
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = (formData.get('category') as string) || 'other'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/webm', 'audio/x-wav', 'audio/x-m4a']
    const allowedExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.webm']
    const ext = path.extname(file.name).toLowerCase()

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      return NextResponse.json({ error: 'Invalid file type. Audio files only.' }, { status: 400 })
    }

    const id = uuidv4()
    const filename = `${id}${ext}`
    const filepath = path.join(SOUNDS_DIR, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    const sound = {
      id,
      name: path.basename(file.name, ext),
      filename,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      category,
      url: `/api/audio/${filename}`
    }

    const db = await readDB()
    db.push(sound)
    await writeDB(db)

    return NextResponse.json({ sound }, { status: 201 })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
