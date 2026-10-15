from concurrent.futures import ThreadPoolExecutor

from app.models.schemas import UserPreferencesUpdate
from app.services import user as user_module
from app.services.user import UserService


def test_concurrent_updates_of_different_fields_are_all_kept(monkeypatch):
    monkeypatch.setattr(user_module, "_user_prefs", user_module._default_preferences.model_copy())
    service = UserService()
    updates = [
        UserPreferencesUpdate(notifications_enabled=False),
        UserPreferencesUpdate(default_map_zoom=9),
        UserPreferencesUpdate(preferred_units="imperial"),
        UserPreferencesUpdate(favorite_areas=["MG Road"]),
    ] * 25

    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(service.update_preferences, updates))

    data, _ = service.get_preferences()
    assert data["notifications_enabled"] is False
    assert data["default_map_zoom"] == 9
    assert data["preferred_units"] == "imperial"
    assert data["favorite_areas"] == ["MG Road"]
