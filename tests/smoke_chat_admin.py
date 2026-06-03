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
            parsed = json.loads(body) if body else body
        except Exception:
            parsed = body
        return {
            "ok": False,
            "status": e.code,
            "elapsed_ms": elapsed_ms,
            "body": parsed,
            "error": str(e),
        }


def main():
    # Seed
    seed = http_json("GET", "/api/admin/seed")

    # Login admin
    login = http_json(
        "POST",
        "/api/auth/login",
        payload={"email": "admin_seed@example.com", "senha": "senha123"},
    )
    token = None
    if login.get("ok") and isinstance(login.get("body"), dict):
        token = login["body"].get("access_token")

    results = [{"seed": seed, "login": login}]

    # List chat conversations
    conv = http_json("GET", "/chat/conversas", token=token)
    results.append({"GET /chat/conversas": conv})

    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
