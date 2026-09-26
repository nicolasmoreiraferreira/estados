import { Etiqueta } from '@/components/ui'
import { usarDefinicaoCondicao } from '@/lib/simulacao/usarCondicao'

/**
 * Faixa que lembra qual condição está ativa.
 *
 * Um simulador ligado sem aviso é uma armadilha: quem abre o site e vê "erro no
 * servidor" conclui que o projeto está quebrado, não que aquilo é uma
 * demonstração. Esta faixa existe para que nunca haja dúvida sobre o que está
 * sendo mostrado — e o texto muda conforme o grupo, porque "sem internet" e
 * "dado inválido" pedem explicações diferentes.
 */
export function FaixaCondicao() {
  const definicao = usarDefinicaoCondicao()

  if (definicao.id === 'normal') return null

  const tom =
    definicao.grupo === 'falha' ? 'erro' : definicao.grupo === 'dados' ? 'atencao' : 'marca'

  return (
    <div
      role="status"
      aria-live="polite"
      className="animar-entrada border-b border-[var(--color-borda)] bg-[var(--color-superficie-2)]"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 sm:px-6">
        <Etiqueta tom={tom}>Simulando: {definicao.rotulo}</Etiqueta>
        <p className="text-xs text-[var(--color-texto-suave)]">
          <span className="text-[var(--color-texto-fraco)]">Esperado — </span>
          {definicao.oQueDeveAcontecer}
        </p>
      </div>
    </div>
  )
}
