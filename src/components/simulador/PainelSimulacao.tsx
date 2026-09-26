import { useEffect, useRef, useState } from 'react'

import { Etiqueta } from '@/components/ui'
import { GRUPOS, porGrupo } from '@/lib/simulacao/catalogo'
import { definirCondicao } from '@/lib/simulacao/loja'
import type { GrupoCondicao } from '@/lib/simulacao/tipos'
import { usarDefinicaoCondicao } from '@/lib/simulacao/usarCondicao'

/**
 * Painel de simulação.
 *
 * O diferencial do projeto. Sem ele, "trata erro" é afirmação; com ele, é algo
 * que qualquer pessoa verifica em dois cliques — inclusive quem está avaliando
 * o portfólio, que não vai clonar o repositório para testar.
 *
 * Três decisões que fazem diferença no uso:
 *
 * 1. **Cada opção explica o que simula e o que deve acontecer.** Quem escolhe
 *    "erro no servidor" sabe o que esperar, e pode conferir se a tela cumpre.
 *    Sem os dois textos, o painel seria um botão misterioso.
 * 2. **Estado na URL.** Cada condição tem endereço próprio, então o link
 *    "olhe o que acontece quando a rede cai" abre exatamente nisso.
 * 3. **Recolhível.** Ocupa espaço na tela do app — precisa sair da frente
 *    quando não está sendo usado, sem deixar de estar a um clique.
 */
export function PainelSimulacao() {
  const definicao = usarDefinicaoCondicao()
  const [aberto, definirAberto] = useState(false)
  const painelRef = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)

  const ativo = definicao.id !== 'normal'

  // Esc fecha o painel. Quem navega por teclado precisa conseguir sair.
  useEffect(() => {
    if (!aberto) return
    function aoTeclar(evento: KeyboardEvent): void {
      if (evento.key === 'Escape') {
        definirAberto(false)
        botaoRef.current?.focus()
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  // Clique fora fecha — comportamento esperado de um painel flutuante.
  useEffect(() => {
    if (!aberto) return
    function aoClicar(evento: MouseEvent): void {
      const alvo = evento.target as Node
      if (painelRef.current?.contains(alvo) || botaoRef.current?.contains(alvo)) return
      definirAberto(false)
    }
    document.addEventListener('mousedown', aoClicar)
    return () => {
      document.removeEventListener('mousedown', aoClicar)
    }
  }, [aberto])

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 print:hidden">
      {aberto ? (
        <div
          ref={painelRef}
          role="dialog"
          aria-label="Simulador de condições"
          className="animar-entrada flex max-h-[min(78vh,44rem)] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius-caixa)] border border-[var(--color-borda-forte)] bg-[var(--color-superficie)] shadow-2xl"
        >
          <header className="flex items-start justify-between gap-3 border-b border-[var(--color-borda)] px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Simulador de condições</h2>
              <p className="mt-0.5 text-xs text-[var(--color-texto-suave)]">
                Escolha uma situação e veja como o app reage.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                definirAberto(false)
              }}
              className="rounded-md p-1 text-[var(--color-texto-fraco)] hover:bg-[var(--color-superficie-2)] hover:text-[var(--color-texto)]"
              aria-label="Fechar o simulador"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {(Object.keys(GRUPOS) as GrupoCondicao[]).map((grupo) => (
              <fieldset key={grupo} className="border-b border-[var(--color-borda)] last:border-b-0">
                <legend className="px-4 pt-3 pb-1.5 text-xs font-semibold tracking-wide text-[var(--color-texto-fraco)] uppercase">
                  {GRUPOS[grupo]}
                </legend>
                <div className="pb-2">
                  {porGrupo(grupo).map((item) => {
                    const selecionado = item.id === definicao.id
                    return (
                      <label
                        key={item.id}
                        className={[
                          'flex cursor-pointer gap-3 px-4 py-2.5 transition-colors',
                          selecionado
                            ? 'bg-[var(--color-marca-suave)]'
                            : 'hover:bg-[var(--color-superficie-2)]',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="condicao"
                          value={item.id}
                          checked={selecionado}
                          onChange={() => {
                            definirCondicao(item.id)
                          }}
                          className="mt-1 size-4 shrink-0 accent-[var(--color-marca)]"
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.rotulo}</span>
                            {item.status !== null ? (
                              <span className="font-mono text-[10px] text-[var(--color-texto-fraco)]">
                                {item.status}
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-xs text-[var(--color-texto-suave)]">
                            {item.oQueSimula}
                          </span>
                          {selecionado ? (
                            <span className="mt-1.5 block rounded-md bg-[var(--color-superficie)] px-2 py-1.5 text-xs text-[var(--color-texto)]">
                              <strong className="font-medium">Esperado:</strong>{' '}
                              {item.oQueDeveAcontecer}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <footer className="border-t border-[var(--color-borda)] px-4 py-3">
            <p className="text-xs text-[var(--color-texto-fraco)]">
              A condição fica no endereço: copie a barra para enviar um link que já abre nesta
              situação.
            </p>
          </footer>
        </div>
      ) : null}

      <button
        ref={botaoRef}
        type="button"
        onClick={() => {
          definirAberto((valor) => !valor)
        }}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        className={[
          'flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg transition-colors',
          ativo
            ? 'border-transparent bg-[var(--color-marca)] text-white hover:brightness-110'
            : 'border-[var(--color-borda-forte)] bg-[var(--color-superficie)] text-[var(--color-texto)] hover:bg-[var(--color-superficie-2)]',
        ].join(' ')}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <path d="M4 7h10M18 7h2M4 17h4M12 17h8" strokeLinecap="round" />
          <circle cx="16" cy="7" r="2.2" />
          <circle cx="9" cy="17" r="2.2" />
        </svg>
        {aberto ? 'Fechar simulador' : 'Simular situação'}
        {!aberto && ativo ? (
          <Etiqueta tom="marca" className="ml-0.5 bg-white/20 text-white">
            {definicao.rotulo}
          </Etiqueta>
        ) : null}
      </button>
    </div>
  )
}
