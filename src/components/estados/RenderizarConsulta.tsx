import type { ReactNode } from 'react'

import { AvisoDemora, BlocoErro, Esqueleto } from '@/components/estados'
import { Cartao, CabecalhoCartao } from '@/components/ui'
import type { EstadoConsulta } from '@/lib/api/usarConsulta'

/**
 * Renderizador de consulta.
 *
 * Esta é a peça que faz o projeto cumprir a promessa. Cada tela entrega o estado
 * da consulta e **três funções de renderização** — uma para o conteúdo e uma
 * para cada tipo de vazio. Não existe caminho para esquecer o tratamento de
 * erro: quem escreve a tela não tem onde colocar o conteúdo sem passar por aqui.
 *
 * A alternativa comum é cada tela fazer `if (carregando) ... if (erro) ...` e,
 * na pressa, esquecer um ramo. Aí o erro vira tela branca. Concentrar o
 * tratamento em um lugar significa corrigir uma vez e valer para todas as telas.
 */
export function RenderizarConsulta<T>({
  estado,
  aoRecarregar,
  aoAutenticar,
  titulo,
  descricao,
  acoes,
  linhasEsqueleto = 6,
  colunasEsqueleto = 4,
  vazio,
  renderizar,
}: {
  readonly estado: EstadoConsulta<T>
  readonly aoRecarregar: () => void
  readonly aoAutenticar?: (() => void) | undefined
  readonly titulo: string
  readonly descricao?: string | undefined
  readonly acoes?: ReactNode
  readonly linhasEsqueleto?: number
  readonly colunasEsqueleto?: number
  /**
   * Renderiza o estado vazio, ou devolve `null` quando há conteúdo a mostrar.
   *
   * A convenção é deliberada: quem escreve a tela decide o que é "vazio" para o
   * seu domínio — lista sem itens e lista filtrada até zerar são situações
   * diferentes, com textos e ações diferentes.
   */
  readonly vazio: (dados: T) => ReactNode
  readonly renderizar: (dados: T, aviso: string | null) => ReactNode
}) {
  const corpo = ((): ReactNode => {
    switch (estado.situacao) {
      case 'carregando':
        return (
          <>
            {estado.demorando ? (
              <AvisoDemora tentativa={estado.tentativa} aoTentarDeNovo={aoRecarregar} />
            ) : null}
            <Esqueleto linhas={linhasEsqueleto} colunas={colunasEsqueleto} />
          </>
        )

      case 'falhou':
        return (
          <BlocoErro
            erro={estado.erro}
            tentativa={estado.tentativa}
            aoTentarDeNovo={estado.podeTentarDeNovo ? aoRecarregar : undefined}
            aoAutenticar={aoAutenticar}
          />
        )

      case 'pronto': {
        const conteudoVazio = vazio(estado.dados)
        if (conteudoVazio !== null && conteudoVazio !== undefined) return conteudoVazio
        return renderizar(estado.dados, estado.aviso)
      }
    }
  })()

  return (
    <Cartao>
      <CabecalhoCartao titulo={titulo} descricao={descricao} acoes={acoes} />
      {corpo}
    </Cartao>
  )
}
