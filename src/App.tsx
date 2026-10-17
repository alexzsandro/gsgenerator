import { useMemo, useState, type ChangeEvent } from "react";
import {
  emptySlide,
  makeId,
  type Slide,
  type SlideKind,
  type WorshipDocument,
} from "./domain";
import { parseWorshipText } from "./parser";
import { SlideEditor } from "./components/SlideEditor";

const newDocument = (): WorshipDocument => ({
  metadata: { title: "Tata Ibadah", church: "", date: "", topic: "" },
  sourceBlocks: [],
  slides: [],
  warnings: [],
});

function App() {
  const [document, setDocument] = useState<WorshipDocument>(newDocument);
  const [sourceName, setSourceName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const hasSlides = document.slides.length > 0;
  const summary = useMemo(
    () =>
      `${document.slides.length} slide • ${document.warnings.length} perlu ditinjau`,
    [document.slides.length, document.warnings.length]
  );

  const uploadDocx = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    try {
      const { extractRawText } = await import("mammoth/mammoth.browser");
      const result = await extractRawText({
        arrayBuffer: await file.arrayBuffer(),
      });
      setDocument(parseWorshipText(result.value));
      setSourceName(file.name);
    } catch {
      setDocument({
        ...newDocument(),
        warnings: [
          "DOCX tidak dapat dibaca. Pastikan Anda memilih file Word berekstensi .docx yang tidak rusak.",
        ],
      });
      setSourceName(file.name);
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  };

  const updateSlide = (updated: Slide): void =>
    setDocument((current) => ({
      ...current,
      slides: current.slides.map((slide) =>
        slide.id === updated.id ? updated : slide
      ),
    }));
  const deleteSlide = (id: string): void =>
    setDocument((current) => ({
      ...current,
      slides: current.slides.filter((slide) => slide.id !== id),
    }));
  const duplicateSlide = (id: string): void =>
    setDocument((current) => {
      const at = current.slides.findIndex((slide) => slide.id === id);
      if (at < 0) return current;
      const copy = { ...current.slides[at], id: makeId() };
      return {
        ...current,
        slides: [
          ...current.slides.slice(0, at + 1),
          copy,
          ...current.slides.slice(at + 1),
        ],
      };
    });
  const moveSlide = (id: string, direction: -1 | 1): void =>
    setDocument((current) => {
      const at = current.slides.findIndex((slide) => slide.id === id);
      const destination = at + direction;
      if (at < 0 || destination < 0 || destination >= current.slides.length)
        return current;
      const slides = [...current.slides];
      [slides[at], slides[destination]] = [slides[destination], slides[at]];
      return { ...current, slides };
    });
  const addSlide = (kind: SlideKind): void =>
    setDocument((current) => ({
      ...current,
      slides: [...current.slides, emptySlide(kind)],
    }));
  const exportDeck = async (): Promise<void> => {
    setIsExporting(true);
    try {
      const { downloadPptx } = await import("./pptx");
      await downloadPptx(document);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">Multimedia HKBP Taman Mini</p>
          <h1>Green Screen PPT Generator</h1>
          <p>
            Ubah tata ibadah DOCX menjadi slide green screen yang siap ditinjau
            dan ditayangkan.
          </p>
        </div>
        <div className="privacy-note">
          🔒 Semua file diproses di perangkat ini.
          <br />
          Tidak ada unggahan ke server.
        </div>
      </header>
      <section className="upload-panel" aria-labelledby="upload-title">
        <div>
          <h2 id="upload-title">1. Unggah tata ibadah</h2>
          <p>
            Pilih file Word (.docx). Penanda lagu, ayat, bagian, dan cue akan
            dikenali otomatis.
          </p>
        </div>
        <label className="file-button">
          <input
            aria-label="Pilih DOCX tata ibadah"
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={uploadDocx}
          />
          {isParsing ? "Membaca DOCX…" : "Pilih file DOCX"}
        </label>
      </section>
      {sourceName && (
        <p className="source-name">
          Sumber: <strong>{sourceName}</strong> · {summary}
        </p>
      )}
      {document.warnings.length > 0 && (
        <section className="warning-panel" aria-live="polite">
          <h2>Perlu ditinjau</h2>
          <ul>
            {document.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      )}
      {hasSlides && (
        <>
          <section className="metadata" aria-labelledby="metadata-title">
            <h2 id="metadata-title">2. Periksa hasil</h2>
            <div className="metadata-grid">
              <label>
                Judul
                <input
                  value={document.metadata.title}
                  onChange={(event) =>
                    setDocument({
                      ...document,
                      metadata: {
                        ...document.metadata,
                        title: event.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Gereja
                <input
                  value={document.metadata.church}
                  onChange={(event) =>
                    setDocument({
                      ...document,
                      metadata: {
                        ...document.metadata,
                        church: event.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Tanggal
                <input
                  value={document.metadata.date}
                  onChange={(event) =>
                    setDocument({
                      ...document,
                      metadata: {
                        ...document.metadata,
                        date: event.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Topik
                <input
                  value={document.metadata.topic}
                  onChange={(event) =>
                    setDocument({
                      ...document,
                      metadata: {
                        ...document.metadata,
                        topic: event.target.value,
                      },
                    })
                  }
                />
              </label>
            </div>
          </section>
          <section className="toolbar" aria-label="Tambah slide">
            <span>{document.slides.length} slide siap diekspor</span>
            <div>
              <button type="button" onClick={() => addSlide("cue")}>
                + Cue
              </button>
              <button type="button" onClick={() => addSlide("custom-text")}>
                + Teks
              </button>
              <button type="button" onClick={() => addSlide("image")}>
                + Gambar
              </button>
            </div>
          </section>
          <section className="slide-list" aria-label="Editor slide">
            {document.slides.map((slide, index) => (
              <SlideEditor
                key={slide.id}
                slide={slide}
                index={index}
                total={document.slides.length}
                onChange={updateSlide}
                onMove={(direction) => moveSlide(slide.id, direction)}
                onDuplicate={() => duplicateSlide(slide.id)}
                onDelete={() => deleteSlide(slide.id)}
              />
            ))}
          </section>
          <section className="export-panel">
            <div>
              <h2>3. Unduh PPTX</h2>
              <p>
                Format 16:9 dengan latar hijau #00FF00, teks putih ber-outline,
                dan label bawah.
              </p>
            </div>
            <button
              type="button"
              className="export-button"
              disabled={isExporting}
              onClick={exportDeck}
            >
              {isExporting ? "Membuat PPTX…" : "Unduh PPT Green Screen"}
            </button>
          </section>
        </>
      )}
    </main>
  );
}

export default App;
