'use client'
import { useState, useRef, useEffect } from 'react'

type PetInfo = { id: string; name: string; species: string; breed: string | null; age: string | null }
type SoapData = {
  subjetivo: string; objetivo: string; avaliacao: string; plano: string
  transcript: string; aiSummary: string
  aiDiagnoses: string[]; aiMeds: string[]; aiExams: string[]; aiRetorno: string
  sinaisVitais: { temperatura: string; frequenciaCardiaca: string; frequenciaRespiratoria: string; peso: string; tpc: string }
  vetName: string; unitId: string
  prescriptions: { medication: string; dose: string; frequency: string; duration: string; instructions: string }[]
  examOrders: { examName: string; notes: string }[]
}

const INITIAL: SoapData = {
  subjetivo: '', objetivo: '', avaliacao: '', plano: '',
  transcript: '', aiSummary: '',
  aiDiagnoses: [], aiMeds: [], aiExams: [], aiRetorno: '',
  sinaisVitais: { temperatura: '', frequenciaCardiaca: '', frequenciaRespiratoria: '', peso: '', tpc: '' },
  vetName: '', unitId: '',
  prescriptions: [], examOrders: [],
}

const UNITS = [
  { id: 'caucaia', name: 'Caucaia' }, { id: 'pecem', name: 'Pecém' },
  { id: 'saogoncalo', name: 'São Gonçalo' }, { id: 'taiba', name: 'Taíba' },
]

type RecordingState = 'idle' | 'recording' | 'processing' | 'done'

export default function SoapForm({
  pet, onClose, onSaved,
}: {
  pet: PetInfo
  onClose: () => void
  onSaved: (recordId: string) => void
}) {
  const [data, setData] = useState<SoapData>(INITIAL)
  const [recState, setRecState] = useState<RecordingState>('idle')
  const [recTime, setRecTime] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'scribe' | 'soap' | 'rx' | 'exames'>('scribe')

  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')

  const up = (patch: Partial<SoapData>) => setData(d => ({ ...d, ...patch }))
  const upVital = (key: keyof SoapData['sinaisVitais'], v: string) =>
    setData(d => ({ ...d, sinaisVitais: { ...d.sinaisVitais, [key]: v } }))

  const startRecording = async () => {
    setError(null)
    transcriptRef.current = ''

    // Web Speech API para transcrição em tempo real
    type SpeechRecognitionConstructor = new () => {
      continuous: boolean; interimResults: boolean; lang: string
      onresult: ((e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null
      start(): void; stop(): void
    }
    const SpeechRecognitionClass = (
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    ) as SpeechRecognitionConstructor | undefined

    if (SpeechRecognitionClass) {
      const rec = new SpeechRecognitionClass()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'pt-BR'
      let finalTranscript = ''

      rec.onresult = (e) => {
        let interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + ' '
          else interim += e.results[i][0].transcript
        }
        transcriptRef.current = finalTranscript + interim
        up({ transcript: transcriptRef.current })
      }
      rec.start()
      recognitionRef.current = rec
    }

    setRecState('recording')
    setRecTime(0)
    timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000)
  }

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop()

    setRecState('processing')

    const finalTranscript = transcriptRef.current || data.transcript
    if (!finalTranscript.trim() || finalTranscript.trim().length < 10) {
      setRecState('done')
      setError('Transcrição muito curta. Verifique o microfone e tente novamente.')
      return
    }

    try {
      const res = await fetch('/api/vet/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: finalTranscript,
          petInfo: { name: pet.name, species: pet.species, breed: pet.breed, age: pet.age },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      const s = json.soap ?? {}

      // Auto-prescrições vindas da IA
      const rxFromAI = (s.medicamentos ?? []).map((m: string) => {
        const parts = m.split(' - ')
        return { medication: parts[0] ?? m, dose: parts[1] ?? '', frequency: '', duration: parts[2] ?? '', instructions: '' }
      })
      const exFromAI = (s.exames ?? []).map((e: string) => ({ examName: e, notes: '' }))

      up({
        subjetivo: s.subjetivo ?? '',
        objetivo: s.objetivo ?? '',
        avaliacao: s.avaliacao ?? '',
        plano: s.plano ?? '',
        aiSummary: s.resumo ?? '',
        aiDiagnoses: s.diagnosticos ?? [],
        aiMeds: s.medicamentos ?? [],
        aiExams: s.exames ?? [],
        aiRetorno: s.retorno ?? '',
        sinaisVitais: { ...INITIAL.sinaisVitais, ...s.sinaisVitais },
        prescriptions: rxFromAI,
        examOrders: exFromAI,
      })
      setActiveTab('soap')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na análise com IA')
    }
    setRecState('done')
  }

  const save = async (sign = false) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/vet/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: pet.id,
          ...data,
          status: sign ? 'signed' : 'open',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      onSaved(json.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
    setSaving(false)
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 760, marginTop: '1rem', marginBottom: '1rem', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#111827', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1f2937', display: 'grid', placeItems: 'center', fontSize: 22 }}>
            {pet.species === 'cao' ? '🐕' : pet.species === 'gato' ? '🐈' : '🐾'}
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'white', fontSize: '1rem' }}>Nova consulta — {pet.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}{pet.age ? ` · ${pet.age}` : ''}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 22, padding: 4 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
          {[
            { key: 'scribe', label: '🎙️ IA Scribe' },
            { key: 'soap', label: '📋 SOAP' },
            { key: 'rx', label: `💊 Prescrição${data.prescriptions.length > 0 ? ` (${data.prescriptions.length})` : ''}` },
            { key: 'exames', label: `🔬 Exames${data.examOrders.length > 0 ? ` (${data.examOrders.length})` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as typeof activeTab)}
              style={{ padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: activeTab === t.key ? 700 : 400, color: activeTab === t.key ? '#10b981' : '#6b7280', borderBottom: activeTab === t.key ? '2px solid #10b981' : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.5rem' }}>

          {/* ─── IA SCRIBE ─── */}
          {activeTab === 'scribe' && (
            <div>
              <div style={{ textAlign: 'center', padding: '1rem 0 1.5rem' }}>
                {/* Botão de gravação */}
                <button
                  onClick={recState === 'recording' ? stopRecording : recState === 'idle' || recState === 'done' ? startRecording : undefined}
                  disabled={recState === 'processing'}
                  style={{
                    width: 100, height: 100, borderRadius: '50%',
                    background: recState === 'recording' ? '#ef4444' : recState === 'processing' ? '#6b7280' : '#10b981',
                    border: 'none', cursor: recState === 'processing' ? 'not-allowed' : 'pointer',
                    fontSize: 36, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: recState === 'recording' ? '0 0 0 12px rgba(239,68,68,0.2)' : '0 4px 20px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s',
                  }}>
                  {recState === 'recording' ? '⏹' : recState === 'processing' ? '⏳' : '🎙️'}
                </button>

                <div style={{ marginTop: 12, fontWeight: 600, fontSize: '0.95rem', color: recState === 'recording' ? '#ef4444' : '#374151' }}>
                  {recState === 'idle' && 'Clique para iniciar a gravação'}
                  {recState === 'recording' && `Gravando... ${fmt(recTime)}`}
                  {recState === 'processing' && 'Analisando com IA...'}
                  {recState === 'done' && 'Análise concluída ✓'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 6 }}>
                  Fale naturalmente durante a consulta. A IA vai transcrever e preencher o SOAP automaticamente.
                </div>
              </div>

              {/* Transcrição em tempo real */}
              {(recState === 'recording' || data.transcript) && (
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {recState === 'recording' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />}
                    TRANSCRIÇÃO {recState === 'recording' ? 'AO VIVO' : ''}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto', margin: 0 }}>
                    {data.transcript || 'Aguardando fala...'}
                  </p>
                </div>
              )}

              {/* Resumo IA */}
              {data.aiSummary && (
                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '1rem', marginTop: '1rem', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', marginBottom: 6 }}>✨ RESUMO DA IA</div>
                  <p style={{ fontSize: '0.875rem', color: '#15803d', margin: 0, lineHeight: 1.6 }}>{data.aiSummary}</p>
                </div>
              )}

              {/* Diagnósticos IA */}
              {data.aiDiagnoses.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>🩺 DIAGNÓSTICOS SUGERIDOS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {data.aiDiagnoses.map((d, i) => (
                      <span key={i} style={{ padding: '4px 12px', borderRadius: 20, background: i === 0 ? '#dbeafe' : '#f3f4f6', color: i === 0 ? '#1d4ed8' : '#374151', fontSize: '0.8rem', fontWeight: 600 }}>
                        {i === 0 ? '⭐ ' : ''}{d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {error && <div style={{ marginTop: '1rem', background: '#fef2f2', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem' }}>⚠️ {error}</div>}

              {recState === 'done' && !error && (
                <button onClick={() => setActiveTab('soap')} style={{ marginTop: '1.5rem', width: '100%', background: '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                  Revisar prontuário SOAP →
                </button>
              )}
            </div>
          )}

          {/* ─── SOAP ─── */}
          {activeTab === 'soap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Informações gerais */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>VETERINÁRIO</label>
                  <input value={data.vetName} onChange={e => up({ vetName: e.target.value })} placeholder="Dr. João Silva"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>UNIDADE</label>
                  <select value={data.unitId} onChange={e => up({ unitId: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: '0.875rem', background: 'white' }}>
                    <option value="">Selecione</option>
                    {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Sinais vitais */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>SINAIS VITAIS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {[
                    { key: 'temperatura', label: 'Temperatura', unit: '°C' },
                    { key: 'frequenciaCardiaca', label: 'FC', unit: 'bpm' },
                    { key: 'frequenciaRespiratoria', label: 'FR', unit: 'rpm' },
                    { key: 'peso', label: 'Peso', unit: 'kg' },
                    { key: 'tpc', label: 'TPC', unit: 's' },
                  ].map(v => (
                    <div key={v.key}>
                      <label style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', marginBottom: 3 }}>{v.label} <span style={{ color: '#d1d5db' }}>({v.unit})</span></label>
                      <input value={data.sinaisVitais[v.key as keyof typeof data.sinaisVitais]}
                        onChange={e => upVital(v.key as keyof typeof data.sinaisVitais, e.target.value)}
                        placeholder="—"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: '0.875rem', boxSizing: 'border-box', textAlign: 'center', outline: 'none' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* SOAP fields */}
              {[
                { key: 'subjetivo', label: 'S — SUBJETIVO', placeholder: 'Queixa principal, histórico relatado pelo tutor, comportamento do animal...' },
                { key: 'objetivo', label: 'O — OBJETIVO', placeholder: 'Achados do exame físico, sinais clínicos observados, resultados de exames...' },
                { key: 'avaliacao', label: 'A — AVALIAÇÃO', placeholder: 'Diagnóstico ou diagnósticos diferenciais...' },
                { key: 'plano', label: 'P — PLANO', placeholder: 'Tratamento, medicamentos, exames solicitados, orientações ao tutor, retorno...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <textarea value={data[f.key as keyof SoapData] as string}
                    onChange={e => up({ [f.key]: e.target.value })}
                    placeholder={f.placeholder} rows={3}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical', outline: 'none', lineHeight: 1.6 }} />
                </div>
              ))}
            </div>
          )}

          {/* ─── PRESCRIÇÃO ─── */}
          {activeTab === 'rx' && (
            <div>
              {data.prescriptions.map((rx, i) => (
                <div key={i} style={{ background: '#f9fafb', borderRadius: 10, padding: '1rem', marginBottom: 10, border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151' }}>Medicamento {i + 1}</span>
                    <button onClick={() => up({ prescriptions: data.prescriptions.filter((_, j) => j !== i) })}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>✕ remover</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { key: 'medication', label: 'Medicamento *', placeholder: 'Ex: Amoxicilina 250mg' },
                      { key: 'dose', label: 'Dose', placeholder: 'Ex: 1 comprimido' },
                      { key: 'frequency', label: 'Frequência', placeholder: 'Ex: 2x ao dia' },
                      { key: 'duration', label: 'Duração', placeholder: 'Ex: 7 dias' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>{f.label}</label>
                        <input value={rx[f.key as keyof typeof rx]} onChange={e => {
                          const updated = [...data.prescriptions]
                          updated[i] = { ...updated[i], [f.key]: e.target.value }
                          up({ prescriptions: updated })
                        }} placeholder={f.placeholder}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: '0.8rem', boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                    ))}
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>Instruções</label>
                      <input value={rx.instructions} onChange={e => { const u = [...data.prescriptions]; u[i] = { ...u[i], instructions: e.target.value }; up({ prescriptions: u }) }} placeholder="Ex: Administrar com comida"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: '0.8rem', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => up({ prescriptions: [...data.prescriptions, { medication: '', dose: '', frequency: '', duration: '', instructions: '' }] })}
                style={{ width: '100%', background: 'white', border: '1.5px dashed #d1d5db', borderRadius: 10, padding: '10px', cursor: 'pointer', color: '#6b7280', fontWeight: 600, fontSize: '0.875rem' }}>
                + Adicionar medicamento
              </button>
            </div>
          )}

          {/* ─── EXAMES ─── */}
          {activeTab === 'exames' && (
            <div>
              {data.examOrders.map((ex, i) => (
                <div key={i} style={{ background: '#f9fafb', borderRadius: 10, padding: '1rem', marginBottom: 10, border: '1px solid #e5e7eb', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>Exame *</label>
                    <input value={ex.examName} onChange={e => { const u = [...data.examOrders]; u[i] = { ...u[i], examName: e.target.value }; up({ examOrders: u }) }} placeholder="Ex: Hemograma completo"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>Observações</label>
                    <input value={ex.notes} onChange={e => { const u = [...data.examOrders]; u[i] = { ...u[i], notes: e.target.value }; up({ examOrders: u }) }} placeholder="Ex: Em jejum"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <button onClick={() => up({ examOrders: data.examOrders.filter((_, j) => j !== i) })}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', paddingTop: 24 }}>✕</button>
                </div>
              ))}
              <button onClick={() => up({ examOrders: [...data.examOrders, { examName: '', notes: '' }] })}
                style={{ width: '100%', background: 'white', border: '1.5px dashed #d1d5db', borderRadius: 10, padding: '10px', cursor: 'pointer', color: '#6b7280', fontWeight: 600, fontSize: '0.875rem' }}>
                + Solicitar exame
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, background: '#f9fafb' }}>
          <button onClick={onClose} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>Cancelar</button>
          {error && <span style={{ flex: 1, color: '#dc2626', fontSize: '0.8rem', alignSelf: 'center' }}>⚠️ {error}</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => save(false)} disabled={saving}
              style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 18px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, color: '#374151' }}>
              💾 Salvar rascunho
            </button>
            <button onClick={() => save(true)} disabled={saving}
              style={{ background: saving ? '#d1d5db' : '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
              {saving ? 'Salvando...' : '✅ Assinar e salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
