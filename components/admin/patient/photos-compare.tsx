"use client"

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { GitCompare, Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface PhotoRecord {
  id: string
  data: string
  foto_url: string
  momento_avaliacao: string | null
  posicao: string | null
}

interface PhotosCompareProps {
  patientId: string
  patientName?: string
}

const POSICOES = [
  { key: 'frontal', label: 'Frontal' },
  { key: 'lateral_d', label: 'Lateral D' },
  { key: 'lateral_e', label: 'Lateral E' },
  { key: 'costas', label: 'Costas' },
] as const

export function PhotosCompare({ patientId, patientName }: PhotosCompareProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [momentoA, setMomentoA] = useState<string>('')
  const [momentoB, setMomentoB] = useState<string>('')
  const [posicao, setPosicao] = useState<string>('frontal')
  const [exporting, setExporting] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/admin/patients/${patientId}/progress-photos`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const list: PhotoRecord[] = json.photos || []
          setPhotos(list)
          // Defaults: primeiro e último momentos disponíveis
          const momentos = Array.from(new Set(list.map(p => p.momento_avaliacao).filter(Boolean))) as string[]
          const sorted = momentos.sort()
          if (sorted.length >= 2) {
            setMomentoA(sorted[0])
            setMomentoB(sorted[sorted.length - 1])
          } else if (sorted.length === 1) {
            setMomentoA(sorted[0])
            setMomentoB(sorted[0])
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [open, patientId])

  const getPhoto = (momento: string, pos: string): PhotoRecord | undefined => {
    return photos.find(p => p.momento_avaliacao === momento && p.posicao === pos)
  }

  const availableMomentos = Array.from(new Set(photos.map(p => p.momento_avaliacao).filter(Boolean))).sort() as string[]

  const photoA = momentoA ? getPhoto(momentoA, posicao) : undefined
  const photoB = momentoB ? getPhoto(momentoB, posicao) : undefined

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  const handleExport = async () => {
    if (!canvasRef.current) return
    setExporting(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      })
      const a = document.createElement('a')
      const safeName = (patientName || 'paciente').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      a.download = `evolucao-${safeName}-${momentoA}-vs-${momentoB}-${posicao}.png`
      a.href = dataUrl
      a.click()
      toast.success('Imagem exportada')
    } catch (err) {
      console.error('Erro exportar:', err)
      toast.error('Erro ao exportar imagem')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-background-elevated transition-colors"
      >
        <div className="flex items-center gap-3">
          <GitCompare className="w-5 h-5 text-dourado" />
          <h2 className="text-lg font-semibold text-foreground">Comparar Fotos (Antes × Depois)</h2>
          <span className="text-xs text-foreground-muted">Exportável</span>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-foreground-secondary" /> : <ChevronDown className="w-5 h-5 text-foreground-secondary" />}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-foreground-muted text-sm">
              <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
              Carregando fotos...
            </div>
          ) : availableMomentos.length === 0 ? (
            <div className="py-8 text-center text-foreground-muted text-sm">
              Nenhuma foto com momento (M0-M6) cadastrada ainda.
            </div>
          ) : (
            <>
              {/* Seletores */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-foreground-secondary mb-1">Momento A</label>
                  <select
                    value={momentoA}
                    onChange={(e) => setMomentoA(e.target.value)}
                    className="w-full px-2 py-2 border border-border rounded-lg text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  >
                    {availableMomentos.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-foreground-secondary mb-1">Momento B</label>
                  <select
                    value={momentoB}
                    onChange={(e) => setMomentoB(e.target.value)}
                    className="w-full px-2 py-2 border border-border rounded-lg text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  >
                    {availableMomentos.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-foreground-secondary mb-1">Posição</label>
                  <select
                    value={posicao}
                    onChange={(e) => setPosicao(e.target.value)}
                    className="w-full px-2 py-2 border border-border rounded-lg text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  >
                    {POSICOES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Canvas a ser exportado */}
              <div
                ref={canvasRef}
                className="bg-white rounded-xl p-6"
                style={{ boxShadow: '0 0 0 1px #d4cbc2 inset' }}
              >
                {/* Header do export */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                  <div>
                    <p className="text-xs text-foreground-muted uppercase tracking-wider">Evolução — Complexo Felice</p>
                    {patientName && <p className="font-heading text-lg font-bold text-foreground">{patientName}</p>}
                  </div>
                  <p className="text-xs text-dourado font-semibold">{POSICOES.find(p => p.key === posicao)?.label}</p>
                </div>

                {/* Par de fotos */}
                <div className="grid grid-cols-2 gap-4">
                  {[{ m: momentoA, p: photoA, label: 'ANTES' }, { m: momentoB, p: photoB, label: 'DEPOIS' }].map((side, i) => (
                    <div key={i} className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">{side.label}</span>
                        <span className="text-sm font-heading font-bold text-dourado">{side.m || '—'}</span>
                      </div>
                      <div className="aspect-[3/4] w-full bg-background-elevated rounded-lg overflow-hidden border border-border">
                        {side.p ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={side.p.foto_url}
                            alt={`${side.m} ${posicao}`}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground-muted text-xs text-center px-2">
                            Foto não cadastrada para este momento/posição
                          </div>
                        )}
                      </div>
                      {side.p && (
                        <p className="mt-2 text-[11px] text-foreground-muted text-center">{formatDate(side.p.data)}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Rodapé de marca */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <p className="text-[10px] text-foreground-muted">Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
                  <p className="text-[10px] font-heading text-dourado font-semibold tracking-wider">COMPLEXO FELICE · WELLNESS</p>
                </div>
              </div>

              {/* Ação */}
              <div className="flex justify-end">
                <button
                  onClick={handleExport}
                  disabled={exporting || (!photoA && !photoB)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-dourado hover:bg-dourado/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {exporting ? 'Gerando PNG...' : 'Exportar PNG'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
