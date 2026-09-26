import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BlocoVazio, FaixaAviso } from '@/components/estados'
import { RenderizarConsulta } from '@/components/estados/RenderizarConsulta'
import { Botao, Etiqueta, Indicador } from '@/components/ui'
import { CampoBusca, Celula, Filtros, LinhaTabela, Tabela } from '@/components/ui/tabela'
import { usarConsulta } from '@/lib/api/usarConsulta'
import { moeda, normalizarBusca, numero } from '@/lib/formato'
import { validarCatalogo, type ItemCatalogo } from './tipos'

/**
 * Tela de catálogo.
 *
 * É aqui que o volume se torna visível. Com cinco mil itens, renderizar todas as
 * linhas de uma vez trava a rolagem — então a lista usa janela de renderização
 * (virtualização): só as linhas próximas da área visível existem no DOM.
 *
 * A implementação é própria, sem biblioteca, para que o mecanismo fique legível:
 * uma altura de linha fixa, o cálculo do intervalo visível a partir da rolagem e
 * um espaçador que mantém a barra de rolagem no tamanho certo. TanStack Virtual
 * faria isso melhor em produção — e o README diz exatamente por que não foi
 * usado aqui.
 *
 * O ganho é mensurável: com 5.000 itens, o DOM mantém ~20 linhas em vez de
 * 5.000. A diferença de fluidez é a diferença entre "funciona" e "dá para usar".
 */

const FILTROS = [
  { valor: 'todos', rotulo: 'Todas' },
  { valor: 'Elétrica', rotulo: 'Elétrica' },
  { valor: 'Pintura', rotulo: 'Pintura' },
  { valor: 'Construção', rotulo: 'Construção' },
  { valor: 'Segurança', rotulo: 'Segurança' },
  { valor: 'Iluminação', rotulo: 'Iluminação' },
] as const

type FiltroCategoria = (typeof FILTROS)[number]['valor']

const ALTURA_LINHA = 53
const ALTURA_VISIVEL = 424
const EXCEDENTE = 6

export function TelaCatalogo() {
  // Ação do erro 401: sem isto o bloco de sessão expirada ofereceria um
  // botão que não leva a lugar nenhum.
  const navegar = useNavigate()
  const [busca, definirBusca] = useState('')
  const [categoria, definirCategoria] = useState<FiltroCategoria>('todos')
  const [deslocamento, definirDeslocamento] = useState(0)
  const areaRef = useRef<HTMLDivElement>(null)

  const { estado, recarregar } = usarConsulta<readonly ItemCatalogo[]>({
    recurso: 'catalogo',
    validar: validarCatalogo,
  })

  const filtrados = useMemo(() => {
    if (estado.situacao !== 'pronto') return []
    const termo = normalizarBusca(busca)
    return estado.dados.filter((item) => {
      if (categoria !== 'todos' && item.categoria !== categoria) return false
      if (termo === '') return true
      return normalizarBusca(`${item.nome} ${item.id}`).includes(termo)
    })
  }, [estado, busca, categoria])

  // Virtualização: só o intervalo visível entra no DOM. Em listas pequenas o
  // cálculo é irrelevante; em cinco mil itens é o que mantém a rolagem fluida.
  const total = filtrados.length
  const usarVirtual = total > 120
  const inicio = usarVirtual ? Math.max(0, Math.floor(deslocamento / ALTURA_LINHA) - EXCEDENTE) : 0
  const quantidade = usarVirtual ? Math.ceil(ALTURA_VISIVEL / ALTURA_LINHA) + EXCEDENTE * 2 : total
  const fim = Math.min(total, inicio + quantidade)
  const visiveis = filtrados.slice(inicio, fim)

  const semEstoque = useMemo(
    () => filtrados.filter((item) => item.estoque === 0).length,
    [filtrados],
  )

  const limparFiltros = (): void => {
    definirBusca('')
    definirCategoria('todos')
    definirDeslocamento(0)
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Catálogo</h1>
        <p className="max-w-prose text-sm text-[var(--color-texto-suave)]">
          Com muitos itens, a lista passa a renderizar apenas o que está à vista. Escolha "Muitos
          dados" no simulador para ver a diferença de comportamento com cinco mil registros.
        </p>
      </header>

      {estado.situacao === 'pronto' && total > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Indicador rotulo="Itens" valor={numero(total)} detalhe={usarVirtual ? 'rolagem virtual' : undefined} />
          <Indicador rotulo="Sem estoque" valor={numero(semEstoque)} />
          <Indicador
            rotulo="Linhas no DOM"
            valor={numero(visiveis.length)}
            detalhe={usarVirtual ? `de ${numero(total)}` : 'lista completa'}
          />
        </div>
      ) : null}

      <RenderizarConsulta
        estado={estado}
        aoRecarregar={recarregar}
        aoAutenticar={() => void navegar("/entrar")}
        titulo="Itens disponíveis"
        descricao="Preço e estoque por item, com filtro por categoria."
        linhasEsqueleto={8}
        colunasEsqueleto={4}
        acoes={
          <Botao variante="secundario" onClick={recarregar}>
            Recarregar
          </Botao>
        }
        vazio={(dados) =>
          dados.length === 0 ? (
            <BlocoVazio
              tipo="sem-registros"
              titulo="Catálogo vazio"
              descricao="Nenhum item cadastrado. A consulta respondeu normalmente, apenas não há nada aqui ainda."
            />
          ) : filtrados.length === 0 ? (
            <BlocoVazio
              titulo="Nenhum item com esse filtro"
              descricao="O catálogo tem itens, mas nenhum combina com a categoria ou a busca escolhidas."
              acao={
                <Botao variante="principal" onClick={limparFiltros}>
                  Limpar filtros
                </Botao>
              }
            />
          ) : null
        }
        renderizar={(_dados, aviso) => (
          <>
            {aviso ? <FaixaAviso tom="atencao">{aviso}</FaixaAviso> : null}

            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-borda)] px-5 py-3">
              <div className="min-w-[15rem] flex-1">
                <CampoBusca
                  valor={busca}
                  aoMudar={(valor) => {
                    definirBusca(valor)
                    definirDeslocamento(0)
                  }}
                  rotulo="Buscar item por nome ou código"
                  placeholder="Buscar por nome ou código…"
                  resultados={total}
                />
              </div>
              <Filtros
                opcoes={FILTROS}
                valor={categoria}
                aoMudar={(valor) => {
                  definirCategoria(valor)
                  definirDeslocamento(0)
                }}
                rotulo="Filtrar por categoria"
              />
            </div>

            <div
              ref={areaRef}
              onScroll={(evento) => {
                definirDeslocamento(evento.currentTarget.scrollTop)
              }}
              className="overflow-y-auto overscroll-contain"
              style={{ maxHeight: ALTURA_VISIVEL }}
              tabIndex={0}
              role="region"
              aria-label="Itens do catálogo — use as setas para rolar"
            >
              <div style={usarVirtual ? { height: total * ALTURA_LINHA, position: 'relative' } : undefined}>
                <div
                  style={
                    usarVirtual
                      ? { position: 'absolute', top: inicio * ALTURA_LINHA, left: 0, right: 0 }
                      : undefined
                  }
                >
                  <Tabela
                    legenda="Itens do catálogo"
                    larguraMinima="42rem"
                    cabecalhos={[
                      { rotulo: 'Código' },
                      { rotulo: 'Item' },
                      { rotulo: 'Categoria' },
                      { rotulo: 'Estoque', alinharDireita: true },
                      { rotulo: 'Preço', alinharDireita: true },
                    ]}
                  >
                    {visiveis.map((item) => (
                      <LinhaTabela key={item.id}>
                        <Celula numerica>
                          <span className="font-mono text-xs">{item.id}</span>
                        </Celula>
                        <Celula>{item.nome}</Celula>
                        <Celula>
                          <Etiqueta tom="neutro">{item.categoria}</Etiqueta>
                        </Celula>
                        <Celula alinharDireita numerica>
                          {item.estoque === 0 ? (
                            <Etiqueta tom="erro">Sem estoque</Etiqueta>
                          ) : (
                            numero(item.estoque)
                          )}
                        </Celula>
                        <Celula alinharDireita numerica>
                          {moeda(item.preco)}
                        </Celula>
                      </LinhaTabela>
                    ))}
                  </Tabela>
                </div>
              </div>
            </div>

            <p className="border-t border-[var(--color-borda)] px-5 py-2.5 text-xs text-[var(--color-texto-fraco)]">
              {usarVirtual
                ? `Mostrando ${numero(visiveis.length)} de ${numero(total)} linhas — as demais aparecem conforme a rolagem.`
                : `${numero(total)} ${total === 1 ? 'item' : 'itens'} na lista.`}
            </p>
          </>
        )}
      />
    </div>
  )
}
