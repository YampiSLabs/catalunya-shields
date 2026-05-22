import json

from dokploy_api import query_trpc_post


def main():
    print("Creating project 'catalunya-shields'...")
    project = query_trpc_post(
        "project.create",
        {
            "name": "catalunya-shields",
            "description": "Automated Catalan municipal shields repository updater",
        },
    )
    print(json.dumps(project, indent=2))


if __name__ == "__main__":
    main()
