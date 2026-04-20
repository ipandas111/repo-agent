import os

def write_file(path: str, content: str) -> dict:
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return {"success": True, "path": path, "bytes_written": len(content.encode())}
