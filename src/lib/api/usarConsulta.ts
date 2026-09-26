import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { CONDICAO_PADRAO, inscrever, lerCondicao } from '../simulacao/loja'
import { ErroApp, ehTransitorio, erroDoCorpo, normalizarErro } from './erros'

/**
 * Consulta de dados com todos os estados explícitos.
 *
 * Existe para que nenhuma tela precise inventar a própria lógica de
 * carregamento — e para que todas respondam igual às mesmas condições. O tipo
 * de retorno é uma união discriminada: é impossível renderizar sem tratar cada
 * situação, porque o compilador cobra.
 *
 * As decisões que valem explicação:
 *
 * 1. **Espera crescente.** Falha de rede costuma passar sozinha. Tentar de novo
 *    imediatamente só gasta bateria e sobrecarrega um servidor que já está mal —
 *    daí a espera dobrar a cada tentativa.
 * 2. **Resposta obsoleta descartada.** Se o usuário troca o filtro enquanto a
 *    requisição anterior está no ar, a resposta antiga pode chegar depois e
 *    sobrescrever a nova. É o defeito clássico de busca: a lista mostra o
 *    resultado do termo anterior. Cada requisição recebe um número de ordem, e
 *    só a última pode escrever no estado.
 * 3. **Cancelamento de verdade.** Trocar de tela cancela a requisição em vez de
 *    deixá-la terminar em vão.
 * 4. **Validação no status 200.** Um corpo malformado é um caminho real. Quando a
 *    validação da tela rejeita o conteúdo, o erro vira `validacao` — e não
 *    "problema inesperado", que não diz nada a quem está usando.
 */

export type EstadoConsulta<T> =
  | { readonly situacao: 'carregando'; readonly demorando: boolean; readonly tentativa: number }
  | { readonly situacao: 'pronto'; readonly dados: T; readonly aviso: string | null }
  | {
      readonly situacao: 'falhou'
      readonly erro: ErroApp
      readonly tentativa: number
      readonly podeTentarDeNovo: boolean
    }

export interface OpcoesConsulta<T> {
  /** Caminho do recurso, por exemplo `pedidos`. */
  readonly recurso: string
  /** Valida e converte o corpo bruto. Deve lançar quando o formato é inválido. */
  readonly validar: (corpo: unknown) => T
  /** Quantas vezes reprocessar sozinho antes de passar a bola para o usuário. */
  readonly tentativasAutomaticas?: number
  /** Tempo base da espera crescente, em milissegundos. */
  readonly esperaBaseMs?: number
  /** A partir de quanto tempo avisar que está demorando mais que o normal. */
  readonly limiteDemoraMs?: number
  /** Muda quando o recurso deve ser buscado de novo (filtro, período, termo). */
  readonly dependencias?: readonly unknown[]
}

const TENTATIVAS_PADRAO = 2
const ESPERA_BASE_PADRAO = 500
const LIMITE_DEMORA_PADRAO = 1200

export interface RetornoConsulta<T> {
  readonly estado: EstadoConsulta<T>
  readonly recarregar: () => void
}

export function usarConsulta<T>(opcoes: OpcoesConsulta<T>): RetornoConsulta<T> {
  const {
    recurso,
    validar,
    tentativasAutomaticas = TENTATIVAS_PADRAO,
    esperaBaseMs = ESPERA_BASE_PADRAO,
    limiteDemoraMs = LIMITE_DEMORA_PADRAO,
    dependencias = [],
  } = opcoes

  const [estado, definirEstado] = useState<EstadoConsulta<T>>({
    situacao: 'carregando',
    demorando: false,
    tentativa: 1,
  })

  // A condição simulada entra como dependência do efeito: trocar de situação
  // no painel precisa refazer a consulta na hora. Sem isso o simulador seria
  // decorativo — o dado antigo ficaria na tela e nada reagiria.
  const condicao = useSyncExternalStore(inscrever, lerCondicao, () => CONDICAO_PADRAO)

  // Número de ordem da requisição: só a mais recente pode escrever no estado.
  const ordemRef = useRef(0)
  const [gatilho, definirGatilho] = useState(0)

  const recarregar = useCallback(() => {
    definirGatilho((valor) => valor + 1)
  }, [])

  useEffect(() => {
    const controlador = new AbortController()
    const minhaOrdem = ordemRef.current + 1
    ordemRef.current = minhaOrdem

    // Objeto mutável em vez de variável simples: o TypeScript estreita `let`
    // capturado em closure para o valor inicial e passa a considerar a condição
    // sempre falsa — o que esconderia justamente o caminho de cancelamento.
    const controle = { cancelado: false }

    let tentativa = 1
    let temporizador: ReturnType<typeof setTimeout> | undefined

    definirEstado({ situacao: 'carregando', demorando: false, tentativa: 1 })

    const temporizadorDemora = setTimeout(() => {
      if (!controle.cancelado && ordemRef.current === minhaOrdem) {
        definirEstado((atual) =>
          atual.situacao === 'carregando' ? { ...atual, demorando: true } : atual,
        )
      }
    }, limiteDemoraMs)

    const aindaVale = (): boolean => !controle.cancelado && ordemRef.current === minhaOrdem

    const executar = async (): Promise<void> => {
      try {
        const resposta = await fetch(`/api/${recurso}`, { signal: controlador.signal })
        if (!aindaVale()) return

        let corpo: unknown = null
        try {
          corpo = await resposta.json()
        } catch {
          corpo = null
        }
        if (!aindaVale()) return

        if (!resposta.ok) {
          throw erroDoCorpo(corpo, resposta.status)
        }

        // A validação roda sempre, inclusive no 200: corpo com formato errado é
        // um caminho real, e é aqui que ele é barrado em vez de quebrar a tela.
        let dados: T
        try {
          dados = validar(corpo)
        } catch (falhaValidacao) {
          throw new ErroApp({
            tipo: 'validacao',
            status: resposta.status,
            explicacao: 'Os dados chegaram em um formato que não dá para usar.',
            proximoPasso: 'Tente de novo. Se continuar, avise o suporte com o detalhe abaixo.',
            podeTentarDeNovo: true,
            detalheTecnico:
              falhaValidacao instanceof Error
                ? `${falhaValidacao.name}: ${falhaValidacao.message}`
                : 'a validação recusou o conteúdo recebido',
          })
        }
        if (!aindaVale()) return

        clearTimeout(temporizadorDemora)
        definirEstado({
          situacao: 'pronto',
          dados,
          aviso:
            lerCondicao() === 'muitos_dados'
              ? 'Resposta grande: a lista renderiza apenas o que está à vista.'
              : null,
        })
      } catch (causa) {
        if (!aindaVale()) return
        if (causa instanceof DOMException && causa.name === 'AbortError') return

        const erro = normalizarErro(causa)

        // Só falha transitória merece nova tentativa automática. Insistir em 403
        // ou 409 é gastar tempo para receber o mesmo resultado.
        if (ehTransitorio(erro) && tentativa <= tentativasAutomaticas) {
          const espera = esperaBaseMs * 2 ** (tentativa - 1)
          tentativa += 1
          definirEstado({ situacao: 'carregando', demorando: true, tentativa })
          temporizador = setTimeout(() => {
            void executar()
          }, espera)
          return
        }

        clearTimeout(temporizadorDemora)
        definirEstado({
          situacao: 'falhou',
          erro,
          tentativa,
          podeTentarDeNovo: erro.podeTentarDeNovo,
        })
      }
    }

    void executar()

    return () => {
      controle.cancelado = true
      controlador.abort()
      clearTimeout(temporizador)
      clearTimeout(temporizadorDemora)
    }
  }, [recurso, gatilho, condicao, tentativasAutomaticas, esperaBaseMs, limiteDemoraMs, ...dependencias])

  return { estado, recarregar }
}
