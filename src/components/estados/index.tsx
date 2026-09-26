import type { ReactNode } from 'react'

import { Botao, Etiqueta } from '@/components/ui'
import type { ErroApp } from '@/lib/api/erros'

/* -------------------------------------------------------------------------- */
/* Ícones                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Ícones desenhados à mão, em SVG.
 *
 * Sem biblioteca de ícones: são cinco formas, e o projeto não deve carregar
 * centenas de kB para desenhar cinco formas. Todos são `aria-hidden` porque
 * nunca carregam significado sozinhos — o texto ao lado é que informa.
 */
const comum = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function IconeAlerta({ tamanho = 20 }: { readonly tamanho?: number }) {
  return (
    <svg {...comum} width={tamanho} height={tamanho}>
      <path d="M12 3.5 2.8 19.2h18.4L12 3.5Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function IconeSinal({ tamanho = 20 }: { readonly tamanho?: number }) {
  return (
    <svg {...comum} width={tamanho} height={tamanho}>
      <path d="M5 12.5a10 10 0 0 1 14 0" />
      <path d="M8.2 15.8a5.6 5.6 0 0 1 7.6 0" />
      <circle cx="12" cy="19" r="0.8" fill="currentColor" />
      <path d="M3 3l18 18" />
    </svg>
  )
}

export function IconeCadeado({ tamanho = 20 }: { readonly tamanho?: number }) {
  return (
    <svg {...comum} width={tamanho} height={tamanho}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </svg>
  )
}

export function IconeCaixa({ tamanho = 20 }: { readonly tamanho?: number }) {
  return (
    <svg {...comum} width={tamanho} height={tamanho}>
      <path d="M3.5 8.2 12 3.5l8.5 4.7v7.6L12 20.5l-8.5-4.7V8.2Z" />
      <path d="M3.5 8.2 12 13l8.5-4.8M12 13v7.5" />
    </svg>
  )
}

export function IconeRelogio({ tamanho = 20 }: { readonly tamanho?: number }) {
  return (
    <svg {...comum} width={tamanho} height={tamanho}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

export function IconeConflito({ tamanho = 20 }: { readonly tamanho?: number }) {
  return (
    <svg {...comum} width={tamanho} height={tamanho}>
      <path d="M7 4v13a2 2 0 0 0 2 2h9" />
      <path d="M17 20V7a2 2 0 0 0-2-2H6" />
      <path d="M4 8.5 6.5 6 4 3.5M20 15.5 17.5 18 20 20.5" />
    </svg>
  )
}

export function IconeAtualizar({ tamanho = 16 }: { readonly tamanho?: number }) {
  return (
    <svg {...comum} width={tamanho} height={tamanho}>
      <path d="M20 11.5A8 8 0 0 0 6.2 6.2L3.5 8.8" />
      <path d="M4 12.5a8 8 0 0 0 13.8 5.3l2.7-2.6" />
      <path d="M3.5 4.5v4.3h4.3M20.5 19.5v-4.3h-4.3" />
    </svg>
  )
}

function iconePorTipo(erro: ErroApp, tamanho: number): ReactNode {
  switch (erro.tipo) {
    case 'rede':
      return <IconeSinal tamanho={tamanho} />
    case 'autenticacao':
    case 'permissao':
      return <IconeCadeado tamanho={tamanho} />
    case 'conflito':
      return <IconeConflito tamanho={tamanho} />
    case 'validacao':
      return <IconeCaixa tamanho={tamanho} />
    default:
      return <IconeAlerta tamanho={tamanho} />
  }
}

/* -------------------------------------------------------------------------- */
/* Esqueleto de carregamento                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Esqueleto que preserva o layout.
 *
 * A alternativa comum — um giro no meio da tela — é pior do que parece: quando
 * o dado chega, tudo salta de lugar, e quem está lendo perde a posição. O
 * esqueleto ocupa o espaço final desde o início.
 *
 * `aria-hidden` no desenho e um anúncio único para leitor de tela: doze blocos
 * cinzas não são informação útil para quem não vê.
 */
export function Esqueleto({
  linhas = 6,
  colunas = 4,
  rotulo = 'Carregando',
}: {
  readonly linhas?: number
  readonly colunas?: number
  readonly rotulo?: string
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="apenas-leitor">{rotulo}</span>
      <div className="divide-y divide-[var(--color-borda)]" aria-hidden="true">
        {Array.from({ length: linhas }, (_, linha) => (
          <div key={linha} className="flex items-center gap-4 px-5 py-3.5">
            {Array.from({ length: colunas }, (_, coluna) => (
              <div
                key={coluna}
                className="animar-pulso h-4 rounded bg-[var(--color-superficie-2)]"
                style={{
                  width: coluna === 0 ? '22%' : coluna === colunas - 1 ? '14%' : '20%',
                  animationDelay: `${String(linha * 60)}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Aviso de demora                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Aviso de que está demorando mais que o normal.
 *
 * Existe porque "carregando" e "travado" são indistinguíveis para quem espera.
 * Passado o tempo razoável, a interface precisa dizer que sabe que está demorando
 * e dar controle: continuar esperando ou tentar de novo. Silêncio é o pior
 * comportamento possível.
 */
export function AvisoDemora({
  tentativa,
  aoTentarDeNovo,
}: {
  readonly tentativa: number
  readonly aoTentarDeNovo: () => void
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="animar-entrada flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-borda)] bg-[var(--color-aviso-suave)] px-5 py-3"
    >
      <p className="flex items-center gap-2.5 text-sm text-[var(--color-texto)]">
        <span className="text-[var(--color-aviso)]">
          <IconeRelogio tamanho={18} />
        </span>
        <span>
          Está demorando mais que o normal.
          {tentativa > 1 ? (
            <span className="text-[var(--color-texto-suave)]">
              {' '}
              Nova tentativa {tentativa} em andamento.
            </span>
          ) : null}
        </span>
      </p>
      <Botao variante="secundario" onClick={aoTentarDeNovo} icone={<IconeAtualizar />}>
        Tentar de novo
      </Botao>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Bloco de erro                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Bloco de erro.
 *
 * Quatro decisões que separam isto de um "algo deu errado":
 *
 * 1. Diz o que aconteceu em linguagem de gente, e de quem é o problema —
 *    "o sistema está com um problema" em vez de culpar quem está usando.
 * 2. Oferece a ação certa. Em 403 e 409, tentar de novo não resolve: mostrar o
 *    botão seria mentir para o usuário.
 * 3. Guarda o detalhe técnico atrás de um `details`, para quem for investigar.
 * 4. `role="alert"` anuncia a falha a leitores de tela sem exigir que a pessoa
 *    descubra sozinha que algo mudou.
 */
export function BlocoErro({
  erro,
  aoTentarDeNovo,
  aoAutenticar,
  tentativa,
}: {
  readonly erro: ErroApp
  readonly aoTentarDeNovo?: (() => void) | undefined
  readonly aoAutenticar?: (() => void) | undefined
  readonly tentativa?: number | undefined
}) {
  const mostrarBotao = erro.podeTentarDeNovo && aoTentarDeNovo !== undefined
  const mostrarAcesso = erro.tipo === 'autenticacao' && aoAutenticar !== undefined

  return (
    <div
      role="alert"
      className="animar-entrada flex flex-col items-start gap-4 px-5 py-8 sm:flex-row sm:items-start"
    >
      <span className="rounded-full bg-[var(--color-erro-suave)] p-2.5 text-[var(--color-erro)]">
        {iconePorTipo(erro, 22)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold">{erro.explicacao}</h3>
          {erro.status !== null ? <Etiqueta tom="erro">HTTP {erro.status}</Etiqueta> : null}
          {tentativa !== undefined && tentativa > 1 ? (
            <Etiqueta tom="neutro">{tentativa} tentativas</Etiqueta>
          ) : null}
        </div>

        {erro.proximoPasso ? (
          <p className="mt-1.5 max-w-prose text-sm text-[var(--color-texto-suave)]">
            {erro.proximoPasso}
          </p>
        ) : null}

        {mostrarBotao || mostrarAcesso ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {mostrarAcesso ? (
              <Botao variante="principal" onClick={aoAutenticar}>
                Entrar novamente
              </Botao>
            ) : null}
            {mostrarBotao ? (
              <Botao variante="secundario" onClick={aoTentarDeNovo} icone={<IconeAtualizar />}>
                Tentar de novo
              </Botao>
            ) : null}
          </div>
        ) : null}

        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-[var(--color-texto-fraco)] hover:text-[var(--color-texto-suave)]">
            Detalhe técnico
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--color-superficie-2)] p-3 font-mono text-xs text-[var(--color-texto-suave)]">
            {erro.detalheTecnico}
          </pre>
        </details>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Estado vazio                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Estado vazio.
 *
 * Um estado vazio bem feito responde três perguntas: por que não tem nada, se
 * isso é normal, e o que fazer agora. Tabela sem linhas e sem texto parece
 * defeito — e o usuário fica sem saber se espera ou se age.
 *
 * Os dois vazios são diferentes de propósito: "ainda não há nada" (primeira
 * visita) e "nada corresponde ao filtro" (a ação é limpar o filtro, não criar).
 */
export function BlocoVazio({
  titulo,
  descricao,
  acao,
  tipo = 'sem-resultado',
}: {
  readonly titulo: string
  readonly descricao: string
  readonly acao?: ReactNode
  readonly tipo?: 'sem-resultado' | 'sem-registros'
}) {
  return (
    <div className="animar-entrada flex flex-col items-center gap-3 px-5 py-12 text-center">
      <span className="rounded-full bg-[var(--color-superficie-2)] p-3 text-[var(--color-texto-fraco)]">
        <IconeCaixa tamanho={24} />
      </span>
      <div>
        <h3 className="text-base font-semibold">{titulo}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-texto-suave)]">{descricao}</p>
      </div>
      {tipo === 'sem-resultado' ? (
        <Etiqueta tom="neutro">A consulta funcionou; a lista é que está vazia</Etiqueta>
      ) : null}
      {acao ? <div className="mt-1">{acao}</div> : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Aviso em faixa                                                              */
/* -------------------------------------------------------------------------- */

/** Faixa de aviso para informação que não impede o uso. */
export function FaixaAviso({
  children,
  tom = 'aviso',
}: {
  readonly children: ReactNode
  readonly tom?: 'aviso' | 'atencao' | 'marca'
}) {
  const corTexto =
    tom === 'atencao'
      ? 'text-[var(--color-atencao)]'
      : tom === 'marca'
        ? 'text-[var(--color-marca)]'
        : 'text-[var(--color-aviso)]'

  return (
    <div
      role="status"
      className="animar-entrada flex items-start gap-2.5 border-b border-[var(--color-borda)] bg-[var(--color-superficie-2)] px-5 py-2.5 text-sm"
    >
      <span className={corTexto}>
        <IconeAlerta tamanho={17} />
      </span>
      <span className="text-[var(--color-texto-suave)]">{children}</span>
    </div>
  )
}
