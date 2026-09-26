import { Link } from 'react-router-dom'

import { BlocoErro, BlocoVazio, Esqueleto } from '@/components/estados'
import { Cartao, CabecalhoCartao, Etiqueta } from '@/components/ui'
import { ErroApp } from '@/lib/api/erros'
import { LISTA_CATALOGO } from '@/lib/simulacao/catalogo'
import { definirCondicao } from '@/lib/simulacao/loja'
import { usarCondicao } from '@/lib/simulacao/usarCondicao'

/**
 * Painel inicial.
 *
 * A tese do projeto em uma tela: o mesmo componente de erro, alimentado por
 * erros diferentes, produz mensagens diferentes — porque a causa é diferente e a
 * ação também. É a parte que se entende sem ler código, e é por isso que está na
 * primeira página.
 */

interface ExemploErro {
  readonly titulo: string
  readonly descricao: string
  readonly erro: ErroApp
}

const EXEMPLOS: readonly ExemploErro[] = [
  {
    titulo: 'A culpa não é do usuário',
    descricao:
      'Servidor fora do ar não é erro de quem está usando. O texto diz isso, e o botão oferece a única ação útil: tentar de novo.',
    erro: new ErroApp({
      tipo: 'servidor',
      status: 500,
      explicacao: 'O sistema está com um problema e não conseguiu responder.',
      proximoPasso: 'Não é do seu lado. Tente de novo em alguns instantes.',
      podeTentarDeNovo: true,
      detalheTecnico: 'HTTP 500 — Internal Server Error',
    }),
  },
  {
    titulo: 'Tentar de novo não resolve tudo',
    descricao:
      'Em falta de permissão, repetir a tentativa só frustra. Aqui não há botão de recarregar — há a instrução do que fazer: pedir acesso a quem pode liberar.',
    erro: new ErroApp({
      tipo: 'permissao',
      status: 403,
      explicacao: 'Você não tem acesso a esta área.',
      proximoPasso: 'Peça a um administrador para liberar o seu acesso.',
      podeTentarDeNovo: false,
      detalheTecnico: 'HTTP 403 — perfil sem escopo',
    }),
  },
  {
    titulo: 'Sem internet é outra conversa',
    descricao:
      'O aviso é diferente porque a causa é diferente. E a tela volta sozinha quando a conexão retorna, em vez de exigir recarregar a página.',
    erro: new ErroApp({
      tipo: 'rede',
      status: null,
      explicacao: 'Você está sem conexão.',
      proximoPasso: 'Verifique a internet. A tela volta sozinha quando a conexão retornar.',
      podeTentarDeNovo: true,
      detalheTecnico: 'navigator.onLine = false',
    }),
  },
]

const exemploPadrao = EXEMPLOS[0]?.erro ?? new ErroApp({
  tipo: 'desconhecido',
  status: null,
  explicacao: 'Aconteceu um problema inesperado.',
  proximoPasso: 'Tente de novo.',
  podeTentarDeNovo: true,
  detalheTecnico: 'sem exemplo carregado',
})

export function TelaPainel() {
  const condicaoAtual = usarCondicao()

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Etiqueta tom="marca">Projeto de portfólio</Etiqueta>
        <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Todo app funciona quando dá tudo certo. Este mostra o que acontece quando não dá.
        </h1>
        <p className="max-w-prose text-sm text-[var(--color-texto-suave)]">
          As quatro telas aqui — pedidos, agenda, catálogo e clientes — funcionam normalmente. O
          diferencial está no botão <strong className="font-medium">Simular situação</strong>, no
          canto: ele força doze condições reais (servidor fora do ar, sessão expirada, sem
          internet, dado corrompido, cinco mil registros) e você vê a reação de cada tela na hora.
        </p>
        <p className="max-w-prose text-sm text-[var(--color-texto-suave)]">
          A condição fica no endereço. Copie a barra do navegador para enviar um link que já abre
          na situação que você quer mostrar.
        </p>
      </header>

      <section aria-labelledby="titulo-exemplos" className="space-y-3">
        <h2 id="titulo-exemplos" className="text-lg font-semibold tracking-tight">
          O mesmo componente de erro, três situações
        </h2>
        <p className="max-w-prose text-sm text-[var(--color-texto-suave)]">
          Um erro genérico ("algo deu errado") não ajuda ninguém. A causa muda o texto e muda a
          ação oferecida:
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          {EXEMPLOS.map((exemplo) => (
            <Cartao key={exemplo.titulo} className="overflow-hidden">
              <CabecalhoCartao titulo={exemplo.titulo} />
              <p className="px-5 pt-3 text-sm text-[var(--color-texto-suave)]">{exemplo.descricao}</p>
              <div className="mt-3 border-t border-[var(--color-borda)]">
                <BlocoErro erro={exemplo.erro} />
              </div>
            </Cartao>
          ))}
        </div>
      </section>

      <section aria-labelledby="titulo-estados" className="space-y-3">
        <h2 id="titulo-estados" className="text-lg font-semibold tracking-tight">
          Os três estados que ninguém desenha
        </h2>
        <p className="max-w-prose text-sm text-[var(--color-texto-suave)]">
          Carregando, vazio e erro são os estados mais esquecidos de qualquer interface — e são
          justamente os que o usuário mais encontra.
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          <Cartao className="overflow-hidden">
            <CabecalhoCartao
              titulo="Carregando"
              descricao="O esqueleto ocupa o lugar do conteúdo final. Nada salta quando o dado chega."
            />
            <Esqueleto linhas={4} colunas={3} />
          </Cartao>
          <Cartao className="overflow-hidden">
            <CabecalhoCartao
              titulo="Vazio"
              descricao="Diz por que está vazio e o que fazer. Tabela sem linhas e sem texto parece defeito."
            />
            <BlocoVazio
              titulo="Nenhum pedido neste período"
              descricao="Existem pedidos, mas nenhum cai no intervalo escolhido. Amplie o período para ver os demais."
            />
          </Cartao>
          <Cartao className="overflow-hidden">
            <CabecalhoCartao
              titulo="Erro"
              descricao="Explica, oferece a ação certa e guarda o detalhe técnico para quem for investigar."
            />
            <BlocoErro erro={EXEMPLOS[0]?.erro ?? exemploPadrao} />
          </Cartao>
        </div>
      </section>

      <section aria-labelledby="titulo-condicoes" className="space-y-3">
        <h2 id="titulo-condicoes" className="text-lg font-semibold tracking-tight">
          As doze condições simuláveis
        </h2>
        <p className="max-w-prose text-sm text-[var(--color-texto-suave)]">
          Clique em qualquer uma para aplicá-la agora — o simulador abre com a situação já
          selecionada.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LISTA_CATALOGO.map((item) => {
            const ativo = item.id === condicaoAtual
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    definirCondicao(item.id)
                  }}
                  aria-pressed={ativo}
                  className={[
                    'h-full w-full rounded-[var(--radius-caixa)] border p-4 text-left transition-colors',
                    ativo
                      ? 'border-[var(--color-marca)] bg-[var(--color-marca-suave)]'
                      : 'border-[var(--color-borda)] bg-[var(--color-superficie)] hover:bg-[var(--color-superficie-2)]',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{item.rotulo}</span>
                    {item.status !== null ? (
                      <span className="font-mono text-[10px] text-[var(--color-texto-fraco)]">
                        {item.status}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--color-texto-suave)]">
                    {item.oQueSimula}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="titulo-telas" className="space-y-3">
        <h2 id="titulo-telas" className="text-lg font-semibold tracking-tight">
          As quatro telas
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            {
              para: '/pedidos',
              titulo: 'Pedidos',
              descricao: 'Lista com busca, filtro por situação, paginação e indicadores derivados.',
            },
            {
              para: '/agenda',
              titulo: 'Agenda',
              descricao: 'Compromissos por dia, com um estado vazio que faz sentido: agenda livre.',
            },
            {
              para: '/catalogo',
              titulo: 'Catálogo',
              descricao: 'Cinco mil itens com rolagem virtual — a lista só renderiza o que está à vista.',
            },
            {
              para: '/clientes',
              titulo: 'Clientes',
              descricao: 'Tela simples, para mostrar que a estrutura de estados se reaproveita sem esforço.',
            },
          ].map((tela) => (
            <li key={tela.para}>
              <Link
                to={tela.para}
                className="block h-full rounded-[var(--radius-caixa)] border border-[var(--color-borda)] bg-[var(--color-superficie)] p-4 transition-colors hover:border-[var(--color-borda-forte)] hover:bg-[var(--color-superficie-2)]"
              >
                <span className="text-sm font-semibold">{tela.titulo}</span>
                <span className="mt-1 block text-xs text-[var(--color-texto-suave)]">
                  {tela.descricao}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
