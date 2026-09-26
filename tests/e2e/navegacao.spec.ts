import { expect, test } from '@playwright/test'

/**
 * Testes de navegação e das telas em uso normal.
 *
 * Cobrem o que os testes de condição não cobrem: filtro, busca, paginação e o
 * estado vazio por filtro — os caminhos que o usuário percorre quando nada dá
 * errado. Um app que só trata falha mas não deixa filtrar direito não serve
 * para nada.
 */

test.describe('painel inicial', () => {
  test('explica a proposta e permite aplicar uma condição', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('quando não dá')
    await expect(page.getByText('O mesmo componente de erro, três situações')).toBeVisible()

    // O atalho da lista precisa funcionar: é o caminho que quem avalia vai usar.
    await page.getByRole('button', { name: /erro no servidor/i }).first().click()
    await expect(page).toHaveURL(/estado=erro_servidor/)
  })

  test('lista as doze condições', async ({ page }) => {
    await page.goto('/')
    const itens = page.locator('button[aria-pressed]')
    await expect(itens).toHaveCount(12)
  })

  test('a página sobre explica as decisões e os limites', async ({ page }) => {
    await page.goto('/#/sobre')
    await expect(page.getByText('Decisões técnicas')).toBeVisible()
    // Declarar limite é parte do projeto: quem avalia precisa saber o que não
    // está sendo demonstrado.
    await expect(page.getByText('Limites conhecidos')).toBeVisible()
    await expect(page.getByText(/não há servidor real/i)).toBeVisible()
  })
})

test.describe('pedidos', () => {
  test('filtra por situação', async ({ page }) => {
    await page.goto('/#/pedidos')
    await expect(page.getByRole('cell', { name: 'PD-1041' })).toBeVisible()

    await page.getByRole('button', { name: 'Cancelado', exact: true }).click()
    await expect(page.getByRole('cell', { name: 'PD-1045' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'PD-1041' })).toHaveCount(0)
  })

  test('busca ignorando acento', async ({ page }) => {
    // Em português, busca que não ignora acento é quase inútil: ninguém digita
    // "São" com til ao procurar.
    await page.goto('/#/pedidos')
    await page.getByPlaceholder(/buscar por número ou cliente/i).fill('sao jorge')
    await expect(page.getByRole('cell', { name: 'Mercado São Jorge' })).toBeVisible()
  })

  test('busca por número do pedido', async ({ page }) => {
    await page.goto('/#/pedidos')
    await page.getByPlaceholder(/buscar por número ou cliente/i).fill('1043')
    await expect(page.getByRole('cell', { name: 'PD-1043' })).toBeVisible()
    await expect(page.locator('tbody tr')).toHaveCount(1)
  })

  test('mostra os indicadores calculados', async ({ page }) => {
    await page.goto('/#/pedidos')
    await expect(page.getByText('Valor total')).toBeVisible()
    await expect(page.getByText('Aguardando')).toBeVisible()
  })
})

test.describe('agenda', () => {
  test('agrupa compromissos por dia', async ({ page }) => {
    await page.goto('/#/agenda')
    await expect(page.getByText(/Visita técnica/)).toBeVisible()
    await expect(page.getByText(/compromissos?$/).first()).toBeVisible()
  })

  test('filtra por período', async ({ page }) => {
    await page.goto('/#/agenda')
    await page.getByRole('button', { name: 'Hoje', exact: true }).click()
    await expect(page.getByText(/Visita técnica/)).toBeVisible()
  })
})

test.describe('catálogo', () => {
  test('filtra por categoria', async ({ page }) => {
    await page.goto('/#/catalogo')
    await page.getByRole('button', { name: 'Pintura', exact: true }).click()
    await expect(page.getByText(/Tinta acrílica/)).toBeVisible()
    await expect(page.getByText(/Cabo flexível/)).toHaveCount(0)
  })

  test('sinaliza item sem estoque', async ({ page }) => {
    await page.goto('/#/catalogo')
    // Situação que o usuário precisa perceber de longe, e que não pode
    // depender só de cor para ser entendida.
    await expect(page.getByRole('table').getByText('Sem estoque')).toBeVisible()
  })
})

test.describe('clientes', () => {
  test('filtra por situação', async ({ page }) => {
    await page.goto('/#/clientes')
    await page.getByRole('button', { name: 'Inadimplentes', exact: true }).click()
    await expect(page.getByRole('cell', { name: 'Auto Peças Litoral' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Mercado São Jorge' })).toHaveCount(0)
  })

  test('conta os resultados filtrados', async ({ page }) => {
    await page.goto('/#/clientes')
    await expect(page.getByText(/de 5 clientes/)).toBeVisible()
  })
})

test.describe('estado em cada tela', () => {
  test('navegar entre telas mantém a condição', async ({ page }) => {
    // A condição vive na URL, então trocar de tela não pode perdê-la — senão o
    // usuário teria de reaplicar a cada navegação.
    await page.goto('/#/pedidos?estado=erro_servidor')
    await page.getByRole('link', { name: 'Agenda' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/estado=erro_servidor/)
  })
})
