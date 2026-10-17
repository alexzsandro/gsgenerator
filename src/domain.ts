import { z } from 'zod'

export const slideKinds = ['section', 'song-line', 'scripture-line', 'cue', 'custom-text', 'image'] as const
export type SlideKind = (typeof slideKinds)[number]

export const slideSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(slideKinds),
  text: z.string(),
  label: z.string().default(''),
  secondaryLabel: z.string().default(''),
  imageData: z.string().optional(),
})

export type Slide = z.infer<typeof slideSchema>

export const sourceBlockSchema = z.object({
  index: z.number().int().nonnegative(),
  text: z.string(),
  classification: z.enum(['song', 'scripture', 'section', 'spoken', 'cue', 'unknown']),
})

export type SourceBlock = z.infer<typeof sourceBlockSchema>

export const worshipDocumentSchema = z.object({
  metadata: z.object({
    title: z.string().default('Tata Ibadah'),
    church: z.string().default(''),
    date: z.string().default(''),
    topic: z.string().default(''),
  }),
  sourceBlocks: z.array(sourceBlockSchema),
  slides: z.array(slideSchema),
  warnings: z.array(z.string()),
})

export type WorshipDocument = z.infer<typeof worshipDocumentSchema>

export const makeId = (): string => crypto.randomUUID()

export const emptySlide = (kind: SlideKind = 'custom-text'): Slide => ({
  id: makeId(),
  kind,
  text: kind === 'cue' ? '-- MUSIK --' : '',
  label: '',
  secondaryLabel: '',
})
