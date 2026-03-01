// PDF Generator for Complexo Wellness Reports

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { WeeklyReport, MonthlyReport } from '@/types/reports'

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

interface PDFTheme {
  primary: string
  secondary: string
  success: string
  warning: string
  text: string
  muted: string
}

const defaultTheme: PDFTheme = {
  primary: '#8b5cf6',
  secondary: '#6366f1',
  success: '#22c55e',
  warning: '#f59e0b',
  text: '#1f2937',
  muted: '#6b7280'
}

/**
 * Generates a PDF for weekly report
 */
export async function generateWeeklyReportPDF(report: WeeklyReport): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  const theme = defaultTheme
  let y = 20

  // Header
  doc.setFillColor(139, 92, 246) // violet-500
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.text('Complexo Wellness', 20, 18)

  doc.setFontSize(16)
  doc.text(`Relatório Semanal - Semana ${report.weekNumber}/${report.year}`, 20, 30)

  y = 50

  // Date range
  doc.setTextColor(theme.muted)
  doc.setFontSize(10)
  const startDate = format(report.dateRange.start, "dd 'de' MMMM", { locale: ptBR })
  const endDate = format(report.dateRange.end, "dd 'de' MMMM", { locale: ptBR })
  doc.text(`${startDate} - ${endDate}`, 20, y)

  y += 15

  // Score section
  doc.setTextColor(theme.text)
  doc.setFontSize(14)
  doc.text('Pontuação da Semana', 20, y)

  y += 10
  doc.setFontSize(32)
  doc.setTextColor(139, 92, 246)
  doc.text(`${report.summary.score.average}`, 20, y)
  doc.setFontSize(12)
  doc.setTextColor(theme.muted)
  doc.text('pontos', 50, y)

  // Stats row
  y += 20
  doc.setTextColor(theme.text)
  doc.setFontSize(11)

  // Treino
  doc.text('Treinos', 20, y)
  doc.setFontSize(14)
  doc.text(`${report.summary.workouts.completed}/${report.summary.workouts.planned}`, 20, y + 8)
  doc.setFontSize(9)
  doc.setTextColor(theme.muted)
  doc.text(`${report.summary.workouts.completionRate}% concluído`, 20, y + 15)

  // Calorias
  doc.setTextColor(theme.text)
  doc.setFontSize(11)
  doc.text('Média Calorias', 70, y)
  doc.setFontSize(14)
  doc.text(`${report.summary.nutrition.avgCalories} kcal`, 70, y + 8)

  // Proteína
  doc.setFontSize(11)
  doc.text('Média Proteína', 130, y)
  doc.setFontSize(14)
  doc.text(`${report.summary.nutrition.avgProtein}g`, 130, y + 8)

  // Água
  doc.setFontSize(11)
  doc.text('Média Água', 170, y)
  doc.setFontSize(14)
  doc.text(`${report.summary.hydration.avgDaily}L`, 170, y + 8)

  y += 35

  // Daily breakdown
  doc.setFontSize(12)
  doc.setTextColor(theme.text)
  doc.text('Resumo Diário', 20, y)

  y += 10
  doc.setFontSize(9)
  doc.setTextColor(theme.muted)
  doc.text('Dia', 20, y)
  doc.text('Treino', 60, y)
  doc.text('Refeições', 90, y)
  doc.text('Água', 130, y)
  doc.text('Pontuação', 160, y)

  y += 5
  doc.setDrawColor(200, 200, 200)
  doc.line(20, y, 190, y)

  y += 8
  doc.setTextColor(theme.text)
  report.dailyActivity.forEach((day) => {
    const date = new Date(day.date)
    const dayName = format(date, 'EEE, dd/MM', { locale: ptBR })

    doc.text(dayName, 20, y)
    doc.text(day.workout ? 'Sim' : 'Não', 60, y)
    doc.text(`${day.mealsLogged}`, 90, y)
    doc.text(day.waterGoalMet ? 'Meta' : 'Abaixo', 130, y)
    doc.text(`${day.score}`, 160, y)

    y += 7
  })

  // PRs section
  if (report.prs.length > 0) {
    y += 10
    doc.setFontSize(12)
    doc.text('PRs da Semana', 20, y)

    y += 8
    doc.setFontSize(10)
    report.prs.forEach((pr) => {
      doc.text(`${pr.exercise}: ${pr.weight}kg x ${pr.reps} reps`, 20, y)
      y += 6
    })
  }

  // Insights section
  if (report.insights.length > 0) {
    y += 10
    doc.setFontSize(12)
    doc.text('Principais Insights', 20, y)

    y += 8
    doc.setFontSize(10)
    report.insights.slice(0, 5).forEach((insight) => {
      doc.text(`${insight.icon} ${insight.title}`, 20, y)
      y += 6
    })
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(theme.muted)
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - Complexo Wellness`,
    20,
    285
  )

  return doc.output('blob')
}

/**
 * Generates a PDF for monthly report
 */
export async function generateMonthlyReportPDF(report: MonthlyReport): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  const theme = defaultTheme
  let y = 20

  // Header
  doc.setFillColor(34, 197, 94) // green-500
  doc.rect(0, 0, 210, 45, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.text('Complexo Wellness', 20, 18)

  doc.setFontSize(18)
  doc.text(`Relatório Mensal - ${monthNames[report.month - 1]} ${report.year}`, 20, 32)

  y = 55

  // Executive Summary
  doc.setTextColor(theme.text)
  doc.setFontSize(12)
  doc.text('Resumo Executivo', 20, y)

  y += 8
  doc.setFontSize(10)
  doc.setTextColor(theme.muted)
  const summaryLines = doc.splitTextToSize(report.executiveSummary, 170)
  doc.text(summaryLines, 20, y)

  y += summaryLines.length * 5 + 10

  // Score
  doc.setFontSize(11)
  doc.setTextColor(theme.text)
  doc.text('Pontuação Geral:', 20, y)
  doc.setFontSize(24)
  doc.setTextColor(34, 197, 94)
  doc.text(`${report.overallScore}`, 70, y)
  doc.setFontSize(10)
  doc.setTextColor(theme.muted)
  doc.text(`/ 100 - ${report.ranking}`, 90, y)

  y += 20

  // Stats Grid
  doc.setFontSize(11)
  doc.setTextColor(theme.text)

  // Row 1
  doc.text('Treinos', 20, y)
  doc.setFontSize(14)
  doc.text(`${report.summary.workouts.completed}/${report.summary.workouts.planned}`, 20, y + 8)

  doc.setFontSize(11)
  doc.text('PRs Batidos', 70, y)
  doc.setFontSize(14)
  doc.text(`${report.prs.length}`, 70, y + 8)

  doc.setFontSize(11)
  doc.text('Média Proteína', 120, y)
  doc.setFontSize(14)
  doc.text(`${report.summary.nutrition.avgProtein}g`, 120, y + 8)

  doc.setFontSize(11)
  doc.text('Média Água', 170, y)
  doc.setFontSize(14)
  doc.text(`${report.summary.hydration.avgDaily}L`, 170, y + 8)

  y += 25

  // Weekly Progression
  doc.setFontSize(12)
  doc.setTextColor(theme.text)
  doc.text('Progressão Semanal', 20, y)

  y += 10
  doc.setFontSize(9)
  doc.setTextColor(theme.muted)
  doc.text('Semana', 20, y)
  doc.text('Pontuação', 60, y)
  doc.text('Treinos', 100, y)
  doc.text('Proteína Média', 140, y)

  y += 5
  doc.line(20, y, 190, y)

  y += 8
  doc.setTextColor(theme.text)
  doc.setFontSize(10)
  report.weeklyProgression.forEach((week) => {
    doc.text(`Semana ${week.week}`, 20, y)
    doc.text(`${week.score} pts`, 60, y)
    doc.text(`${week.workouts}`, 100, y)
    doc.text(`${week.avgProtein}g`, 140, y)
    y += 7
  })

  // Body Changes
  y += 10
  doc.setFontSize(12)
  doc.text('Mudanças Corporais', 20, y)

  y += 10
  doc.setFontSize(10)
  if (report.summary.body.weightChange !== null) {
    const sign = report.summary.body.weightChange > 0 ? '+' : ''
    doc.text(`Peso: ${sign}${report.summary.body.weightChange}kg`, 20, y)
  }
  if (report.summary.body.fatChange !== null) {
    const sign = report.summary.body.fatChange > 0 ? '+' : ''
    doc.text(`Gordura: ${sign}${report.summary.body.fatChange}%`, 80, y)
  }
  if (report.summary.body.muscleChange !== null) {
    const sign = report.summary.body.muscleChange > 0 ? '+' : ''
    doc.text(`Músculo: ${sign}${report.summary.body.muscleChange}kg`, 140, y)
  }

  // PRs
  if (report.prs.length > 0) {
    y += 15
    doc.setFontSize(12)
    doc.text('PRs do Mês', 20, y)

    y += 8
    doc.setFontSize(10)
    report.prs.slice(0, 5).forEach((pr) => {
      doc.text(`${pr.exercise}: ${pr.weight}kg x ${pr.reps} reps`, 20, y)
      y += 6
    })
  }

  // Gamification
  y += 10
  doc.setFontSize(12)
  doc.text('Gamificação', 20, y)

  y += 10
  doc.setFontSize(10)
  doc.text(`XP Ganho: ${report.summary.gamification.xpGained.toLocaleString('pt-BR')}`, 20, y)
  doc.text(`Níveis: +${report.summary.gamification.levelsGained}`, 80, y)
  doc.text(`Conquistas: ${report.summary.gamification.achievementsUnlocked}`, 130, y)

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(theme.muted)
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - Complexo Wellness`,
    20,
    285
  )

  return doc.output('blob')
}

/**
 * Downloads a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Captures an HTML element as canvas and returns a blob
 */
export async function captureElementAsImage(element: HTMLElement): Promise<Blob> {
  const { default: html2canvas } = await import('html2canvas')
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false
  })

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/png')
  })
}

/**
 * Generates a PDF from an HTML element
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'l' : 'p',
    unit: 'px',
    format: [canvas.width, canvas.height]
  })

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(filename)
}
