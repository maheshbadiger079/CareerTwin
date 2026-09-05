import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_MODEL = 'gemini-2.5-flash'

def get_gemini_client(custom_api_key=None):
    api_key = custom_api_key or os.getenv('GEMINI_API_KEY')
    if not api_key or api_key in ['MY_GEMINI_API_KEY', 'your-gemini-api-key-here', '']:
        return None
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        return client
    except Exception as e:
        print(f'Warning: Could not initialize Gemini client: {e}')
        return None
