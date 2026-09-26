import { describe, expect, it, vi } from 'vitest'

import { CATALOGO, LISTA_CATALOGO, porGrupo } from '@/lib/simulacao/catalogo'
import {
  CONDICAO_PADRAO,
  condicaoDaUrl,
  definirCondicao,
  inscrever,
  lerCondicao,
} from '@/lib/simulacao/loja'
import { CONDICOES, ehCondicao } from '@/lib/simulacao/tipos'

describe('catálogo de condições', () => {
  it('cobre todas as condições declaradas', () => {
    // A checagem existe para o caso de alguém adicionar uma condição ao tipo e
    // esquecer de descrevê-la. Sem isso, o painel mostraria uma opção sem texto
    // — e o contrato da tela ficaria implícito.
    for (const condicao of CONDICOES) {
      expect(CATALOGO[condicao]).toBeDefined()
      expect(CATALOGO[condicao].id).toBe(condicao)
    }
    expect(LISTA_CATALOGO).toHaveLength(CONDICOES.length)
  })

  it('descreve o que simula e o que deve acontecer em cada condição', () => {
    for (const definicao of LISTA_CATALOGO) {
      expect(definicao.oQueSimula.length).toBeGreaterThan(10)
      expect(definicao.oQueDeveAcontecer.length).toBeGreaterThan(30)
    }
  })

  it('atribui status HTTP coerente com o grupo', () => {
    expect(CATALOGO.erro_servidor.status).toBe(500)
    expect(CATALOGO.nao_autenticado.status).toBe(401)
    expect(CATALOGO.sem_permissao.status).toBe(403)
    expect(CATALOGO.conflito.status).toBe(409)
    expect(CATALOGO.vazio.status).toBe(200)
    // 401 e 403 pedem ações diferentes: um pede novo acesso, o outro pede
    // liberação. Se os dois virassem o mesmo código, a interface não teria como
    // distinguir — e a distinção é justamente o ponto.
    expect(CATALOGO.nao_autenticado.status).not.toBe(CATALOGO.sem_permissao.status)
  })

  it('distribui as condições nos três grupos', () => {
    expect(porGrupo('fluxo').length).toBeGreaterThan(0)
    expect(porGrupo('falha').length).toBeGreaterThan(0)
    expect(porGrupo('dados').length).toBeGreaterThan(0)
    const soma =
      porGrupo('fluxo').length + porGrupo('falha').length + porGrupo('dados').length
    expect(soma).toBe(LISTA_CATALOGO.length)
  })
})

describe('reconhecimento de condição', () => {
  it('aceita apenas valores conhecidos', () => {
    expect(ehCondicao('erro_servidor')).toBe(true)
    expect(ehCondicao('normal')).toBe(true)
  })

  it('recusa entrada externa inválida', () => {
    // Toda entrada de fora é não confiável: um valor inventado na URL não pode
    // chegar ao servidor falso nem quebrar a tela.
    expect(ehCondicao('inventado')).toBe(false)
    expect(ehCondicao('')).toBe(false)
    expect(ehCondicao(null)).toBe(false)
    expect(ehCondicao(undefined)).toBe(false)
    expect(ehCondicao('ERRO_SERVIDOR')).toBe(false)
    expect(ehCondicao('__proto__')).toBe(false)
  })
})

describe('loja de condição', () => {
  it('começa no padrão', () => {
    expect(lerCondicao()).toBe(CONDICAO_PADRAO)
  })

  it('notifica os interessados quando a condição muda', () => {
    const ouvinte = vi.fn()
    const cancelar = inscrever(ouvinte)

    definirCondicao('erro_servidor')
    expect(ouvinte).toHaveBeenCalledTimes(1)
    expect(lerCondicao()).toBe('erro_servidor')

    // Definir o mesmo valor não deve notificar: notificação redundante faz a
    // interface renderizar à toa.
    definirCondicao('erro_servidor')
    expect(ouvinte).toHaveBeenCalledTimes(1)

    definirCondicao('vazio')
    expect(ouvinte).toHaveBeenCalledTimes(2)

    cancelar()
    definirCondicao('normal')
    expect(ouvinte).toHaveBeenCalledTimes(2)
  })

  it('grava a condição no endereço', () => {
    definirCondicao('sem_permissao')
    expect(window.location.search).toBe('?estado=sem_permissao')
  })

  it('remove o parâmetro ao voltar ao padrão', () => {
    definirCondicao('offline')
    definirCondicao('normal')
    // Endereço limpo quando não há nada a mostrar: link compartilhado não deve
    // carregar um parâmetro sem efeito.
    expect(window.location.search).toBe('')
  })

  it('substitui o histórico em vez de acumular', () => {
    const antes = window.history.length
    definirCondicao('vazio')
    definirCondicao('lento')
    definirCondicao('erro_rede')
    // Alternar condições não deve encher o botão de voltar do navegador.
    expect(window.history.length).toBe(antes)
  })
})

describe('leitura da condição pela URL', () => {
  it('lê um valor válido', () => {
    window.history.replaceState(null, '', '/?estado=muitos_dados')
    expect(condicaoDaUrl()).toBe('muitos_dados')
  })

  it('cai no padrão quando o valor não existe', () => {
    window.history.replaceState(null, '', '/')
    expect(condicaoDaUrl()).toBe(CONDICAO_PADRAO)
  })

  it('cai no padrão quando o valor é inválido', () => {
    window.history.replaceState(null, '', '/?estado=drop_table')
    expect(condicaoDaUrl()).toBe(CONDICAO_PADRAO)
  })

  it('preserva os outros parâmetros do endereço', () => {
    window.history.replaceState(null, '', '/?pagina=2')
    definirCondicao('vazio')
    // Sincronizar a condição não pode apagar o resto da URL: numa aplicação com
    // filtros no endereço, isso destruiria o estado da tela.
    expect(window.location.search).toContain('pagina=2')
    expect(window.location.search).toContain('estado=vazio')
  })
})
