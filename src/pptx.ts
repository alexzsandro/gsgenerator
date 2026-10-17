import PptxGenJS from 'pptxgenjs'
import type { Slide, WorshipDocument } from './domain'

const GREEN = '00FF00'
const WHITE = 'FFFFFF'
const BLACK = '000000'
const WIDE_WIDTH = 13.333
const WIDE_HEIGHT = 7.5

const outline = { color: BLACK, size: 1.5 }

function addMainText(slide: PptxGenJS.Slide, item: Slide): void {
  const isSection = item.kind === 'section' || item.kind === 'cue'
  const isImage = item.kind === 'image'
  if (isImage && item.imageData) {
    slide.addImage({ data: item.imageData, x: 0.5, y: 0.45, w: 12.33, h: 6.45, sizing: { type: 'contain', x: 0.5, y: 0.45, w: 12.33, h: 6.45 } })
    return
  }
  slide.addText(item.text || 'TEKS BELUM DIISI', {
    x: 0.55,
    y: isSection ? 2.65 : 5.35,
    w: 12.23,
    h: isSection ? 1.45 : 1.35,
    fontFace: isSection ? 'Arial Black' : 'Arial Black',
    fontSize: isSection ? 35 : 31,
    bold: true,
    color: WHITE,
    margin: 0.04,
    align: 'center',
    valign: 'middle',
    breakLine: false,
    fit: 'shrink',
    outline,
    shadow: { type: 'outer', color: BLACK, opacity: 0.7, blur: 2, angle: 45, offset: 1 },
  })
}

function addLabels(slide: PptxGenJS.Slide, item: Slide): void {
  if (item.kind === 'section' || item.kind === 'cue' || item.kind === 'image') return
  const common = {
    fontFace: 'Franklin Gothic Heavy', fontSize: 19, bold: true, italic: true, color: WHITE,
    margin: 0.02, valign: 'middle' as const, fit: 'shrink' as const, outline,
  }
  if (item.label) slide.addText(item.label, { ...common, x: 0.42, y: 6.55, w: 4.6, h: 0.38, align: 'center' })
  if (item.secondaryLabel) slide.addText(item.secondaryLabel, { ...common, x: 10.85, y: 6.55, w: 2.05, h: 0.38, align: 'center' })
}

export function buildPresentation(document: Pick<WorshipDocument, 'slides'>): PptxGenJS {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'Green Screen PPT Generator'
  pptx.subject = 'Tata Ibadah Green Screen'
  pptx.title = 'Tata Ibadah'
  pptx.company = 'HKBP'
  pptx.defineLayout({ name: 'CUSTOM_WIDE', width: WIDE_WIDTH, height: WIDE_HEIGHT })
  pptx.layout = 'CUSTOM_WIDE'
  for (const item of document.slides) {
    const slide = pptx.addSlide()
    slide.background = { color: GREEN }
    addMainText(slide, item)
    addLabels(slide, item)
  }
  return pptx
}

export async function generatePptxArrayBuffer(document: Pick<WorshipDocument, 'slides'>): Promise<ArrayBuffer> {
  const pptx = buildPresentation(document)
  return pptx.write({ outputType: 'arraybuffer' }) as Promise<ArrayBuffer>
}

export async function downloadPptx(document: WorshipDocument): Promise<void> {
  const pptx = buildPresentation(document)
  const safeDate = document.metadata.date.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'tata-ibadah'
  await pptx.writeFile({ fileName: `PPT-Green-Screen-${safeDate}.pptx` })
}
