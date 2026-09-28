import io
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

from app.api.deps import CurrentUser
from app.core.config import settings

router = APIRouter(prefix="/uploads", tags=["uploads"])

EXTENSIONS = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp", "GIF": "gif"}


class UploadOut(BaseModel):
    url: str


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile, user: CurrentUser) -> UploadOut:
    """Store an image on local disk and return its public URL.

    The URL is then used for gallery covers, artwork images or avatars.
    """
    data = await file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "Image is too large")
    try:
        with Image.open(io.BytesIO(data)) as image:
            image_format = image.format
            image.verify()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File is not a valid image") from None
    if image_format not in EXTENSIONS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Use a JPEG, PNG, WEBP or GIF image")

    settings.media_dir.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}.{EXTENSIONS[image_format]}"
    (settings.media_dir / name).write_bytes(data)
    return UploadOut(url=f"{settings.public_base_url}/media/{name}")
