from unittest.mock import MagicMock
from app.services.soil_service import resolve_soil_data

class MockResponse:
    def __init__(self, data):
        self.data = data

def test_village_data_used_when_no_override(mock_supabase):
    mock_supabase.table().select().eq().execute.side_effect = [
        MockResponse([{"n": 10.0, "p": 12.0, "k": 14.0, "ph": 6.5, "latitude": 19.0, "longitude": 73.0}]), # villages
        MockResponse([{"default_n": 5.0, "default_p": 5.0, "default_k": 5.0, "default_ph": 7.0}]) # districts
    ]
    
    result = resolve_soil_data(1, 1)
    assert result["n"] == 10.0
    assert result["p"] == 12.0
    assert result["k"] == 14.0
    assert result["ph"] == 6.5
    assert result["latitude"] == 19.0

def test_manual_override_replaces_single_field(mock_supabase):
    mock_supabase.table().select().eq().execute.side_effect = [
        MockResponse([{"n": 10.0, "p": 12.0, "k": 14.0, "ph": 6.5, "latitude": 19.0, "longitude": 73.0}]),
        MockResponse([{"default_n": 5.0, "default_p": 5.0, "default_k": 5.0, "default_ph": 7.0}])
    ]
    
    result = resolve_soil_data(1, 1, manual_ph=7.5)
    assert result["n"] == 10.0
    assert result["ph"] == 7.5

def test_manual_override_replaces_all_fields(mock_supabase):
    mock_supabase.table().select().eq().execute.side_effect = [
        MockResponse([{"n": 10.0, "p": 12.0, "k": 14.0, "ph": 6.5, "latitude": 19.0, "longitude": 73.0}]),
        MockResponse([{"default_n": 5.0, "default_p": 5.0, "default_k": 5.0, "default_ph": 7.0}])
    ]
    
    result = resolve_soil_data(1, 1, manual_n=20.0, manual_p=22.0, manual_k=24.0, manual_ph=7.5)
    assert result["n"] == 20.0
    assert result["p"] == 22.0
    assert result["k"] == 24.0
    assert result["ph"] == 7.5

def test_null_village_value_falls_back_to_district_default(mock_supabase):
    # Village missing 'n'
    mock_supabase.table().select().eq().execute.side_effect = [
        MockResponse([{"n": None, "p": 12.0, "k": 14.0, "ph": 6.5, "latitude": 19.0, "longitude": 73.0}]),
        MockResponse([{"default_n": 5.0, "default_p": 5.0, "default_k": 5.0, "default_ph": 7.0}])
    ]
    
    result = resolve_soil_data(1, 1)
    assert result["n"] == 5.0 # fallback
    assert result["p"] == 12.0
