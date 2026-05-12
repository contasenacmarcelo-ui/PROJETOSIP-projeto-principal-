import json
import pytest


def _get_api_base():
    return "http://localhost:5000/api"


def test_admin_ml_exemplos_endpoint_estrutura():
    """Valida se o endpoint existe e retorna o formato esperado.

    Observação: precisa do servidor Flask rodando e token admin válido.
    Para execução no CI/local, configure o token no env.
    """
    import os
    import requests

    api_base = _get_api_base()
    token = os.environ.get("SIP_ADMIN_TOKEN")
    if not token:
        pytest.skip("SIP_ADMIN_TOKEN não configurado")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    resp = requests.get(f"{api_base}/admin/ml/exemplos", headers=headers, timeout=30)
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert "exemplos_por_modelo" in data
    m = data["exemplos_por_modelo"]

    expected_types = [
        "classificador_suporte",
        "recomendador_servicos",
        "estimador_orcamento",
        "detector_anomalias",
        "clustering_clientes",
        "extrator_tags",
    ]
    for t in expected_types:
        assert t in m
        assert isinstance(m[t], list)
        # seed garante top 5
        assert len(m[t]) == 5
        for item in m[t]:
            assert "exemplo_idx" in item
            assert "input" in item
            assert "output" in item


@pytest.mark.order(2)
def test_admin_ml_exemplos_persiste():
    """Garante que os 5 exemplos retornam com exemplo_idx 1..5."""
    import os
    import requests

    api_base = _get_api_base()
    token = os.environ.get("SIP_ADMIN_TOKEN")
    if not token:
        pytest.skip("SIP_ADMIN_TOKEN não configurado")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    resp = requests.get(f"{api_base}/admin/ml/exemplos", headers=headers, timeout=30)
    assert resp.status_code == 200
    data = resp.json()

    m = data["exemplos_por_modelo"]
    for t in m.keys():
        idxs = sorted([x["exemplo_idx"] for x in m[t]])
        assert idxs == [1, 2, 3, 4, 5]

