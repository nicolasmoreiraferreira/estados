import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Cartao, CabecalhoCartao, Etiqueta } from '@/components/ui'
import { definirCondicao } from '@/lib/simulacao/loja'

/**
 * Tela de entrada.
 *
 * Existe para fechar o ciclo da sessão expirada. Sem ela, o erro 401 ofereceria
 * um botão "Entrar novamente" que não leva a lugar nenhum — e um botão que não
 * faz o que promete é pior que nenhum botão. Aqui o caminho fica completo:
 * sessão vence, a tela explica, o usuário entra, a sessão volta.
 *
 * O formulário é honesto sobre o que faz: não há autenticação real, e a tela diz
 * isso em vez de fingir. Ao entrar, a condição simulada volta ao normal — que é
 * exatamente o efeito de uma sessão restaurada.
 */
export function TelaEntrar() {
  const navegar = useNavigate()
  const [email, definirEmail] = useState('ana@empresa.com.br')
  const [senha, definirSenha] = useState('')

  const podeEnviar = email.includes('@') && senha.length >= 4

  function entrar(): void {
    // Restaurar a sessão é, na prática, voltar ao estado normal: as consultas
    // passam a funcionar de novo. É o mesmo efeito que um login real teria.
    definirCondicao('normal')
    void navegar(-1)
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-[var(--color-texto-suave)]">
          Sua sessão expirou. Entre novamente para continuar de onde parou.
        </p>
      </header>

      <Cartao>
        <CabecalhoCartao
          titulo="Acesso"
          descricao="Os dados são fictícios e a API é simulada no navegador."
          acoes={<Etiqueta tom="atencao">Demonstração</Etiqueta>}
        />
        <form
          className="space-y-4 px-5 py-4"
          onSubmit={(evento) => {
            evento.preventDefault()
            entrar()
          }}
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              autoComplete="username"
              onChange={(evento) => {
                definirEmail(evento.target.value)
              }}
              className="mt-1 w-full rounded-lg border border-[var(--color-borda-forte)] bg-[var(--color-superficie)] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              autoComplete="current-password"
              aria-describedby="senha-ajuda"
              onChange={(evento) => {
                definirSenha(evento.target.value)
              }}
              className="mt-1 w-full rounded-lg border border-[var(--color-borda-forte)] bg-[var(--color-superficie)] px-3 py-2 text-sm"
            />
            <p id="senha-ajuda" className="mt-1 text-xs text-[var(--color-texto-fraco)]">
              Qualquer senha com 4 caracteres ou mais funciona nesta demonstração.
            </p>
          </div>

          <button
            type="submit"
            disabled={!podeEnviar}
            className="w-full rounded-lg bg-[var(--color-marca)] px-4 py-2 text-sm font-medium text-white transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Entrar e restaurar a sessão
          </button>

          <p className="text-xs text-[var(--color-texto-fraco)]">
            Não há autenticação de verdade: nada é enviado a lugar nenhum. Entrar apenas devolve o
            app ao estado normal.{' '}
            <Link to="/sobre" className="underline decoration-dotted underline-offset-2">
              Ver as decisões do projeto
            </Link>
            .
          </p>
        </form>
      </Cartao>

      <p className="text-center text-sm">
        <Link
          to="/"
          className="text-[var(--color-texto-suave)] underline decoration-dotted underline-offset-2 hover:text-[var(--color-texto)]"
        >
          Voltar sem entrar
        </Link>
      </p>
    </div>
  )
}
