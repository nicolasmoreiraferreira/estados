import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { TelaAgenda } from '@/features/agenda/TelaAgenda'
import { TelaCatalogo } from '@/features/catalogo/TelaCatalogo'
import { TelaClientes } from '@/features/clientes/TelaClientes'
import { TelaPedidos } from '@/features/pedidos/TelaPedidos'
import { instalarServidorFalso } from '@/lib/api/servidorFalso'
import { definirCondicao } from '@/lib/simulacao/loja'

/**
 * Testes das telas.
 *
 * A suíte de navegador já cobre estes caminhos em condições reais; aqui o
 * objetivo é outro — testar a **lógica de cada tela** (filtro, busca, contagem,
 * virtualização) em isolamento, rápido o bastante para rodar a cada alteração.
 *
 * O servidor falso é instalado aqui de propósito: é ele que permite exercitar a
 * tela em todas as condições sem depender de rede, e usá-lo nos testes é a
 * melhor prova de que ele funciona.
 */

let desinstalar: () => void

beforeAll(() => {
  desinstalar = instalarServidorFalso()
})

afterAll(() => {
  desinstalar()
})

function renderizar(componente: React.ReactElement) {
  return render(<MemoryRouter>{componente}</MemoryRouter>)
}

describe('tela de pedidos', () => {
  it('mostra os pedidos quando a consulta responde', async () => {
    definirCondicao('normal')
    renderizar(<TelaPedidos />)
    expect(await screen.findByText('Mercado São Jorge')).toBeInTheDocument()
    expect(screen.getByText('PD-1041')).toBeInTheDocument()
  })

  it('mostra o esqueleto enquanto carrega', () => {
    definirCondicao('carregando')
    renderizar(<TelaPedidos />)
    // O esqueleto anuncia o estado em vez de deixar a área vazia.
    expect(screen.getAllByText('Carregando').length).toBeGreaterThan(0)
  })

  it('filtra por situação sem nova consulta', async () => {
    definirCondicao('normal')
    renderizar(<TelaPedidos />)
    await screen.findByText('Mercado São Jorge')

    await userEvent.click(screen.getByRole('button', { name: 'Cancelado' }))
    expect(screen.queryByText('Mercado São Jorge')).not.toBeInTheDocument()
    expect(screen.getByText('Escola Novo Tempo')).toBeInTheDocument()
  })

  it('busca ignorando acento', async () => {
    definirCondicao('normal')
    renderizar(<TelaPedidos />)
    await screen.findByText('Mercado São Jorge')

    // Em português, busca sem normalização de acento é quase inútil.
    await userEvent.type(screen.getByRole('searchbox'), 'sao jorge')
    expect(screen.getByText('Mercado São Jorge')).toBeInTheDocument()
    expect(screen.queryByText('Padaria Dois Irmãos')).not.toBeInTheDocument()
  })

  it('distingue lista vazia de filtro sem resultado', async () => {
    definirCondicao('vazio')
    renderizar(<TelaPedidos />)
    // Vazio real: a consulta funcionou e não há nada.
    expect(await screen.findByText('Nenhum pedido ainda')).toBeInTheDocument()
  })

  it('oferece limpar filtros quando nada corresponde', async () => {
    definirCondicao('normal')
    renderizar(<TelaPedidos />)
    await screen.findByText('Mercado São Jorge')

    await userEvent.type(screen.getByRole('searchbox'), 'zzz-inexistente')
    expect(screen.getByText('Nenhum pedido corresponde a este filtro')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }))
    expect(screen.getByText('Mercado São Jorge')).toBeInTheDocument()
  })

  it('calcula os indicadores a partir dos dados', async () => {
    definirCondicao('normal')
    renderizar(<TelaPedidos />)
    await screen.findByText('Mercado São Jorge')
    expect(screen.getByText('Valor total')).toBeInTheDocument()
    expect(screen.getByText('Aguardando')).toBeInTheDocument()
  })
})

describe('tela de agenda', () => {
  it('agrupa compromissos por dia', async () => {
    definirCondicao('normal')
    renderizar(<TelaAgenda />)
    expect(await screen.findByText(/Visita técnica/)).toBeInTheDocument()
    // O cabeçalho do grupo traz a contagem — é o que dá noção de carga do dia.
    expect(screen.getAllByText(/compromissos?$/).length).toBeGreaterThan(0)
  })

  it('trata agenda vazia como situação normal', async () => {
    definirCondicao('vazio')
    renderizar(<TelaAgenda />)
    expect(await screen.findByText('Nenhum compromisso agendado')).toBeInTheDocument()
    expect(screen.getByText(/não é um erro/i)).toBeInTheDocument()
  })

  it('filtra por período', async () => {
    definirCondicao('normal')
    renderizar(<TelaAgenda />)
    await screen.findByText(/Visita técnica/)

    await userEvent.click(screen.getByRole('button', { name: 'Hoje' }))
    expect(screen.getByText(/Visita técnica/)).toBeInTheDocument()
    expect(screen.queryByText(/Fechamento do mês/)).not.toBeInTheDocument()
  })
})

describe('tela de catálogo', () => {
  it('lista os itens com preço e estoque', async () => {
    definirCondicao('normal')
    renderizar(<TelaCatalogo />)
    expect(await screen.findByText(/Cabo flexível/)).toBeInTheDocument()
    const tabela = screen.getAllByRole('table')[0]
    expect(tabela && within(tabela).getByText('Sem estoque')).toBeInTheDocument()
  })

  it('filtra por categoria', async () => {
    definirCondicao('normal')
    renderizar(<TelaCatalogo />)
    await screen.findByText(/Cabo flexível/)

    await userEvent.click(screen.getByRole('button', { name: 'Pintura' }))
    expect(screen.getByText(/Tinta acrílica/)).toBeInTheDocument()
    expect(screen.queryByText(/Cabo flexível/)).not.toBeInTheDocument()
  })

  it('virtualiza a lista quando há volume', async () => {
    definirCondicao('muitos_dados')
    renderizar(<TelaCatalogo />)

    await waitFor(
      async () => {
        expect(await screen.findByText('Linhas no DOM')).toBeInTheDocument()
      },
      { timeout: 10_000 },
    )

    // A prova da janela de renderização: o DOM tem poucas linhas, mesmo com
    // milhares de itens. Sem isso, cinco mil linhas travaríam a rolagem.
    const linhas = screen.getAllByRole('row').length
    expect(linhas).toBeLessThan(60)
    expect(linhas).toBeGreaterThan(1)
  }, 20_000)

  it('mantém a busca utilizável sobre o volume', async () => {
    definirCondicao('muitos_dados')
    renderizar(<TelaCatalogo />)
    await waitFor(async () => {
      expect(await screen.findByText('Linhas no DOM')).toBeInTheDocument()
    }, { timeout: 10_000 })

    await userEvent.type(screen.getByRole('searchbox'), 'argamassa')
    const linhas = screen.getAllByRole('row').length
    expect(linhas).toBeGreaterThan(1)
  }, 20_000)
})

describe('tela de clientes', () => {
  it('mostra os clientes com situação', async () => {
    definirCondicao('normal')
    renderizar(<TelaClientes />)
    expect(await screen.findByText('Mercado São Jorge')).toBeInTheDocument()
    expect(screen.getByText('Inadimplente')).toBeInTheDocument()
  })

  it('filtra por situação', async () => {
    definirCondicao('normal')
    renderizar(<TelaClientes />)
    await screen.findByText('Mercado São Jorge')

    await userEvent.click(screen.getByRole('button', { name: 'Inadimplentes' }))
    expect(screen.getByText('Auto Peças Litoral')).toBeInTheDocument()
    expect(screen.queryByText('Mercado São Jorge')).not.toBeInTheDocument()
  })

  it('conta os resultados exibidos', async () => {
    definirCondicao('normal')
    renderizar(<TelaClientes />)
    await screen.findByText('Mercado São Jorge')
    expect(screen.getByText(/de 5 clientes/)).toBeInTheDocument()
  })
})

describe('comportamento comum das telas', () => {
  const telas = [
    { nome: 'pedidos', elemento: <TelaPedidos /> },
    { nome: 'agenda', elemento: <TelaAgenda /> },
    { nome: 'catálogo', elemento: <TelaCatalogo /> },
    { nome: 'clientes', elemento: <TelaClientes /> },
  ] as const

  it('nenhuma tela quebra quando o servidor falha', async () => {
    // Este é o teste que sustenta a promessa do projeto: se alguém adicionar uma
    // tela nova e esquecer de tratar erro, ele falha aqui.
    for (const tela of telas) {
      definirCondicao('erro_servidor')
      const { unmount } = renderizar(tela.elemento)
      // O prazo cobre a cadeia de retentativas automáticas, que é parte do
      // comportamento sob erro transitório.
      const alerta = await screen.findByRole('alert', {}, { timeout: 10_000 })
      expect(alerta, `tela ${tela.nome}`).toBeInTheDocument()
      expect(within(alerta).getByText(/problema/i), `tela ${tela.nome}`).toBeInTheDocument()
      unmount()
    }
  }, 30_000)

  it('nenhuma tela quebra com dado inválido', async () => {
    // O caso mais perigoso: status 200 com conteúdo fora do contrato. Sem
    // validação, a tela quebraria no meio da renderização.
    for (const tela of telas) {
      definirCondicao('dado_invalido')
      const { unmount } = renderizar(tela.elemento)
      const alerta = await screen.findByRole('alert', {}, { timeout: 10_000 })
      expect(alerta, `tela ${tela.nome}`).toContainElement(
        within(alerta).getByText(/formato que não dá para usar/i),
      )
      unmount()
    }
  }, 30_000)

  it('nenhuma tela quebra com volume alto', async () => {
    for (const tela of telas) {
      definirCondicao('muitos_dados')
      const { unmount } = renderizar(tela.elemento)
      await waitFor(
        () => {
          expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        },
        { timeout: 10_000 },
      )
      unmount()
    }
  }, 40_000)
})
