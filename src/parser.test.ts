import { describe, expect, it } from 'vitest'
import expected from './fixtures/tata-ibadah-sample.expected.json'
import source from './fixtures/tata-ibadah-sample.txt?raw'
import { parseWorshipText, splitReadable } from './parser'

describe('parseWorshipText', () => {
  it('maps the worship markers to the expected slide model', () => {
    const document = parseWorshipText(source)
    expect(document.metadata).toMatchObject(expected.metadata)
    for (const kind of expected.requiredSlideKinds) expect(document.slides.some((slide) => slide.kind === kind)).toBe(true)
    for (const label of expected.requiredLabels) expect(document.slides.some((slide) => slide.label === label || slide.secondaryLabel === label)).toBe(true)
    expect(document.slides.some((slide) => slide.text === '-- MUSIK --')).toBe(true)
    expect(document.warnings.some((warning) => warning.includes('Catatan khusus'))).toBe(true)
  })

  it('does not generate empty slides for blank text', () => {
    expect(splitReadable('    ')).toEqual([])
    expect(splitReadable('satu dua tiga', 5)).toEqual(['satu', 'dua', 'tiga'])
  })

  it('splits long scripture content into readable fragments', () => {
    const document = parseWorshipText(`EPISTEL\n10. ${'Firman Tuhan yang baik '.repeat(20)}`)
    const scripture = document.slides.filter((slide) => slide.kind === 'scripture-line')
    expect(scripture.length).toBeGreaterThan(1)
    expect(scripture.every((slide) => slide.text.length <= 150)).toBe(true)
    expect(scripture.every((slide) => slide.secondaryLabel === 'AYAT 10')).toBe(true)
  })

  it('uses the BN header as canonical song metadata instead of a BL parenthetical note', () => {
    const document = parseWorshipText(`BERNYANYI BN No. 8 : 1 - 3 “YA ALLAH, YA ALLAH”\n(Jahowa, Jahowa) BL.197\n♫♪♫ Ya Allah, Ya Bapa`)
    const lyric = document.slides.find((slide) => slide.kind === 'song-line')
    expect(lyric).toMatchObject({
      label: 'BN No. 8 : 1 - 3',
      secondaryLabel: 'AYAT 1 - 3',
      songTitle: 'BN No. 8 : 1 - 3 “YA ALLAH, YA ALLAH”',
    })
    expect(lyric?.songTitle).not.toContain('BL.197')
  })

  it('recognizes a BN header when BERNYANYI is not at the start of the paragraph', () => {
    const document = parseWorshipText(`BN No. 187 : 2 “ALANGKAH BAIK BIMBINGAN-MU” BERNYANYI\n♫♪♫ Tak mungkin hukum dari manusia`)
    expect(document.slides.find((slide) => slide.kind === 'song-line')).toMatchObject({
      label: 'BN No. 187 : 2', songTitle: 'BN No. 187 : 2 “ALANGKAH BAIK BIMBINGAN-MU”',
    })
  })

  it('falls back to BL metadata when it is the only song reference', () => {
    const document = parseWorshipText(`BERNYANYI BL. 197 “JAHOWA”\n♫♪♫ Lirik lagu`)
    expect(document.slides.find((slide) => slide.kind === 'song-line')).toMatchObject({ label: 'BL. 197', songTitle: 'BL. 197 “JAHOWA”' })
  })
})
