import { describe, expect, it } from 'vitest'

import { validarAgenda, validarCompromisso } from '@/features/agenda/tipos'
import { validarCatalogo, validarItem } from '@/features/catalogo/tipos'
import { validarCliente, validarClientes } from '@/features/clientes/tipos'
import { DadoInvalido, validarPedido, validarPedidos } from '@/features/pedidos/tipos'

/**
 * Testes de validação de fronteira.
 *
 * Estes testes são o argumento do projeto em forma executável: cada caso aqui é
 * um dado que, sem validação, chegaria à tela e quebraria a renderização com
 * mensagem incompreensível — ou pior, renderizaria algo plausível e errado.
 */

const pedidoValido = {
  id: 'PD-1',
  cliente: 'Mercado',
  valor: 100,
  status: 'pago',
  criadoEm: '2026-09-20T10:00:00Z',
}

describe('validação de pedido', () => {
  it('aceita registro completo', () => {
    expect(validarPedido(pedidoValido)).toMatchObject({ id: 'PD-1', valor: 100 })
  })

  it('recusa registro sem campo obrigatório', () => {
    // É exatamente o que o simulador faz na condição de dado inválido: o corpo
    // parece certo, mas perdeu campos.
    const semValor: Record<string, unknown> = { ...pedidoValido }
    delete semValor['valor']
    expect(() => validarPedido(semValor)).toThrow(DadoInvalido)
  })

  it('recusa valor que não é número', () => {
    expect(() => validarPedido({ ...pedidoValido, valor: '100' })).toThrow(DadoInvalido)
  })

  it('recusa número infinito', () => {
    expect(() => validarPedido({ ...pedidoValido, valor: Number.POSITIVE_INFINITY })).toThrow(
      DadoInvalido,
    )
  })

  it('recusa situação desconhecida', () => {
    expect(() => validarPedido({ ...pedidoValido, status: 'sumiu' })).toThrow(DadoInvalido)
  })

  it('recusa data inválida', () => {
    expect(() => validarPedido({ ...pedidoValido, criadoEm: 'ontem' })).toThrow(DadoInvalido)
  })

  it('recusa texto vazio', () => {
    expect(() => validarPedido({ ...pedidoValido, cliente: '   ' })).toThrow(DadoInvalido)
  })

  it('recusa registro que não é objeto', () => {
    expect(() => validarPedido(null)).toThrow(DadoInvalido)
    expect(() => validarPedido('pedido')).toThrow(DadoInvalido)
  })

  it('recusa corpo sem a chave de itens', () => {
    expect(() => validarPedidos({ dados: [] })).toThrow(DadoInvalido)
    expect(() => validarPedidos(null)).toThrow(DadoInvalido)
  })

  it('aponta qual campo falhou', () => {
    // A mensagem precisa identificar o campo: é o que permite investigar o
    // defeito a partir do detalhe técnico mostrado na tela.
    try {
      validarPedido({ ...pedidoValido, valor: 'cem' })
      expect.unreachable('deveria ter lançado')
    } catch (causa) {
      expect(causa).toBeInstanceOf(DadoInvalido)
      expect((causa as DadoInvalido).campo).toBe('valor')
    }
  })
})

describe('validação de compromisso', () => {
  const compromissoValido = {
    id: 'AG-1',
    titulo: 'Reunião',
    inicio: '2026-09-25T10:00:00Z',
    fim: '2026-09-25T11:00:00Z',
    sala: 'Sala 1',
  }

  it('aceita intervalo coerente', () => {
    expect(validarCompromisso(compromissoValido).titulo).toBe('Reunião')
  })

  it('recusa término antes do início', () => {
    // Regra de domínio, não de formato: o dado passa na checagem de tipo e
    // representa um intervalo impossível. Sem validar isso, a tela mostraria
    // algo plausível e errado — pior que mostrar erro.
    expect(() =>
      validarCompromisso({
        ...compromissoValido,
        inicio: '2026-09-25T12:00:00Z',
        fim: '2026-09-25T11:00:00Z',
      }),
    ).toThrow(DadoInvalido)
  })

  it('recusa intervalo de duração zero', () => {
    expect(() =>
      validarCompromisso({
        ...compromissoValido,
        fim: compromissoValido.inicio,
      }),
    ).toThrow(DadoInvalido)
  })

  it('recusa lista sem itens', () => {
    expect(() => validarAgenda({})).toThrow(DadoInvalido)
  })
})

describe('validação de item de catálogo', () => {
  const itemValido = { id: 'CB-1', nome: 'Cabo', preco: 10.5, estoque: 3, categoria: 'Elétrica' }

  it('aceita item coerente', () => {
    expect(validarItem(itemValido).preco).toBe(10.5)
  })

  it('recusa preço negativo', () => {
    expect(() => validarItem({ ...itemValido, preco: -10 })).toThrow(DadoInvalido)
  })

  it('recusa estoque negativo', () => {
    expect(() => validarItem({ ...itemValido, estoque: -1 })).toThrow(DadoInvalido)
  })

  it('aceita estoque zerado', () => {
    // Zero é válido: significa indisponível, não dado inválido.
    expect(validarItem({ ...itemValido, estoque: 0 }).estoque).toBe(0)
  })

  it('recusa lista que não é lista', () => {
    expect(() => validarCatalogo({ itens: 'muitos' })).toThrow(DadoInvalido)
  })
})

describe('validação de cliente', () => {
  const clienteValido = {
    id: 'CL-1',
    nome: 'Mercado',
    email: 'contato@mercado.com.br',
    situacao: 'ativo',
    desde: '2024-01-01',
  }

  it('aceita cliente coerente', () => {
    expect(validarCliente(clienteValido).email).toBe('contato@mercado.com.br')
  })

  it('recusa e-mail sem arroba', () => {
    expect(() => validarCliente({ ...clienteValido, email: 'contato.mercado.com' })).toThrow(
      DadoInvalido,
    )
  })

  it('recusa domínio sem ponto', () => {
    expect(() => validarCliente({ ...clienteValido, email: 'contato@mercado' })).toThrow(
      DadoInvalido,
    )
  })

  it('recusa situação desconhecida', () => {
    expect(() => validarCliente({ ...clienteValido, situacao: 'sumido' })).toThrow(DadoInvalido)
  })

  it('recusa lista com um item inválido no meio', () => {
    // Um registro ruim contamina a lista inteira — e é isso que a tela precisa
    // saber antes de tentar renderizar.
    expect(() =>
      validarClientes({ itens: [clienteValido, { ...clienteValido, email: 'invalido' }] }),
    ).toThrow(DadoInvalido)
  })
})
