import os
import logging
import uuid
from pathlib import Path
from typing import Union, Optional, Tuple
import secrets

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
SAVE_DIR = "temp_files/"
try:
    import aiofiles
    import aiofiles.os
    AIOFILES_AVAILABLE = True
except ImportError:
    AIOFILES_AVAILABLE = False

async def handle_temporary_file_upload(content: bytes, filename:str, mode: str = 'wb') -> str:
    try:
        save_dir_path = Path(SAVE_DIR)
        save_dir_path.mkdir(parents=True, exist_ok=True)
        _, file_extension = os.path.splitext(filename) if filename else ("", ".dat")
        unique_filename = f"{secrets.token_urlsafe(16)}{file_extension}"
        file_path = save_dir_path / unique_filename
        if AIOFILES_AVAILABLE:
            async with aiofiles.open(file_path, mode='wb') as f:
                await f.write(content)
        else:
            
            with open(file_path, mode='wb') as f:
                 f.write(content)

        logger.info(f"File saved successfully at {file_path}")
        return unique_filename, str(file_path)
    except OSError as e:
        logger.error(f"OS error saving file '{filename}' as '{unique_filename}': {e}", exc_info=True)
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Cleaned up partially written file: {file_path}")
            except OSError as cleanup_e:
                logger.error(f"Error cleaning up file {file_path} after save error: {cleanup_e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error saving file '{filename}': {e}", exc_info=True)
        return None

def delete_temporary_file(file_name : str):
    file_path = SAVE_DIR+file_name
    try:
        os.remove(file_path)
        logger.info(f"Successfully deleted {file_path}")
        return {"result" : True, "message" : "Temp File successfully deleted."}
    except FileNotFoundError:
        logger.warning(f"File {file_path} not found during deletion")
        return {"result" : False, "message" : f"File {file_path} not found during deletion"}
    except Exception as e:
                logger.error(f"Error deleting file {file_path}: {e}")
                return {"result" : False, "message" : f"Error deleting file {file_path}: {e}"}
