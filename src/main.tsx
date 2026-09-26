import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/layout/Layout'
import { TelaAgenda } from '@/features/agenda/TelaAgenda'
import { TelaCatalogo } from '@/features/catalogo/TelaCatalogo'
import { TelaClientes } from '@/features/clientes/TelaClientes'
import { TelaPainel } from '@/features/painel/TelaPainel'
import { TelaSobre } from '@/features/painel/TelaSobre'
import { TelaPedidos } from '@/features/pedidos/TelaPedidos'
import { TelaEntrar } from '@/features/sessao/TelaEntrar'
import { instalarServidorFalso } from '@/lib/api/servidorFalso'
import {
  condicaoDaUrl,
  definirCondicao,
  normalizarUrl,
  observarEndereco,
} from '@/lib/simulacao/loja'
import './index.css'

/**
 * Ponto de entrada.
 *
 * A ordem importa: o servidor falso é instalado e a condição é lida da URL
 * **antes** da primeira renderização. Se a instalação viesse depois, a primeira
 * consulta de cada tela escaparia do simulador — e a demonstração começaria
 * quebrada justamente para quem abriu um link com condição forçada.
 *
 * O roteamento é por hash porque a demonstração é estática: sem servidor para
 * redirecionar, um caminho puro daria 404 ao recarregar a página. Os parâmetros
 * da aplicação vivem dentro do fragmento — `#/pedidos?estado=vazio`.
 */
instalarServidorFalso()

const condicaoInicial = condicaoDaUrl()
if (condicaoInicial !== 'normal') definirCondicao(condicaoInicial)
else normalizarUrl()

// A partir daqui, mudar o endereço aplica a condição na hora — é o que faz um
// link colado na mesma aba funcionar, sem precisar recarregar.
observarEndereco()

const raiz = document.getElementById('root')
if (!raiz) throw new Error('Elemento #root não encontrado no documento.')

createRoot(raiz).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<TelaPainel />} />
          <Route path="pedidos" element={<TelaPedidos />} />
          <Route path="agenda" element={<TelaAgenda />} />
          <Route path="catalogo" element={<TelaCatalogo />} />
          <Route path="clientes" element={<TelaClientes />} />
          <Route path="entrar" element={<TelaEntrar />} />
          <Route path="sobre" element={<TelaSobre />} />
          <Route path="*" element={<TelaPainel />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
