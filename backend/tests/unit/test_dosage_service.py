from unittest.mock import MagicMock
from app.services.dosage_service import apply_dosage_clamp
from app.core.constants import DEFAULT_SAFE_DOSAGE_LIMIT

class MockResponse:
    def __init__(self, data):
        self.data = data

def test_quantity_under_limit_passes_through(mock_supabase):
    mock_supabase.table().select().eq().eq().execute.return_value = MockResponse([])
    
    clamped, timing, exp = apply_dosage_clamp(1, 1, 30.0)
    assert clamped == 30.0
    assert timing is None
    assert exp is None

def test_quantity_over_limit_is_clamped(mock_supabase):
    mock_supabase.table().select().eq().eq().execute.return_value = MockResponse([])
    
    clamped, timing, exp = apply_dosage_clamp(1, 1, 100.0)
    assert clamped == DEFAULT_SAFE_DOSAGE_LIMIT
    assert timing is None # No cumulative limit exceeded, just raw clamping

def test_cumulative_season_usage_triggers_override(mock_supabase):
    mock_supabase.table().select().eq().eq().execute.return_value = MockResponse([{"rec_quantity": 40.0}])
    
    clamped, timing, exp = apply_dosage_clamp(1, 1, 20.0)
    assert clamped == 10.0 # 50 - 40 = 10 allowance
    assert "Apply remaining safe allowance" in timing
    
def test_cumulative_season_usage_zero_allowance(mock_supabase):
    mock_supabase.table().select().eq().eq().execute.return_value = MockResponse([{"rec_quantity": 50.0}])
    
    clamped, timing, exp = apply_dosage_clamp(1, 1, 10.0)
    assert clamped == 0.0
    assert "Avoid further application" in timing
