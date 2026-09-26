import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BlocoVazio, FaixaAviso } from '@/components/estados'
import { RenderizarConsulta } from '@/components/estados/RenderizarConsulta'
import { Botao, EtiquetaSituacao } from '@/components/ui'
import { CampoBusca, Celula, Filtros, LinhaTabela, Tabela } from '@/components/ui/tabela'
import { usarConsulta } from '@/lib/api/usarConsulta'
import { dataHora, normalizarBusca } from '@/lib/formato'
import { validarClientes, type Cliente } from './tipos'

/**
 * Tela de clientes.
 *
 * A mais simples das quatro — de propósito. Serve para mostrar que a mesma
 * estrutura de estados se aplica sem esforço a uma tela nova: quem escreve a
 * quinta tela não precisa pensar em como tratar erro, vazio ou demora, porque
 * o renderizador já resolve. É o argumento de reaproveitamento que o projeto
 * quer provar.
 */

const FILTROS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'ativo', rotulo: 'Ativos' },
  { valor: 'inadimplente', rotulo: 'Inadimplentes' },
  { valor: 'inativo', rotulo: 'Inativos' },
] as const

type FiltroSituacao = (typeof FILTROS)[number]['valor']

export function TelaClientes() {
  // Ação do erro 401: sem isto o bloco de sessão expirada ofereceria um
  // botão que não leva a lugar nenhum.
  const navegar = useNavigate()
  const [busca, definirBusca] = useState('')
  const [situacao, definirSituacao] = useState<FiltroSituacao>('todos')

  const { estado, recarregar } = usarConsulta<readonly Cliente[]>({
    recurso: 'clientes',
    validar: validarClientes,
  })

  const filtrados = useMemo(() => {
    if (estado.situacao !== 'pronto') return []
    const termo = normalizarBusca(busca)
    return estado.dados.filter((cliente) => {
      if (situacao !== 'todos' && cliente.situacao !== situacao) return false
      if (termo === '') return true
      return normalizarBusca(`${cliente.nome} ${cliente.email}`).includes(termo)
    })
  }, [estado, busca, situacao])

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Clientes</h1>
        <p className="max-w-prose text-sm text-[var(--color-texto-suave)]">
          Cadastro com busca e filtro por situação. A estrutura de estados é a mesma das outras
          telas: escrever uma tela nova não exige repensar carregamento, erro ou vazio.
        </p>
      </header>

      <RenderizarConsulta
        estado={estado}
        aoRecarregar={recarregar}
        aoAutenticar={() => void navegar("/entrar")}
        titulo="Clientes cadastrados"
        descricao="Busca por nome ou e-mail."
        linhasEsqueleto={6}
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
              titulo="Nenhum cliente cadastrado"
              descricao="Ainda não há clientes. Cadastre o primeiro para começar a acompanhar pedidos e cobranças."
            />
          ) : filtrados.length === 0 ? (
            <BlocoVazio
              titulo="Nenhum cliente com esse filtro"
              descricao="Existem clientes cadastrados, mas nenhum corresponde à busca ou à situação escolhidas."
              acao={
                <Botao
                  variante="principal"
                  onClick={() => {
                    definirBusca('')
                    definirSituacao('todos')
                  }}
                >
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
                  aoMudar={definirBusca}
                  rotulo="Buscar cliente por nome ou e-mail"
                  placeholder="Buscar por nome ou e-mail…"
                  resultados={filtrados.length}
                />
              </div>
              <Filtros opcoes={FILTROS} valor={situacao} aoMudar={definirSituacao} rotulo="Filtrar por situação" />
            </div>

            <Tabela
              legenda="Clientes"
              larguraMinima="40rem"
              cabecalhos={[
                { rotulo: 'Cliente' },
                { rotulo: 'E-mail' },
                { rotulo: 'Situação' },
                { rotulo: 'Cliente desde' },
              ]}
            >
              {filtrados.map((cliente) => (
                <LinhaTabela key={cliente.id}>
                  <Celula>{cliente.nome}</Celula>
                  <Celula>
                    <span className="text-[var(--color-texto-suave)]">{cliente.email}</span>
                  </Celula>
                  <Celula>
                    <EtiquetaSituacao situacao={cliente.situacao} />
                  </Celula>
                  <Celula>
                    <span className="text-[var(--color-texto-suave)]">{dataHora(cliente.desde)}</span>
                  </Celula>
                </LinhaTabela>
              ))}
            </Tabela>

            <p className="border-t border-[var(--color-borda)] px-5 py-2.5 text-xs text-[var(--color-texto-fraco)]">
              {filtrados.length} de {estado.situacao === 'pronto' ? estado.dados.length : 0}{' '}
              {filtrados.length === 1 ? 'cliente' : 'clientes'}
            </p>
          </>
        )}
      />
    </div>
  )
}
