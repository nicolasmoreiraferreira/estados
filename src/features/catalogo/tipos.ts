import { DadoInvalido } from '@/features/pedidos/tipos'

/**
 * Contrato do recurso "catalogo".
 *
 * Regra de domínio além do formato: preço e estoque não podem ser negativos.
 * Um preço negativo passaria na checagem de tipo e apareceria na tela como
 * "R$ -12,00" — plausível o bastante para ninguém desconfiar, errado o
 * suficiente para contaminar qualquer total calculado a partir dali.
 */

export interface ItemCatalogo {
  readonly id: string
  readonly nome: string
  readonly preco: number
  readonly estoque: number
  readonly categoria: string
}

function texto(registro: Record<string, unknown>, campo: string): string {
  const valor = registro[campo]
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new DadoInvalido(campo, 'esperado texto não vazio')
  }
  return valor
}

function numeroNaoNegativo(registro: Record<string, unknown>, campo: string): number {
  const valor = registro[campo]
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    throw new DadoInvalido(campo, 'esperado número finito')
  }
  if (valor < 0) {
    throw new DadoInvalido(campo, 'não pode ser negativo')
  }
  return valor
}

export function validarItem(bruto: unknown): ItemCatalogo {
  if (typeof bruto !== 'object' || bruto === null) {
    throw new DadoInvalido('registro', 'esperado objeto')
  }
  const registro = bruto as Record<string, unknown>
  return {
    id: texto(registro, 'id'),
    nome: texto(registro, 'nome'),
    preco: numeroNaoNegativo(registro, 'preco'),
    estoque: numeroNaoNegativo(registro, 'estoque'),
    categoria: texto(registro, 'categoria'),
  }
}

export function validarCatalogo(corpo: unknown): readonly ItemCatalogo[] {
  if (typeof corpo !== 'object' || corpo === null) {
    throw new DadoInvalido('corpo', 'esperado objeto com a chave "itens"')
  }
  const itens = (corpo as { itens?: unknown }).itens
  if (!Array.isArray(itens)) {
    throw new DadoInvalido('itens', 'esperada lista')
  }
  return itens.map((item) => validarItem(item))
}
