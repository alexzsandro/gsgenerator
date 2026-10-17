import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import type { WorshipDocument } from './domain'
import { generatePptxArrayBuffer } from './pptx'

const document: WorshipDocument = {
  metadata: { title: 'Tata Ibadah', church: '', date: '18-10-2026', topic: '' },
  sourceBlocks: [],
  warnings: [],
  slides: [
    { id: 'one', kind: 'song-line', text: 'Ya Allah, Ya Bapa', label: 'BN. 8 : 1-3', secondaryLabel: 'AYAT 1' },
    { id: 'two', kind: 'cue', text: '-- MUSIK --', label: '', secondaryLabel: '' },
  ],
}

describe('PPTX renderer', () => {
  it('creates a wide green-screen presentation with expected text', async () => {
    const output = await generatePptxArrayBuffer(document)
    const zip = await JSZip.loadAsync(output)
    const presentation = await zip.file('ppt/presentation.xml')?.async('string')
    const firstSlide = await zip.file('ppt/slides/slide1.xml')?.async('string')
    expect(presentation).toContain('cx="12191695" cy="6858000"')
    expect(firstSlide).toContain('00FF00')
    expect(firstSlide).toContain('Ya Allah, Ya Bapa')
    expect(firstSlide).toContain('BN. 8 : 1-3')
  })
})
