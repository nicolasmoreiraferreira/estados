import { CATALOGO } from '../simulacao/catalogo'
import { lerCondicao } from '../simulacao/loja'
import type { Condicao } from '../simulacao/tipos'
import { ErroApp, normalizarErro } from './erros'

/**
 * Servidor falso com injeção de falha.
 *
 * Substitui o `fetch` real para que a mesma tela possa ser exercitada em todas
 * as condições sem depender de sorte, de rede ou de um backend. A decisão
 * importante aqui é que ele **não é uma ferramenta de desenvolvimento**: vai
 * para produção, porque é o que permite a quem avalia escolher a situação e ver
 * o comportamento na hora. Um simulador que só existe em `dev` não demonstra
 * nada para quem abre o site publicado.
 *
 * O corpo de `dado_invalido` sai daqui **sem** ser conferido de propósito: quem
 * precisa recusar conteúdo malformado é o cliente, mesmo quando o status é 200.
 * Validar aqui esconderia o caminho que o projeto quer demonstrar.
 */

const INTERVALO_VERIFICACAO_MS = 120

let instalado = false
const fetchOriginal = globalThis.fetch

/** Simula espera, com opção de aborto — cancelar precisa ser possível. */
function esperar(ms: number, sinal?: AbortSignal | null): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    if (sinal?.aborted) {
      rejeitar(new DOMException('Cancelado', 'AbortError'))
      return
    }
    function aoAbortar(): void {
      clearTimeout(temporizador)
      rejeitar(new DOMException('Cancelado', 'AbortError'))
    }
    const temporizador = setTimeout(() => {
      sinal?.removeEventListener('abort', aoAbortar)
      resolver()
    }, ms)
    sinal?.addEventListener('abort', aoAbortar, { once: true })
  })
}

/**
 * Espera a condição mudar.
 *
 * Quando o usuário troca a condição no painel, a requisição em curso precisa
 * reagir: se ele escolheu "erro no servidor", a tela deve falhar agora, não
 * depois da próxima navegação. Sem isso, o painel pareceria não funcionar — o
 * defeito mais comum em simuladores mal feitos.
 */
async function esperarMudancaCondicao(inicial: Condicao, sinal?: AbortSignal | null): Promise<void> {
  while (lerCondicao() === inicial) {
    await esperar(INTERVALO_VERIFICACAO_MS, sinal)
  }
}

function erroParaCondicao(condicao: Condicao): ErroApp {
  switch (condicao) {
    case 'offline':
      return new ErroApp({
        tipo: 'rede',
        status: null,
        explicacao: 'Você está sem conexão.',
        proximoPasso: 'Verifique a internet. A tela volta sozinha quando a conexão retornar.',
        podeTentarDeNovo: true,
        detalheTecnico: 'navigator.onLine = false (simulado)',
      })
    case 'erro_rede':
      return new ErroApp({
        tipo: 'rede',
        status: null,
        explicacao: 'A conexão falhou no meio do caminho.',
        proximoPasso: 'Tente de novo.',
        podeTentarDeNovo: true,
        detalheTecnico: 'TypeError: Failed to fetch (simulado)',
      })
    case 'erro_servidor':
      return new ErroApp({
        tipo: 'servidor',
        status: 500,
        explicacao: 'O sistema está com um problema e não conseguiu responder.',
        proximoPasso: 'Não é do seu lado. Tente de novo em alguns instantes.',
        podeTentarDeNovo: true,
        detalheTecnico: 'HTTP 500 — Internal Server Error (simulado)',
      })
    case 'nao_autenticado':
      return new ErroApp({
        tipo: 'autenticacao',
        status: 401,
        explicacao: 'Sua sessão expirou.',
        proximoPasso: 'Entre novamente para continuar de onde parou.',
        podeTentarDeNovo: false,
        detalheTecnico: 'HTTP 401 — token expirado (simulado)',
      })
    case 'sem_permissao':
      return new ErroApp({
        tipo: 'permissao',
        status: 403,
        explicacao: 'Você não tem acesso a esta área.',
        proximoPasso: 'Peça a um administrador para liberar o seu acesso.',
        podeTentarDeNovo: false,
        detalheTecnico: 'HTTP 403 — perfil sem escopo (simulado)',
      })
    case 'dado_invalido':
      return new ErroApp({
        tipo: 'validacao',
        status: 200,
        explicacao: 'Os dados chegaram em um formato que não dá para usar.',
        proximoPasso: 'Tente de novo. Se continuar, avise o suporte com o detalhe abaixo.',
        podeTentarDeNovo: true,
        detalheTecnico: 'resposta 200 com corpo fora do contrato (simulado)',
      })
    default:
      return new ErroApp({
        tipo: 'desconhecido',
        status: null,
        explicacao: 'Aconteceu um problema inesperado.',
        proximoPasso: 'Tente de novo.',
        podeTentarDeNovo: true,
        detalheTecnico: `condição ${condicao} sem erro mapeado`,
      })
  }
}

export interface OpcoesRequisicao {
  /** Já recebido pela tela, para simular conflito de edição. */
  readonly jaRecebido?: unknown
}

/**
 * Responde a uma requisição conforme a condição atual.
 *
 * Devolve `unknown` de propósito: o corpo chega como texto de rede, sem garantia
 * nenhuma, e é a validação de cada tela que transforma isso em tipo. Assumir o
 * formato aqui seria fingir uma segurança que não existe.
 */
export async function responder(
  recurso: string,
  opcoes: OpcoesRequisicao = {},
  sinal?: AbortSignal | null,
): Promise<unknown> {
  const condicao = lerCondicao()
  const definicao = CATALOGO[condicao]

  if (definicao.atrasoMs === Number.POSITIVE_INFINITY) {
    // "Carregando" não termina: a tela precisa saber viver assim.
    await esperarMudancaCondicao(condicao, sinal)
    return responder(recurso, opcoes, sinal)
  }

  await esperar(definicao.atrasoMs, sinal)

  // Se a condição mudou enquanto esperávamos, refaz a partir do novo estado.
  if (lerCondicao() !== condicao) return responder(recurso, opcoes, sinal)

  switch (condicao) {
    case 'normal':
    case 'carregando':
    case 'lento':
      return corpoDe(recurso, 'normal')
    case 'vazio':
      return corpoDe(recurso, 'vazio')
    case 'muitos_dados':
      return corpoDe(recurso, 'muitos_dados')
    case 'dado_invalido':
      return corpoDe(recurso, 'dado_invalido')
    case 'conflito':
      // O conflito é resposta de erro com conteúdo: 409 mais as duas versões.
      // A interface precisa das duas para mostrar lado a lado — dizer apenas que
      // houve conflito obrigaria a uma segunda requisição para descobrir o quê.
      throw new ErroApp({
        tipo: 'conflito',
        status: 409,
        explicacao: 'Alguém alterou este registro antes de você salvar.',
        proximoPasso: 'Compare as duas versões e escolha qual manter.',
        podeTentarDeNovo: false,
        detalheTecnico: 'HTTP 409 — ETag divergente (simulado)',
        dados: {
          alteradoPor: 'Ana Ribeiro',
          alteradoEm: new Date(Date.now() - 4 * 60_000).toISOString(),
          valorAtual: corpoDe(recurso, 'normal'),
          seuValor: opcoes.jaRecebido ?? null,
        },
      })
    default:
      throw erroParaCondicao(condicao)
  }
}

/* -------------------------------------------------------------------------- */
/* Corpos de resposta                                                          */
/* -------------------------------------------------------------------------- */

const CAMPOS_ESPERADOS: Readonly<Record<string, readonly string[]>> = {
  pedidos: ['id', 'cliente', 'valor', 'status', 'criadoEm'],
  agenda: ['id', 'titulo', 'inicio', 'fim', 'sala'],
  catalogo: ['id', 'nome', 'preco', 'estoque', 'categoria'],
  clientes: ['id', 'nome', 'email', 'situacao', 'desde'],
}

/** Recursos que o servidor falso conhece. */
export const RECURSOS: readonly string[] = Object.keys(CAMPOS_ESPERADOS)

function corpoDe(
  recurso: string,
  variacao: 'normal' | 'vazio' | 'muitos_dados' | 'dado_invalido',
): unknown {
  if (variacao === 'vazio') return { itens: [], total: 0 }

  const base = DADOS[recurso]
  if (!base) return { itens: [], total: 0 }

  if (variacao === 'dado_invalido') {
    // Corpo que engana uma conferência superficial: JSON válido, status 200,
    // lista com itens. Mas o segundo registro perdeu campos — e é isso que faz
    // a validação de fronteira valer a pena.
    const quebrados = base.map((item, indice) =>
      indice === 1
        ? (Object.fromEntries(Object.entries(item).slice(0, 2)) as (typeof base)[number])
        : item,
    )
    return { itens: quebrados, total: quebrados.length }
  }

  if (variacao === 'muitos_dados') {
    const multiplicador = Math.ceil(5000 / base.length)
    const muitos = Array.from({ length: multiplicador }, (_, volta) =>
      base.map((item) => ({ ...item, id: `${String(item['id'])}-${String(volta)}` })),
    ).flat()
    return { itens: muitos, total: muitos.length }
  }

  return { itens: base, total: base.length }
}

const DADOS: Readonly<Record<string, readonly Record<string, unknown>[]>> = {
  pedidos: [
    { id: 'PD-1041', cliente: 'Mercado São Jorge', valor: 1284.5, status: 'pago', criadoEm: '2026-09-22T13:10:00Z' },
    { id: 'PD-1042', cliente: 'Padaria Dois Irmãos', valor: 320.0, status: 'pendente', criadoEm: '2026-09-22T15:42:00Z' },
    { id: 'PD-1043', cliente: 'Auto Peças Litoral', valor: 4720.9, status: 'enviado', criadoEm: '2026-09-23T09:05:00Z' },
    { id: 'PD-1044', cliente: 'Clínica Bem Viver', valor: 890.0, status: 'pago', criadoEm: '2026-09-23T11:20:00Z' },
    { id: 'PD-1045', cliente: 'Escola Novo Tempo', valor: 2150.75, status: 'cancelado', criadoEm: '2026-09-24T08:15:00Z' },
    { id: 'PD-1046', cliente: 'Restaurante Maré', valor: 640.3, status: 'pendente', criadoEm: '2026-09-24T14:50:00Z' },
    { id: 'PD-1047', cliente: 'Oficina do Zé', valor: 175.0, status: 'pago', criadoEm: '2026-09-24T17:32:00Z' },
    { id: 'PD-1048', cliente: 'Livraria Página Viva', valor: 980.4, status: 'enviado', criadoEm: '2026-09-25T10:00:00Z' },
  ],
  agenda: [
    { id: 'AG-01', titulo: 'Visita técnica — Mercado São Jorge', inicio: '2026-09-25T09:00:00Z', fim: '2026-09-25T10:00:00Z', sala: 'Externa' },
    { id: 'AG-02', titulo: 'Reunião de equipe', inicio: '2026-09-25T11:00:00Z', fim: '2026-09-25T12:00:00Z', sala: 'Sala 2' },
    { id: 'AG-03', titulo: 'Treinamento de operação', inicio: '2026-09-25T14:00:00Z', fim: '2026-09-25T16:00:00Z', sala: 'Auditório' },
    { id: 'AG-04', titulo: 'Retorno — Clínica Bem Viver', inicio: '2026-09-26T10:30:00Z', fim: '2026-09-26T11:30:00Z', sala: 'Externa' },
    { id: 'AG-05', titulo: 'Fechamento do mês', inicio: '2026-09-30T16:00:00Z', fim: '2026-09-30T18:00:00Z', sala: 'Sala 1' },
  ],
  catalogo: [
    { id: 'CB-201', nome: 'Cabo flexível 2,5 mm — 100 m', preco: 289.9, estoque: 34, categoria: 'Elétrica' },
    { id: 'CB-202', nome: 'Disjuntor bipolar 40 A', preco: 62.4, estoque: 128, categoria: 'Elétrica' },
    { id: 'CB-203', nome: 'Tinta acrílica branca 18 L', preco: 419.0, estoque: 12, categoria: 'Pintura' },
    { id: 'CB-204', nome: 'Argamassa AC-III 20 kg', preco: 38.9, estoque: 0, categoria: 'Construção' },
    { id: 'CB-205', nome: 'Fechadura eletrônica', preco: 749.0, estoque: 7, categoria: 'Segurança' },
    { id: 'CB-206', nome: 'Luminária LED 30 W', preco: 96.5, estoque: 210, categoria: 'Iluminação' },
  ],
  clientes: [
    { id: 'CL-31', nome: 'Mercado São Jorge', email: 'compras@saojorge.com.br', situacao: 'ativo', desde: '2023-04-11' },
    { id: 'CL-32', nome: 'Padaria Dois Irmãos', email: 'contato@doisirmaos.com.br', situacao: 'ativo', desde: '2024-01-30' },
    { id: 'CL-33', nome: 'Auto Peças Litoral', email: 'financeiro@aplitoral.com.br', situacao: 'inadimplente', desde: '2022-08-02' },
    { id: 'CL-34', nome: 'Clínica Bem Viver', email: 'adm@bemviver.com.br', situacao: 'ativo', desde: '2025-02-18' },
    { id: 'CL-35', nome: 'Escola Novo Tempo', email: 'secretaria@novotempo.edu.br', situacao: 'inativo', desde: '2021-11-05' },
  ],
}

/**
 * Instala o servidor falso no lugar de `fetch`.
 *
 * Só intercepta caminhos conhecidos: se o app um dia chamar outra coisa, a
 * requisição real passa direto em vez de ser engolida silenciosamente.
 */
export function instalarServidorFalso(): () => void {
  if (instalado) return () => undefined

  const fetchAnterior = fetchOriginal

  globalThis.fetch = async (entrada: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof entrada === 'string' ? entrada : entrada instanceof URL ? entrada.href : entrada.url
    const recurso = RECURSOS.find((nome) => url.includes(`/api/${nome}`))

    if (recurso === undefined) return fetchAnterior(entrada, init)

    try {
      const corpo = await responder(recurso, {}, init?.signal ?? null)
      return new Response(JSON.stringify(corpo), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    } catch (causa) {
      const erro = normalizarErro(causa)
      if (erro.detalheTecnico === 'AbortError') throw causa
      return new Response(JSON.stringify(erro.paraJson()), {
        status: erro.status ?? 503,
        headers: { 'content-type': 'application/json' },
      })
    }
  }

  instalado = true

  return () => {
    globalThis.fetch = fetchOriginal
    instalado = false
  }
}

/** Se o servidor falso está ativo. Usado pelos testes. */
export function estaInstalado(): boolean {
  return instalado
}
