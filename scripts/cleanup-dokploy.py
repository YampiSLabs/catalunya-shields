import json
import os

from dokploy_api import query_trpc_post


def main():
    app_id = os.environ.get("DOKPLOY_APPLICATION_ID")
    project_id = os.environ.get("DOKPLOY_PROJECT_ID")

    if not app_id and not project_id:
        raise RuntimeError("Set DOKPLOY_APPLICATION_ID and/or DOKPLOY_PROJECT_ID to clean up")

    print("Cleaning up explicit Dokploy resources from environment variables...")

    if app_id:
        print(f"Deleting application {app_id}...")
        app_del = query_trpc_post("application.delete", {"applicationId": app_id})
        print("Application delete result:", json.dumps(app_del, indent=2))

    if project_id:
        print(f"Deleting project {project_id}...")
        proj_del = query_trpc_post("project.remove", {"projectId": project_id})
        print("Project remove result:", json.dumps(proj_del, indent=2))


if __name__ == "__main__":
    main()
