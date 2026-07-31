import { format, differenceInDays, isWithinInterval, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'

// Timezone de São Paulo
export const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo'

/**
 * Retorna a data atual no timezone de São Paulo
 */
export function getNowSaoPaulo(): Date {
  return toZonedTime(new Date(), SAO_PAULO_TIMEZONE)
}

/**
 * Retorna a data de hoje no formato ISO (YYYY-MM-DD) no timezone de São Paulo
 * USE ESTA FUNÇÃO em vez de new Date().toISOString().split('T')[0]
 */
export function getTodayDateSP(): string {
  return formatInTimeZone(new Date(), SAO_PAULO_TIMEZONE, 'yyyy-MM-dd')
}

/**
 * Retorna a hora atual no timezone de São Paulo
 */
export function getCurrentTimeSP(): string {
  return formatInTimeZone(new Date(), SAO_PAULO_TIMEZONE, 'HH:mm')
}

/**
 * Retorna a hora atual (número) no timezone de São Paulo
 */
export function getCurrentHourSP(): number {
  const now = getNowSaoPaulo()
  return now.getHours()
}

/**
 * Formata uma data no timezone de São Paulo
 */
export function formatDateSP(date: Date, formatStr: string): string {
  return formatInTimeZone(date, SAO_PAULO_TIMEZONE, formatStr, { locale: ptBR })
}

/**
 * Formata data em português brasileiro
 * Ex: "Terça-feira, 24 de Dezembro"
 */
export function formatDatePtBr(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
}

/**
 * Formata data curta
 * Ex: "24/12/2024"
 */
export function formatDateShort(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

/**
 * Retorna saudação baseada na hora atual (timezone de São Paulo)
 */
export function getGreeting(): string {
  const hour = getCurrentHourSP()

  if (hour >= 5 && hour < 12) {
    return 'Bom dia'
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde'
  } else {
    return 'Boa noite'
  }
}

/**
 * Calcula dias até uma data alvo
 */
export function getDaysUntil(targetDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  return differenceInDays(target, today)
}

/**
 * Verifica se o horário atual está em um intervalo
 * @param start Horário de início (formato "HH:mm")
 * @param end Horário de fim (formato "HH:mm")
 */
export function isInTimeRange(start: string, end: string): boolean {
  const now = new Date()
  const today = new Date()

  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)

  const startTime = setMinutes(setHours(today, startHour), startMin)
  const endTime = setMinutes(setHours(today, endHour), endMin)

  return isWithinInterval(now, { start: startTime, end: endTime })
}

/**
 * Retorna a hora atual formatada (timezone de São Paulo)
 */
export function getCurrentTime(): string {
  return getCurrentTimeSP()
}

/**
 * Converte string de horário para Date
 */
export function parseTimeString(timeString: string): Date {
  const today = new Date()
  const [hours, minutes] = timeString.split(':').map(Number)
  return setMinutes(setHours(today, hours), minutes)
}

/**
 * Calcula diferença em minutos entre agora e um horário
 */
export function getMinutesUntil(timeString: string): number {
  const now = new Date()
  const target = parseTimeString(timeString)
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60))
}

/**
 * Formata minutos em horas e minutos
 * Ex: 90 -> "1h 30min"
 */
export function formatMinutesToTime(minutes: number): string {
  if (minutes < 0) return '0min'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

/**
 * Retorna o dia da semana atual
 */
export function getCurrentDayOfWeek(): string {
  return format(new Date(), 'EEEE', { locale: ptBR })
}

/**
 * Retorna data de hoje no formato ISO (YYYY-MM-DD) - timezone de São Paulo
 */
export function getTodayISO(): string {
  return getTodayDateSP()
}

/**
 * Retorna data offset por N dias a partir de hoje (SP), no formato YYYY-MM-DD.
 * Ex: getDateOffsetSP(-7) → 7 dias atrás. getDateOffsetSP(7) → 7 dias à frente.
 * USE em vez de `new Date(); d.setDate(d.getDate() - N); d.toISOString().split('T')[0]`
 */
export function getDateOffsetSP(daysOffset: number): string {
  const ms = Date.now() + daysOffset * 24 * 60 * 60 * 1000
  return formatInTimeZone(new Date(ms), SAO_PAULO_TIMEZONE, 'yyyy-MM-dd')
}

/**
 * Retorna o primeiro dia do mês corrente (SP), no formato YYYY-MM-DD.
 */
export function getMonthStartSP(): string {
  return formatInTimeZone(new Date(), SAO_PAULO_TIMEZONE, 'yyyy-MM') + '-01'
}

/**
 * Retorna o INÍCIO do dia atual em SP no formato ISO UTC.
 * Ex: 2026-05-13T03:00:00.000Z (meia-noite SP = 03:00 UTC).
 *
 * USE para filtros tipo `.gte('created_at', getStartOfTodaySP())` quando
 * quiser pegar tudo que aconteceu desde meia-noite no fuso de SP.
 *
 * NUNCA use `new Date(); d.setHours(0,0,0,0); d.toISOString()` no
 * servidor — isso retorna meia-noite UTC, que em BRT é 21h do dia
 * anterior, fazendo o "hoje" pular indevidamente.
 */
export function getStartOfTodaySP(): string {
  const todayDateSP = getTodayDateSP() // YYYY-MM-DD em SP
  // Brasil aboliu DST — sempre -03:00. Construa string ISO com offset SP.
  return new Date(`${todayDateSP}T00:00:00-03:00`).toISOString()
}

/**
 * Idade em anos completos numa data de referência.
 *
 * Compara as strings YYYY-MM-DD diretamente, sem construir Date — assim não há
 * risco de o fuso empurrar o aniversário um dia para trás ou para frente.
 * Retorna null quando a data de nascimento é inválida ou futura.
 */
export function calcularIdade(
  dataNascimento: string | null | undefined,
  dataReferencia: string = getTodayDateSP()
): number | null {
  if (!dataNascimento) return null

  const nascimento = dataNascimento.slice(0, 10)
  const referencia = dataReferencia.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(referencia)) return null

  const [anoN, mesN, diaN] = nascimento.split('-').map(Number)
  const [anoR, mesR, diaR] = referencia.split('-').map(Number)

  let idade = anoR - anoN
  if (mesR < mesN || (mesR === mesN && diaR < diaN)) idade -= 1

  if (idade < 0 || idade > 130) return null
  return idade
}
