/**
 * Erros tipados.
 *
 * A diferença entre este arquivo e um `throw new Error('falhou')` está no que
 * cada erro carrega: o tipo (para a interface decidir o que mostrar), a
 * explicação em linguagem de gente (para o usuário saber o que fazer), se vale a
 * pena tentar de novo e, quando faz sentido, um conteúdo estruturado. Sem isso,
 * a interface só pode dizer "algo deu errado" — que é o mesmo que não dizer nada.
 */

export type TipoErro =
  | 'rede'
  | 'servidor'
  | 'autenticacao'
  | 'permissao'
  | 'conflito'
  | 'validacao'
  | 'desconhecido'

export interface DetalhesErro {
  readonly tipo: TipoErro
  readonly status: number | null
  /** O que aconteceu, em linguagem de gente. */
  readonly explicacao: string
  /** O que fazer a respeito. Vazio quando não há ação possível. */
  readonly proximoPasso: string
  /** Se faz sentido oferecer "tentar de novo". */
  readonly podeTentarDeNovo: boolean
  /** Informação técnica para quem for investigar. */
  readonly detalheTecnico: string
  /**
   * Conteúdo estruturado que a interface precisa para resolver a situação.
   *
   * Existe por causa do conflito de edição: nesse caso não basta dizer que houve
   * conflito, é preciso entregar as duas versões para a tela mostrar lado a lado
   * e deixar o usuário escolher. Um erro que só carrega texto obrigaria a tela a
   * fazer uma segunda requisição para descobrir o que mudou.
   */
  readonly dados?: unknown
}

export class ErroApp extends Error {
  readonly tipo: TipoErro
  readonly status: number | null
  readonly explicacao: string
  readonly proximoPasso: string
  readonly podeTentarDeNovo: boolean
  readonly detalheTecnico: string
  readonly dados: unknown

  constructor(detalhes: DetalhesErro) {
    super(detalhes.explicacao)
    this.name = 'ErroApp'
    this.tipo = detalhes.tipo
    this.status = detalhes.status
    this.explicacao = detalhes.explicacao
    this.proximoPasso = detalhes.proximoPasso
    this.podeTentarDeNovo = detalhes.podeTentarDeNovo
    this.detalheTecnico = detalhes.detalheTecnico
    this.dados = detalhes.dados ?? null
  }

  /** Versão serializável, para transporte e para os testes. */
  paraJson(): DetalhesErro {
    return {
      tipo: this.tipo,
      status: this.status,
      explicacao: this.explicacao,
      proximoPasso: this.proximoPasso,
      podeTentarDeNovo: this.podeTentarDeNovo,
      detalheTecnico: this.detalheTecnico,
      dados: this.dados,
    }
  }
}

/**
 * Normaliza qualquer coisa jogada para `ErroApp`.
 *
 * É a fronteira do sistema: a partir daqui, a interface nunca precisa lidar com
 * `unknown`. Vale para erro de rede, erro do nosso código e até para um
 * `throw 'string'`, que infelizmente ainda aparece em bibliotecas.
 */
export function normalizarErro(causa: unknown): ErroApp {
  if (causa instanceof ErroApp) return causa

  if (causa instanceof DOMException && causa.name === 'AbortError') {
    return new ErroApp({
      tipo: 'desconhecido',
      status: null,
      explicacao: 'A operação foi cancelada.',
      proximoPasso: '',
      podeTentarDeNovo: true,
      detalheTecnico: 'AbortError',
    })
  }

  if (causa instanceof TypeError) {
    return new ErroApp({
      tipo: 'rede',
      status: null,
      explicacao: 'Não foi possível falar com o servidor.',
      proximoPasso: 'Verifique a conexão e tente de novo.',
      podeTentarDeNovo: true,
      detalheTecnico: causa.message,
    })
  }

  if (causa instanceof Error) {
    return new ErroApp({
      tipo: 'desconhecido',
      status: null,
      explicacao: 'Aconteceu um problema inesperado.',
      proximoPasso: 'Tente de novo. Se continuar, avise o suporte.',
      podeTentarDeNovo: true,
      detalheTecnico: `${causa.name}: ${causa.message}`,
    })
  }

  return new ErroApp({
    tipo: 'desconhecido',
    status: null,
    explicacao: 'Aconteceu um problema inesperado.',
    proximoPasso: 'Tente de novo. Se continuar, avise o suporte.',
    podeTentarDeNovo: true,
    detalheTecnico: `valor lançado sem ser erro: ${JSON.stringify(causa)}`,
  })
}

/** Se o erro é do tipo que passa sozinho e vale reprocessar automaticamente. */
export function ehTransitorio(erro: ErroApp): boolean {
  return erro.tipo === 'rede' || erro.tipo === 'servidor'
}

/**
 * Reconstitui um `ErroApp` a partir do corpo de uma resposta.
 *
 * O corpo vem da rede e não é confiável: cada campo é conferido antes de ser
 * usado, e o que faltar cai em um valor sensato. Assumir o formato aqui seria
 * repetir o erro que o projeto inteiro tenta evitar.
 */
export function erroDoCorpo(corpo: unknown, status: number): ErroApp {
  const bruto = (typeof corpo === 'object' && corpo !== null ? corpo : {}) as Record<string, unknown>

  const tiposValidos: readonly TipoErro[] = [
    'rede',
    'servidor',
    'autenticacao',
    'permissao',
    'conflito',
    'validacao',
    'desconhecido',
  ]
  const tipoBruto = bruto['tipo']
  const tipo =
    typeof tipoBruto === 'string' && (tiposValidos as readonly string[]).includes(tipoBruto)
      ? (tipoBruto as TipoErro)
      : status === 401
        ? 'autenticacao'
        : status === 403
          ? 'permissao'
          : status === 409
            ? 'conflito'
            : status >= 500
              ? 'servidor'
              : 'desconhecido'

  const texto = (campo: string, padrao: string): string => {
    const valor = bruto[campo]
    return typeof valor === 'string' && valor !== '' ? valor : padrao
  }

  return new ErroApp({
    tipo,
    status,
    explicacao: texto('explicacao', 'Não foi possível concluir a operação.'),
    proximoPasso: texto('proximoPasso', ''),
    podeTentarDeNovo: bruto['podeTentarDeNovo'] !== false,
    detalheTecnico: texto('detalheTecnico', `HTTP ${String(status)}`),
    dados: bruto['dados'] ?? null,
  })
}
