import pytest
from tools.github import parse_github_url

def test_parse_standard_url():
    owner, repo = parse_github_url("https://github.com/anthropics/anthropic-sdk-python")
    assert owner == "anthropics"
    assert repo == "anthropic-sdk-python"

def test_parse_trailing_slash():
    owner, repo = parse_github_url("https://github.com/anthropics/anthropic-sdk-python/")
    assert owner == "anthropics"
    assert repo == "anthropic-sdk-python"

def test_parse_invalid_url():
    with pytest.raises(ValueError):
        parse_github_url("https://gitlab.com/foo/bar")
