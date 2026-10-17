import { makeId, type Slide, type SourceBlock, type WorshipDocument, worshipDocumentSchema } from './domain'

const MUSICAL_PREFIX = /^[♫♪\s]+/
const SECTION_NAMES = /^(VOTUM|HUKUM TUHAN|DOA PENGAKUAN DOSA|PENGAKUAN IMAN|WARTA JEMAAT|ILU MANETEK|BERDOA|DOA PENUTUP|PELEPASAN|KOOR|E\s*P\s*I\s*S\s*T\s*E\s*L|EPISTEL|EVANGELIUM|KHOTBAH)/i
const SONG_MARKER = /\bBERNYANYI\b/i
const SONG_REFERENCE = /\b(BN|BL)\.?\s*(?:No\.?\s*)?(\d+(?:\s*:\s*\d+(?:\s*(?:-|,)\s*\d+)*)?)/i
const VERSE_START = /^(\d{1,3})\s*[.:]\s*(.+)$/
const SPOKEN = /^(L|J|S)\s*:/i

const cleanLine = (line: string): string => line.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()

const splitReadable = (text: string, maximum = 150): string[] => {
  const words = cleanLine(text).split(' ').filter(Boolean)
  if (words.length === 0) return []
  const chunks: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maximum && current) {
      chunks.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) chunks.push(current)
  return chunks
}

type SongMetadata = { label: string; title: string; verse: string; reference: 'BN' | 'BL' | '' }

const emptySongMetadata = (): SongMetadata => ({ label: 'BERNYANYI', title: '', verse: '', reference: '' })

const extractSongMetadata = (line: string): SongMetadata | null => {
  const match = line.match(SONG_REFERENCE)
  if (!match) return SONG_MARKER.test(line) ? emptySongMetadata() : null
  const reference = match[1].toUpperCase() as 'BN' | 'BL'
  const numberAndVerses = match[2].replace(/\s+/g, ' ').trim()
  const label = `${reference}${reference === 'BN' ? ' No.' : '.'} ${numberAndVerses}`
  const verse = numberAndVerses.match(/:\s*(\d+(?:\s*(?:-|,)\s*\d+)*)/)
  const title = cleanLine(line.replace(SONG_MARKER, '').trim())
  return { label, title, verse: verse ? `AYAT ${verse[1].replace(/\s+/g, ' ')}` : '', reference }
}

const isAllCapsHeading = (line: string): boolean => {
  const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, '')
  return letters.length >= 5 && letters === letters.toUpperCase() && line.length < 90
}

const headingText = (line: string): string => cleanLine(line).replace(/:$/, '')

export function parseWorshipText(rawText: string): WorshipDocument {
  const lines = rawText.split(/\r?\n/).map(cleanLine).filter(Boolean)
  const slides: Slide[] = []
  const sourceBlocks: SourceBlock[] = []
  const warnings: string[] = []
  const metadata = { title: 'Tata Ibadah', church: '', date: '', topic: '' }
  let mode: 'normal' | 'song' | 'scripture' = 'normal'
  let currentSong = emptySongMetadata()
  let activeScripture = ''
  let activeVerse = ''

  const addBlock = (index: number, text: string, classification: SourceBlock['classification']): void => {
    sourceBlocks.push({ index, text, classification })
  }
  const addSlide = (kind: Slide['kind'], text: string, label = '', secondaryLabel = '', songTitle?: string): void => {
    slides.push({ id: makeId(), kind, text, label, secondaryLabel, songTitle })
  }
  const addScripture = (text: string, verse: string): void => {
    splitReadable(text).forEach((fragment) => addSlide('scripture-line', fragment, activeScripture, verse ? `AYAT ${verse}` : ''))
  }

  lines.forEach((line, index) => {
    if (index < 12) {
      if (/^TATA IBADAH$/i.test(line)) metadata.title = line
      if (/^TOPIK\s*:/i.test(line)) metadata.topic = cleanLine(line.replace(/^TOPIK\s*:/i, ''))
      if (/^HKBP\b/i.test(line)) metadata.church = line
      if (/\bMinggu,\s+\d{1,2}\s+\w+\s+\d{4}\b/i.test(line)) metadata.date = line
    }

    if (/^---\s*Musik\s*---$/i.test(line)) {
      addBlock(index, line, 'cue')
      addSlide('cue', '-- MUSIK --')
      mode = 'normal'
      return
    }
    if (/^---\s*Jemaat\s+/i.test(line)) {
      addBlock(index, line, 'cue')
      addSlide('cue', line.replace(/---/g, '').trim())
      return
    }
    const songCandidate = extractSongMetadata(line)
    const startsSong = songCandidate?.reference === 'BN' || SONG_MARKER.test(line) || (songCandidate?.reference === 'BL' && mode !== 'song')
    if (startsSong) {
      // BN is the canonical source whenever both BN and BL information exist in one song block.
      if (songCandidate?.reference === 'BN' || currentSong.reference !== 'BN') currentSong = songCandidate ?? emptySongMetadata()
      mode = 'song'
      addBlock(index, line, 'song')
      return
    }
    if (SECTION_NAMES.test(line) || isAllCapsHeading(line)) {
      const title = headingText(line)
      addBlock(index, line, 'section')
      addSlide('section', title)
      mode = /^(E\s*P\s*I\s*S\s*T\s*E\s*L|EPISTEL|EVANGELIUM)/i.test(title) ? 'scripture' : 'normal'
      activeScripture = mode === 'scripture' ? title : ''
      activeVerse = ''
      return
    }
    if (/^♫♪♫/.test(line) && mode !== 'song') {
      mode = 'song'
      currentSong = emptySongMetadata()
    }
    if (mode === 'song' && (/^♫♪♫/.test(line) || !SPOKEN.test(line))) {
      const lyric = cleanLine(line.replace(MUSICAL_PREFIX, ''))
      if (lyric && !/^\(.*\)$/.test(lyric)) {
        addBlock(index, line, 'song')
        splitReadable(lyric, 115).forEach((fragment) => addSlide('song-line', fragment, currentSong.label, currentSong.verse, currentSong.title || undefined))
      }
      return
    }
    const verse = line.match(VERSE_START)
    if (mode === 'scripture' && verse) {
      activeVerse = verse[1]
      addBlock(index, line, 'scripture')
      addScripture(verse[2], activeVerse)
      return
    }
    if (mode === 'scripture' && activeVerse && !SPOKEN.test(line)) {
      addBlock(index, line, 'scripture')
      addScripture(line, activeVerse)
      return
    }
    if (SPOKEN.test(line)) {
      addBlock(index, line, 'spoken')
      return
    }
    if (/^(\(|Pukul\s*:|Minggu,|TATA IBADAH|TOPIK\s*:|HKBP\b)/i.test(line)) {
      addBlock(index, line, 'section')
      return
    }
    addBlock(index, line, 'unknown')
    if (warnings.length < 8) warnings.push(`Baris “${line.slice(0, 70)}${line.length > 70 ? '…' : ''}” belum dikenali dan perlu ditinjau.`)
  })

  if (slides.length === 0) warnings.unshift('Tidak ada slide yang berhasil dibuat. Periksa format DOCX atau tambahkan slide manual.')
  return worshipDocumentSchema.parse({ metadata, sourceBlocks, slides, warnings })
}

export { splitReadable }
