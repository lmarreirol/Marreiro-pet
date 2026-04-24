import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é um assistente clínico veterinário especializado em análise de consultas.
Receberá a transcrição de uma consulta veterinária e deve extrair informações estruturadas.

Responda APENAS com um objeto JSON válido, sem markdown, sem texto extra, no seguinte formato:
{
  "subjetivo": "Queixa principal relatada pelo tutor, histórico recente, comportamento do animal",
  "objetivo": "Sinais vitais mencionados, achados do exame físico, estado geral observado",
  "avaliacao": "Diagnóstico ou diagnósticos diferenciais mais prováveis baseados nos dados clínicos",
  "plano": "Tratamento proposto, medicamentos, exames solicitados, retorno e orientações ao tutor",
  "resumo": "Resumo em 2-3 frases do atendimento para registro rápido",
  "diagnosticos": ["diagnóstico 1", "diagnóstico 2"],
  "medicamentos": ["medicamento 1 - dose - duração", "medicamento 2 - dose - duração"],
  "exames": ["exame 1", "exame 2"],
  "retorno": "prazo de retorno sugerido",
  "sinaisVitais": {
    "temperatura": "",
    "frequenciaCardiaca": "",
    "frequenciaRespiratoria": "",
    "peso": "",
    "tpc": ""
  }
}

Se alguma informação não estiver presente na transcrição, deixe o campo como string vazia ou array vazio.
Diagnósticos diferenciais devem ser listados do mais ao menos provável.`

export async function POST(req: NextRequest) {
  try {
    const { transcript, petInfo } = await req.json()
    if (!transcript || transcript.trim().length < 10) {
      return NextResponse.json({ error: 'Transcrição muito curta' }, { status: 400 })
    }

    const userMessage = `Analise a transcrição abaixo da consulta veterinária${petInfo ? ` do paciente ${petInfo.name} (${petInfo.species}, ${petInfo.breed}, ${petInfo.age})` : ''} e preencha o prontuário SOAP:

TRANSCRIÇÃO:
${transcript}`

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1500,
      messages: [{ role: 'user', content: userMessage }],
      system: SYSTEM_PROMPT,
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    let soap: Record<string, unknown>
    try {
      soap = JSON.parse(raw)
    } catch {
      // tenta extrair JSON de dentro de possível markdown
      const match = raw.match(/\{[\s\S]*\}/)
      soap = match ? JSON.parse(match[0]) : {}
    }

    return NextResponse.json({ soap, transcript })
  } catch (err) {
    console.error('[vet/analyze]', err)
    return NextResponse.json({ error: 'Erro na análise com IA' }, { status: 500 })
  }
}
