from app.core.config import Settings


def test_cors_origins_drop_trailing_slash():
    s = Settings(CORS_ORIGINS="https://app.example.com/, http://localhost:3000")
    assert s.cors_origins_list == ["https://app.example.com", "http://localhost:3000"]


def test_app_env_is_normalised_so_production_disables_debug():
    s = Settings(APP_ENV=" Production ", DEBUG=True)
    assert s.APP_ENV == "production" and s.DEBUG is False
