# pyrefly: ignore [missing-import]
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_supabase(mocker):
    return mocker.patch("app.db.supabase_client.supabase")

@pytest.fixture
def mock_httpx(mocker):
    return mocker.patch("httpx.AsyncClient")
