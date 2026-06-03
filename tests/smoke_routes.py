import json
import time
import traceback
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:5000"


def http_request(method, path, token=None, payload=None, timeout=15):
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
            elapsed = (time.time() - start) * 1000
            status = resp.status
            try:
                parsed = json.loads(body) if body else None
            except Exception:
                parsed = body
            return {"ok": True, "status": status, "elapsed_ms": elapsed, "body": parsed}
    except urllib.error.HTTPError as e:
        elapsed = (time.time() - start) * 1000
        body = e.read().decode("utf-8", errors="replace") if hasattr(e, "read") else ""
        try:
            parsed = json.loads(body) if body else None
        except Exception:
            parsed = body
        return {
            "ok": False,
            "status": e.code,
            "elapsed_ms": elapsed,
            "body": parsed,
            "error": str(e),
        }
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        return {
            "ok": False,
            "status": None,
            "elapsed_ms": elapsed,
            "body": None,
            "error": f"{type(e).__name__}: {e}",
        }


def main():
    results = []

    # Health / public
    for method, path, token, payload in [
        ("GET", "/", None, None),
        ("GET", "/api/ml/status", None, None),
        ("GET", "/api/ml-executivo/status", None, None),
        (
            "POST",
            "/api/contato",
            None,
            {"email": "test@example.com", "mensagem": "Olá"},
        ),
    ]:
        r = http_request(method, path, token=token, payload=payload)
        results.append({"rota": f"{method} {path}", **r})

    # Login admin para testar rotas protegidas
    seed_login = http_request(
        "POST",
        "/api/auth/login",
        token=None,
        payload={"email": "admin_seed@example.com", "senha": "senha123"},
    )
    token_admin = None
    if seed_login.get("ok") and isinstance(seed_login.get("body"), dict):
        token_admin = seed_login["body"].get("access_token")

    protected = [
        ("GET", "/api/pedidos", token_admin),
        ("GET", "/api/usuarios", token_admin),
        ("GET", "/api/notificacoes", token_admin),
        ("GET", "/api/contato", token_admin),
    ]
    for method, path, token in protected:
        r = http_request(method, path, token=token, payload=None)
        results.append({"rota": f"{method} {path}", **r})

    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print("FALHA NO SMOKE-TEST")
        traceback.print_exc()
