import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'

const DB_PATH = '/tmp/sounds-db.json'

async function readDB(): Promise<any[]> {
  try { return JSON.parse(await readFile(DB_PATH, 'utf-8')) } catch { return [] }
}
async function writeDB(sounds: any[]) {
  await writeFile(DB_PATH, JSON.stringify(sounds, null, 2))
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const db = await readDB()
    const idx = db.findIndex(s => s.id === params.id)
    if (idx === -1) return NextResponse.json({ error: 'Sound not found' }, { status: 404 })
    if (body.name) db[idx].name = body.name
    if (body.category) db[idx].category = body.category
    await writeDB(db)
    return NextResponse.json({ sound: db[idx] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
