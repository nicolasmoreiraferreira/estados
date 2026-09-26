import { defineConfig, devices } from '@playwright/test'

/**
 * Testes de estado.
 *
 * A suíte unitária prova que cada componente sabe se comportar sozinho. Estes
 * testes provam outra coisa: que a condição simulada chega à tela. É a
 * diferença entre "o componente de erro funciona" e "quando eu forço erro 500,
 * o app mostra o erro" — a segunda é o que o projeto promete.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'movel', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        command: 'npm run build && npm run preview -- --port 4173 --strictPort --host 127.0.0.1',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env['CI'],
        timeout: 180_000,
      },
})
