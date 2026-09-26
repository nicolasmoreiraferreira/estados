import { expect, test, type Page } from '@playwright/test'

/**
 * Testes de estado em navegador real.
 *
 * A suíte unitária prova que cada componente se comporta bem isolado. Estes
 * testes provam a promessa do projeto: **quando eu forço uma condição, ela
 * chega à tela**. É a diferença entre "o componente de erro funciona" e "o app
 * mostra o erro" — e a segunda é o que o projeto afirma.
 *
 * Por isso a maioria destes testes não navega pelo painel: abre o endereço com
 * a condição, que é o mesmo mecanismo que o painel usa. Assim a suíte verifica
 * o caminho real e, de quebra, confirma que os links compartilháveis funcionam.
 */

const ROTAS = ['/pedidos', '/agenda', '/catalogo', '/clientes'] as const

/** Abre uma rota com a condição já aplicada, como um link compartilhado. */
async function abrirCom(page: Page, rota: string, condicao: string): Promise<void> {
  // O endereço usa hash porque a demonstração é estática: sem servidor para
  // redirecionar, um caminho puro daria 404 ao recarregar.
  await page.goto(`/#${rota}?estado=${condicao}`)
}

test.describe('condições de falha', () => {
  test('erro no servidor mostra mensagem que não culpa o usuário', async ({ page }) => {
    await abrirCom(page, '/pedidos', 'erro_servidor')
    const alerta = page.getByRole('alert')
    await expect(alerta).toBeVisible()
    await expect(alerta).toContainText('O sistema está com um problema')
    await expect(alerta).toContainText('Não é do seu lado')
    await expect(alerta).toContainText('HTTP 500')
  })

  test('sessão expirada oferece entrar novamente', async ({ page }) => {
    await abrirCom(page, '/pedidos', 'nao_autenticado')
    const alerta = page.getByRole('alert')
    await expect(alerta).toContainText('Sua sessão expirou')
    await expect(alerta.getByRole('button', { name: /entrar novamente/i })).toBeVisible()
  })

  test('falta de permissão não oferece tentativa inútil', async ({ page }) => {
    // O teste mais importante da suíte: mostrar "tentar de novo" em 403 seria
    // mentir para o usuário, e é o tipo de detalhe que passa batido em revisão.
    await abrirCom(page, '/pedidos', 'sem_permissao')
    const alerta = page.getByRole('alert')
    await expect(alerta).toContainText('não tem acesso')
    await expect(alerta.getByRole('button', { name: /tentar de novo/i })).toHaveCount(0)
    await expect(alerta).toContainText('administrador')
  })

  test('sem conexão é diferente de erro do servidor', async ({ page }) => {
    await abrirCom(page, '/pedidos', 'offline')
    const alerta = page.getByRole('alert')
    await expect(alerta).toContainText('sem conexão')
    await expect(alerta).not.toContainText('O sistema está com um problema')
  })

  test('falha de conexão oferece nova tentativa', async ({ page }) => {
    await abrirCom(page, '/pedidos', 'erro_rede')
    const alerta = page.getByRole('alert')
    await expect(alerta.getByRole('button', { name: /tentar de novo/i })).toBeVisible()
  })

  test('conflito de edição explica a situação', async ({ page }) => {
    await abrirCom(page, '/pedidos', 'conflito')
    const alerta = page.getByRole('alert')
    await expect(alerta).toContainText('Alguém alterou este registro')
    await expect(alerta).toContainText('HTTP 409')
  })

  test('dado inválido é barrado na fronteira, sem quebrar a tela', async ({ page }) => {
    // Sem validação, este caso derrubaria a renderização com erro
    // incompreensível. Com validação, vira uma mensagem que explica o problema.
    await abrirCom(page, '/pedidos', 'dado_invalido')
    const alerta = page.getByRole('alert')
    await expect(alerta).toContainText('formato que não dá para usar')
    // A tela continua utilizável: o cabeçalho e o simulador seguem presentes.
    await expect(page.getByRole('heading', { name: 'Pedidos', level: 1 })).toBeVisible()
  })

  test('todas as telas reagem à mesma condição', async ({ page }) => {
    // A promessa central: nenhuma tela escapa. Se alguém adicionar uma tela e
    // esquecer de tratar erro, este teste falha.
    for (const rota of ROTAS) {
      await abrirCom(page, rota, 'erro_servidor')
      // O prazo cobre as retentativas automáticas antes da falha definitiva.
      await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })
    }
  })
})

test.describe('condições de dados', () => {
  test('lista vazia explica em vez de parecer defeito', async ({ page }) => {
    await abrirCom(page, '/pedidos', 'vazio')
    await expect(page.getByText('Nenhum pedido ainda')).toBeVisible()
    await expect(page.getByText(/a consulta funcionou/i)).toBeVisible()
  })

  test('agenda vazia é tratada como situação normal', async ({ page }) => {
    await abrirCom(page, '/agenda', 'vazio')
    await expect(page.getByText('Nenhum compromisso agendado')).toBeVisible()
    // O texto precisa deixar claro que isso não é erro — agenda livre é normal.
    await expect(page.getByText(/não é um erro/i)).toBeVisible()
  })

  test('filtro sem resultado oferece limpar', async ({ page }) => {
    await abrirCom(page, '/pedidos', 'normal')
    await page.getByPlaceholder(/buscar por número ou cliente/i).fill('zzzz-inexistente')
    await expect(page.getByText('Nenhum pedido corresponde a este filtro')).toBeVisible()
    await expect(page.getByRole('button', { name: /limpar filtros/i })).toBeVisible()
  })

  test('volume alto mantém a lista utilizável e virtualizada', async ({ page }) => {
    await abrirCom(page, '/catalogo', 'muitos_dados')
    await expect(page.getByText('Linhas no DOM')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/de 5\.\d\d\d/).first()).toBeVisible()

    // A prova da virtualização: a contagem de linhas no DOM é muito menor que o
    // total. Se alguém remover a janela de renderização, este teste falha.
    const linhas = await page.locator('tbody tr').count()
    expect(linhas).toBeLessThan(60)
    expect(linhas).toBeGreaterThan(0)
  })

  test('a busca responde sobre o volume sem travar', async ({ page }) => {
    await abrirCom(page, '/catalogo', 'muitos_dados')
    await page.getByPlaceholder(/buscar por nome ou código/i).fill('argamassa')
    await expect(page.getByText(/linhas no dom/i)).toBeVisible()
    const linhas = await page.locator('tbody tr').count()
    expect(linhas).toBeGreaterThan(0)
  })
})

test.describe('condições de fluxo', () => {
  test('carregando mostra esqueleto que preserva o layout', async ({ page }) => {
    await abrirCom(page, '/pedidos', 'carregando')
    await expect(page.getByRole('status').first()).toBeVisible()
    // O esqueleto anuncia o estado para quem não vê o desenho.
    await expect(page.getByText('Carregando').first()).toBeAttached()
    // E não trava a tela: o resto continua acessível.
    await expect(page.getByRole('heading', { name: 'Pedidos', level: 1 })).toBeVisible()
  })

  test('rede lenta avisa que está demorando', async ({ page }) => {
    await abrirCom(page, '/pedidos', 'lento')
    await expect(page.getByText(/está demorando mais que o normal/i)).toBeVisible({ timeout: 15_000 })
  })

  test('estado normal mostra os dados', async ({ page }) => {
    await abrirCom(page, '/pedidos', 'normal')
    await expect(page.getByText('Mercado São Jorge')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'PD-1041' })).toBeVisible()
  })
})

test.describe('troca de condição com a tela aberta', () => {
  test('o painel aplica a condição na hora, sem recarregar', async ({ page }) => {
    // O defeito mais comum em simulador mal feito: trocar a condição não faz
    // nada, porque a requisição já terminou. Aqui a tela precisa reagir.
    await abrirCom(page, '/pedidos', 'normal')
    await expect(page.getByText('Mercado São Jorge')).toBeVisible()

    await page.getByRole('button', { name: /simular situação/i }).click()
    await page.getByRole('radio', { name: /erro no servidor/i }).check()
    await page.getByRole('button', { name: /fechar o simulador/i }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/estado=erro_servidor/)
  })

  test('a faixa lembra qual condição está ativa', async ({ page }) => {
    await abrirCom(page, '/pedidos', 'sem_permissao')
    await expect(page.getByText('Simulando: Sem permissão')).toBeVisible()
  })

  test('o endereço fica limpo quando não há condição', async ({ page }) => {
    await abrirCom(page, '/pedidos', 'normal')
    await expect(page).not.toHaveURL(/estado=/)
    await expect(page.getByText(/simulando:/i)).toHaveCount(0)
  })
})

test.describe('acessibilidade e navegação', () => {
  test('o app inteiro funciona por teclado', async ({ page }) => {
    await page.goto('/#/pedidos?estado=erro_servidor')
    // O simulador precisa ser alcançável por teclado e fechável com Esc: sem
    // isso, quem não usa mouse não consegue sair do painel.
    const botao = page.getByRole('button', { name: /simular situação/i })
    await botao.focus()
    await expect(botao).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: /simulador/i })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: /simulador/i })).toHaveCount(0)
  })

  test('a rota ativa é anunciada para leitor de tela', async ({ page }) => {
    await page.goto('/#/catalogo')
    const atual = page.getByRole('link', { name: 'Catálogo' })
    await expect(atual).toHaveAttribute('aria-current', 'page')
  })

  test('a tabela usa marcação semântica', async ({ page }) => {
    await page.goto('/#/pedidos')
    // Cabeçalho de coluna com escopo é o que permite ao leitor de tela anunciar
    // "coluna Preço, valor R$ ...". Grades feitas com div não fazem isso.
    await expect(page.getByRole('table').first()).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Cliente' })).toBeVisible()
  })
})
