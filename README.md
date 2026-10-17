# Green Screen PPT Generator

Web app statis untuk mengubah DOCX tata ibadah menjadi PPT green screen 16:9 yang dapat ditinjau sebelum diunduh.

## Menjalankan

```bash
npm install
npm run dev
```

Untuk produksi Netlify, build command adalah `npm run build` dan publish directory adalah `dist` (sudah dikonfigurasi dalam `netlify.toml`).

## Catatan penggunaan

Pilih DOCX tata ibadah, periksa slide yang dibuat, lalu ubah teks/label atau tambahkan cue, teks, maupun gambar. Seluruh berkas diproses di browser dan tidak diunggah ke server.

V1 mengikuti pola dokumen yang memakai penanda seperti `BERNYANYI`, `♫♪♫`, `EPISTEL`, `EVANGELIUM`, dan `--- Musik ---`. Materi yang tidak bisa dipetakan pasti ditandai untuk ditinjau.

## Pemeriksaan

```bash
npm run check
npm run test:e2e
```

# Fixture tata ibadah dan model harapan parser tersimpan di `src/fixtures`; pengujian browser juga membuat DOCX minimal di memori agar unggahan DOCX tervalidasi tanpa berkas pribadi.

# gsgenerator

Turn your Docx into PPT
