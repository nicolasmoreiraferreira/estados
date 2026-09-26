import { describe, expect, it } from 'vitest'

import { ehTransitorio, ErroApp, erroDoCorpo, normalizarErro } from '@/lib/api/erros'
import { responder } from '@/lib/api/servidorFalso'
import { definirCondicao } from '@/lib/simulacao/loja'

describe('servidor falso', () => {
  it('responde dados válidos na condição normal', async () => {
    definirCondicao('normal')
    const corpo = (await responder('pedidos')) as { itens: unknown[]; total: number }
    expect(Array.isArray(corpo.itens)).toBe(true)
    expect(corpo.total).toBeGreaterThan(0)
    expect(corpo.itens[0]).toMatchObject({ id: expect.any(String) })
  })

  it('responde lista vazia na condição de vazio', async () => {
    definirCondicao('vazio')
    const corpo = (await responder('pedidos')) as { itens: unknown[]; total: number }
    // Vazio é sucesso com lista vazia, não erro: é essa distinção que permite à
    // interface mostrar "nada aqui" em vez de "algo deu errado".
    expect(corpo.itens).toHaveLength(0)
    expect(corpo.total).toBe(0)
  })

  it('devolve corpo fora do contrato na condição de dado inválido', async () => {
    definirCondicao('dado_invalido')
    const corpo = (await responder('pedidos')) as { itens: Record<string, unknown>[] }
    // O segundo registro perdeu campos de propósito: quem precisa recusar é o
    // cliente, e é isso que o teste de validação confirma.
    expect(corpo.itens).toHaveLength(8)
    expect(Object.keys(corpo.itens[1] ?? {})).toHaveLength(2)
  })

  it('produz volume na condição de muitos dados', async () => {
    definirCondicao('muitos_dados')
    const corpo = (await responder('catalogo')) as { itens: unknown[]; total: number }
    expect(corpo.total).toBeGreaterThanOrEqual(5000)
    expect(corpo.itens).toHaveLength(corpo.total)
  })

  it('gera identificadores únicos no volume', async () => {
    definirCondicao('muitos_dados')
    const corpo = (await responder('catalogo')) as { itens: { id: string }[] }
    const ids = new Set(corpo.itens.map((item) => item.id))
    // Chave duplicada em lista longa é o defeito que aparece só em produção,
    // quando o React reclama de `key` repetida e a lista se comporta de forma
    // estranha. Vale conferir no teste, não no olho.
    expect(ids.size).toBe(corpo.itens.length)
  })

  it('lança erro tipado para cada condição de falha', async () => {
    const casos = [
      { condicao: 'offline', tipo: 'rede', status: null },
      { condicao: 'erro_rede', tipo: 'rede', status: null },
      { condicao: 'erro_servidor', tipo: 'servidor', status: 500 },
      { condicao: 'nao_autenticado', tipo: 'autenticacao', status: 401 },
      { condicao: 'sem_permissao', tipo: 'permissao', status: 403 },
    ] as const

    for (const caso of casos) {
      definirCondicao(caso.condicao)
      const erro = await responder('pedidos').catch((causa: unknown) => normalizarErro(causa))
      expect(erro).toBeInstanceOf(ErroApp)
      expect((erro as ErroApp).tipo).toBe(caso.tipo)
      expect((erro as ErroApp).status).toBe(caso.status)
    }
  })

  it('recusa nova tentativa onde ela não resolve', async () => {
    // Em 401 e 403, insistir dá o mesmo resultado. Oferecer o botão seria
    // mentir para o usuário, então a interface se apoia neste campo.
    definirCondicao('sem_permissao')
    const erro = await responder('pedidos').catch((causa: unknown) => normalizarErro(causa))
    expect((erro as ErroApp).podeTentarDeNovo).toBe(false)

    definirCondicao('erro_servidor')
    const erroServidor = await responder('pedidos').catch((causa: unknown) => normalizarErro(causa))
    expect((erroServidor as ErroApp).podeTentarDeNovo).toBe(true)
  })

  it('entrega as duas versões no conflito', async () => {
    definirCondicao('conflito')
    const erro = await responder('pedidos', { jaRecebido: { versao: 'minha' } }).catch(
      (causa: unknown) => normalizarErro(causa),
    )
    const conflito = erro as ErroApp
    expect(conflito.tipo).toBe('conflito')
    // Sem o conteúdo das duas versões, a tela não teria como mostrar o que
    // mudou — só saberia dizer que houve conflito, o que não resolve nada.
    expect(conflito.dados).toMatchObject({
      alteradoPor: expect.any(String),
      valorAtual: expect.anything(),
      seuValor: { versao: 'minha' },
    })
  })

  it('reconhece erro de rede como transitório', () => {
    const rede = new ErroApp({
      tipo: 'rede',
      status: null,
      explicacao: '',
      proximoPasso: '',
      podeTentarDeNovo: true,
      detalheTecnico: '',
    })
    const permissao = new ErroApp({
      tipo: 'permissao',
      status: 403,
      explicacao: '',
      proximoPasso: '',
      podeTentarDeNovo: false,
      detalheTecnico: '',
    })
    expect(ehTransitorio(rede)).toBe(true)
    expect(ehTransitorio(permissao)).toBe(false)
  })
})

describe('normalização de erro', () => {
  it('mantém um ErroApp como está', () => {
    const original = new ErroApp({
      tipo: 'servidor',
      status: 500,
      explicacao: 'x',
      proximoPasso: 'y',
      podeTentarDeNovo: true,
      detalheTecnico: 'z',
    })
    expect(normalizarErro(original)).toBe(original)
  })

  it('classifica falha de fetch como erro de rede', () => {
    const erro = normalizarErro(new TypeError('Failed to fetch'))
    expect(erro.tipo).toBe('rede')
    expect(erro.podeTentarDeNovo).toBe(true)
  })

  it('não quebra com valor lançado que não é erro', () => {
    // Acontece em bibliotecas: `throw 'algo'`. A fronteira precisa absorver isso
    // em vez de deixar a interface receber um valor que ela não sabe ler.
    const erro = normalizarErro('falha em texto solto')
    expect(erro.tipo).toBe('desconhecido')
    expect(erro.detalheTecnico).toContain('falha em texto solto')
  })

  it('não trata cancelamento como falha', () => {
    const erro = normalizarErro(new DOMException('Cancelado', 'AbortError'))
    expect(erro.detalheTecnico).toBe('AbortError')
  })
})

describe('reconstituição de erro a partir do corpo', () => {
  it('usa o tipo informado quando é válido', () => {
    const erro = erroDoCorpo({ tipo: 'permissao', explicacao: 'Sem acesso' }, 403)
    expect(erro.tipo).toBe('permissao')
    expect(erro.explicacao).toBe('Sem acesso')
  })

  it('deduz o tipo pelo status quando o corpo não informa', () => {
    expect(erroDoCorpo({}, 401).tipo).toBe('autenticacao')
    expect(erroDoCorpo({}, 403).tipo).toBe('permissao')
    expect(erroDoCorpo({}, 409).tipo).toBe('conflito')
    expect(erroDoCorpo({}, 500).tipo).toBe('servidor')
  })

  it('ignora corpo que não é objeto', () => {
    const erro = erroDoCorpo('texto qualquer', 500)
    expect(erro.tipo).toBe('servidor')
    expect(erro.explicacao.length).toBeGreaterThan(0)
  })

  it('não aceita tipo inventado no corpo', () => {
    const erro = erroDoCorpo({ tipo: 'superpoder' }, 500)
    expect(erro.tipo).toBe('servidor')
  })
})
