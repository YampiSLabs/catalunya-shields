import json
import os

from dokploy_api import query_trpc_post


def main():
    environment_id = os.environ.get("DOKPLOY_ENVIRONMENT_ID")
    if not environment_id:
        raise RuntimeError("DOKPLOY_ENVIRONMENT_ID is required")

    print(f"Creating application 'catalunya-shields' under environment {environment_id}...")
    app = query_trpc_post(
        "application.create",
        {
            "name": "catalunya-shields",
            "environmentId": environment_id,
            "description": "Automated Catalan municipal shields downloader/optimizer",
        },
    )
    print(json.dumps(app, indent=2))


if __name__ == "__main__":
    main()
