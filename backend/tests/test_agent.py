import pytest
from unittest.mock import patch, MagicMock
from agent import dispatch_tool

def test_dispatch_github_get_repo():
    with patch("agent.github_get_repo") as mock:
        mock.return_value = {"name": "test-repo"}
        result = dispatch_tool("github_get_repo", {"owner": "foo", "repo": "bar"})
        mock.assert_called_once_with(owner="foo", repo="bar")
        assert result == {"name": "test-repo"}

def test_dispatch_unknown_tool():
    result = dispatch_tool("nonexistent_tool", {})
    assert "error" in result
