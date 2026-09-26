/**
 * As condições que o app sabe simular.
 *
 * A lista é fechada de propósito: cada condição corresponde a uma situação que
 * acontece em produção e a um comportamento que a interface precisa ter. Uma
 * condição que não muda nada na tela não deveria estar aqui.
 */
export const CONDICOES = [
  'normal',
  'carregando',
  'lento',
  'offline',
  'erro_rede',
  'erro_servidor',
  'nao_autenticado',
  'sem_permissao',
  'conflito',
  'vazio',
  'dado_invalido',
  'muitos_dados',
] as const

export type Condicao = (typeof CONDICOES)[number]

/** Agrupamento usado no painel para não despejar doze opções de uma vez. */
export type GrupoCondicao = 'fluxo' | 'falha' | 'dados'

export interface DefinicaoCondicao {
  readonly id: Condicao
  readonly rotulo: string
  readonly grupo: GrupoCondicao
  /** O que está sendo simulado, em uma frase. */
  readonly oQueSimula: string
  /** O que a interface deve fazer nesse caso — o contrato da tela. */
  readonly oQueDeveAcontecer: string
  /** Status HTTP equivalente, quando faz sentido. */
  readonly status: number | null
  /** Quanto o servidor falso demora para responder. */
  readonly atrasoMs: number
}

/**
 * Verifica se um texto vindo da URL (ou de qualquer entrada externa) é uma
 * condição conhecida.
 *
 * Toda entrada externa é tratada como não confiável: um `?estado=` inventado
 * não pode quebrar a tela nem chegar ao servidor falso.
 */
export function ehCondicao(valor: string | null | undefined): valor is Condicao {
  return typeof valor === 'string' && (CONDICOES as readonly string[]).includes(valor)
}
