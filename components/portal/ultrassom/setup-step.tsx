'use client'

import { useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import type { WizardState } from './collection-wizard'
import {
  USG_PROTOCOLS,
  collectionOrder,
  isProtocolCompatibleWithSexo,
} from '@/lib/usg/protocols'
import type { UsgProtocolCode, UsgSexo } from '@/lib/usg/types'
import { cn } from '@/lib/utils'

interface SetupStepProps {
  estado: WizardState
  onChange: (parcial: Partial<WizardState>) => void
  onIniciar: () => void
  temAvaliacaoAnterior: boolean
  /** true quando já há medidas — o setup virou "editar dados da avaliação". */
  jaColetou: boolean
  /** Protocolo do histórico do paciente, para avisar sobre troca. */
  protocoloDoHistorico: UsgProtocolCode | null
}

const MOMENTOS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'] as const

const REGRAS = [
  'Lado direito do corpo, sempre',
  'Camada generosa de gel (3 a 5 mm)',
  'Pressão mínima no transdutor',
  'Transdutor perpendicular à pele',
  'Duas medidas por ponto (três se divergirem)',
]

export function SetupStep({
  estado,
  onChange,
  onIniciar,
  temAvaliacaoAnterior,
  jaColetou,
  protocoloDoHistorico,
}: SetupStepProps) {
  const [protocoloAberto, setProtocoloAberto] = useState(!temAvaliacaoAnterior)

  const sexo = estado.sexo
  const protocolosDisponiveis = (
    Object.values(USG_PROTOCOLS) as Array<(typeof USG_PROTOCOLS)[UsgProtocolCode]>
  ).filter((p) => p.code !== 'livre' && (!sexo || isProtocolCompatibleWithSexo(p.code, sexo)))

  const protocoloSelecionado = USG_PROTOCOLS[estado.protocolo]
  const exigeEquacao = protocoloSelecionado.densityEquationBySexo !== null
  const totalPontos = collectionOrder(estado.protocolo, estado.medirMusculo).length

  // As mesmas faixas que o servidor aplica. Validar aqui evita a nutricionista
  // descobrir o erro só depois de medir os 7 pontos.
  const pesoNumero = estado.peso ? Number(estado.peso.replace(',', '.')) : null
  const pesoInvalido =
    pesoNumero !== null &&
    (!Number.isFinite(pesoNumero) || pesoNumero < 20 || pesoNumero > 400)

  const idadeNumero = estado.idade ? Number(estado.idade) : null
  const idadeInvalida =
    idadeNumero !== null &&
    (!Number.isFinite(idadeNumero) || idadeNumero < 10 || idadeNumero > 100)

  const trocouProtocolo =
    protocoloDoHistorico !== null && protocoloDoHistorico !== estado.protocolo
  const faltaSexo = exigeEquacao && !sexo
  const faltaIdade = exigeEquacao && !estado.idade

  const trocarSexo = (novo: UsgSexo) => {
    // Trocar o sexo pode invalidar o protocolo escolhido (JP3 é específico).
    const protocoloAindaVale = isProtocolCompatibleWithSexo(estado.protocolo, novo)
    onChange({
      sexo: novo,
      protocolo: protocoloAindaVale
        ? estado.protocolo
        : novo === 'feminino'
          ? 'jp3_mulheres'
          : 'jp7',
    })
  }

  return (
    <div className="h-full overflow-y-auto px-4 pb-28 pt-4">
      {/* Protocolo */}
      <fieldset>
        <legend className="text-label text-foreground-muted uppercase tracking-wide mb-2">
          Protocolo
        </legend>
        {trocouProtocolo && (
          <p className="text-label-sm text-[#8a6432] mb-2">
            As avaliações anteriores deste paciente usaram outro protocolo. Trocar
            começa uma série nova — a comparação com o histórico deixa de existir.
          </p>
        )}
        <div className="grid grid-cols-1 gap-2">
          {protocolosDisponiveis.map((protocolo) => {
            const ativo = protocolo.code === estado.protocolo
            return (
              <button
                key={protocolo.code}
                type="button"
                onClick={() => onChange({ protocolo: protocolo.code })}
                aria-pressed={ativo}
                className={cn(
                  'text-left p-3 rounded-xl border transition-colors min-h-[72px]',
                  ativo
                    ? 'border-dourado bg-dourado/10'
                    : 'border-border bg-background-card hover:border-dourado/40'
                )}
              >
                <p className="font-medium text-foreground">{protocolo.label}</p>
                <p className="text-label-sm text-foreground-secondary mt-0.5">
                  {protocolo.descricao}
                </p>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Sexo — obrigatório para a equação, então nunca é presumido */}
      <fieldset className="mt-5">
        <legend className="text-label text-foreground-muted uppercase tracking-wide mb-2">
          Sexo (define a equação)
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(['feminino', 'masculino'] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => trocarSexo(opcao)}
              aria-pressed={sexo === opcao}
              className={cn(
                'h-12 rounded-xl border capitalize transition-colors',
                sexo === opcao
                  ? 'border-dourado bg-dourado/10 text-foreground'
                  : 'border-border bg-background-card text-foreground-secondary'
              )}
            >
              {opcao}
            </button>
          ))}
        </div>
        {faltaSexo && (
          <p className="text-label-sm text-vinho mt-1.5">
            O cadastro não tem essa informação. Escolha para o cálculo sair certo.
          </p>
        )}
      </fieldset>

      {/* Momento */}
      <fieldset className="mt-5">
        <legend className="text-label text-foreground-muted uppercase tracking-wide mb-2">
          Momento do programa
        </legend>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {MOMENTOS.map((momento) => (
            <button
              key={momento}
              type="button"
              onClick={() =>
                onChange({ momento: estado.momento === momento ? '' : momento })
              }
              aria-pressed={estado.momento === momento}
              className={cn(
                'h-12 min-w-[56px] px-3 rounded-xl border shrink-0 transition-colors',
                estado.momento === momento
                  ? 'border-dourado bg-dourado/10 text-foreground'
                  : 'border-border bg-background-card text-foreground-secondary'
              )}
            >
              {momento}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Dados do cálculo */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        <label className="block">
          <span className="text-label text-foreground-muted">Data</span>
          <input
            type="date"
            value={estado.data}
            onChange={(e) => onChange({ data: e.target.value })}
            className="input-default w-full h-12 mt-1"
          />
        </label>
        <label className="block">
          <span className="text-label text-foreground-muted">Idade</span>
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={100}
            value={estado.idade}
            onChange={(e) => onChange({ idade: e.target.value })}
            className="input-default w-full h-12 mt-1"
            placeholder="anos"
          />
        </label>
        <label className="block">
          <span className="text-label text-foreground-muted">Peso (kg)</span>
          <input
            type="text"
            inputMode="decimal"
            value={estado.peso}
            onChange={(e) => onChange({ peso: e.target.value })}
            className="input-default w-full h-12 mt-1"
            placeholder="ex: 72,4"
          />
        </label>
        <label className="block">
          <span className="text-label text-foreground-muted">Aparelho</span>
          <input
            type="text"
            value={estado.equipamento}
            onChange={(e) => onChange({ equipamento: e.target.value })}
            maxLength={120}
            className="input-default w-full h-12 mt-1"
          />
        </label>
      </div>

      {faltaIdade && (
        <p className="text-label-sm text-vinho mt-1.5">
          Informe a idade — ela entra direto na equação.
        </p>
      )}
      {idadeInvalida && (
        <p className="text-label-sm text-vinho mt-1.5">
          Idade fora da faixa aceita (10 a 100 anos).
        </p>
      )}
      {pesoInvalido && (
        <p className="text-label-sm text-vinho mt-1.5">
          Peso fora da faixa aceita (20 a 400 kg). Confira a vírgula.
        </p>
      )}
      {!estado.peso && (
        <p className="text-label-sm text-foreground-muted mt-1.5">
          Sem o peso, o percentual de gordura ainda é calculado, mas massa gorda e
          massa magra ficam indisponíveis.
        </p>
      )}

      {/* Espessura muscular */}
      <label className="flex items-center justify-between gap-3 mt-5 p-3 rounded-xl border border-border bg-background-card min-h-[56px]">
        <span>
          <span className="text-foreground font-medium">
            Medir espessura muscular
          </span>
          <span className="block text-label-sm text-foreground-secondary">
            Adiciona {USG_PROTOCOLS[estado.protocolo].muscleSites.length} pontos ao
            final
          </span>
        </span>
        <input
          type="checkbox"
          checked={estado.medirMusculo}
          onChange={(e) => onChange({ medirMusculo: e.target.checked })}
          className="w-6 h-6 accent-[#c29863]"
        />
      </label>

      {/* Protocolo de coleta */}
      <div className="mt-5 rounded-xl border border-border bg-background-card overflow-hidden">
        <button
          type="button"
          onClick={() => setProtocoloAberto((v) => !v)}
          aria-expanded={protocoloAberto}
          className="w-full flex items-center justify-between p-3 min-h-[56px]"
        >
          <span className="flex items-center gap-2 text-foreground font-medium">
            <Info className="w-4 h-4 text-dourado" aria-hidden="true" />
            Padronização da coleta
          </span>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-foreground-muted transition-transform',
              protocoloAberto && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>
        {protocoloAberto && (
          <ul className="px-3 pb-3 space-y-1.5">
            {REGRAS.map((regra) => (
              <li
                key={regra}
                className="text-body-md text-foreground-secondary flex gap-2"
              >
                <span className="text-dourado" aria-hidden="true">
                  •
                </span>
                {regra}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Ação */}
      <div className="fixed inset-x-0 bottom-0 p-4 bg-background-card border-t border-border safe-bottom">
        <button
          type="button"
          onClick={onIniciar}
          disabled={
            faltaSexo || faltaIdade || idadeInvalida || pesoInvalido || totalPontos === 0
          }
          className="w-full h-14 rounded-xl btn-gradient text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado"
        >
          {jaColetou
            ? 'Voltar à revisão'
            : `Iniciar coleta · ${totalPontos} ${totalPontos === 1 ? 'ponto' : 'pontos'}`}
        </button>
      </div>
    </div>
  )
}
