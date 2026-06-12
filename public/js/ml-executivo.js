// public/js/ml-executivo.js

async function fetchDados(minEach = 5, limit = 10) {
  const url = `/api/ml-executivo/dados?min_each=${encodeURIComponent(minEach)}&limit=${encodeURIComponent(limit)}`;
  const token2 = (typeof getToken === 'function' ? getToken() : null) || localStorage.getItem('access_token');
  const response = await fetch(url, {
    headers: {
      'Authorization': token2 ? `Bearer ${token2}` : '',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // Compatibilidade: se a rota não existir em algum deploy antigo,
    // tenta fallback para o endpoint antigo (quando aplicável).
    if (response.status === 404) {
      const fallback = await fetch(`/api/ml-executivo/dados?min_each=${encodeURIComponent(minEach)}&limit=${encodeURIComponent(limit)}`)
        .catch(() => null);
      if (fallback && fallback.ok) return await fallback.json();
    }

    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}. ${text}`);
  }
  return response.json();
}


function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');
}

function renderPreview(dados) {
  const container = document.getElementById('ml-preview-container');
  const previewStatus = document.getElementById('ml-status-text');

  const chamados = Array.isArray(dados?.chamados) ? dados.chamados : [];
  const pedidos = Array.isArray(dados?.pedidos) ? dados.pedidos : [];

  document.getElementById('ml-count-chamados').textContent = chamados.length;
  document.getElementById('ml-count-pedidos').textContent = pedidos.length;

  const hasData = chamados.length > 0 || pedidos.length > 0;
  previewStatus.textContent = hasData ? 'Dados carregados ✅' : 'Nenhum dado pendente no BD (usando seed UI)';

  if (!hasData) {
    container.innerHTML = `<div class="ml-empty">Nenhum registro foi encontrado. A tela tenta manter a execução funcionando com amostras.</div>`;
    return;
  }

  const chamadosRows = chamados.slice(0, 10).map(c => {
    return `
      <tr>
        <td>${escapeHtml(c.titulo)}</td>
        <td>${escapeHtml(c.descricao)}</td>
        <td>${escapeHtml(c.categoria_classificada ?? '')}</td>
        <td>${escapeHtml(c.prioridade ?? '')}</td>
        <td>${escapeHtml(c.status ?? '')}</td>
      </tr>
    `;
  }).join('');

  const pedidosRows = pedidos.slice(0, 10).map(p => {
    return `
      <tr>
        <td>${escapeHtml(p.tipo_servico ?? '')}</td>
        <td>${escapeHtml(p.descricao ?? '')}</td>
        <td>${escapeHtml(p.status ?? '')}</td>
        <td>${escapeHtml(p.valor_estimado ?? '')}</td>
        <td>${escapeHtml(p.prazo ?? '')}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div style="padding: 14px 20px;">
      <div style="display:grid;grid-template-columns:1fr;gap:18px;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:12px;">
            <h3 class="ml-section-title" style="margin:0;">Chamados (${chamados.length})</h3>
            <span style="color:rgba(255,255,255,0.65)">Mostrando até 10</span>
          </div>
          <div class="ml-table-container">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${chamadosRows || '<tr><td colspan="5" style="color:rgba(255,255,255,0.55)">Sem chamados</td></tr>'}</tbody>
            </table>
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:12px;">
            <h3 class="ml-section-title" style="margin:0;">Pedidos (${pedidos.length})</h3>
            <span style="color:rgba(255,255,255,0.65)">Mostrando até 10</span>
          </div>
          <div class="ml-table-container">
            <table>
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Valor estimado</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>${pedidosRows || '<tr><td colspan="5" style="color:rgba(255,255,255,0.55)">Sem pedidos</td></tr>'}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function processar(dados) {
  const token2 = (typeof getToken === 'function' ? getToken() : null) || localStorage.getItem('access_token');
  const processResponse = await fetch('/api/ml-executivo/processar',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token2 ? { 'Authorization': `Bearer ${token2}` } : {}),
      },
      body: JSON.stringify(dados)
    }
  );


  if (!processResponse.ok) {
    const text = await processResponse.text().catch(() => '');
    throw new Error(`HTTP ${processResponse.status}. ${text}`);
  }
  return processResponse.json();
}

async function start() {
  const errorEl = document.getElementById('error-container');
  const resultEl = document.getElementById('ml-result');

  try {
    if (errorEl) errorEl.innerHTML = '';
    resultEl.textContent = 'Executando...';

    const dados = await fetchDados(5, 10);
    renderPreview(dados);

    const resultados = await processar(dados);
    resultEl.textContent = JSON.stringify(resultados, null, 2);

  } catch (err) {
    console.error('❌ Erro ao iniciar ML executivo:', err);
    if (errorEl) {
      errorEl.innerHTML = `<p style="color: red;">Erro: ${escapeHtml(err.message)}</p>`;
    }
    resultEl.textContent = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnProcessar = document.getElementById('ml-btn-processar');
  const btnRecarregar = document.getElementById('ml-btn-recarregar');

  if (btnProcessar) btnProcessar.addEventListener('click', start);
  if (btnRecarregar) btnRecarregar.addEventListener('click', start);

  // auto-start
  start();
});

