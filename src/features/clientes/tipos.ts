import { DadoInvalido } from '@/features/pedidos/tipos'

/**
 * Contrato do recurso "clientes".
 *
 * A validação de e-mail é deliberadamente simples — presença de `@` e de um
 * ponto no domínio. Tentar reproduzir a especificação completa de e-mail em
 * expressão regular é armadilha conhecida: fica ilegível e ainda erra. Para
 * contato, o que importa é barrar lixo óbvio; a confirmação real é o envio de
 * uma mensagem.
 */

export const SITUACOES_CLIENTE = ['ativo', 'inadimplente', 'inativo'] as const
export type SituacaoCliente = (typeof SITUACOES_CLIENTE)[number]

export interface Cliente {
  readonly id: string
  readonly nome: string
  readonly email: string
  readonly situacao: SituacaoCliente
  readonly desde: string
}

function texto(registro: Record<string, unknown>, campo: string): string {
  const valor = registro[campo]
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new DadoInvalido(campo, 'esperado texto não vazio')
  }
  return valor
}

function email(registro: Record<string, unknown>, campo: string): string {
  const valor = texto(registro, campo)
  const [usuario, dominio] = valor.split('@')
  if (!usuario || !dominio || !dominio.includes('.')) {
    throw new DadoInvalido(campo, 'esperado endereço com formato usuário@domínio')
  }
  return valor
}

function situacao(registro: Record<string, unknown>, campo: string): SituacaoCliente {
  const valor = registro[campo]
  if (typeof valor !== 'string' || !(SITUACOES_CLIENTE as readonly string[]).includes(valor)) {
    throw new DadoInvalido(campo, `esperado um de: ${SITUACOES_CLIENTE.join(', ')}`)
  }
  return valor as SituacaoCliente
}

export function validarCliente(bruto: unknown): Cliente {
  if (typeof bruto !== 'object' || bruto === null) {
    throw new DadoInvalido('registro', 'esperado objeto')
  }
  const registro = bruto as Record<string, unknown>
  const desde = texto(registro, 'desde')
  if (Number.isNaN(new Date(desde).getTime())) {
    throw new DadoInvalido('desde', 'esperada data válida')
  }
  return {
    id: texto(registro, 'id'),
    nome: texto(registro, 'nome'),
    email: email(registro, 'email'),
    situacao: situacao(registro, 'situacao'),
    desde,
  }
}

export function validarClientes(corpo: unknown): readonly Cliente[] {
  if (typeof corpo !== 'object' || corpo === null) {
    throw new DadoInvalido('corpo', 'esperado objeto com a chave "itens"')
  }
  const itens = (corpo as { itens?: unknown }).itens
  if (!Array.isArray(itens)) {
    throw new DadoInvalido('itens', 'esperada lista')
  }
  return itens.map((item) => validarCliente(item))
}
