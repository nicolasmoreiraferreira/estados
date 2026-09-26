import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  AvisoDemora,
  BlocoErro,
  BlocoVazio,
  Esqueleto,
  FaixaAviso,
} from '@/components/estados'
import { EtiquetaSituacao } from '@/components/ui'
import { ErroApp } from '@/lib/api/erros'

/**
 * Testes dos componentes de estado.
 *
 * O que estes testes protegem não é aparência, é promessa: cada tipo de erro
 * oferece a ação certa, o vazio explica em vez de sumir, o esqueleto anuncia o
 * carregamento para quem não vê, e a situação nunca depende só de cor.
 */

function erro(parcial: Partial<ConstructorParameters<typeof ErroApp>[0]> = {}): ErroApp {
  return new ErroApp({
    tipo: 'servidor',
    status: 500,
    explicacao: 'O sistema está com um problema.',
    proximoPasso: 'Tente de novo em alguns instantes.',
    podeTentarDeNovo: true,
    detalheTecnico: 'HTTP 500',
    ...parcial,
  })
}

describe('BlocoErro', () => {
  it('mostra a explicação e o próximo passo', () => {
    render(<BlocoErro erro={erro()} />)
    expect(screen.getByText('O sistema está com um problema.')).toBeInTheDocument()
    expect(screen.getByText('Tente de novo em alguns instantes.')).toBeInTheDocument()
  })

  it('anuncia a falha para leitores de tela', () => {
    render(<BlocoErro erro={erro()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('oferece nova tentativa quando ela pode resolver', async () => {
    const aoTentar = vi.fn()
    render(<BlocoErro erro={erro()} aoTentarDeNovo={aoTentar} />)
    await userEvent.click(screen.getByRole('button', { name: /tentar de novo/i }))
    expect(aoTentar).toHaveBeenCalledOnce()
  })

  it('não oferece nova tentativa quando ela não resolve', () => {
    // Este é o ponto: mostrar "tentar de novo" em falta de permissão faz o
    // usuário repetir uma ação que nunca vai funcionar.
    render(
      <BlocoErro
        erro={erro({ tipo: 'permissao', status: 403, podeTentarDeNovo: false })}
        aoTentarDeNovo={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: /tentar de novo/i })).not.toBeInTheDocument()
  })

  it('oferece acesso quando a sessão expirou', async () => {
    const aoAutenticar = vi.fn()
    render(
      <BlocoErro
        erro={erro({ tipo: 'autenticacao', status: 401, podeTentarDeNovo: false })}
        aoAutenticar={aoAutenticar}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /entrar novamente/i }))
    expect(aoAutenticar).toHaveBeenCalledOnce()
  })

  it('guarda o detalhe técnico em elemento recolhido', () => {
    render(<BlocoErro erro={erro({ detalheTecnico: 'HTTP 500 — teste' })} />)
    const detalhes = screen.getByText('Detalhe técnico')
    // Recolhido de propósito: quem está usando não precisa ver código de erro,
    // mas quem for investigar precisa encontrá-lo.
    expect(detalhes.closest('details')).not.toHaveAttribute('open')
    expect(screen.getByText('HTTP 500 — teste')).toBeInTheDocument()
  })

  it('mostra o status quando existe', () => {
    render(<BlocoErro erro={erro({ status: 503 })} />)
    expect(screen.getByText('HTTP 503')).toBeInTheDocument()
  })

  it('omite o status quando o erro não veio do servidor', () => {
    // Erro de rede não tem código HTTP: mostrar um número ali sugeriria que o
    // servidor respondeu, quando na verdade a requisição nem chegou.
    render(
      <BlocoErro
        erro={erro({ tipo: 'rede', status: null, detalheTecnico: 'navigator.onLine = false' })}
      />,
    )
    expect(screen.queryByText(/^HTTP \d/)).not.toBeInTheDocument()
  })
})

describe('BlocoVazio', () => {
  it('explica por que está vazio e o que fazer', async () => {
    const acao = vi.fn()
    render(
      <BlocoVazio
        titulo="Nenhum pedido"
        descricao="Ainda não há pedidos cadastrados."
        acao={<button onClick={acao}>Criar o primeiro</button>}
      />,
    )
    expect(screen.getByText('Nenhum pedido')).toBeInTheDocument()
    expect(screen.getByText('Ainda não há pedidos cadastrados.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Criar o primeiro' }))
    expect(acao).toHaveBeenCalledOnce()
  })

  it('distingue vazio por filtro de vazio real', () => {
    // São situações diferentes e pedem ações diferentes: uma pede limpar o
    // filtro, a outra pede criar o primeiro registro.
    const { rerender } = render(
      <BlocoVazio titulo="Sem resultados" descricao="Nada corresponde ao filtro." />,
    )
    expect(screen.getByText(/a lista é que está vazia/i)).toBeInTheDocument()

    rerender(
      <BlocoVazio titulo="Nada aqui" descricao="Nada cadastrado ainda." tipo="sem-registros" />,
    )
    expect(screen.queryByText(/a lista é que está vazia/i)).not.toBeInTheDocument()
  })
})

describe('Esqueleto', () => {
  it('anuncia o carregamento para leitor de tela', () => {
    render(<Esqueleto linhas={3} />)
    const status = screen.getByRole('status')
    expect(within(status).getByText('Carregando')).toBeInTheDocument()
    expect(status).toHaveAttribute('aria-busy', 'true')
  })

  it('esconde o desenho de quem não vê', () => {
    // Blocos cinzas não são informação: o anúncio de texto é que informa.
    const { container } = render(<Esqueleto linhas={4} />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('respeita a quantidade de linhas pedida', () => {
    const { container } = render(<Esqueleto linhas={5} colunas={3} />)
    const desenho = container.querySelector('[aria-hidden="true"]')
    expect(desenho?.children).toHaveLength(5)
  })
})

describe('AvisoDemora', () => {
  it('avisa que está demorando e oferece controle', async () => {
    const aoTentar = vi.fn()
    render(<AvisoDemora tentativa={1} aoTentarDeNovo={aoTentar} />)
    expect(screen.getByText(/está demorando mais que o normal/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /tentar de novo/i }))
    expect(aoTentar).toHaveBeenCalledOnce()
  })

  it('informa em qual tentativa está', () => {
    render(<AvisoDemora tentativa={3} aoTentarDeNovo={vi.fn()} />)
    expect(screen.getByText(/tentativa 3/i)).toBeInTheDocument()
  })
})

describe('FaixaAviso', () => {
  it('usa role de status para não interromper a leitura', () => {
    render(<FaixaAviso>A lista mostra apenas parte dos registros.</FaixaAviso>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

describe('EtiquetaSituacao', () => {
  it('nunca depende só de cor', () => {
    // Critério de acessibilidade: quem não distingue cor (ou usa leitor de
    // tela) precisa receber a mesma informação. O texto é o que informa.
    for (const situacao of ['pago', 'pendente', 'cancelado', 'enviado', 'inativo']) {
      const { unmount } = render(<EtiquetaSituacao situacao={situacao} />)
      expect(screen.getByText(new RegExp(situacao, 'i'))).toBeInTheDocument()
      unmount()
    }
  })
})
