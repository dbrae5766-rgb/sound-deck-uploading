'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './page.module.css'

interface Sound {
  id: string
  name: string
  filename: string
  size: number
  duration?: number
  uploadedAt: string
  category: string
  url: string
}

export default function Home() {
  const [sounds, setSounds] = useState<Sound[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = ['all', 'voice', 'sfx', 'music', 'ambient', 'meme', 'other']

  useEffect(() => { loadSounds() }, [])

  async function loadSounds() {
    try {
      const res = await fetch('/api/sounds')
      const data = await res.json()
      setSounds(data.sounds || [])
    } catch {
      notify('Failed to load sounds', 'error')
    }
  }

  function notify(msg: string, type: 'success' | 'error') {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3500)
  }

  async function handleUpload(files: FileList | File[]) {
    const fileArray = Array.from(files)
    const audioFiles = fileArray.filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|aac|m4a|webm)$/i.test(f.name))
    if (!audioFiles.length) { notify('Please upload audio files only', 'error'); return }

    setUploading(true)
    setUploadProgress(0)

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'other')

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        setUploadProgress(Math.round(((i + 1) / audioFiles.length) * 100))
      } catch (err: any) {
        notify(err.message, 'error')
      }
    }

    await loadSounds()
    setUploading(false)
    setUploadProgress(0)
    notify(`Uploaded ${audioFiles.length} sound${audioFiles.length > 1 ? 's' : ''}!`, 'success')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    handleUpload(e.dataTransfer.files)
  }

  function playSound(sound: Sound) {
    if (playingId === sound.id) {
      audioRefs.current[sound.id]?.pause()
      audioRefs.current[sound.id]!.currentTime = 0
      setPlayingId(null)
      return
    }
    if (playingId && audioRefs.current[playingId]) {
      audioRefs.current[playingId].pause()
      audioRefs.current[playingId]!.currentTime = 0
    }
    if (!audioRefs.current[sound.id]) {
      audioRefs.current[sound.id] = new Audio(sound.url)
      audioRefs.current[sound.id].onended = () => setPlayingId(null)
    }
    audioRefs.current[sound.id].play()
    setPlayingId(sound.id)
  }

  async function deleteSound(id: string) {
    if (!confirm('Delete this sound?')) return
    try {
      const res = await fetch(`/api/delete/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setSounds(s => s.filter(x => x.id !== id))
      notify('Sound deleted', 'success')
    } catch {
      notify('Failed to delete sound', 'error')
    }
  }

  async function renameSound(id: string) {
    if (!editName.trim()) return
    try {
      const res = await fetch(`/api/sounds/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      })
      if (!res.ok) throw new Error('Rename failed')
      setSounds(s => s.map(x => x.id === id ? { ...x, name: editName.trim() } : x))
      setEditingId(null)
      notify('Renamed!', 'success')
    } catch {
      notify('Rename failed', 'error')
    }
  }

  const filtered = sounds.filter(s => {
    const matchCat = filter === 'all' || s.category === filter
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>◈</span>
            <span className={styles.logoText}>SOUND<span className={styles.logoAccent}>DECK</span></span>
          </div>
          <nav className={styles.nav}>
            <span className={styles.navBadge}>BETA</span>
            <button className={styles.navLink} onClick={() => setShowApiKey(v => !v)}>
              API KEY
            </button>
            <a
              href="https://github.com"
              className={styles.navLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              DOCS
            </a>
          </nav>
        </div>
        {showApiKey && (
          <div className={styles.apiKeyBar}>
            <span className={styles.apiKeyLabel}>Desktop App API Key:</span>
            <input
              className={styles.apiKeyInput}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter or generate an API key for the desktop app..."
            />
            <button className={styles.btnSmall} onClick={() => {
              const key = 'sk-' + Math.random().toString(36).substr(2, 32)
              setApiKey(key)
            }}>GENERATE</button>
            <button className={styles.btnSmall} onClick={() => { navigator.clipboard.writeText(apiKey); notify('Copied!', 'success') }}>COPY</button>
          </div>
        )}
      </header>

      <main className={styles.main}>
        {/* Hero section */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            YOUR PERSONAL<br />
            <span className={styles.heroAccent}>SOUND STUDIO</span>
          </h1>
          <p className={styles.heroSub}>
            Upload sounds to the cloud. Play them from your desktop app. Apply real-time voice effects.
          </p>
        </section>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{sounds.length}</span>
            <span className={styles.statLabel}>SOUNDS</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{categories.length - 1}</span>
            <span className={styles.statLabel}>CATEGORIES</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{formatSize(sounds.reduce((acc, s) => acc + s.size, 0))}</span>
            <span className={styles.statLabel}>TOTAL SIZE</span>
          </div>
        </div>

        {/* Upload zone */}
        <section
          className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''} ${uploading ? styles.dropZoneUploading : ''}`}
          onDragOver={e => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a"
            multiple
            className={styles.hiddenInput}
            onChange={e => e.target.files && handleUpload(e.target.files)}
          />
          {uploading ? (
            <div className={styles.uploadingState}>
              <div className={styles.uploadSpinner} />
              <span className={styles.uploadingText}>UPLOADING... {uploadProgress}%</span>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <div className={styles.dropIcon}>⊕</div>
              <p className={styles.dropTitle}>{dragActive ? 'DROP IT!' : 'DRAG & DROP SOUNDS'}</p>
              <p className={styles.dropSub}>or click to browse — MP3, WAV, OGG, FLAC, AAC, M4A</p>
            </>
          )}
        </section>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              placeholder="Search sounds..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterTabs}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`${styles.filterTab} ${filter === cat ? styles.filterTabActive : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Sound grid */}
        <section className={styles.soundGrid}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>◎</div>
              <p className={styles.emptyTitle}>NO SOUNDS YET</p>
              <p className={styles.emptySub}>Upload your first sound file above to get started</p>
            </div>
          ) : (
            filtered.map(sound => (
              <div key={sound.id} className={`${styles.soundCard} ${playingId === sound.id ? styles.soundCardPlaying : ''}`}>
                <div className={styles.soundWave}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${styles.waveBar} ${playingId === sound.id ? styles.waveBarActive : ''}`}
                      style={{ animationDelay: `${i * 0.05}s`, height: `${20 + Math.random() * 60}%` }}
                    />
                  ))}
                </div>

                <div className={styles.soundInfo}>
                  {editingId === sound.id ? (
                    <div className={styles.renameRow}>
                      <input
                        className={styles.renameInput}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') renameSound(sound.id); if (e.key === 'Escape') setEditingId(null) }}
                        autoFocus
                      />
                      <button className={styles.btnTiny} onClick={() => renameSound(sound.id)}>✓</button>
                      <button className={styles.btnTiny} onClick={() => setEditingId(null)}>✕</button>
                    </div>
                  ) : (
                    <h3 className={styles.soundName} onDoubleClick={() => { setEditingId(sound.id); setEditName(sound.name) }}>
                      {sound.name}
                    </h3>
                  )}
                  <div className={styles.soundMeta}>
                    <span className={styles.soundCat}>{sound.category}</span>
                    <span className={styles.soundSize}>{formatSize(sound.size)}</span>
                    <span className={styles.soundDate}>{formatDate(sound.uploadedAt)}</span>
                  </div>
                </div>

                <div className={styles.soundActions}>
                  <button
                    className={`${styles.playBtn} ${playingId === sound.id ? styles.playBtnActive : ''}`}
                    onClick={() => playSound(sound)}
                    title={playingId === sound.id ? 'Stop' : 'Play'}
                  >
                    {playingId === sound.id ? '■' : '▶'}
                  </button>
                  <a href={sound.url} download={sound.name} className={styles.iconBtn} title="Download">↓</a>
                  <button
                    className={styles.iconBtn}
                    title="Rename"
                    onClick={() => { setEditingId(sound.id); setEditName(sound.name) }}
                  >✎</button>
                  <button
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    onClick={() => deleteSound(sound.id)}
                    title="Delete"
                  >✕</button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>SoundDeck — Upload sounds here, play them in the <strong>SoundDeck Desktop App</strong> on Windows</p>
        <p className={styles.footerSub}>Built with Next.js · Deploy on Vercel</p>
      </footer>

      {/* Notification toast */}
      {notification && (
        <div className={`${styles.toast} ${notification.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {notification.type === 'success' ? '✓' : '✕'} {notification.msg}
        </div>
      )}
    </div>
  )
}
