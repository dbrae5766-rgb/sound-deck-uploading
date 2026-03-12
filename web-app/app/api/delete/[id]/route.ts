import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const DB_PATH = '/tmp/sounds-db.json'
const SOUNDS_DIR = '/tmp/sounds'

async function readDB(): Promise<any[]> {
  try { return JSON.parse(await readFile(DB_PATH, 'utf-8')) } catch { return [] }
}
async function writeDB(sounds: any[]) {
  await writeFile(DB_PATH, JSON.stringify(sounds, null, 2))
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await readDB()
    const sound = db.find(s => s.id === params.id)
    if (!sound) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const filepath = path.join(SOUNDS_DIR, sound.filename)
    if (existsSync(filepath)) await unlink(filepath)

    await writeDB(db.filter(s => s.id !== params.id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
