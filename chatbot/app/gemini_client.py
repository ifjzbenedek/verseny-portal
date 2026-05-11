from google import genai
from google.genai import types

from .auth import CurrentUser
from .config import settings
from .monolith import MonolithClient
from .tools import FUNCTION_DECLARATIONS, execute_tool


def _system_prompt(user: CurrentUser) -> str:
    return (
        "Te egy iskolai asszisztens chatbot vagy egy oktatási portálon. "
        f"A jelenlegi felhasználó: {user.email} ({user.role}). "
        "Segíts udvariasan, magyarul. Ha a felhasználó a saját adataira kérdez "
        "(jegyek, tárgyak, kurzusok), hívd meg a megfelelő függvényt. "
        "Ha valamire nem tudsz válaszolni, mondd ki őszintén."
    )


def _history_to_contents(history: list[dict]) -> list[types.Content]:
    contents: list[types.Content] = []
    for m in history or []:
        role = m.get("role")
        content = m.get("content")
        if not isinstance(content, str):
            continue
        if role == "user":
            contents.append(types.Content(role="user", parts=[types.Part(text=content)]))
        elif role == "assistant":
            contents.append(types.Content(role="model", parts=[types.Part(text=content)]))
    return contents


async def chat(user: CurrentUser, message: str, history: list[dict] | None) -> str:
    if not settings.gemini_api_key:
        return f"[echo, GEMINI_API_KEY nincs beállítva] {message}"

    client = genai.Client(api_key=settings.gemini_api_key)
    monolith = MonolithClient(user.token)

    contents = _history_to_contents(history or [])
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    config = types.GenerateContentConfig(
        system_instruction=_system_prompt(user),
        tools=[types.Tool(function_declarations=FUNCTION_DECLARATIONS)],
    )

    try:
        for _ in range(5):
            resp = await client.aio.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
                config=config,
            )
            candidate = resp.candidates[0] if resp.candidates else None
            if not candidate or not candidate.content or not candidate.content.parts:
                return "(üres válasz)"

            function_calls = [p.function_call for p in candidate.content.parts if p.function_call]

            if function_calls:
                contents.append(candidate.content)
                tool_response_parts = []
                for fc in function_calls:
                    result = await execute_tool(fc.name, dict(fc.args or {}), monolith)
                    tool_response_parts.append(
                        types.Part.from_function_response(
                            name=fc.name,
                            response={"result": result},
                        )
                    )
                contents.append(types.Content(role="user", parts=tool_response_parts))
                continue

            texts = [p.text for p in candidate.content.parts if p.text]
            return "\n".join(texts) if texts else "(üres válasz)"

        return "(tool loop limit elérve)"
    finally:
        await monolith.aclose()
