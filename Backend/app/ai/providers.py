"""
Adapters for the AI APIs the career advisor can use. Each adapter takes the
same inputs (api key, model, system prompt, user message, timeout) and
returns the model's raw text; parsing and validation happen in the service.

Adding another provider means adding one function here and one entry in
PROVIDERS, plus its key/model settings in config.py.
"""
import requests

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def _post(url, headers, payload, timeout):
    response = requests.post(url, headers=headers, json=payload, timeout=timeout)
    response.raise_for_status()
    return response.json()


def call_anthropic(api_key, model, system, user, timeout):
    data = _post(
        ANTHROPIC_URL,
        {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        {
            "model": model,
            "max_tokens": 1024,
            "temperature": 0.4,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        },
        timeout,
    )
    return "".join(
        block.get("text", "") for block in data.get("content", []) if block.get("type") == "text"
    )


def _call_openai_compatible(url, api_key, model, system, user, timeout):
    data = _post(
        url,
        {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        {
            "model": model,
            "temperature": 0.4,
            "max_tokens": 1024,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
        timeout,
    )
    return data["choices"][0]["message"]["content"]


def call_openai(api_key, model, system, user, timeout):
    return _call_openai_compatible(OPENAI_URL, api_key, model, system, user, timeout)


def call_groq(api_key, model, system, user, timeout):
    # Groq exposes an OpenAI-compatible endpoint, so the same adapter works.
    return _call_openai_compatible(GROQ_URL, api_key, model, system, user, timeout)


def call_gemini(api_key, model, system, user, timeout):
    data = _post(
        GEMINI_URL.format(model=model),
        {"x-goog-api-key": api_key, "Content-Type": "application/json"},
        {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 1024,
                "responseMimeType": "application/json",
            },
        },
        timeout,
    )
    parts = data["candidates"][0]["content"]["parts"]
    return "".join(part.get("text", "") for part in parts)


# name -> label shown in the UI, the config keys holding its API key/model,
# and the adapter function.
PROVIDERS = {
    "anthropic": {
        "label": "Claude (Anthropic)",
        "key_setting": "ANTHROPIC_API_KEY",
        "model_setting": "ANTHROPIC_MODEL",
        "call": call_anthropic,
    },
    "openai": {
        "label": "ChatGPT (OpenAI)",
        "key_setting": "OPENAI_API_KEY",
        "model_setting": "OPENAI_MODEL",
        "call": call_openai,
    },
    "gemini": {
        "label": "Gemini (Google)",
        "key_setting": "GEMINI_API_KEY",
        "model_setting": "GEMINI_MODEL",
        "call": call_gemini,
    },
    "groq": {
        "label": "Llama (Groq)",
        "key_setting": "GROQ_API_KEY",
        "model_setting": "GROQ_MODEL",
        "call": call_groq,
    },
}
