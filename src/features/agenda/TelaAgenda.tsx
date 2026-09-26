import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BlocoVazio, FaixaAviso } from '@/components/estados'
import { RenderizarConsulta } from '@/components/estados/RenderizarConsulta'
import { Botao, Etiqueta } from '@/components/ui'
import { CampoBusca, Celula, Filtros, LinhaTabela, Tabela } from '@/components/ui/tabela'
import { usarConsulta } from '@/lib/api/usarConsulta'
import { dia, hora, normalizarBusca } from '@/lib/formato'
import { validarAgenda, type Compromisso } from './tipos'

/**
 * Tela de agenda.
 *
 * Aqui o estado vazio tem um sentido diferente do de pedidos: agenda vazia em um
 * dia é normal e esperada, não um problema. O texto reflete isso — "não há
 * compromissos neste período" com opção de olhar os próximos dias, em vez de um
 * tom de falha.
 *
 * O agrupamento por dia é feito em memória e memoizado: recalcular a cada
 * digitação, em lista grande, é justamente o tipo de descuido que faz a tela
 * engasgar.
 */

const PERIODOS = [
  { valor: 'proximos', rotulo: 'Próximos' },
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'semana', rotulo: 'Próximos 7 dias' },
  { valor: 'todos', rotulo: 'Todos' },
] as const

type Periodo = (typeof PERIODOS)[number]['valor']

const REFERENCIA = new Date('2026-09-25T08:00:00Z')

function dentroDoPeriodo(compromisso: Compromisso, periodo: Periodo): boolean {
  if (periodo === 'todos') return true
  const inicio = new Date(compromisso.inicio)
  const dias = (inicio.getTime() - REFERENCIA.getTime()) / 86_400_000
  if (periodo === 'hoje') return dias >= 0 && dias < 1
  if (periodo === 'semana') return dias >= 0 && dias < 7
  return dias >= 0
}

export function TelaAgenda() {
  // Ação do erro 401: sem isto o bloco de sessão expirada ofereceria um
  // botão que não leva a lugar nenhum.
  const navegar = useNavigate()
  const [busca, definirBusca] = useState('')
  const [periodo, definirPeriodo] = useState<Periodo>('todos')

  const { estado, recarregar } = usarConsulta<readonly Compromisso[]>({
    recurso: 'agenda',
    validar: validarAgenda,
  })

  const filtrados = useMemo(() => {
    if (estado.situacao !== 'pronto') return []
    const termo = normalizarBusca(busca)
    return estado.dados
      .filter((compromisso) => dentroDoPeriodo(compromisso, periodo))
      .filter((compromisso) => {
        if (termo === '') return true
        return normalizarBusca(`${compromisso.titulo} ${compromisso.sala}`).includes(termo)
      })
      .sort((a, b) => a.inicio.localeCompare(b.inicio))
  }, [estado, busca, periodo])

  const porDia = useMemo(() => {
    const mapa = new Map<string, Compromisso[]>()
    for (const compromisso of filtrados) {
      const chave = dia(compromisso.inicio)
      const lista = mapa.get(chave)
      if (lista) lista.push(compromisso)
      else mapa.set(chave, [compromisso])
    }
    return [...mapa.entries()]
  }, [filtrados])

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Agenda</h1>
        <p className="max-w-prose text-sm text-[var(--color-texto-suave)]">
          Compromissos agrupados por dia. Uma agenda vazia é uma situação normal — e é tratada como
          tal, com uma saída útil em vez de um aviso de erro.
        </p>
      </header>

      <RenderizarConsulta
        estado={estado}
        aoRecarregar={recarregar}
        aoAutenticar={() => void navegar("/entrar")}
        titulo="Compromissos"
        descricao="Agrupados por dia, do mais próximo ao mais distante."
        linhasEsqueleto={5}
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
              titulo="Nenhum compromisso agendado"
              descricao="Não há nada na agenda. Isso não é um erro: é uma agenda livre. Assim que um compromisso for marcado, ele aparece aqui."
            />
          ) : filtrados.length === 0 ? (
            <BlocoVazio
              titulo="Nada neste período"
              descricao="Existem compromissos, mas nenhum cai no período ou na busca escolhidos. Amplie o período para ver os demais."
              acao={
                <Botao
                  variante="principal"
                  onClick={() => {
                    definirPeriodo('todos')
                    definirBusca('')
                  }}
                >
                  Ver todos os compromissos
                </Botao>
              }
            />
          ) : null
        }
        renderizar={(_dados, aviso) => (
          <>
            {aviso ? <FaixaAviso>{aviso}</FaixaAviso> : null}

            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-borda)] px-5 py-3">
              <div className="min-w-[15rem] flex-1">
                <CampoBusca
                  valor={busca}
                  aoMudar={definirBusca}
                  rotulo="Buscar compromisso por título ou local"
                  placeholder="Buscar por título ou local…"
                  resultados={filtrados.length}
                />
              </div>
              <Filtros opcoes={PERIODOS} valor={periodo} aoMudar={definirPeriodo} rotulo="Filtrar período" />
            </div>

            <div className="divide-y divide-[var(--color-borda)]">
              {porDia.map(([chave, compromissos]) => (
                <div key={chave}>
                  <h3 className="bg-[var(--color-superficie-2)] px-5 py-2 text-xs font-semibold tracking-wide text-[var(--color-texto-fraco)] uppercase">
                    {chave} · {compromissos.length}{' '}
                    {compromissos.length === 1 ? 'compromisso' : 'compromissos'}
                  </h3>
                  <Tabela
                    legenda={`Compromissos de ${chave}`}
                    larguraMinima="34rem"
                    cabecalhos={[{ rotulo: 'Horário' }, { rotulo: 'Compromisso' }, { rotulo: 'Local' }]}
                  >
                    {compromissos.map((compromisso) => (
                      <LinhaTabela key={compromisso.id}>
                        <Celula numerica>
                          <span className="font-mono text-xs">{hora(compromisso.inicio)}</span>
                        </Celula>
                        <Celula>{compromisso.titulo}</Celula>
                        <Celula>
                          <Etiqueta tom={compromisso.sala === 'Externa' ? 'atencao' : 'neutro'}>
                            {compromisso.sala}
                          </Etiqueta>
                        </Celula>
                      </LinhaTabela>
                    ))}
                  </Tabela>
                </div>
              ))}
            </div>
          </>
        )}
      />
    </div>
  )
}
