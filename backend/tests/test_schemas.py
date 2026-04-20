from tools.schemas import TOOLS, TOOL_NAMES

def test_all_tools_have_required_fields():
    for tool in TOOLS:
        assert "name" in tool
        assert "description" in tool
        assert "input_schema" in tool

def test_tool_names_match():
    assert set(TOOL_NAMES) == {t["name"] for t in TOOLS}

def test_expected_tools_present():
    names = {t["name"] for t in TOOLS}
    for expected in ["github_get_repo", "github_list_tree", "github_read_file",
                     "github_search_code", "github_list_issues", "github_list_prs",
                     "github_get_languages", "github_get_commits", "write_file"]:
        assert expected in names
