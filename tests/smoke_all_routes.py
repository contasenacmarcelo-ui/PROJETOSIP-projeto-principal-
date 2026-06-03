import json
import time
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:5000"


def http_request(method, path, token=None, payload=None, timeout=25):
    url = BASE + path
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url=url, data=data, headers=headers, method=method)
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            elapsed_ms = (time.time() - start) * 1000
            try:
                parsed = json.loads(body) if body else None
            except Exception:
                parsed = body
            return {
                "ok": True,
                "status": resp.status,
                "elapsed_ms": elapsed_ms,
                "body": parsed,
            }
    except urllib.error.HTTPError as e:
        elapsed_ms = (time.time() - start) * 1000
        body = e.read().decode("utf-8", errors="replace") if hasattr(e, "read") else ""
        try:
            parsed = json.loads(body) if body else None
        except Exception:
            parsed = body
        return {
            "ok": False,
            "status": e.code,
            "elapsed_ms": elapsed_ms,
            "body": parsed,
            "error": str(e),
        }
    except Exception as e:
        elapsed_ms = (time.time() - start) * 1000
        return {
            "ok": False,
            "status": None,
            "elapsed_ms": elapsed_ms,
            "body": None,
            "error": f"{type(e).__name__}: {e}",
        }


def login(email, senha):
    r = http_request(
        "POST", "/api/auth/login", payload={"email": email, "senha": senha}
    )
    if r.get("ok") and isinstance(r.get("body"), dict):
        return r["body"].get("access_token"), r["body"]
    return None, r


def get_ids_from_list(endpoint, token):
    r = http_request("GET", endpoint, token=token)
    if not r.get("ok"):
        return [], r
    body = r.get("body")
    if isinstance(body, list):
        return body, r
    if isinstance(body, dict):
        # admin endpoints sometimes return {pedidos:[...]}
        for k in ["pedidos", "clientes", "mensagens", "conversas", "orcamentos"]:
            if k in body and isinstance(body[k], list):
                return body[k], r
    return [], r


def main():
    results = []

    # Seed e tokens
    seed = http_request("GET", "/api/admin/seed")
    results.append({"rota": "GET /api/admin/seed", **seed})

    token_admin, login_admin = login("admin_seed@example.com", "senha123")
    results.append({"rota": "POST /api/auth/login (admin)", **login_admin})

    token_user1, login_user1 = login("cliente1_seed@example.com", "senha123")
    results.append({"rota": "POST /api/auth/login (user1)", **login_user1})

    # Health + status
    for method, path in [
        ("GET", "/"),
        ("GET", "/api/ml/status"),
        ("GET", "/api/ml-executivo/status"),
    ]:
        r = http_request(method, path)
        results.append({"rota": f"{method} {path}", **r})

    # Contato (public)
    r = http_request(
        "POST", "/api/contato", payload={"email": "qa@example.com", "mensagem": "msg"}
    )
    results.append({"rota": "POST /api/contato", **r})

    # ML endpoints (valid payload)
    r = http_request(
        "POST",
        "/api/ml/classificador-suporte",
        token=token_user1,
        payload={"descricao": "O sistema travou ao clicar no botão."},
    )
    results.append({"rota": "POST /api/ml/classificador-suporte", **r})

    r = http_request(
        "POST",
        "/api/ml/estimador-orcamento",
        token=token_user1,
        payload={"tipo_servico": "website", "parametros": {"n_paginas": 5}},
    )
    results.append({"rota": "POST /api/ml/estimador-orcamento", **r})

    r = http_request(
        "POST",
        "/api/ml/extrator-tags",
        token=token_user1,
        payload={"descricao": "Preciso de uma app em React com login e dashboard"},
    )
    results.append({"rota": "POST /api/ml/extrator-tags", **r})

    # ML batch admin
    r = http_request("POST", "/api/admin/ml/sync", token=token_admin, payload={})
    results.append({"rota": "POST /api/admin/ml/sync", **r})

    r = http_request("GET", "/api/admin/ml/preview", token=token_admin)
    results.append({"rota": "GET /api/admin/ml/preview", **r})

    # ML dashboard
    r = http_request("GET", "/api/ml-executivo/dados", token=token_admin)
    results.append({"rota": "GET /api/ml-executivo/dados", **r})

    r = http_request(
        "POST",
        "/api/ml-executivo/processar",
        token=token_admin,
        payload={"chamados": [], "pedidos": []},
    )
    results.append({"rota": "POST /api/ml-executivo/processar", **r})

    # Usuarios (admin)
    r = http_request("GET", "/api/usuarios", token=token_admin)
    results.append({"rota": "GET /api/usuarios", **r})

    # Pedidos (admin)
    r = http_request("GET", "/api/pedidos", token=token_admin)
    results.append({"rota": "GET /api/pedidos", **r})

    # Pedidos (user): GET + POST + PUT (usa IDs se houver)
    pedidos_list, r_pedidos_user = get_ids_from_list("/api/pedidos", token_user1)
    results.append({"rota": "GET /api/pedidos (user1)", **r_pedidos_user})

    # POST pedido
    post_pedido = http_request(
        "POST",
        "/api/pedidos",
        token=token_user1,
        payload={
            "tipo_servico": "website",
            "descricao": "Pedido QA",
            "parametros": {"n_paginas": 3},
        },
    )
    results.append({"rota": "POST /api/pedidos (user1)", **post_pedido})

    # Orçamentos (user): GET + POST + aprovar (se houver orcamento)
    orc_list_r = http_request("GET", "/api/orcamentos", token=token_user1)
    results.append({"rota": "GET /api/orcamentos (user1)", **orc_list_r})

    post_orc = http_request(
        "POST",
        "/api/orcamentos",
        token=token_user1,
        payload={
            "tipo": "website",
            "parametros": {"n_paginas": 2},
            "valor_estimado": 999.0,
        },
    )
    results.append({"rota": "POST /api/orcamentos (user1)", **post_orc})

    # Se conseguiu criar orçamento, tenta aprovar
    orc_id = None
    if post_orc.get("ok") and isinstance(post_orc.get("body"), dict):
        orc_obj = post_orc["body"].get("orcamento") or {}
        orc_id = orc_obj.get("id")

    if orc_id:
        aprovar = http_request(
            "POST", f"/api/orcamentos/{orc_id}/aprovar", token=token_user1, payload={}
        )
        results.append({"rota": f"POST /api/orcamentos/{orc_id}/aprovar", **aprovar})

    # Suporte (user): GET/POST/classificar
    sup_list = http_request("GET", "/api/chamados", token=token_user1)
    results.append({"rota": "GET /api/chamados (user1)", **sup_list})

    post_chamado = http_request(
        "POST",
        "/api/chamados",
        token=token_user1,
        payload={"titulo": "QA chamado", "descricao": "Preciso de ajuda no login"},
    )
    results.append({"rota": "POST /api/chamados (user1)", **post_chamado})

    chamado_id = None
    if post_chamado.get("ok") and isinstance(post_chamado.get("body"), dict):
        chamado_obj = post_chamado["body"].get("chamado") or {}
        chamado_id = chamado_obj.get("id")

    if chamado_id:
        classif = http_request(
            "PUT",
            f"/api/chamados/{chamado_id}/classificar",
            token=token_user1,
            payload={"categoria": "duvida", "prioridade": "media"},
        )
        results.append(
            {"rota": f"PUT /api/chamados/{chamado_id}/classificar", **classif}
        )

        put_sup = http_request(
            "PUT",
            f"/api/chamados/{chamado_id}",
            token=token_user1,
            payload={"status": "em_andamento"},
        )
        results.append({"rota": f"PUT /api/chamados/{chamado_id}", **put_sup})

    # Notificações (admin): GET + PUT + DELETE (se houver)
    noti_list = http_request("GET", "/api/notificacoes", token=token_admin)
    results.append({"rota": "GET /api/notificacoes", **noti_list})

    notif_id = None
    if (
        noti_list.get("ok")
        and isinstance(noti_list.get("body"), list)
        and noti_list["body"]
    ):
        notif_id = noti_list["body"][0].get("id")

    if notif_id:
        lido = http_request(
            "PUT", f"/api/notificacoes/{notif_id}/lido", token=token_admin, payload={}
        )
        results.append({"rota": f"PUT /api/notificacoes/{notif_id}/lido", **lido})

        dele = http_request(
            "DELETE", f"/api/notificacoes/{notif_id}", token=token_admin, payload={}
        )
        results.append({"rota": f"DELETE /api/notificacoes/{notif_id}", **dele})

    # Chat admin: /chat/conversas + (mensagens depende de chamado; só valida listagem)
    chat_conv = http_request("GET", "/chat/conversas", token=token_admin)
    results.append({"rota": "GET /chat/conversas (admin)", **chat_conv})

    # Admin endpoints
    dash = http_request("GET", "/api/admin/dashboard", token=token_admin)
    results.append({"rota": "GET /api/admin/dashboard", **dash})

    clientes = http_request("GET", "/api/admin/clientes", token=token_admin)
    results.append({"rota": "GET /api/admin/clientes", **clientes})

    # ML exemplos
    ml_ex = http_request("GET", "/api/admin/ml/exemplos", token=token_admin)
    results.append({"rota": "GET /api/admin/ml/exemplos", **ml_ex})

    # Relatorio
    rel = http_request("GET", "/api/admin/relatorio/ml", token=token_admin)
    results.append({"rota": "GET /api/admin/relatorio/ml", **rel})

    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
