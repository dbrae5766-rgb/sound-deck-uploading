import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'

const DB_PATH = '/tmp/sounds-db.json'

async function readDB(): Promise<any[]> {
  try {
    const data = await readFile(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const sounds = await readDB()
    return NextResponse.json({ sounds: sounds.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
