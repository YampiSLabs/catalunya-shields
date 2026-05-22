import json
import os
import ssl
import urllib.error
import urllib.parse
import urllib.request


def _required_env(name):
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def _api_url():
    return _required_env("DOKPLOY_URL").rstrip("/")


def _api_key():
    return _required_env("DOKPLOY_API_KEY")


def _ssl_context():
    if os.environ.get("DOKPLOY_INSECURE_SSL") != "1":
        return None

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def query_trpc_get(procedure, input_data=None):
    encoded_input = urllib.parse.quote(json.dumps({"json": input_data or {}}))
    url = f"{_api_url()}/trpc/{procedure}?input={encoded_input}"
    req = urllib.request.Request(url, headers={"x-api-key": _api_key()})

    try:
        with urllib.request.urlopen(req, context=_ssl_context(), timeout=10) as resp:
            data = json.loads(resp.read())
            return data.get("result", {}).get("data", {}).get("json", {})
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        return {"error": e.code, "body": body}
    except Exception as e:
        return {"error": str(e)}


def query_trpc_post(procedure, body_data):
    url = f"{_api_url()}/trpc/{procedure}"
    req = urllib.request.Request(
        url,
        data=json.dumps({"json": body_data}).encode("utf-8"),
        headers={
            "x-api-key": _api_key(),
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, context=_ssl_context(), timeout=10) as resp:
            data = json.loads(resp.read())
            return data.get("result", {}).get("data", {}).get("json", {})
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        return {"error": e.code, "body": body}
    except Exception as e:
        return {"error": str(e)}
