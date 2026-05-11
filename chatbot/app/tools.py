from .monolith import MonolithClient

FUNCTION_DECLARATIONS = [
    {
        "name": "get_my_grades",
        "description": "Lekérdezi a bejelentkezett HALLGATO összes jegyét.",
        "parameters": {"type": "OBJECT", "properties": {}},
    },
    {
        "name": "get_my_subjects",
        "description": "Visszaadja a bejelentkezett felhasználó tantárgyait (hallgatóknak amiket tanulnak, oktatóknak amiket tanítanak).",
        "parameters": {"type": "OBJECT", "properties": {}},
    },
    {
        "name": "get_my_teaching",
        "description": "OKTATO szerepkörhöz, a tanított órái, csoportjai.",
        "parameters": {"type": "OBJECT", "properties": {}},
    },
    {
        "name": "get_me",
        "description": "Saját diákprofil adatai, HALLGATO felhasználónak.",
        "parameters": {"type": "OBJECT", "properties": {}},
    },
    {
        "name": "get_courses",
        "description": "Az elérhető kurzusok listája.",
        "parameters": {"type": "OBJECT", "properties": {}},
    },
]


async def execute_tool(name: str, _args: dict, monolith: MonolithClient):
    try:
        if name == "get_my_grades":
            return await monolith.get_my_grades()
        if name == "get_my_subjects":
            return await monolith.get_my_subjects()
        if name == "get_my_teaching":
            return await monolith.get_my_teaching()
        if name == "get_me":
            return await monolith.get_me()
        if name == "get_courses":
            return await monolith.get_courses()
        return {"error": f"Unknown tool: {name}"}
    except Exception as e:
        return {"error": str(e)}
