import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Importação por IA temporariamente indisponível. Funcionalidade será reativada em breve.' },
    { status: 503 }
  )
}
