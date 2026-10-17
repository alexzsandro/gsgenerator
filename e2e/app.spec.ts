import { expect, test } from '@playwright/test'
import JSZip from 'jszip'

async function minimalDocx(): Promise<Buffer> {
  const zip = new JSZip()
  zip.file('[Content_Types].xml', `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`)
  zip.folder('_rels')?.file('.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`)
  zip.folder('word')?.file('document.xml', `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>TATA IBADAH</w:t></w:r></w:p><w:p><w:r><w:t>BERNYANYI BN No. 8 : 1</w:t></w:r></w:p><w:p><w:r><w:t>♫♪♫ Ya Allah, Ya Bapa</w:t></w:r></w:p></w:body></w:document>`)
  return zip.generateAsync({ type: 'nodebuffer' })
}

test('operator can upload, edit, reorder, add an image slide, and download', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Pilih DOCX tata ibadah').setInputFiles({ name: 'tata-ibadah.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: await minimalDocx() })
  await expect(page.getByText('slide siap diekspor')).toBeVisible()
  await page.getByLabel('Teks utama').first().fill('Lirik yang sudah diperiksa')
  await page.getByRole('button', { name: '+ Teks' }).click()
  await page.getByRole('button', { name: 'Pindah ke atas' }).last().click()
  await page.getByRole('button', { name: '+ Gambar' }).click()
  await expect(page.getByText('Gambar lokal')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Unduh PPT Green Screen' }).click()
  expect((await download).suggestedFilename()).toMatch(/\.pptx$/)
})
