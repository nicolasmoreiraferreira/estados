import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

import { reiniciarLoja } from '@/lib/simulacao/loja'

/**
 * Preparação comum dos testes.
 *
 * `cleanup` explícito porque o projeto não usa o auto-cleanup do Testing
 * Library: sem ele, um teste encontraria elementos deixados pelo anterior e
 * passaria por engano. E `reiniciarLoja` garante que a condição simulada volte
 * ao padrão entre os testes — sem isso, um teste que força "erro no servidor"
 * contaminaria todos os seguintes, e a falha apareceria longe da causa.
 */
beforeEach(() => {
  reiniciarLoja()
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  cleanup()
})
