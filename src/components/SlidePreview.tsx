import type { Slide } from '../domain'

const kindLabel: Record<Slide['kind'], string> = {
  section: 'Bagian',
  'song-line': 'Lirik',
  'scripture-line': 'Ayat',
  cue: 'Cue',
  'custom-text': 'Teks',
  image: 'Gambar',
}

export function SlidePreview({ slide, number }: { slide: Slide; number?: number }) {
  const centered = slide.kind === 'section' || slide.kind === 'cue'
  return (
    <div className="slide-preview" aria-label={`Pratinjau slide ${number ?? ''}: ${kindLabel[slide.kind]}`}>
      <span className="preview-kind">{number ? `${number}. ` : ''}{kindLabel[slide.kind]}</span>
      {slide.kind === 'image' && slide.imageData ? (
        <img className="preview-image" src={slide.imageData} alt="Gambar slide" />
      ) : (
        <p className={centered ? 'preview-text preview-text-center' : 'preview-text'}>{slide.text || 'TEKS BELUM DIISI'}</p>
      )}
      {!centered && slide.kind !== 'image' && (
        <div className="preview-labels">
          <span>{slide.label}</span>
          <span>{slide.secondaryLabel}</span>
        </div>
      )}
    </div>
  )
}
