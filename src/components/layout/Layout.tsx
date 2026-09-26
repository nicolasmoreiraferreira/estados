import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { To } from 'react-router-dom'
import { useEffect, useRef } from 'react'

import { FaixaCondicao } from '@/components/simulador/FaixaCondicao'
import { PainelSimulacao } from '@/components/simulador/PainelSimulacao'

/**
 * Estrutura da aplicação.
 *
 * Detalhes de acessibilidade que não são opcionais:
 *
 * - **Link de pular para o conteúdo.** Quem navega por teclado não deve
 *   atravessar o cabeçalho inteiro em toda troca de tela.
 * - **Foco levado ao conteúdo na troca de rota.** Sem isso, uma aplicação de
 *   página única deixa o foco no link antigo, e a próxima tecla continua
 *   navegando pelo menu — comportamento desorientador, e o defeito de
 *   acessibilidade mais comum em SPA.
 * - **`aria-current`** marcando a rota ativa, para leitor de tela anunciar onde
 *   se está.
 */

const ROTAS = [
  { para: '/', rotulo: 'Painel', fim: true },
  { para: '/pedidos', rotulo: 'Pedidos', fim: false },
  { para: '/agenda', rotulo: 'Agenda', fim: false },
  { para: '/catalogo', rotulo: 'Catálogo', fim: false },
  { para: '/clientes', rotulo: 'Clientes', fim: false },
  { para: '/sobre', rotulo: 'Sobre', fim: false },
] as const

export function Layout() {
  const { pathname, search } = useLocation()
  const conteudoRef = useRef<HTMLElement>(null)
  const primeiraRenderizacao = useRef(true)

  useEffect(() => {
    // Não roubar o foco na primeira carga: quem abriu a página ainda não
    // interagiu, e mover o foco interromperia a leitura do topo.
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false
      return
    }
    conteudoRef.current?.focus()
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-[var(--color-marca)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-40 border-b border-[var(--color-borda)] bg-[color-mix(in_oklch,var(--color-superficie)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <NavLink
            to={`/${search}` as To}
            className="flex shrink-0 items-center gap-2"
            aria-label="Estados — início"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-[var(--color-texto)] text-white">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 18 8 7l4 6 2.5-3.5L20 18z" fill="currentColor" />
                <circle cx="17.5" cy="6.5" r="2" fill="var(--color-marca)" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight">Estados</span>
          </NavLink>

          <nav aria-label="Seções do app" className="min-w-0 flex-1">
            <ul className="flex items-center gap-0.5 overflow-x-auto">
              {ROTAS.map((rota) => (
                <li key={rota.para}>
                  <NavLink
                    to={`${rota.para}${search}` as To}
                    end={rota.fim}
                    className={({ isActive }) =>
                      [
                        'block rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                        isActive
                          ? 'bg-[var(--color-superficie-2)] font-medium text-[var(--color-texto)]'
                          : 'text-[var(--color-texto-suave)] hover:bg-[var(--color-superficie-2)] hover:text-[var(--color-texto)]',
                      ].join(' ')
                    }
                  >
                    {rota.rotulo}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <FaixaCondicao />

      <main
        id="conteudo"
        ref={conteudoRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8"
      >
        <Outlet />
      </main>

      <footer className="border-t border-[var(--color-borda)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-[var(--color-texto-fraco)] sm:px-6">
          <p>
            Projeto de portfólio — React, TypeScript, Vite e Tailwind.{' '}
            <a
              href="https://github.com/nicolasmoreiraferreira/estados"
              className="underline decoration-dotted underline-offset-2 hover:text-[var(--color-texto-suave)]"
            >
              Código no GitHub
            </a>
            .
          </p>
          <p>Os dados são fictícios e a API é simulada no navegador.</p>
        </div>
      </footer>

      <PainelSimulacao />
    </div>
  )
}
