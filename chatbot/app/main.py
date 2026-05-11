from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .auth import CurrentUser, get_current_user
from .config import settings
from .gemini_client import chat

app = FastAPI(title="Portal Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] | None = None


class ChatResponse(BaseModel):
    reply: str


@app.get("/health")
async def health():
    return {"status": "ok", "gemini_configured": bool(settings.gemini_api_key)}


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    req: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
):
    history = [m.model_dump() for m in (req.history or [])]
    reply = await chat(user, req.message, history)
    return ChatResponse(reply=reply)
