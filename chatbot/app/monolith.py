import httpx

from .config import settings


class MonolithClient:
    def __init__(self, jwt_token: str):
        self.client = httpx.AsyncClient(
            base_url=settings.monolith_base_url,
            headers={"Authorization": f"Bearer {jwt_token}"},
            timeout=10.0,
        )

    async def aclose(self) -> None:
        await self.client.aclose()

    async def _get(self, path: str, params: dict | None = None):
        r = await self.client.get(path, params=params or {})
        r.raise_for_status()
        return r.json()

    async def get_my_grades(self):
        return await self._get("/api/grades/me")

    async def get_my_subjects(self):
        return await self._get("/api/assignments/my-subjects")

    async def get_my_teaching(self):
        return await self._get("/api/assignments/my-teaching")

    async def get_me(self):
        return await self._get("/api/students/me")

    async def get_courses(self):
        return await self._get("/api/courses")
