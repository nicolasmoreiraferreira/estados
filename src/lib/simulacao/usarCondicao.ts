import { useSyncExternalStore } from 'react'

import { CATALOGO } from './catalogo'
import { CONDICAO_PADRAO, inscrever, lerCondicao } from './loja'
import type { Condicao, DefinicaoCondicao } from './tipos'

/**
 * Assina a condição atual.
 *
 * `useSyncExternalStore` é o gancho certo aqui: a loja vive fora do React, e
 * este é o mecanismo que garante que a interface não leia um valor
 * desatualizado durante a renderização concorrente.
 */
export function usarCondicao(): Condicao {
  return useSyncExternalStore(inscrever, lerCondicao, () => CONDICAO_PADRAO)
}

/** A condição atual com seus textos e metadados. */
export function usarDefinicaoCondicao(): DefinicaoCondicao {
  const condicao = usarCondicao()
  return CATALOGO[condicao]
}

/** Se a condição atual é uma falha que impede a tela de mostrar conteúdo. */
export function usarTemFalha(): boolean {
  const condicao = usarCondicao()
  return condicao !== 'normal' && condicao !== 'carregando' && condicao !== 'lento'
}
