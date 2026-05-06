'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { AnimatePresence, motion } from 'motion/react'
import { toPng } from 'html-to-image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EstimateCard } from '@/components/calculator/EstimateCard'
import { makeEstimateMessage, makePngFilename } from '@/lib/calc'
import type { EstimateSnapshot } from '@/types/domain'

type StepState = 'idle' | 'done'

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [meta, base64] = dataUrl.split(',')
  const mime = meta.match(/data:(.*);base64/)?.[1] ?? 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new File([bytes], filename, { type: mime })
}

export function ExportPanel({ snapshot, onClose }: { snapshot: EstimateSnapshot | null; onClose: () => void }) {
  const cardRef = useRef<HTMLElement>(null)
  const fallbackTextRef = useRef<HTMLTextAreaElement>(null)
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCopyFallback, setShowCopyFallback] = useState(false)
  const [copyState, setCopyState] = useState<StepState>('idle')
  const [shareState, setShareState] = useState<StepState>('idle')
  const [instagramState, setInstagramState] = useState<StepState>('idle')

  const estimateMessage = useMemo(() => {
    if (!snapshot) return ''
    return makeEstimateMessage(snapshot.area, snapshot.lines, snapshot.total, snapshot.settings)
  }, [snapshot])

  useEffect(() => {
    if (!snapshot) return

    setPngDataUrl(null)
    setError(null)
    setShowCopyFallback(false)
    setCopyState('idle')
    setShareState('idle')
    setInstagramState('idle')
    setIsGenerating(true)

    const frame = window.requestAnimationFrame(() => {
      window.setTimeout(async () => {
        if (!cardRef.current) return
        try {
          const dataUrl = await toPng(cardRef.current, {
            backgroundColor: '#f7f4ef',
            cacheBust: true,
            pixelRatio: 1,
            width: 1080,
            height: 1350,
            canvasWidth: 1080,
            canvasHeight: 1350,
            preferredFontFormat: 'ttf',
          })
          setPngDataUrl(dataUrl)
        } catch {
          setError('Не удалось создать карточку. Текст расчёта можно отправить вручную.')
        } finally {
          setIsGenerating(false)
        }
      }, 220)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [snapshot])

  async function copyMessage() {
    setError(null)
    setShowCopyFallback(false)

    try {
      if (!window.isSecureContext || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard API requires secure context')
      }

      await navigator.clipboard.writeText(estimateMessage)
      setCopyState('done')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = estimateMessage
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.top = '0'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      textarea.setSelectionRange(0, textarea.value.length)

      try {
        const copied = document.execCommand('copy')
        if (copied) {
          setCopyState('done')
          return
        }
      } finally {
        document.body.removeChild(textarea)
      }

      setShowCopyFallback(true)
      window.setTimeout(() => {
        fallbackTextRef.current?.focus()
        fallbackTextRef.current?.select()
      }, 0)
    }
  }

  function downloadPng(dataUrl: string) {
    if (!snapshot) return
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = makePngFilename(snapshot.area, new Date(snapshot.createdAt), snapshot.settings.brandName)
    link.click()
  }

  async function shareCard() {
    if (!snapshot || !pngDataUrl) return

    const filename = makePngFilename(snapshot.area, new Date(snapshot.createdAt), snapshot.settings.brandName)
    const file = dataUrlToFile(pngDataUrl, filename)
    const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })

    try {
      if (canShareFiles && typeof navigator.share === 'function') {
        await navigator.share({
          title: 'Расчёт ARCHIPELAG',
          text: estimateMessage,
          files: [file],
        })
      } else {
        downloadPng(pngDataUrl)
      }
      setShareState('done')
    } catch {
      downloadPng(pngDataUrl)
      setShareState('done')
      setError('Скачайте карточку и отправьте вручную.')
    }
  }

  function openInstagram() {
    if (!snapshot?.settings.instagramHandle) return
    window.open(`https://instagram.com/${snapshot.settings.instagramHandle}`, '_blank', 'noopener,noreferrer')
    setInstagramState('done')
  }

  return (
    <AnimatePresence>
      {snapshot ? (
        <motion.div className="export-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section
            className="export-panel"
            initial={{ y: 42, opacity: 0, filter: 'blur(12px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: 32, opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            aria-modal="true"
            role="dialog"
          >
            <div className="export-topline">
              <span className="brand-mark">{snapshot.settings.shortMark}</span>
              <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть">×</button>
            </div>
            <div className="export-heading">
              <p className="eyebrow">Экспорт</p>
              <h2>Готово к отправке</h2>
              <p>Карточка и текст расчёта созданы из текущего снимка.</p>
            </div>

            <div className="card-preview-shell">
              {isGenerating ? <div className="card-skeleton" /> : null}
              <div className="card-scale-frame" aria-hidden={isGenerating}>
                <EstimateCard snapshot={snapshot} />
              </div>
            </div>

            <div className="export-card-source" aria-hidden="true">
              <EstimateCard snapshot={snapshot} exportMode ref={cardRef} />
            </div>

            {error ? <p className="export-error">{error}</p> : null}

            <ol className="export-steps">
              <li className={copyState === 'done' ? 'complete' : ''}>
                <span className="step-index">1</span>
                <div>
                  <strong>Скопировать текст</strong>
                  <p>Вставьте его в Instagram DM.</p>
                  <button className="button button-dark" type="button" onClick={copyMessage}>
                    {copyState === 'done' ? 'Текст скопирован' : 'Скопировать'}
                  </button>
                  {showCopyFallback ? (
                    <div className="copy-fallback">
                      <p>Автокопирование недоступно на этом адресе. Выделите текст ниже и отправьте его вместе с PNG.</p>
                      <textarea ref={fallbackTextRef} readOnly value={estimateMessage} />
                    </div>
                  ) : null}
                </div>
              </li>
              <li className={shareState === 'done' ? 'complete' : copyState === 'done' ? 'active' : ''}>
                <span className="step-index">2</span>
                <div>
                  <strong>Поделиться карточкой</strong>
                  <p>PNG для отправки или сохранения.</p>
                  <button className="button button-light" type="button" onClick={shareCard} disabled={!pngDataUrl}>
                    {shareState === 'done' ? 'Карточка готова' : pngDataUrl ? 'Поделиться PNG' : 'Создаём PNG'}
                  </button>
                </div>
              </li>
              {snapshot.settings.instagramHandle ? (
                <li className={instagramState === 'done' ? 'complete' : shareState === 'done' ? 'active' : ''}>
                  <span className="step-index">3</span>
                  <div>
                    <strong>Открыть Instagram</strong>
                    <p>Выберите чат и отправьте материалы.</p>
                    <button className="link-button text-arrow-link" type="button" onClick={openInstagram}>
                      <span>Открыть Instagram</span>
                      <span className="text-arrow" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ) : null}
            </ol>
            <footer className="export-footer">
              <span>{snapshot.settings.websiteHandle}</span>
              <span>@{snapshot.settings.instagramHandle}</span>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
