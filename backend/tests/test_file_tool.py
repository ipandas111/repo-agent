import os
import tempfile
from tools.file import write_file

def test_write_file_creates_file():
    with tempfile.TemporaryDirectory() as tmpdir:
        path = os.path.join(tmpdir, "output.md")
        result = write_file(path, "# Hello")
        assert result["success"] is True
        assert os.path.exists(path)
        with open(path) as f:
            assert f.read() == "# Hello"
