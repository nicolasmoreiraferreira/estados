import { ehCondicao, type Condicao } from './tipos'

/**
 * Loja da condição simulada.
 *
 * Por que não um contexto do React apenas: o cliente da API não é um componente
 * e precisa ler a condição no momento da chamada. Uma loja pequena, fora do
 * React, resolve os dois lados — o cliente lê direto, e a interface assina com
 * `useSyncExternalStore`. Assim não existe estado duplicado nem risco de a tela
 * e a API discordarem sobre qual condição está valendo.
 *
 * **Sobre o endereço.** A aplicação usa roteamento por hash, porque a
 * demonstração é estática: sem servidor para redirecionar, um caminho puro daria
 * 404 ao recarregar. Isso significa que os parâmetros da própria aplicação vivem
 * *dentro* do fragmento — `#/pedidos?estado=vazio` — e não em `location.search`.
 *
 * Ler apenas `location.search` seria o defeito silencioso: em jsdom (testes
 * unitários) não há fragmento e tudo funcionaria; no navegador, com o roteador
 * montado, o parâmetro estaria no fragmento e a condição nunca seria lida. Um
 * bug que passa nos testes e falha na demonstração. Por isso a leitura e a
 * escrita procuram o lugar certo: o fragmento quando ele existe, a busca normal
 * quando não existe.
 */

const CHAVE_URL = 'estado'
const PADRAO: Condicao = 'normal'

let condicao: Condicao = PADRAO
const ouvintes = new Set<() => void>()

/** Leitura síncrona, usada pelo servidor falso e pelos testes. */
export function lerCondicao(): Condicao {
  return condicao
}

export function definirCondicao(nova: Condicao): void {
  if (nova === condicao) return
  condicao = nova
  sincronizarUrl(nova)
  for (const ouvinte of ouvintes) ouvinte()
}

export function inscrever(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

/* -------------------------------------------------------------------------- */
/* Endereço                                                                    */
/* -------------------------------------------------------------------------- */

interface PartesDoEndereco {
  /** O caminho dentro do fragmento, sem a cerquilha. Vazio quando não há. */
  readonly caminho: string
  readonly parametros: URLSearchParams
  readonly temFragmento: boolean
}

/**
 * Separa o endereço em caminho e parâmetros.
 *
 * Quando há fragmento, os parâmetros da aplicação estão nele
 * (`#/pedidos?estado=vazio`); quando não há, estão na busca normal
 * (`/pedidos?estado=vazio`). Cobre os dois casos para que a mesma loja sirva aos
 * testes unitários e ao navegador.
 */
function lerEndereco(): PartesDoEndereco {
  const fragmento = window.location.hash
  const semCerquilha = fragmento.startsWith('#') ? fragmento.slice(1) : fragmento
  const temFragmento = semCerquilha !== ''
  const origem = temFragmento ? semCerquilha : window.location.search
  const indice = origem.indexOf('?')
  const caminho = indice === -1 ? origem : origem.slice(0, indice)
  const consulta = indice === -1 ? '' : origem.slice(indice + 1)
  return { caminho, parametros: new URLSearchParams(consulta), temFragmento }
}

/** Escreve os parâmetros no mesmo lugar de onde foram lidos. */
function escreverEndereco(partes: PartesDoEndereco): void {
  const consulta = partes.parametros.toString()
  if (partes.temFragmento) {
    const caminho = partes.caminho === '' ? '/' : partes.caminho
    window.history.replaceState(null, '', `#${caminho}${consulta === '' ? '' : `?${consulta}`}`)
    return
  }
  const caminho = window.location.pathname === '' ? '/' : window.location.pathname
  window.history.replaceState(null, '', `${caminho}${consulta === '' ? '' : `?${consulta}`}`)
}

/**
 * Sincroniza a condição com o endereço.
 *
 * Isso não é detalhe de navegação: é o que torna o estado compartilhável. Quem
 * avalia recebe um link que já abre na situação a ser verificada — "olhe aqui o
 * que acontece quando o servidor cai" — em vez de precisar reproduzir passos.
 * `replaceState` mantém o histórico limpo: alternar condições não enche o botão
 * de voltar.
 */
function sincronizarUrl(valor: Condicao): void {
  if (typeof window === 'undefined') return
  const partes = lerEndereco()
  if (valor === PADRAO) partes.parametros.delete(CHAVE_URL)
  else partes.parametros.set(CHAVE_URL, valor)
  escreverEndereco(partes)
}

/**
 * Lê a condição inicial do endereço, validando o valor.
 *
 * A entrada vem de fora e é tratada como não confiável: um `?estado=` inventado
 * cai no padrão em vez de propagar lixo para o servidor falso.
 */
export function condicaoDaUrl(): Condicao {
  if (typeof window === 'undefined') return PADRAO
  const valor = lerEndereco().parametros.get(CHAVE_URL)
  return ehCondicao(valor) ? valor : PADRAO
}

/** Restaura o padrão. Usado entre testes para não vazar estado. */
export function reiniciarLoja(): void {
  condicao = PADRAO
  for (const ouvinte of ouvintes) ouvinte()
}

/**
 * Passa a acompanhar o endereço depois da carga.
 *
 * A condição inicial é lida uma vez, ao abrir a aplicação. Sem este observador,
 * colar um link com outra condição na mesma aba não faria nada — a página não
 * recarrega, o endereço muda e o app continua no estado anterior. Quem estivesse
 * demonstrando concluiria que o link não funciona.
 *
 * Aqui a condição é definida **sem** reescrever o endereço: ele já é a fonte da
 * mudança, e reescrevê-lo criaria um ciclo entre escrita e leitura.
 */
export function observarEndereco(): () => void {
  if (typeof window === 'undefined') return () => undefined

  const aoMudarEndereco = (): void => {
    const daUrl = condicaoDaUrl()
    if (daUrl === condicao) return
    condicao = daUrl
    for (const ouvinte of ouvintes) ouvinte()
  }

  window.addEventListener('hashchange', aoMudarEndereco)
  window.addEventListener('popstate', aoMudarEndereco)
  return () => {
    window.removeEventListener('hashchange', aoMudarEndereco)
    window.removeEventListener('popstate', aoMudarEndereco)
  }
}

/**
 * Remove o parâmetro quando ele não acrescenta nada.
 *
 * `?estado=normal` é válido, mas redundante: significa o mesmo que a ausência do
 * parâmetro. Deixar os dois conviverem produziria endereços diferentes para a
 * mesma situação — e um link que parece forçar algo sem forçar nada.
 */
export function normalizarUrl(): void {
  if (typeof window === 'undefined') return
  const partes = lerEndereco()
  if (partes.parametros.get(CHAVE_URL) !== PADRAO) return
  partes.parametros.delete(CHAVE_URL)
  escreverEndereco(partes)
}

export const CONDICAO_PADRAO = PADRAO
