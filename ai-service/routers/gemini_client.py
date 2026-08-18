#tried with gemini but didnt work; so changed it to openrouter.
#file name remains unchanged to avoid updating every import — renaming is cosmetic and can be done later.

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize the OpenRouter client (OpenAI-compatible)
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

MODEL = os.getenv("AI_MODEL", "google/gemma-4-31b-it:free")


def get_client():
    return client


def get_model():
    return MODEL