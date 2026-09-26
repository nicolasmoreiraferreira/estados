# Decisões técnicas

Registro do que foi escolhido, por quê, e — quando for o caso — do que foi descartado. A
pergunta "por que isso é assim?" deve ter resposta sem arqueologia no histórico do Git.

---

## 1. Um renderizador de estados em vez de lógica em cada tela

**Decisão.** Cada tela entrega o estado da consulta e funções de renderização para
conteúdo e vazio. O tratamento de carregamento, erro e demora fica em um componente único,
`RenderizarConsulta`.

**Por quê.** A alternativa — cada tela com seus `if (carregando) ... if (erro) ...` — tem
dois problemas: é onde o erro vira tela branca na pressa, e exige corrigir a mesma coisa em
quatro lugares. Concentrando, corrigir uma vez vale para todas.

**O que isso impede.** Uma tela nova não tem onde colocar o conteúdo sem passar pelo
tratamento de estado. É impossível esquecer — e o teste
`nenhuma tela quebra quando o servidor falha` percorre as quatro telas justamente para
verificar isso.

**Custo aceito.** Menos flexibilidade: uma tela que precise de comportamento muito
diferente tem de contornar a abstração. Para quatro telas com as mesmas necessidades, vale
a pena.

---

## 2. O servidor falso vai para produção

**Decisão.** `instalarServidorFalso` roda também no bundle de produção, não só em
desenvolvimento.

**Por quê.** Se o simulador existisse apenas em `dev`, quem abre o site publicado não veria
nada — e demonstrar é o ponto do projeto. Um portfólio cuja melhor parte só funciona depois
de clonar o repositório não demonstra nada para quem avalia.

**Proteção.** Ele intercepta apenas os caminhos conhecidos (`/api/pedidos`, `/api/agenda`,
`/api/catalogo`, `/api/clientes`). Qualquer outra requisição passa para o `fetch` real, em
vez de ser engolida em silêncio.

**Trade-off declarado.** Um app real não faria isso. Aqui faz sentido porque não existe
backend — e a tela "Sobre" explica ao visitante que os dados são simulados.

---

## 3. A condição simulada vive na URL

**Decisão.** A condição é gravada em `?estado=...` com `replaceState`, e lida da URL na
carga.

**Por quê.** Torna cada situação um endereço compartilhável: em vez de instruir alguém a
"clicar em três lugares para ver o erro", o link abre naquela situação. Também é o que faz
o estado sobreviver ao recarregar a página.

**`replaceState`, não `pushState`.** Alternar condições não deve encher o botão de voltar do
navegador — quem experimenta dez condições não quer dez passos para sair.

**Validação na leitura.** A entrada vem de fora e é tratada como não confiável: um
`?estado=` inventado cai no padrão em vez de propagar lixo para o servidor falso. Há testes
para `__proto__` e para valor vazio.

**Detalhe que surgiu na implementação.** `?estado=normal` é válido mas redundante —
significa o mesmo que a ausência do parâmetro. Como conviver com os dois produziria
endereços diferentes para a mesma situação, a URL é normalizada removendo o parâmetro.

---

## 4. Erro tipado, com explicação e ação

**Decisão.** Todo erro é um `ErroApp` com tipo, status, explicação em linguagem de gente,
próximo passo, se vale tentar de novo e um detalhe técnico.

**Por quê.** Sem essa estrutura, a interface só consegue dizer "algo deu errado" — que é o
mesmo que não dizer nada. Com ela, cada causa produz a resposta certa: erro 500 oferece
nova tentativa, 403 não (repetir não resolve), 401 leva ao acesso.

**O conflito carrega conteúdo.** Um erro 409 que só dissesse "houve conflito" obrigaria a
tela a fazer uma segunda requisição para descobrir o que mudou. O campo `dados` entrega as
duas versões de uma vez.

**Fronteira normalizada.** `normalizarErro` absorve qualquer coisa lançada — inclusive
`throw 'string'`, que ainda aparece em bibliotecas. A partir daí a interface nunca lida com
`unknown`.

---

## 5. Validação mesmo quando o status é 200

**Decisão.** O corpo da resposta é validado campo a campo antes de chegar à tela, inclusive
quando a resposta é bem-sucedida.

**Por quê.** Um corpo com formato errado é um caminho real, e o status 200 não garante
nada. A condição `dado_invalido` do simulador existe exatamente para isso: JSON válido,
lista com itens, mas o segundo registro sem os campos obrigatórios. Sem validação, o
formatador receberia `undefined` no meio da renderização e a tela quebraria com mensagem
incompreensível.

**Validação escrita à mão.** Sem biblioteca de esquema, para que fique visível o que
significa validar na fronteira: conferir tipo, presença, faixa e regra de domínio de cada
campo.

**Regra de domínio, não só formato.** A agenda recusa término antes do início; o catálogo
recusa preço negativo. Esses dados passariam na checagem de tipo e produziriam telas
plausíveis e erradas — pior que mostrar erro.

---

## 6. Resposta obsoleta descartada

**Decisão.** Cada requisição recebe um número de ordem; só a mais recente pode escrever no
estado.

**Por quê.** Se o usuário troca o filtro enquanto a requisição anterior está no ar, a
resposta antiga pode chegar depois e sobrescrever a nova. É o defeito clássico de busca: a
lista mostra o resultado do termo anterior. Sem número de ordem, o bug aparece só quando a
rede está irregular — ou seja, nunca em demonstração.

---

## 7. Retentativa só onde ela resolve

**Decisão.** Falha de rede e erro 5xx são reprocessados automaticamente (duas vezes, com
espera que dobra). Erros 4xx não são.

**Por quê.** Falha transitória costuma passar sozinha; insistir imediatamente gasta bateria
e sobrecarrega um servidor que já está mal. Mas insistir em 403 ou 409 é gastar tempo para
receber o mesmo resultado — e a interface precisa saber a diferença para não oferecer um
botão que não leva a lugar nenhum.

**Ajuste durante a construção.** A espera inicial era de 900 ms, o que fazia a demonstração
parecer lenta: quase quatro segundos até o erro aparecer. Reduzida para 500 ms, com o aviso
de demora aparecendo em 1,2 s — assim o usuário vê o app tentando, em vez de uma tela
parada.

---

## 8. Virtualização escrita à mão

**Decisão.** O catálogo implementa a janela de renderização sem biblioteca: altura de linha
fixa, intervalo visível calculado da rolagem, espaçador mantendo a barra no tamanho certo.

**Por quê.** Para que o mecanismo fique legível no código. É a diferença entre usar uma
ferramenta e entender o que ela faz — e o projeto existe para mostrar entendimento.

**Honestidade sobre o limite.** [TanStack Virtual](https://tanstack.com/virtual) faria
melhor, especialmente com linhas de altura variável. Isso está declarado no README e na
tela "Sobre", em vez de apresentar a solução caseira como ideal.

---

## 9. TypeScript no modo mais rigoroso que encontrei

**Decisão.** `strict`, mais `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`,
`noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`.

**Por quê.** Cada opção pegou um defeito real durante a construção:

| Opção | O que pegou |
| --- | --- |
| `exactOptionalPropertyTypes` | `detalhe?: string` recebendo `string \| undefined` em quatro lugares — passaria despercebido e produziria `undefined` renderizado |
| `noPropertyAccessFromIndexSignature` | Acesso a `item.id` em dado vindo de `Record<string, unknown>` — acesso por colchete obrigatório, que é o correto para conteúdo de rede |
| `noUncheckedIndexedAccess` | Acesso a `EXEMPLOS[0]` sem conferir se existe — virou `?? exemploPadrao` |
| `verbatimModuleSyntax` | Import de tipo misturado com import de valor, que quebra em build com transpilação isolada |

**Custo aceito.** Mais verboso em pontos como `descricao?: string | undefined`. É o ponto:
obriga a pensar se "não informado" e "informado como vazio" são a mesma coisa — e quase
nunca são.

---

## 10. Cinco defeitos que os testes pegaram

Registrados porque são o argumento para manter a suíte — e porque o padrão se repete:
defeito que passa na revisão visual e aparece no teste.

**1. Trocar a condição no painel não refazia a consulta.** O efeito de carregamento não
dependia da condição simulada, então a tela continuava com o dado antigo. Era o defeito que
anulava o projeto inteiro — o simulador seria decorativo. Corrigido passando a condição
como dependência do efeito.

**2. O botão "Entrar novamente" nunca aparecia.** Nenhuma tela passava o tratador de
reautenticação, então o erro 401 exibia um bloco sem ação. Um botão que não leva a lugar
nenhum é pior que nenhum botão. Corrigido com a tela de entrada, que fecha o ciclo.

**3. Navegar entre telas perdia a condição.** Os links de navegação não carregavam a busca
atual, então a condição sumia ao trocar de tela — e um link compartilhado deixava de
funcionar depois do primeiro clique.

**4. `?estado=normal` ficava grudado no endereço**, produzindo um link que parecia forçar
algo sem forçar nada.

**5. A condição de conflito não chegava à tela.** O servidor falso devolvia o conflito como
resposta 200 com conteúdo especial, mas o cliente esperava um erro. A situação apareceria
como "tudo certo" com dado estranho. Corrigido transformando o conflito em 409 com
conteúdo.

Os cinco foram encontrados por teste, não por inspeção. Quatro deles não apareceriam em
nenhuma revisão visual, porque a tela parecia funcionar.

---

## Descartado

**Biblioteca de esquema (Zod).** Validação à mão é mais verbosa, mas o projeto existe para
mostrar o que é validar. Uma biblioteca esconderia justamente o mecanismo em julgamento.

**Biblioteca de ícones.** São sete formas. Carregar centenas de kB para desenhá-las não se
justifica.

**Biblioteca de formatação de data.** `Intl` está no navegador e resolve melhor que
qualquer pacote. Os formatadores são criados uma vez e reaproveitados — em listas de
milhares de itens, criar por chamada aparece no perfil.

**Estado global (Redux, Zustand).** O estado é local a cada tela, mais a condição simulada,
que é uma loja pequena lida com `useSyncExternalStore`. Não há necessidade de mais.

**`axe` no CI.** Deveria estar. Está na lista de próximos passos, não entre as conquistas.
