from fastapi import APIRouter, HTTPException
from app.repository import code_chat, code_format, code_suggest,get_pylint_score
from app.models.code_format_model import code_chat_schema, code_format_schema 


app = APIRouter(prefix="/beautycode/v1")
gemini_api_key = 'AIzaSyBdX9J0Lb3m7z6Hry9wtXGHc4wu5bHAQrE'

url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBdX9J0Lb3m7z6Hry9wtXGHc4wu5bHAQrE"

@app.post("/code-format")
async def code_format_route(request: code_format_schema ):
    return code_format(request)

@app.post("/code-suggest")
async def code_suggest_route(request: code_format_schema ):
    return code_suggest(request)

@app.post("/chat-ai")
async def code_chat_route(request:code_chat_schema):
    return code_chat(request)

@app.post("/analyze-code")
async def analyze_code_route(request:code_chat_schema):
    return get_pylint_score(request)