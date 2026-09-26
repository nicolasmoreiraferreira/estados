<div align="center">

# Estados

**Todo app funciona quando dá tudo certo. Este mostra o que acontece quando não dá.**

Laboratório de estados de interface: um app React completo em que cada tela sabe se
comportar quando a API falha, a rede cai, o dado vem corrompido ou o usuário não tem
permissão — com um simulador que força cada situação em dois cliques.

[![Demonstração](https://img.shields.io/badge/demonstração-online-22d3ee?style=flat-square)](https://nicolasmoreiraferreira.github.io/estados/)
[![CI](https://github.com/nicolasmoreiraferreira/estados/actions/workflows/ci.yml/badge.svg)](https://github.com/nicolasmoreiraferreira/estados/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-estrito-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)
![Testes](https://img.shields.io/badge/testes-165-6da13f?style=flat-square)

[Acessar a demonstração](https://nicolasmoreiraferreira.github.io/estados/) · [Decisões técnicas](https://nicolasmoreiraferreira.github.io/estados/#/sobre)

</div>

---

## O problema

A maioria dos portfólios mostra a tela funcionando: a lista carrega, o botão responde, o
formulário salva. Isso prova que a pessoa consegue montar interface — não que consegue
construir produto.

Em produção, o que separa um app utilizável de um app frustrante não é o caminho feliz.
É o que acontece quando a requisição falha, quando o servidor devolve algo inesperado,
quando o usuário não tem permissão, quando a lista tem cinco mil itens ou quando não há
nada para mostrar. São esses os momentos em que a interface precisa explicar, oferecer
saída e não deixar ninguém perdido.

> **A tese deste projeto:** tratar estado de erro, vazio e carregamento é o trabalho de
> front-end que quase ninguém demonstra. É o que este repositório coloca em primeiro plano.

## Como ver funcionando

A demonstração está publicada e não exige instalação. Três caminhos:

**1. O simulador.** No canto inferior direito há o botão **Simular situação**. Ele força
doze condições reais — erro 500, sessão expirada, sem permissão, sem internet, conflito de
edição, dado corrompido, lista vazia, cinco mil registros — e cada tela reage na hora.

**2. Um link direto.** A condição faz parte do endereço, então dá para enviar exatamente a
situação que você quer mostrar:

```
https://nicolasmoreiraferreira.github.io/estados/#/pedidos?estado=erro_servidor
https://nicolasmoreiraferreira.github.io/estados/#/pedidos?estado=sem_permissao
https://nicolasmoreiraferreira.github.io/estados/#/catalogo?estado=muitos_dados
https://nicolasmoreiraferreira.github.io/estados/#/agenda?estado=vazio
```

**3. A página inicial.** Ela mostra o mesmo componente de erro alimentado por causas
diferentes — e explica por que a mensagem e a ação mudam em cada caso.

## O que o projeto demonstra

### O mesmo erro, respostas diferentes

Um "algo deu errado" genérico não ajuda ninguém. A causa determina o que a interface deve
dizer e qual ação pode oferecer:

| Situação | O que a tela faz |
| --- | --- |
| **Erro 500** | Diz que o problema é do sistema, não do usuário, e oferece tentar de novo |
| **Sessão expirada (401)** | Explica que a sessão venceu e leva ao acesso novamente |
| **Sem permissão (403)** | Explica o que falta e a quem pedir — **sem** botão de tentar de novo |
| **Sem internet** | Diferencia de erro do servidor: a causa é outra, a ação também |
| **Conflito (409)** | Mostra as duas versões e deixa escolher, em vez de sobrescrever em silêncio |
| **Dado inválido** | Barra o conteúdo na fronteira e avisa, em vez de quebrar na renderização |

O caso de 403 é o mais revelador: oferecer "tentar de novo" ali é mentir para o usuário,
porque repetir nunca vai funcionar. Detalhe pequeno, e é onde se vê se alguém pensou no
assunto.

### Os três estados que ninguém desenha

- **Carregando** — esqueleto que ocupa o lugar do conteúdo final, para nada saltar quando o
  dado chega. E aviso de demora depois de um tempo: "carregando" e "travado" são
  indistinguíveis para quem espera.
- **Vazio** — dois casos diferentes: "ainda não há nada" (primeira visita) e "nada
  corresponde ao filtro" (a ação é limpar o filtro, não criar). Cada um com o texto e o
  botão certos.
- **Erro** — explicação em linguagem de gente, ação quando existe, e o detalhe técnico
  guardado para quem for investigar.

### Volume como estado de interface

O catálogo tem uma condição que entrega **5.004 registros**. A lista usa janela de
renderização: só as linhas próximas da área visível existem no DOM. O indicador
**Linhas no DOM** mostra isso ao vivo — cerca de 20 linhas renderizadas de 5.004. Sem
virtualização, a rolagem travaria.

## Decisões que valem explicação

**Um único renderizador de estados.** Cada tela entrega o estado da consulta e as funções
de renderização para conteúdo e vazio. Não existe caminho para esquecer o tratamento de
erro: quem escreve a tela não tem onde colocar o conteúdo sem passar por ele. A
alternativa — cada tela com seus `if (carregando) ... if (erro) ...` — é onde o erro vira
tela branca na pressa.

**O servidor falso vai para produção.** Não é ferramenta de desenvolvimento. Se o
simulador só existisse em `dev`, quem abre o site publicado não veria nada — e demonstrar
é o ponto. Ele intercepta apenas os caminhos conhecidos da API; qualquer outra requisição
passa direto.

**A condição simulada vive na URL.** Torna cada situação um endereço compartilhável. Em
vez de instruir alguém a "clicar em três lugares para ver o erro", o link abre naquela
situação. Também é o que faz o estado sobreviver ao recarregar.

**Erro tipado, não texto solto.** Cada erro carrega tipo, status, explicação, próximo
passo e se vale tentar de novo. Sem isso a interface só consegue dizer "algo deu errado".
O conflito carrega também as duas versões, para a tela comparar sem uma segunda
requisição.

**Validação mesmo no status 200.** A condição "dado inválido" existe para provar isso: o
corpo vem com JSON válido e um registro faltando campos. É na fronteira que ele é barrado,
antes de chegar à renderização.

**Resposta obsoleta descartada.** Se o usuário troca o filtro enquanto a requisição
anterior está no ar, a resposta antiga pode chegar depois e sobrescrever a nova. Cada
requisição recebe um número de ordem, e só a última escreve no estado. É o defeito clássico
de busca: a lista mostra o resultado do termo anterior.

**Retentativa só onde ela resolve.** Falha de rede e erro 5xx são reprocessados
automaticamente com espera crescente. Em 403 e 409 não: insistir só gasta tempo para
receber o mesmo resultado.

**Virtualização escrita à mão.** Para que o mecanismo fique legível no código: altura de
linha fixa, intervalo visível calculado da rolagem e um espaçador que mantém a barra no
tamanho certo. Em produção, [TanStack Virtual](https://tanstack.com/virtual) faria melhor
— e vale dizer isso em vez de fingir que a solução caseira é a ideal.

## Acessibilidade

Tratada como requisito, não como extra:

- Navegação completa por teclado; foco visível em tudo, e o simulador fecha com `Esc`
- Foco levado ao conteúdo na troca de rota — sem isso, uma SPA deixa o foco no menu antigo
- `aria-current` marcando a rota ativa; `aria-pressed` nos filtros; `aria-expanded` no simulador
- `role="alert"` nos erros e `aria-live` nas contagens, para quem usa leitor de tela saber que algo mudou
- Tabelas com `<table>`, `<caption>` e `scope` nos cabeçalhos — grades feitas com `div` não permitem ao leitor anunciar "coluna Preço, valor R$ …"
- Cor nunca é a única informação: toda etiqueta de situação traz o texto
- `prefers-reduced-motion` respeitado; link de pular para o conteúdo; `lang="pt-BR"` declarado

## Qualidade

| Camada | O que cobre |
| --- | --- |
| **Unitária** (Vitest + Testing Library) | Validação de fronteira, motor de simulação, erros tipados, componentes de estado, lógica das quatro telas |
| **Estado** (Playwright) | Cada condição chegando à tela, em desktop e mobile — incluindo a troca de condição com a tela aberta |
| **Estática** | TypeScript em modo estrito, ESLint com regras que exigem tipo |

```bash
npm run test          # testes unitários
npm run test:estados  # testes de estado em navegador real
npm run typecheck     # TypeScript
npm run lint          # ESLint
```

O TypeScript está no modo mais rigoroso que encontrei: `strict`,
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`,
`noUnusedLocals`. Não é exibicionismo — cada uma dessas opções pegou um defeito real
durante a construção, e os casos estão registrados em [`docs/decisoes.md`](docs/decisoes.md).

## Limites, declarados

- **A API é simulada no navegador.** Não há servidor. O objetivo é demonstrar o
  comportamento da interface, não infraestrutura.
- **Os dados são fictícios** e não persistem: recarregar devolve o estado inicial.
- **A virtualização é didática.** Funciona bem na faixa demonstrada, mas não substitui uma
  biblioteca madura em cenários com linhas de altura variável.
- **O foco é comportamento, não visual.** A interface é contida de propósito: o que está
  em julgamento aqui é a reação do sistema às falhas.
- **Sem testes de acessibilidade automatizados.** Há disciplina manual (teclado, foco,
  ARIA, contraste), mas ainda não há `axe` no CI. É a próxima melhoria.

## Como rodar

```bash
git clone https://github.com/nicolasmoreiraferreira/estados
cd estados
npm install
npm run dev
```

Abre em `http://localhost:5173`. Para os testes de estado, instale o navegador uma vez:

```bash
npx playwright install chromium
```

## Estrutura

```
src/
  components/
    estados/       Componentes de estado: erro, vazio, esqueleto, aviso de demora
    simulador/     Painel de simulação e faixa de condição ativa
    ui/            Botão, etiqueta, cartão, tabela, busca, filtros
  features/
    pedidos/       Lista com busca, filtro, paginação e indicadores
    agenda/        Compromissos por dia, com vazio que faz sentido
    catalogo/      Volume com rolagem virtual
    clientes/      Tela simples, para mostrar o reaproveitamento
    painel/        Página inicial (a tese) e "Sobre" (as decisões)
    sessao/        Entrada, que fecha o ciclo da sessão expirada
  lib/
    api/           Servidor falso, erros tipados, consulta com retentativa
    simulacao/     Catálogo de condições, loja, ganchos
    formato/       Moeda, data e busca em português
tests/
  unit/            Vitest + Testing Library
  e2e/             Playwright em desktop e mobile
```

## Licença

MIT — veja [LICENSE](LICENSE).
