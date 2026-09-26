/**
 * Contrato do recurso "pedidos".
 *
 * A validação é escrita à mão, campo a campo, e não com uma biblioteca de
 * esquema. O motivo é didático e prático: assim fica visível o que significa
 * validar na fronteira — conferir tipo, presença e faixa de cada campo antes de
 * deixar o dado entrar na aplicação.
 *
 * O caso `dado_invalido` do simulador existe para exercitar exatamente este
 * caminho. Sem validação, um registro sem `valor` chegaria à tabela e o
 * formatador receberia `undefined` — o erro apareceria no meio da renderização,
 * com mensagem incompreensível para quem está usando.
 */

export const SITUACOES = ['pago', 'pendente', 'enviado', 'cancelado'] as const
export type Situacao = (typeof SITUACOES)[number]

export interface Pedido {
  readonly id: string
  readonly cliente: string
  readonly valor: number
  readonly status: Situacao
  readonly criadoEm: string
}

export class DadoInvalido extends Error {
  readonly campo: string

  constructor(campo: string, detalhe: string) {
    super(`Campo "${campo}": ${detalhe}`)
    this.name = 'DadoInvalido'
    this.campo = campo
  }
}

function exigirTexto(registro: Record<string, unknown>, campo: string): string {
  const valor = registro[campo]
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new DadoInvalido(campo, 'esperado texto não vazio')
  }
  return valor
}

function exigirNumero(registro: Record<string, unknown>, campo: string): number {
  const valor = registro[campo]
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    throw new DadoInvalido(campo, 'esperado número finito')
  }
  return valor
}

function exigirSituacao(registro: Record<string, unknown>, campo: string): Situacao {
  const valor = registro[campo]
  if (typeof valor !== 'string' || !(SITUACOES as readonly string[]).includes(valor)) {
    throw new DadoInvalido(campo, `esperado um de: ${SITUACOES.join(', ')}`)
  }
  return valor as Situacao
}

function exigirData(registro: Record<string, unknown>, campo: string): string {
  const valor = exigirTexto(registro, campo)
  if (Number.isNaN(new Date(valor).getTime())) {
    throw new DadoInvalido(campo, 'esperada data válida em ISO 8601')
  }
  return valor
}

export function validarPedido(bruto: unknown): Pedido {
  if (typeof bruto !== 'object' || bruto === null) {
    throw new DadoInvalido('registro', 'esperado objeto')
  }
  const registro = bruto as Record<string, unknown>
  return {
    id: exigirTexto(registro, 'id'),
    cliente: exigirTexto(registro, 'cliente'),
    valor: exigirNumero(registro, 'valor'),
    status: exigirSituacao(registro, 'status'),
    criadoEm: exigirData(registro, 'criadoEm'),
  }
}

export function validarPedidos(corpo: unknown): readonly Pedido[] {
  if (typeof corpo !== 'object' || corpo === null) {
    throw new DadoInvalido('corpo', 'esperado objeto com a chave "itens"')
  }
  const itens = (corpo as { itens?: unknown }).itens
  if (!Array.isArray(itens)) {
    throw new DadoInvalido('itens', 'esperada lista')
  }
  return itens.map((item) => validarPedido(item))
}
