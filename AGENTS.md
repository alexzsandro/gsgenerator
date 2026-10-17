# Green Screen PPT Generator

## Product context

This is an Indonesian, browser-only tool for church multimedia operators. It converts a worship-order DOCX into a reviewable green-screen PowerPoint deck. The operator must be able to correct every generated slide before exporting it.

## Architecture and guardrails

- Keep all DOCX parsing, image handling, previewing, and PPTX generation in the browser. Do not add authentication, a database, uploads, Netlify Functions, or any server endpoint for worship files.
- Use React + TypeScript + Vite + Tailwind. Use Mammoth for DOCX text extraction, Zod for model validation, and PptxGenJS/JSZip for `.pptx` generation and verification.
- Keep parsing, presentation-model validation, and PPTX rendering as pure modules. React components only coordinate user interaction and presentation.
- TypeScript must remain strict: do not introduce `any`, suppressions, or silent parsing failures.
- User-facing language is Indonesian. Add accessible labels to all file inputs, controls, and text areas.

## Source and presentation model

- Keep source blocks separate from slides. A parsed document contains metadata, source blocks, slides, and warnings.
- Supported slide types are `section`, `song-line`, `scripture-line`, `cue`, `custom-text`, and `image`.
- The DOCX parser recognizes `BERNYANYI`, `Bernyanyi`, `♫♪♫`, `EPISTEL`, `EVANGELIUM`, `KHOTBAH`, `L:`, `J:`, `--- Musik ---`, and `--- Jemaat ... ---`.
- Songs produce one lyric line per slide with a BN and verse label. Scripture produces readable fragments that retain their verse number. Spoken prayers and leader/congregation dialogue become section/cue slides rather than full text slides.
- Preserve unrecognized material in source blocks and report a concise warning. Never discard it silently.

## Visual and export contract

- Generate a 16:9 deck with chroma green `#00FF00`, white bold outlined/glowing text, and lower labels. Use `Arial Black` and `Franklin Gothic Heavy` with Arial fallbacks.
- Preview and PPTX export must read the same slide model. Do not implement a separate, divergent export-only layout.
- V1 is a single built-in style profile based on the supplied example. It is not a generic PowerPoint editor and does not import arbitrary PPTX templates.
- Draft state is session-only. Local image data may exist in memory solely until export.

## Quality bar

- Add or update unit tests whenever parser or renderer behavior changes. Cover markers, text splitting, warnings, and PPTX package dimensions/content.
- Keep the browser flow covered by Playwright: DOCX selection, editing/reordering, image insertion, and PPTX download.
- Verify `npm run check` and `npm run build` before handoff.
