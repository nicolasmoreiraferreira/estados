import type { Condicao, DefinicaoCondicao, GrupoCondicao } from './tipos'

/**
 * Catálogo de condições.
 *
 * Cada entrada carrega dois textos que não são decoração: `oQueSimula` explica
 * a situação real e `oQueDeveAcontecer` é o contrato que a interface cumpre.
 * O painel mostra os dois — quem avalia consegue conferir se a tela faz o que
 * promete, sem precisar ler o código.
 */
export const CATALOGO: Readonly<Record<Condicao, DefinicaoCondicao>> = {
  normal: {
    id: 'normal',
    rotulo: 'Tudo certo',
    grupo: 'fluxo',
    oQueSimula: 'A API responde rápido e com dados.',
    oQueDeveAcontecer: 'A tela mostra o conteúdo e nenhum aviso.',
    status: 200,
    atrasoMs: 280,
  },
  carregando: {
    id: 'carregando',
    rotulo: 'Carregando',
    grupo: 'fluxo',
    oQueSimula: 'A requisição foi enviada e ainda não voltou.',
    oQueDeveAcontecer:
      'A tela mostra o esqueleto do conteúdo, não um giro no meio do vazio. O esqueleto preserva o layout: nada salta quando o dado chega.',
    status: null,
    atrasoMs: Number.POSITIVE_INFINITY,
  },
  lento: {
    id: 'lento',
    rotulo: 'Rede lenta',
    grupo: 'fluxo',
    oQueSimula: 'Conexão de celular em área ruim: a resposta demora segundos.',
    oQueDeveAcontecer:
      'Depois de um tempo, aparece um aviso de que está demorando mais que o normal — e a opção de continuar esperando ou tentar de novo. Ninguém fica olhando um giro sem saber se travou.',
    status: 200,
    atrasoMs: 4200,
  },
  offline: {
    id: 'offline',
    rotulo: 'Sem internet',
    grupo: 'falha',
    oQueSimula: 'O aparelho está sem conexão.',
    oQueDeveAcontecer:
      'A tela diz que não há conexão e volta sozinha quando a internet retornar, sem o usuário precisar recarregar. O aviso é diferente do erro de servidor: a causa é outra, e a ação também.',
    status: null,
    atrasoMs: 120,
  },
  erro_rede: {
    id: 'erro_rede',
    rotulo: 'Falha de conexão',
    grupo: 'falha',
    oQueSimula: 'Há internet, mas a requisição não completou.',
    oQueDeveAcontecer:
      'Aviso de falha com botão de tentar de novo. A nova tentativa é automática nas primeiras vezes, com espera crescente, e o usuário vê em que tentativa está.',
    status: null,
    atrasoMs: 400,
  },
  erro_servidor: {
    id: 'erro_servidor',
    rotulo: 'Erro no servidor',
    grupo: 'falha',
    oQueSimula: 'A API responde 500: o defeito não é do usuário.',
    oQueDeveAcontecer:
      'Mensagem que não culpa quem está usando, diz que o problema é do sistema e oferece tentar de novo. O código técnico aparece, mas escondido atrás de um detalhe.',
    status: 500,
    atrasoMs: 380,
  },
  nao_autenticado: {
    id: 'nao_autenticado',
    rotulo: 'Sessão expirada',
    grupo: 'falha',
    oQueSimula: 'A sessão venceu (401).',
    oQueDeveAcontecer:
      'A tela explica que a sessão expirou e leva ao acesso novamente, preservando o que o usuário estava fazendo. Não pode ser confundido com falta de permissão.',
    status: 401,
    atrasoMs: 380,
  },
  sem_permissao: {
    id: 'sem_permissao',
    rotulo: 'Sem permissão',
    grupo: 'falha',
    oQueSimula: 'O usuário está logado, mas não tem acesso a esse dado (403).',
    oQueDeveAcontecer:
      'Explica o que falta e a quem pedir, em vez de um "acesso negado" seco. Tentar de novo não resolve, então o botão não aparece — oferecer a ação errada é pior que não oferecer nenhuma.',
    status: 403,
    atrasoMs: 360,
  },
  conflito: {
    id: 'conflito',
    rotulo: 'Conflito de edição',
    grupo: 'falha',
    oQueSimula: 'Outra pessoa alterou o mesmo registro antes de você salvar (409).',
    oQueDeveAcontecer:
      'Mostra as duas versões e deixa escolher, em vez de sobrescrever em silêncio. Perder o trabalho de alguém sem avisar é o pior desfecho possível.',
    status: 409,
    atrasoMs: 520,
  },
  vazio: {
    id: 'vazio',
    rotulo: 'Sem resultados',
    grupo: 'dados',
    oQueSimula: 'A API responde 200 com uma lista vazia.',
    oQueDeveAcontecer:
      'Estado vazio de verdade: diz por que está vazio e oferece o próximo passo. Uma tabela sem linhas e sem explicação parece defeito.',
    status: 200,
    atrasoMs: 300,
  },
  dado_invalido: {
    id: 'dado_invalido',
    rotulo: 'Dado inválido',
    grupo: 'dados',
    oQueSimula: 'A API responde 200, mas o conteúdo não tem o formato esperado.',
    oQueDeveAcontecer:
      'A validação barra o dado antes de chegar à tela e a interface avisa que o dado veio corrompido. Sem isso, a tela quebraria no meio da renderização, com erro incompreensível para quem usa.',
    status: 200,
    atrasoMs: 340,
  },
  muitos_dados: {
    id: 'muitos_dados',
    rotulo: 'Muitos dados',
    grupo: 'dados',
    oQueSimula: 'Cinco mil registros em uma resposta só.',
    oQueDeveAcontecer:
      'A lista continua utilizável: rolagem fluida, filtro respondendo, contagem correta. Volume é um estado de interface como qualquer outro.',
    status: 200,
    atrasoMs: 900,
  },
}

/** Condições na ordem em que aparecem no painel. */
export const LISTA_CATALOGO: readonly DefinicaoCondicao[] = Object.values(CATALOGO)

export const GRUPOS: Readonly<Record<GrupoCondicao, string>> = {
  fluxo: 'Fluxo normal',
  falha: 'Quando falha',
  dados: 'Dados difíceis',
}

/** Condições de cada grupo, para o painel não despejar tudo de uma vez. */
export function porGrupo(grupo: GrupoCondicao): readonly DefinicaoCondicao[] {
  return LISTA_CATALOGO.filter((definicao) => definicao.grupo === grupo)
}
