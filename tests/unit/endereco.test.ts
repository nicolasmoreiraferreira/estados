import { describe, expect, it, vi } from 'vitest'

import {
  condicaoDaUrl,
  definirCondicao,
  inscrever,
  lerCondicao,
  observarEndereco,
} from '@/lib/simulacao/loja'

/**
 * Testes da sincronização entre endereço e condição.
 *
 * O caso que motivou este arquivo: colar um link com outra condição na mesma aba
 * não fazia nada, porque a condição só era lida ao carregar a página. Quem
 * estivesse demonstrando concluiria que o link não funciona — um defeito que só
 * aparece no uso real, nunca num teste de unidade ingênuo.
 */

describe('observador de endereço', () => {
  it('aplica a condição quando o endereço muda', () => {
    const cancelar = observarEndereco()
    const ouvinte = vi.fn()
    inscrever(ouvinte)

    // Simula colar um link na mesma aba: o endereço muda, a página não recarrega.
    window.history.replaceState(null, '', '#/pedidos?estado=sem_permissao')
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    expect(lerCondicao()).toBe('sem_permissao')
    expect(ouvinte).toHaveBeenCalled()
    cancelar()
  })

  it('volta ao padrão quando o parâmetro é removido', () => {
    const cancelar = observarEndereco()
    definirCondicao('erro_servidor')

    window.history.replaceState(null, '', '#/pedidos')
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    expect(lerCondicao()).toBe('normal')
    cancelar()
  })

  it('ignora valor inválido no endereço', () => {
    const cancelar = observarEndereco()
    definirCondicao('vazio')

    window.history.replaceState(null, '', '#/pedidos?estado=drop_table')
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    // Entrada externa é não confiável: valor inventado não pode chegar ao
    // servidor falso nem derrubar a tela.
    expect(lerCondicao()).toBe('normal')
    cancelar()
  })

  it('não reescreve o endereço ao reagir a ele', () => {
    const cancelar = observarEndereco()
    window.history.replaceState(null, '', '#/pedidos?estado=lento')
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    // Reescrever aqui criaria um ciclo entre escrita e leitura — e o endereço
    // perderia o caminho da tela atual.
    expect(window.location.hash).toBe('#/pedidos?estado=lento')
    cancelar()
  })

  it('para de observar quando cancelado', () => {
    const cancelar = observarEndereco()
    cancelar()
    definirCondicao('normal')

    window.history.replaceState(null, '', '#/pedidos?estado=erro_rede')
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    expect(lerCondicao()).toBe('normal')
  })
})

describe('leitura do endereço com fragmento', () => {
  it('lê o parâmetro que vive dentro do fragmento', () => {
    // Este é o formato real da demonstração: o roteador é por hash, então os
    // parâmetros ficam depois do #, e não em location.search.
    window.history.replaceState(null, '', '#/catalogo?estado=muitos_dados')
    expect(condicaoDaUrl()).toBe('muitos_dados')
  })

  it('lê o parâmetro na busca normal quando não há fragmento', () => {
    // Formato dos testes de componente, que não montam o roteador.
    window.history.replaceState(null, '', '/catalogo?estado=vazio')
    expect(condicaoDaUrl()).toBe('vazio')
  })

  it('preserva o caminho da tela ao gravar a condição', () => {
    window.history.replaceState(null, '', '#/clientes')
    definirCondicao('conflito')
    // Perder o caminho aqui jogaria o usuário para outra tela ao trocar a
    // condição — o tipo de defeito que só aparece clicando.
    expect(window.location.hash).toBe('#/clientes?estado=conflito')
  })

  it('preserva os outros parâmetros', () => {
    window.history.replaceState(null, '', '#/pedidos?pagina=2')
    definirCondicao('erro_servidor')
    expect(window.location.hash).toContain('pagina=2')
    expect(window.location.hash).toContain('estado=erro_servidor')
  })

  it('remove apenas o parâmetro da condição ao voltar ao padrão', () => {
    window.history.replaceState(null, '', '#/pedidos?pagina=3')
    definirCondicao('lento')
    expect(window.location.hash).toBe('#/pedidos?pagina=3&estado=lento')

    definirCondicao('normal')
    // O outro parâmetro permanece: numa aplicação com filtros no endereço,
    // apagar tudo ao voltar ao padrão destruiria o estado da tela.
    expect(window.location.hash).toBe('#/pedidos?pagina=3')
  })
})
