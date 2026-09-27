from supabase import create_client, Client
from app.core.config import settings

# Global client (can be polluted by auth sessions)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_JWT_SECRET)

def get_admin_client() -> Client:
    """Returns a fresh client that bypasses RLS and ignores active auth sessions."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_JWT_SECRET)