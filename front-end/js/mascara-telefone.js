/**
 * Máscara de Telefone Brasileiro
 * Aceita formatos: (11) 98765-4321 (celular) e (11) 9876-5432 (fixo)
 * Uso: aplicarMascaraTelefone(document.getElementById('meuTelefone'));
 */

function aplicarMascaraTelefone(input) {
    if (!input) return;

    input.addEventListener('input', function (e) {
        let valor = e.target.value.replace(/\D/g, ''); // remove tudo que não é dígito

        if (valor.length > 11) {
            valor = valor.slice(0, 11);
        }

        // Formata conforme digita
        if (valor.length > 7) {
            // Celular: (XX) XXXXX-XXXX
            valor = valor.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (valor.length > 6) {
            // Fixo: (XX) XXXX-XXXX
            valor = valor.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else if (valor.length > 2) {
            valor = valor.replace(/(\d{2})(\d+)/, '($1) $2');
        } else if (valor.length > 0) {
            valor = valor.replace(/(\d+)/, '($1');
        }

        e.target.value = valor;
    });
}

// Aplica automaticamente em qualquer input com a classe .mascara-telefone
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.mascara-telefone, input[type="tel"]').forEach(aplicarMascaraTelefone);
});

// Exporta para usar manualmente também
if (typeof window !== 'undefined') {
    window.aplicarMascaraTelefone = aplicarMascaraTelefone;
}

