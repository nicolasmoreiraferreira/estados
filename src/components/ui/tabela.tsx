import type { ReactNode } from 'react'

import { Botao } from '@/components/ui'

/**
 * Tabela simples e acessível.
 *
 * Duas decisões:
 *
 * - **`<table>` de verdade.** Grades feitas com `div` são comuns e quebram a
 *   navegação de leitor de tela, que depende de cabeçalho e célula para anunciar
 *   "coluna Preço, valor R$ 289,90".
 * - **Rolagem horizontal contida e rotulada.** A tabela rola dentro do próprio
 *   contêiner (a página não rola de lado) e o contêiner é alcançável por teclado
 *   com `tabIndex` e nome, senão quem não usa mouse não consegue rolar.
 */
export function Tabela({
  legenda,
  cabecalhos,
  children,
  larguraMinima = '44rem',
}: {
  readonly legenda: string
  readonly cabecalhos: readonly { readonly rotulo: string; readonly alinharDireita?: boolean }[]
  readonly children: ReactNode
  readonly larguraMinima?: string
}) {
  return (
    <div
      className="overflow-x-auto"
      tabIndex={0}
      role="region"
      aria-label={`${legenda} — use as setas para rolar`}
    >
      <table className="w-full border-collapse text-sm" style={{ minWidth: larguraMinima }}>
        <caption className="apenas-leitor">{legenda}</caption>
        <thead>
          <tr className="border-b border-[var(--color-borda)] text-left">
            {cabecalhos.map((coluna) => (
              <th
                key={coluna.rotulo}
                scope="col"
                className={[
                  'px-5 py-2.5 text-xs font-semibold tracking-wide text-[var(--color-texto-fraco)] uppercase',
                  coluna.alinharDireita ? 'text-right' : '',
                ].join(' ')}
              >
                {coluna.rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-borda)]">{children}</tbody>
      </table>
    </div>
  )
}

export function LinhaTabela({ children }: { readonly children: ReactNode }) {
  return <tr className="transition-colors hover:bg-[var(--color-superficie-2)]">{children}</tr>
}

export function Celula({
  children,
  alinharDireita = false,
  numerica = false,
  className = '',
}: {
  readonly children: ReactNode
  readonly alinharDireita?: boolean
  readonly numerica?: boolean
  readonly className?: string
}) {
  return (
    <td
      className={[
        'px-5 py-3',
        alinharDireita ? 'text-right' : '',
        numerica ? 'tabular-nums' : '',
        className,
      ].join(' ')}
    >
      {children}
    </td>
  )
}

/**
 * Campo de busca.
 *
 * Rótulo visível associado por `htmlFor` — `placeholder` sozinho não é rótulo:
 * ele desaparece quando o usuário digita, e leitor de tela não o anuncia de
 * forma confiável. A contagem de resultados é anunciada por `aria-live` para
 * quem não vê a lista mudar.
 */
export function CampoBusca({
  valor,
  aoMudar,
  rotulo,
  placeholder,
  resultados,
}: {
  readonly valor: string
  readonly aoMudar: (valor: string) => void
  readonly rotulo: string
  readonly placeholder: string
  readonly resultados?: number
}) {
  return (
    <div className="relative">
      <label htmlFor="campo-busca" className="apenas-leitor">
        {rotulo}
      </label>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-texto-fraco)]"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" strokeLinecap="round" />
      </svg>
      <input
        id="campo-busca"
        type="search"
        value={valor}
        placeholder={placeholder}
        onChange={(evento) => {
          aoMudar(evento.target.value)
        }}
        aria-describedby={resultados === undefined ? undefined : 'busca-resultados'}
        className="w-full rounded-lg border border-[var(--color-borda-forte)] bg-[var(--color-superficie)] py-2 pr-3 pl-9 text-sm placeholder:text-[var(--color-texto-fraco)]"
      />
      {resultados === undefined ? null : (
        <span id="busca-resultados" aria-live="polite" className="apenas-leitor">
          {resultados === 1 ? '1 resultado' : `${String(resultados)} resultados`}
        </span>
      )}
    </div>
  )
}

/** Grupo de botões de filtro, com estado pressionado anunciado. */
export function Filtros<T extends string>({
  opcoes,
  valor,
  aoMudar,
  rotulo,
}: {
  readonly opcoes: readonly { readonly valor: T; readonly rotulo: string }[]
  readonly valor: T
  readonly aoMudar: (valor: T) => void
  readonly rotulo: string
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-1.5">
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor
        return (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => {
              aoMudar(opcao.valor)
            }}
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              ativo
                ? 'border-transparent bg-[var(--color-texto)] text-[var(--color-superficie)]'
                : 'border-[var(--color-borda)] text-[var(--color-texto-suave)] hover:bg-[var(--color-superficie-2)]',
            ].join(' ')}
          >
            {opcao.rotulo}
          </button>
        )
      })}
    </div>
  )
}

/** Paginação com a contagem sempre visível. */
export function Paginacao({
  pagina,
  totalPaginas,
  total,
  aoMudar,
}: {
  readonly pagina: number
  readonly totalPaginas: number
  readonly total: number
  readonly aoMudar: (pagina: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-borda)] px-5 py-3 text-sm">
      <p className="text-[var(--color-texto-suave)]">
        Página {pagina} de {totalPaginas} · {total} registros
      </p>
      <div className="flex gap-2">
        <Botao
          variante="secundario"
          disabled={pagina <= 1}
          onClick={() => {
            aoMudar(pagina - 1)
          }}
        >
          Anterior
        </Botao>
        <Botao
          variante="secundario"
          disabled={pagina >= totalPaginas}
          onClick={() => {
            aoMudar(pagina + 1)
          }}
        >
          Próxima
        </Botao>
      </div>
    </div>
  )
}
