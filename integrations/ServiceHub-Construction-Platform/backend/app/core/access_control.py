"""
Project-level access control — IDOR (Insecure Direct Object Reference) prevention.

assert_project_access() raises ForbiddenError if the authenticated user is not
authorized to access the given project.

Access rules:
    ADMIN           → unrestricted (can access all projects)
    PROJECT_MANAGER → only projects where they are the manager (manager_id == user.id)
    SITE_SUPERVISOR → only projects where they are the manager
    COST_MANAGER    → only projects where they are the manager
    IT_OPERATOR     → only projects where they are the manager
    VIEWER          → only projects where they are the manager (read-only enforced
                      by caller via require_roles)

Design note: a full project-membership table would allow finer-grained control,
but the current schema uses manager_id as the single ownership signal.  Any role
below ADMIN is subject to the same ownership check.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.rbac import UserRole
from app.models.user import User
from app.repositories.project import ProjectRepository


async def assert_project_access(
    current_user: User,
    project_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    """Assert that *current_user* is authorized to access *project_id*.

    ADMIN bypasses all project-level checks.  All other roles must be the
    designated manager of the project (Project.manager_id == current_user.id).

    Args:
        current_user: The authenticated user making the request.
        project_id:   The project whose data is being accessed.
        db:           Active async DB session.

    Raises:
        NotFoundError:  The project does not exist (deleted or invalid UUID).
        ForbiddenError: The user does not have permission to access this project.
    """
    user_role = UserRole(current_user.role)

    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if project is None:
        raise NotFoundError("プロジェクトが見つかりません")

    # ADMIN bypasses ownership check but not existence check
    if user_role == UserRole.ADMIN:
        return

    if project.manager_id != current_user.id:
        raise ForbiddenError("このプロジェクトへのアクセス権限がありません")
