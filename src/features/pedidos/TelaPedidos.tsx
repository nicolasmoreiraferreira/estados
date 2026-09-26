import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BlocoVazio, FaixaAviso } from '@/components/estados'
import { RenderizarConsulta } from '@/components/estados/RenderizarConsulta'
import { Botao, EtiquetaSituacao, Indicador } from '@/components/ui'
import { CampoBusca, Celula, Filtros, LinhaTabela, Paginacao, Tabela } from '@/components/ui/tabela'
import { usarConsulta } from '@/lib/api/usarConsulta'
import { dataHora, moeda, normalizarBusca } from '@/lib/formato'
import { validarPedidos, type Pedido } from './tipos'

/**
 * Tela de pedidos.
 *
 * A mais completa do app: lista com busca, filtro por situação, paginação e
 * indicadores derivados. É a tela onde volume e ausência de resultado mais
 * aparecem — daí ser a principal para exercitar os estados de dados.
 *
 * O que vale observar no comportamento: filtro e busca rodam sobre o que já
 * está em memória, então respondem na hora, sem nova ida à API. Isso é uma
 * escolha com custo declarado: em cinco mil registros a filtragem local é
 * instantânea; em cinquenta mil seria hora de mandar o filtro para o servidor.
 * O comentário existe porque a decisão muda de sinal conforme o volume.
 */

const FILTROS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'pago', rotulo: 'Pago' },
  { valor: 'pendente', rotulo: 'Pendente' },
  { valor: 'enviado', rotulo: 'Enviado' },
  { valor: 'cancelado', rotulo: 'Cancelado' },
] as const

type FiltroSituacao = (typeof FILTROS)[number]['valor']

const POR_PAGINA = 25

export function TelaPedidos() {
  // Ação do erro 401: sem isto o bloco de sessão expirada ofereceria um
  // botão que não leva a lugar nenhum.
  const navegar = useNavigate()
  const [busca, definirBusca] = useState('')
  const [situacao, definirSituacao] = useState<FiltroSituacao>('todos')
  const [pagina, definirPagina] = useState(1)

  const { estado, recarregar } = usarConsulta<readonly Pedido[]>({
    recurso: 'pedidos',
    validar: validarPedidos,
  })

  const filtrados = useMemo(() => {
    if (estado.situacao !== 'pronto') return []
    const termo = normalizarBusca(busca)
    return estado.dados.filter((pedido) => {
      const combinaSituacao = situacao === 'todos' || pedido.status === situacao
      if (!combinaSituacao) return false
      if (termo === '') return true
      return normalizarBusca(`${pedido.id} ${pedido.cliente}`).includes(termo)
    })
  }, [estado, busca, situacao])

  const resumo = useMemo(() => {
    if (estado.situacao !== 'pronto') return null
    const total = estado.dados.reduce((soma, pedido) => soma + pedido.valor, 0)
    const pendentes = estado.dados.filter((pedido) => pedido.status === 'pendente').length
    const cancelados = estado.dados.filter((pedido) => pedido.status === 'cancelado').length
    return { total, pendentes, cancelados, quantidade: estado.dados.length }
  }, [estado])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA)

  const limparFiltros = (): void => {
    definirBusca('')
    definirSituacao('todos')
    definirPagina(1)
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Pedidos</h1>
        <p className="max-w-prose text-sm text-[var(--color-texto-suave)]">
          Lista com busca, filtro por situação e paginação. Cada pedido vem de uma API simulada que
          pode falhar, demorar, devolver vazio ou mandar dado corrompido — conforme a condição
          escolhida no simulador.
        </p>
      </header>

      {resumo ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador
            rotulo="Pedidos"
            valor={String(resumo.quantidade)}
            detalhe={resumo.quantidade >= 1000 ? 'rolagem virtual ativa' : undefined}
          />
          <Indicador rotulo="Valor total" valor={moeda(resumo.total)} />
          <Indicador rotulo="Aguardando" valor={String(resumo.pendentes)} detalhe="precisam de atenção" />
          <Indicador rotulo="Cancelados" valor={String(resumo.cancelados)} />
        </div>
      ) : null}

      <RenderizarConsulta
        estado={estado}
        aoRecarregar={recarregar}
        aoAutenticar={() => void navegar("/entrar")}
        titulo="Todos os pedidos"
        descricao="Filtro e busca rodam sobre o que já foi carregado."
        linhasEsqueleto={8}
        colunasEsqueleto={5}
        acoes={
          <Botao variante="secundario" onClick={recarregar}>
            Recarregar
          </Botao>
        }
        vazio={(dados) =>
          dados.length === 0 ? (
            <BlocoVazio
              tipo="sem-registros"
              titulo="Nenhum pedido ainda"
              descricao="A consulta funcionou e voltou vazia: não há pedidos cadastrados neste período. Quando o primeiro pedido entrar, ele aparece aqui."
              acao={
                <Botao variante="secundario" onClick={recarregar}>
                  Verificar de novo
                </Botao>
              }
            />
          ) : filtrados.length === 0 ? (
            <BlocoVazio
              titulo="Nenhum pedido corresponde a este filtro"
              descricao="Existem pedidos cadastrados, mas nenhum combina com a busca e a situação escolhidas. Ajuste os filtros para ver os demais."
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
            {aviso ? <FaixaAviso>{aviso}</FaixaAviso> : null}

            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-borda)] px-5 py-3">
              <div className="min-w-[16rem] flex-1">
                <CampoBusca
                  valor={busca}
                  aoMudar={(valor) => {
                    definirBusca(valor)
                    definirPagina(1)
                  }}
                  rotulo="Buscar por número do pedido ou cliente"
                  placeholder="Buscar por número ou cliente…"
                  resultados={filtrados.length}
                />
              </div>
              <Filtros
                opcoes={FILTROS}
                valor={situacao}
                aoMudar={(valor) => {
                  definirSituacao(valor)
                  definirPagina(1)
                }}
                rotulo="Filtrar por situação"
              />
            </div>

            <Tabela
              legenda="Pedidos"
              cabecalhos={[
                { rotulo: 'Pedido' },
                { rotulo: 'Cliente' },
                { rotulo: 'Situação' },
                { rotulo: 'Criado em' },
                { rotulo: 'Valor', alinharDireita: true },
              ]}
            >
              {visiveis.map((pedido) => (
                <LinhaTabela key={pedido.id}>
                  <Celula numerica>
                    <span className="font-mono text-xs">{pedido.id}</span>
                  </Celula>
                  <Celula>{pedido.cliente}</Celula>
                  <Celula>
                    <EtiquetaSituacao situacao={pedido.status} />
                  </Celula>
                  <Celula>
                    <span className="text-[var(--color-texto-suave)]">{dataHora(pedido.criadoEm)}</span>
                  </Celula>
                  <Celula alinharDireita numerica>
                    {moeda(pedido.valor)}
                  </Celula>
                </LinhaTabela>
              ))}
            </Tabela>

            <Paginacao
              pagina={paginaAtual}
              totalPaginas={totalPaginas}
              total={filtrados.length}
              aoMudar={definirPagina}
            />
          </>
        )}
      />
    </div>
  )
}
