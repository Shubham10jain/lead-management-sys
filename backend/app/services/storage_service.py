import uuid
from pathlib import Path

from app.config import settings

ALLOWED_CONTENT_TYPES = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}


class StorageService:
    """Local-disk file storage behind an interface that an S3 implementation can drop into."""

    def __init__(self, base_dir: str = settings.upload_dir) -> None:
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, content: bytes, content_type: str) -> str:
        extension = ALLOWED_CONTENT_TYPES[content_type]
        filename = f"{uuid.uuid4()}{extension}"
        path = self.base_dir / filename
        path.write_bytes(content)
        return str(path)

    def read(self, path: str) -> bytes:
        return Path(path).read_bytes()


storage_service = StorageService()
