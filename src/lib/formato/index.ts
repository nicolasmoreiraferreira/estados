/**
 * Formatação para leitura humana.
 *
 * Data e valor em português do Brasil, sem biblioteca: `Intl` já está no
 * navegador e resolve melhor que qualquer pacote. Detalhe que costuma passar
 * batido: formatador criado uma vez e reaproveitado é ordens de grandeza mais
 * rápido que criar por chamada — em lista de milhares de itens, isso aparece.
 */

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const NUMERO = new Intl.NumberFormat('pt-BR')
const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const HORA = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const DIA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

export function moeda(valor: number): string {
  return MOEDA.format(valor)
}

export function numero(valor: number): string {
  return NUMERO.format(valor)
}

export function dataHora(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return 'data inválida'
  return DATA_HORA.format(data)
}

export function hora(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return '--:--'
  return HORA.format(data)
}

export function dia(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return 'data inválida'
  return DIA.format(data)
}

/** Converte para maiúsculas a primeira letra — usado em rótulos de situação. */
export function capitalizar(texto: string): string {
  if (texto.length === 0) return texto
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Normaliza texto para busca.
 *
 * `normalize('NFD')` separa a letra do acento, e o `replace` remove o acento.
 * Sem isso, procurar por "sao" não encontra "São" — o que, em português, torna
 * a busca quase inútil na prática.
 */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
