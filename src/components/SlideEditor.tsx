import type { ChangeEvent } from 'react'
import { slideKinds, type Slide, type SlideKind } from '../domain'
import { SlidePreview } from './SlidePreview'

type Props = {
  slide: Slide
  index: number
  total: number
  onChange: (slide: Slide) => void
  onMove: (direction: -1 | 1) => void
  onDuplicate: () => void
  onDelete: () => void
}

const labels: Record<SlideKind, string> = {
  section: 'Bagian', 'song-line': 'Lirik', 'scripture-line': 'Ayat Alkitab', cue: 'Cue', 'custom-text': 'Teks bebas', image: 'Gambar',
}

export function SlideEditor({ slide, index, total, onChange, onMove, onDuplicate, onDelete }: Props) {
  const update = (key: keyof Slide, value: string): void => onChange({ ...slide, [key]: value })
  const onImage = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange({ ...slide, imageData: String(reader.result) })
    reader.readAsDataURL(file)
  }
  return (
    <article className="editor-card">
      <SlidePreview slide={slide} number={index + 1} />
      <div className="editor-fields">
        <div className="editor-header">
          <label>
            <span>Jenis slide</span>
            <select value={slide.kind} onChange={(event) => update('kind', event.target.value)}>
              {slideKinds.map((kind) => <option key={kind} value={kind}>{labels[kind]}</option>)}
            </select>
          </label>
          <div className="icon-actions" aria-label={`Aksi slide ${index + 1}`}>
            <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Pindah ke atas">↑</button>
            <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Pindah ke bawah">↓</button>
            <button type="button" onClick={onDuplicate} aria-label="Duplikasi slide">⧉</button>
            <button type="button" className="danger" onClick={onDelete} aria-label="Hapus slide">×</button>
          </div>
        </div>
        {slide.kind === 'image' ? (
          <label>
            <span>Gambar lokal</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onImage} />
          </label>
        ) : (
          <label>
            <span>Teks utama</span>
            <textarea value={slide.text} rows={3} onChange={(event) => update('text', event.target.value)} placeholder="Teks yang ditampilkan" />
          </label>
        )}
        {slide.kind !== 'section' && slide.kind !== 'cue' && slide.kind !== 'image' && (
          <div className="label-grid">
            <label><span>Label kiri</span><input value={slide.label} onChange={(event) => update('label', event.target.value)} placeholder="BN. 8 : 1-3" /></label>
            <label><span>Label kanan</span><input value={slide.secondaryLabel} onChange={(event) => update('secondaryLabel', event.target.value)} placeholder="AYAT 1" /></label>
          </div>
        )}
      </div>
    </article>
  )
}
