# Estados — texto para o LinkedIn

## Título do projeto

Estados — Laboratório de Estados de Interface

## Descrição (para a seção Projetos)

Aplicação de código aberto que mostra o que acontece quando a API falha, a rede
cai ou o dado não existe.

A ideia veio de um problema recorrente: quase todo bug de interface nasce no
caminho que ninguém testa — o momento em que a requisição falha, a sessão
expira, a rede cai ou o dado chega vazio. Esses estados costumam ser descobertos
pelo usuário, em produção, porque não existe forma simples de provocá-los
durante o desenvolvimento.

Na aplicação, a condição de API não é simulada em teste: ela é parte do
produto. Um painel escolhe a condição e todas as telas passam a responder sob
aquele regime. O endereço guarda a escolha, então qualquer estado pode ser
compartilhado por link — útil para revisão de design, teste manual e
demonstração.

Doze condições, entre elas: erro 500, sessão expirada, sem permissão, sem
conexão, dado corrompido e cinco mil registros.

Um renderizador único de consulta obriga toda tela a tratar carregamento, erro
e vazio: não existe caminho no código para exibir conteúdo sem passar pelos
três. A lista de volume usa virtualização e mantém 20 linhas no DOM de 5.004
registros.

São 175 testes automatizados — 103 unitários e 72 de navegador, em desktop e
celular — com TypeScript no modo mais estrito e integração contínua publicando
a demonstração a cada push.

Stack: React 19, TypeScript, Vite, Tailwind CSS, Vitest e Playwright.

Código aberto: github.com/nicolasmoreiraferreira/estados

## Competências a marcar

React.js · TypeScript · Testes automatizados · Playwright · Acessibilidade ·
Desenvolvimento front-end

## Link

https://github.com/nicolasmoreiraferreira/estados
