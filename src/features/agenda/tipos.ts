import { DadoInvalido } from '@/features/pedidos/tipos'

/**
 * Contrato do recurso "agenda".
 *
 * Uma regra de domínio além da validação de forma: o fim não pode ser antes do
 * início. Dado que passa na checagem de tipo mas representa um intervalo
 * impossível é pior que dado ausente — a tela renderiza algo plausível e errado,
 * e ninguém percebe. Validar regra, não só formato, é a diferença entre
 * conferir a caixa e conferir o conteúdo.
 */

export interface Compromisso {
  readonly id: string
  readonly titulo: string
  readonly inicio: string
  readonly fim: string
  readonly sala: string
}

function texto(registro: Record<string, unknown>, campo: string): string {
  const valor = registro[campo]
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new DadoInvalido(campo, 'esperado texto não vazio')
  }
  return valor
}

function data(registro: Record<string, unknown>, campo: string): Date {
  const valor = texto(registro, campo)
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) {
    throw new DadoInvalido(campo, 'esperada data válida em ISO 8601')
  }
  return data
}

export function validarCompromisso(bruto: unknown): Compromisso {
  if (typeof bruto !== 'object' || bruto === null) {
    throw new DadoInvalido('registro', 'esperado objeto')
  }
  const registro = bruto as Record<string, unknown>
  const inicio = data(registro, 'inicio')
  const fim = data(registro, 'fim')

  if (fim.getTime() <= inicio.getTime()) {
    throw new DadoInvalido('fim', 'o término precisa ser depois do início')
  }

  return {
    id: texto(registro, 'id'),
    titulo: texto(registro, 'titulo'),
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    sala: texto(registro, 'sala'),
  }
}

export function validarAgenda(corpo: unknown): readonly Compromisso[] {
  if (typeof corpo !== 'object' || corpo === null) {
    throw new DadoInvalido('corpo', 'esperado objeto com a chave "itens"')
  }
  const itens = (corpo as { itens?: unknown }).itens
  if (!Array.isArray(itens)) {
    throw new DadoInvalido('itens', 'esperada lista')
  }
  return itens.map((item) => validarCompromisso(item))
}
