import { Cartao, CabecalhoCartao, Etiqueta } from '@/components/ui'

/**
 * Página "Sobre".
 *
 * Existe por um motivo prático: quem avalia um projeto de portfólio quer saber o
 * que foi decidido e por quê. Colocar isso dentro do próprio site — e não só no
 * README — aumenta a chance de ser lido, porque ninguém precisa sair da
 * demonstração para encontrar.
 */

const DECISOES: readonly { readonly titulo: string; readonly texto: string }[] = [
  {
    titulo: 'O servidor falso vai para produção',
    texto:
      'Não é ferramenta de desenvolvimento. Se o simulador só existisse em modo de desenvolvimento, quem abre o site publicado não veria nada — e demonstrar é justamente o ponto. Ele intercepta apenas os caminhos conhecidos da API; qualquer outra requisição passa direto.',
  },
  {
    titulo: 'A condição simulada vive na URL',
    texto:
      'Isso torna cada situação um endereço compartilhável. Em vez de instruir alguém a "clicar em três lugares para ver o erro", o link abre exatamente naquela situação. Também é o que faz o estado sobreviver ao recarregar a página.',
  },
  {
    titulo: 'Um único renderizador de estados',
    texto:
      'Cada tela entrega o estado da consulta e três funções de renderização. Não existe caminho para esquecer o tratamento de erro, porque quem escreve a tela não tem onde colocar o conteúdo sem passar por ele. Concentrar isso em um lugar significa corrigir uma vez e valer para todas as telas.',
  },
  {
    titulo: 'Erro tipado, não texto solto',
    texto:
      'Cada erro carrega o tipo, o status, a explicação em linguagem de gente e se vale a pena tentar de novo. Sem isso, a interface só consegue dizer "algo deu errado" — que é o mesmo que não dizer nada.',
  },
  {
    titulo: 'A validação roda mesmo no status 200',
    texto:
      'A condição "dado inválido" existe para provar isso. Um corpo com formato errado é um caminho real, e é na fronteira que ele é barrado — antes de chegar à renderização, onde o erro apareceria com mensagem incompreensível para quem usa.',
  },
  {
    titulo: 'Virtualização própria, sem biblioteca',
    texto:
      'O catálogo implementa a janela de renderização à mão para que o mecanismo fique visível no código: altura de linha fixa, intervalo visível calculado a partir da rolagem e um espaçador que mantém a barra no tamanho certo. Em produção, TanStack Virtual faria melhor — e vale dizer isso em vez de fingir que a solução caseira é a ideal.',
  },
]

const TECNOLOGIAS = [
  'React 19',
  'TypeScript em modo estrito',
  'Vite',
  'Tailwind CSS 4',
  'React Router',
  'Vitest',
  'Testing Library',
  'Playwright',
  'GitHub Actions',
]

export function TelaSobre() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Sobre este projeto</h1>
        <p className="max-w-prose text-sm text-[var(--color-texto-suave)]">
          Um laboratório de estados de interface: um app React completo cujo objetivo é mostrar, na
          prática, como tratar o que dá errado. Todo portfólio mostra a tela funcionando; este
          mostra o que acontece quando a API cai, a rede some, o dado vem corrompido ou o usuário
          não tem permissão.
        </p>
      </header>

      <Cartao>
        <CabecalhoCartao
          titulo="Decisões técnicas"
          descricao="O que foi escolhido e por quê — as perguntas que aparecem numa entrevista."
        />
        <ul className="divide-y divide-[var(--color-borda)]">
          {DECISOES.map((decisao) => (
            <li key={decisao.titulo} className="px-5 py-4">
              <h3 className="text-sm font-semibold">{decisao.titulo}</h3>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-texto-suave)]">{decisao.texto}</p>
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao>
        <CabecalhoCartao
          titulo="Limites conhecidos"
          descricao="O que este projeto não faz — declarado em vez de escondido."
        />
        <ul className="list-inside list-disc space-y-2 px-5 py-4 text-sm text-[var(--color-texto-suave)]">
          <li>
            <strong className="font-medium text-[var(--color-texto)]">A API é simulada no navegador.</strong>{' '}
            Não há servidor real. O objetivo é demonstrar o comportamento da interface, não a
            infraestrutura.
          </li>
          <li>
            <strong className="font-medium text-[var(--color-texto)]">Os dados são fictícios</strong> e
            não persistem: recarregar a página devolve o estado inicial.
          </li>
          <li>
            <strong className="font-medium text-[var(--color-texto)]">A virtualização é didática.</strong>{' '}
            Funciona bem na faixa demonstrada, mas não substitui uma biblioteca madura em cenários
            com linhas de altura variável.
          </li>
          <li>
            <strong className="font-medium text-[var(--color-texto)]">O foco é comportamento, não visual.</strong>{' '}
            A interface é contida de propósito: o que está em julgamento aqui é a reação do sistema
            às falhas.
          </li>
        </ul>
      </Cartao>

      <Cartao>
        <CabecalhoCartao titulo="Tecnologias" />
        <div className="flex flex-wrap gap-2 px-5 py-4">
          {TECNOLOGIAS.map((tecnologia) => (
            <Etiqueta key={tecnologia} tom="neutro">
              {tecnologia}
            </Etiqueta>
          ))}
        </div>
      </Cartao>

      <Cartao>
        <CabecalhoCartao titulo="Como testar você mesmo" />
        <ol className="list-inside list-decimal space-y-2 px-5 py-4 text-sm text-[var(--color-texto-suave)]">
          <li>
            Abra o simulador no canto inferior direito e escolha uma condição do grupo{' '}
            <strong className="font-medium text-[var(--color-texto)]">Quando falha</strong>.
          </li>
          <li>Navegue pelas quatro telas e observe que todas reagem de forma coerente.</li>
          <li>
            Copie o endereço: a condição faz parte do link, então você pode enviá-lo para alguém.
          </li>
          <li>
            Use só o teclado: <kbd className="rounded border border-[var(--color-borda)] px-1 font-mono text-xs">Tab</kbd> percorre tudo,{' '}
            <kbd className="rounded border border-[var(--color-borda)] px-1 font-mono text-xs">Esc</kbd> fecha o simulador.
          </li>
        </ol>
      </Cartao>
    </div>
  )
}
