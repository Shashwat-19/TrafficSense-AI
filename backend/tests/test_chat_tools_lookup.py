import pytest

from app.services.chatbot_tools import LANDMARKS, _resolve_location


@pytest.mark.parametrize("name", ["road", "nagar", "layout", "ab", ""])
def test_ambiguous_or_short_fragments_are_not_resolved(name):
    assert _resolve_location(name) is None


@pytest.mark.parametrize(
    "name, key",
    [
        ("MG Road", "mg road"),
        ("  Koramangala ", "koramangala"),
        ("MG Road, Bangalore", "mg road"),  # specific landmark beats the city
        ("ring road", "outer ring road"),  # fragment fitting exactly one landmark
        ("ORR", "orr"),
    ],
)
def test_clear_names_resolve(name, key):
    assert _resolve_location(name) == LANDMARKS[key]


def test_landmark_inside_a_longer_word_does_not_match():
    assert _resolve_location("corridor") is None
