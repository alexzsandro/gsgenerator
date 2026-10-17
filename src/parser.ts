import { makeId, type Slide, type SourceBlock, type WorshipDocument, worshipDocumentSchema } from './domain'

const MUSICAL_PREFIX = /^[♫♪\s]+/
const SECTION_NAMES = /^(VOTUM|HUKUM TUHAN|DOA PENGAKUAN DOSA|PENGAKUAN IMAN|WARTA JEMAAT|ILU MANETEK|BERDOA|DOA PENUTUP|PELEPASAN|KOOR|E\s*P\s*I\s*S\s*T\s*E\s*L|EPISTEL|EVANGELIUM|KHOTBAH)/i
const SONG_HEADING = /^(BERNYANYI|Bernyanyi)\b/i
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

const songLabel = (heading: string): string => {
  const match = heading.match(/\b(BN|BL)\s*(?:No\.?\s*)?(\d+(?:\s*:\s*[\d.\s-]+)?)/i)
  if (!match) return 'BERNYANYI'
  return `${match[1].toUpperCase()}. ${match[2].replace(/\s+/g, ' ').trim()}`
}

const verseLabel = (heading: string): string => {
  const match = heading.match(/:\s*([\d]+(?:\s*-\s*[\d]+)?)/)
  return match ? `AYAT ${match[1].replace(/\s+/g, ' ')}` : ''
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
  let currentSong = { label: '', verse: '' }
  let activeScripture = ''
  let activeVerse = ''

  const addBlock = (index: number, text: string, classification: SourceBlock['classification']): void => {
    sourceBlocks.push({ index, text, classification })
  }
  const addSlide = (kind: Slide['kind'], text: string, label = '', secondaryLabel = ''): void => {
    slides.push({ id: makeId(), kind, text, label, secondaryLabel })
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
    if (SONG_HEADING.test(line)) {
      currentSong = { label: songLabel(line), verse: verseLabel(line) }
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
      currentSong = { label: 'BERNYANYI', verse: '' }
    }
    if (mode === 'song' && (/^♫♪♫/.test(line) || !SPOKEN.test(line))) {
      const lyric = cleanLine(line.replace(MUSICAL_PREFIX, ''))
      if (lyric && !/^\(.*\)$/.test(lyric)) {
        addBlock(index, line, 'song')
        splitReadable(lyric, 115).forEach((fragment) => addSlide('song-line', fragment, currentSong.label, currentSong.verse))
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
