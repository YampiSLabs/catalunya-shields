import json

from dokploy_api import query_trpc_get


def main():
    print("GitHub providers:")
    providers = query_trpc_get("github.all")
    print(json.dumps(providers, indent=2))


if __name__ == "__main__":
    main()
