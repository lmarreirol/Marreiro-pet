import { jsPDF } from 'jspdf'

type Prescription = {
  medication: string
  dose: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
}

type ExamOrder = {
  examName: string
  notes: string | null
}

type PdfData = {
  clinicName?: string
  vetName?: string | null
  date: string
  petName: string
  petSpecies: string
  petBreed?: string | null
  tutorName: string
  tutorPhone: string
  avaliacao?: string | null
  aiRetorno?: string | null
  prescriptions: Prescription[]
  examOrders?: ExamOrder[]
}

export function generatePrescriptionPdf(data: PdfData): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 20
  let y = margin

  const orange = [249, 115, 22] as [number, number, number]
  const dark = [17, 24, 39] as [number, number, number]
  const gray = [107, 114, 128] as [number, number, number]
  const lightGray = [243, 244, 246] as [number, number, number]

  // Header bar
  doc.setFillColor(...orange)
  doc.rect(0, 0, W, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(data.clinicName ?? 'Marreiro Pet', margin, 11)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Receituário Veterinário', margin, 15.5)

  y = 26

  // Date & vet
  doc.setTextColor(...gray)
  doc.setFontSize(8)
  const dateLabel = new Date(data.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(`Data: ${dateLabel}`, margin, y)
  if (data.vetName) doc.text(`Veterinário(a): Dr(a). ${data.vetName}`, W / 2, y)
  y += 8

  // Divider
  doc.setDrawColor(...lightGray)
  doc.line(margin, y, W - margin, y)
  y += 6

  // Patient block
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(margin, y, W - margin * 2, 22, 3, 3, 'F')
  doc.setTextColor(...dark)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('PACIENTE', margin + 4, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nome: ${data.petName}`, margin + 4, y + 12)
  doc.text(`Espécie/Raça: ${data.petSpecies}${data.petBreed ? ` — ${data.petBreed}` : ''}`, margin + 4, y + 17)
  doc.text(`Tutor: ${data.tutorName}  |  Tel: ${data.tutorPhone}`, W / 2, y + 12)
  y += 28

  // Diagnosis
  if (data.avaliacao) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...orange)
    doc.setFontSize(8)
    doc.text('DIAGNÓSTICO / AVALIAÇÃO', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...dark)
    const lines = doc.splitTextToSize(data.avaliacao, W - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 6
  }

  // Prescriptions
  if (data.prescriptions.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...orange)
    doc.setFontSize(9)
    doc.text('PRESCRIÇÕES', margin, y)
    y += 6

    data.prescriptions.forEach((p, i) => {
      if (y > 255) { doc.addPage(); y = margin }

      doc.setFillColor(249, 250, 251)
      const blockH = p.instructions ? 20 : 15
      doc.roundedRect(margin, y, W - margin * 2, blockH, 2, 2, 'F')

      doc.setFillColor(...orange)
      doc.circle(margin + 5, y + blockH / 2, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text(String(i + 1), margin + 4, y + blockH / 2 + 2.5)

      doc.setTextColor(...dark)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(p.medication, margin + 11, y + 6)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const detail = [p.dose, p.frequency, p.duration ? `por ${p.duration}` : null].filter(Boolean).join(' · ')
      if (detail) doc.text(detail, margin + 11, y + 11)
      if (p.instructions) {
        doc.setTextColor(...gray)
        doc.setFontSize(7)
        doc.text(`Obs: ${p.instructions}`, margin + 11, y + 16)
      }
      y += blockH + 3
    })
    y += 4
  }

  // Exam orders
  if (data.examOrders && data.examOrders.length > 0) {
    if (y > 240) { doc.addPage(); y = margin }
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...orange)
    doc.setFontSize(9)
    doc.text('EXAMES SOLICITADOS', margin, y)
    y += 6

    data.examOrders.forEach(e => {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...dark)
      doc.setFontSize(8)
      doc.text(`• ${e.examName}${e.notes ? ` — ${e.notes}` : ''}`, margin + 3, y)
      y += 6
    })
    y += 4
  }

  // Return
  if (data.aiRetorno) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...orange)
    doc.setFontSize(8)
    doc.text('RETORNO', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...dark)
    doc.text(data.aiRetorno, margin, y)
    y += 10
  }

  // Signature
  const sigY = Math.max(y + 10, 245)
  doc.setDrawColor(...lightGray)
  doc.line(margin, sigY, margin + 70, sigY)
  doc.setTextColor(...gray)
  doc.setFontSize(7)
  doc.text('Assinatura do(a) Veterinário(a)', margin, sigY + 4)
  if (data.vetName) doc.text(`Dr(a). ${data.vetName}`, margin, sigY + 8)

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(...gray)
  doc.text(`Documento gerado em ${new Date().toLocaleString('pt-BR')}`, W / 2, 287, { align: 'center' })

  doc.save(`receituario-${data.petName.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}
