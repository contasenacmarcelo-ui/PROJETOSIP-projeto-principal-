// frontend/js/ml-executivo.js

async function main() {
  try {
    console.log('🚀 Iniciando ML Executivo...');

    // 1. Buscar dados do banco
    const response = await fetch('/api/ml-executivo/dados');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const dados = await response.json();
    console.log('📊 Dados recebidos:', dados);

    // 2. Processar com ML
    const processResponse = await fetch('/api/ml-executivo/processar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!processResponse.ok) throw new Error(`HTTP ${processResponse.status}`);

    const resultados = await processResponse.json();
    console.log('✅ ML Processado:', resultados);

    // 3. Renderizar no dashboard
    renderizar_dashboard(resultados, dados);

  } catch (err) {
    console.error('❌ Erro ao iniciar ML executivo:', err);
    const el = document.getElementById('error-container');
    if (el) {
      el.innerHTML = `<p style="color: red;">Erro: ${err.message}</p>`;
    }
  }
}

function renderizar_dashboard(resultados, dados) {
  console.log('🎨 Renderizando dashboard...');

  const container = document.getElementById('dashboard-container');
  if (!container) return;

  container.innerHTML = `
    <div style="padding: 20px; font-family: Arial;">
      <h2>📊 ML Executivo - Resultados</h2>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
          <h3>🎯 Chamados Processados</h3>
          <p><strong>${resultados.chamados_processados}</strong> chamados validados</p>
          <p style="font-size: 12px; color: #666;">Categoria e prioridade preenchidas</p>
        </div>

        <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
          <h3>💰 Pedidos Processados</h3>
          <p><strong>${resultados.pedidos_processados}</strong> pedidos validados</p>
          <p style="font-size: 12px; color: #666;">Valor estimado calculado</p>
        </div>
      </div>

      ${resultados.erros && resultados.erros.length > 0 ? `
        <div style="margin-top: 20px; padding: 15px; background: #fee; border-left: 4px solid #f00; border-radius: 4px;">
          <h4>⚠️ Erros encontrados:</h4>
          <ul>${resultados.erros.map(e => `<li>${e}</li>`).join('')}</ul>
        </div>
      ` : '<p style="color: green; margin-top: 20px;">✅ Nenhum erro!</p>'}

      <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        🔄 Processar Novamente
      </button>
    </div>
  `;
}

// Executar quando página carrega
document.addEventListener('DOMContentLoaded', main);

