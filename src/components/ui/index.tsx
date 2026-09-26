import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { capitalizar } from '@/lib/formato'

/* -------------------------------------------------------------------------- */
/* Botão                                                                       */
/* -------------------------------------------------------------------------- */

type VarianteBotao = 'principal' | 'secundario' | 'discreto' | 'perigo'

const ESTILO_BOTAO: Record<VarianteBotao, string> = {
  principal:
    'bg-[var(--color-marca)] text-white hover:brightness-110 active:brightness-95 shadow-sm',
  secundario:
    'bg-[var(--color-superficie)] text-[var(--color-texto)] border border-[var(--color-borda-forte)] hover:bg-[var(--color-superficie-2)]',
  discreto:
    'bg-transparent text-[var(--color-texto-suave)] hover:bg-[var(--color-superficie-2)] hover:text-[var(--color-texto)]',
  perigo: 'bg-[var(--color-erro)] text-white hover:brightness-110 active:brightness-95',
}

interface PropsBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variante?: VarianteBotao
  readonly carregando?: boolean
  readonly icone?: ReactNode
}

export function Botao({
  variante = 'secundario',
  carregando = false,
  icone,
  children,
  className = '',
  disabled,
  ...resto
}: PropsBotao) {
  const inativo = disabled ?? false
  return (
    <button
      type="button"
      disabled={inativo || carregando}
      aria-busy={carregando}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium',
        'transition-[background-color,filter,color] duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        ESTILO_BOTAO[variante],
        className,
      ].join(' ')}
      {...resto}
    >
      {carregando ? <Giro tamanho={14} /> : icone}
      {children}
    </button>
  )
}

/** Indicador de atividade. Pequeno e discreto — giro grande é ruído. */
export function Giro({ tamanho = 16 }: { readonly tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Etiqueta                                                                    */
/* -------------------------------------------------------------------------- */

export type TomEtiqueta = 'neutro' | 'sucesso' | 'aviso' | 'erro' | 'atencao' | 'marca'

const ESTILO_ETIQUETA: Record<TomEtiqueta, string> = {
  neutro: 'bg-[var(--color-superficie-2)] text-[var(--color-texto-suave)] border-[var(--color-borda)]',
  sucesso: 'bg-[var(--color-sucesso-suave)] text-[var(--color-sucesso)] border-transparent',
  aviso: 'bg-[var(--color-aviso-suave)] text-[var(--color-aviso)] border-transparent',
  erro: 'bg-[var(--color-erro-suave)] text-[var(--color-erro)] border-transparent',
  atencao: 'bg-[var(--color-atencao-suave)] text-[var(--color-atencao)] border-transparent',
  marca: 'bg-[var(--color-marca-suave)] text-[var(--color-marca)] border-transparent',
}

export function Etiqueta({
  tom = 'neutro',
  children,
  className = '',
}: {
  readonly tom?: TomEtiqueta
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        ESTILO_ETIQUETA[tom],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

/**
 * Etiqueta de situação.
 *
 * A cor não é a única informação: cada etiqueta traz o texto. Quem não distingue
 * cor (ou usa leitor de tela) recebe a mesma informação — critério de WCAG que
 * quase todo painel esquece.
 */
export function EtiquetaSituacao({ situacao }: { readonly situacao: string }) {
  const tom: TomEtiqueta =
    situacao === 'pago' || situacao === 'ativo'
      ? 'sucesso'
      : situacao === 'pendente'
        ? 'aviso'
        : situacao === 'cancelado' || situacao === 'inadimplente'
          ? 'erro'
          : situacao === 'enviado'
            ? 'atencao'
            : 'neutro'

  return <Etiqueta tom={tom}>{capitalizar(situacao)}</Etiqueta>
}

/* -------------------------------------------------------------------------- */
/* Cartão e estrutura                                                          */
/* -------------------------------------------------------------------------- */

export function Cartao({
  children,
  className = '',
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <section
      className={[
        'rounded-[var(--radius-caixa)] border border-[var(--color-borda)]',
        'bg-[var(--color-superficie)] shadow-[0_1px_2px_oklch(0_0_0/0.04)]',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  )
}

/**
 * `exactOptionalPropertyTypes` está ligado, então propriedade opcional aceita
 * `undefined` de forma explícita. É mais verboso e é o ponto: obriga a pensar se
 * "não informado" e "informado como vazio" são a mesma coisa — quase nunca são.
 */
export function CabecalhoCartao({
  titulo,
  descricao,
  acoes,
}: {
  readonly titulo: string
  readonly descricao?: string | undefined
  readonly acoes?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-borda)] px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{titulo}</h2>
        {descricao ? (
          <p className="mt-0.5 text-sm text-[var(--color-texto-suave)]">{descricao}</p>
        ) : null}
      </div>
      {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
    </header>
  )
}

/** Número em destaque, para o topo das telas. */
export function Indicador({
  rotulo,
  valor,
  detalhe,
}: {
  readonly rotulo: string
  readonly valor: string
  readonly detalhe?: string | undefined
}) {
  return (
    <div className="rounded-[var(--radius-caixa)] border border-[var(--color-borda)] bg-[var(--color-superficie)] px-4 py-3">
      <p className="text-xs font-medium tracking-wide text-[var(--color-texto-fraco)] uppercase">
        {rotulo}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{valor}</p>
      {detalhe ? <p className="mt-0.5 text-xs text-[var(--color-texto-suave)]">{detalhe}</p> : null}
    </div>
  )
}
