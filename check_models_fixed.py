import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
    with open('models_list_final.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(models))
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {str(e)}")
