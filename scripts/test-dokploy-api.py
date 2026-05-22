import json

from dokploy_api import query_trpc_get


def main():
    print("Listing projects from Dokploy...")
    projects = query_trpc_get("project.all")
    print(json.dumps(projects, indent=2))


if __name__ == "__main__":
    main()
