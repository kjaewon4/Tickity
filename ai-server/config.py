import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

REGISTERED_FACE_DIR = os.path.join(os.getcwd(), "data", "registered_faces")
THRESHOLD = 0.7

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
