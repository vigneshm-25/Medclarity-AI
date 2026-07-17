from typing import Optional
from openai import OpenAI
from app.config import settings

# Shared reusable OpenAI client
_client: Optional[OpenAI] = None

def get_openai_client(api_key: Optional[str] = None) -> OpenAI:
    """
    Returns a shared OpenAI client instance.
    If api_key is provided, it uses it (e.g. for overriding), otherwise uses settings.OPENAI_API_KEY.
    """
    global _client
    # If a specific key is requested that differs from the shared client, instantiate a new one
    if api_key and _client and _client.api_key != api_key:
        return OpenAI(api_key=api_key)
        
    if _client is None:
        _client = OpenAI(api_key=api_key or settings.OPENAI_API_KEY)
        
    return _client
