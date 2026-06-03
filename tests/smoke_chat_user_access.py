import json
import time
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:5000"


def http_json(method, path, token=None, payload=None, timeout=20):
    url = BASE + path
    headers = {"Accept": "application/json"}
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
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


def login(email, senha):
    r = http_json(
        "POST", "/api/auth/login", token=None, payload={"email": email, "senha": senha}
    )
    if r.get("ok") and isinstance(r.get("body"), dict):
        return r["body"].get("access_token")
    return None


def main():
    # seed
    http_json("GET", "/api/admin/seed")

    token_admin = login("admin_seed@example.com", "senha123")
    token_user1 = login("cliente1_seed@example.com", "senha123")
    token_user2 = login("cliente2_seed@example.com", "senha123")

    # obter um chamado existente (pelo cliente 1)
    chamados_u1 = http_json("GET", "/api/chamados", token=token_user1)

    print("admin", token_admin is not None)
    print("user1", token_user1 is not None)
    print("user2", token_user2 is not None)
    print("chamados_u1", chamados_u1)

    chamado_id = None
    if (
        chamados_u1.get("ok")
        and isinstance(chamados_u1.get("body"), list)
        and chamados_u1["body"]
    ):
        chamado_id = chamados_u1["body"][0].get("id")

    # deve permitir acesso do user1 e negar do user2
    if chamado_id:
        r1 = http_json("GET", f"/chat/{chamado_id}/mensagens", token=token_user1)
        r2 = http_json("GET", f"/chat/{chamado_id}/mensagens", token=token_user2)
        print("user1 access", r1)
        print("user2 access", r2)


if __name__ == "__main__":
    main()
