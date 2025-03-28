import os
from helper import write_log
import uuid
from pathlib import Path
from typing import Union, Optional, Tuple
import secrets


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

        file_path = get_unique_file_path(save_dir_path , filename)
        if AIOFILES_AVAILABLE:
            async with aiofiles.open(file_path, mode='wb') as f:
                await f.write(content)
        else:
            
            with open(file_path, mode='wb') as f:
                 f.write(content)

        write_log(f"File saved successfully at {file_path}")
        return filename, str(file_path)
    except OSError as e:
        write_log(f"OS error saving file '{filename}' as '{file_path}': {e}", exc_info=True)
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
                write_log(f"Cleaned up partially written file: {file_path}")
            except OSError as cleanup_e:
                write_log(f"Error cleaning up file {file_path} after save error: {cleanup_e}")
        return None
    except Exception as e:
        write_log(f"Unexpected error saving file '{filename}': {e}", exc_info=True)
        return None

def delete_temporary_file(file_name : str):
    file_path = SAVE_DIR+file_name
    try:
        os.remove(file_path)
        write_log(f"Successfully deleted {file_path}")
        return {"result" : True, "message" : "Temp File successfully deleted."}
    except FileNotFoundError:
        write_log(f"File {file_path} not found during deletion")
        return {"result" : False, "message" : f"File {file_path} not found during deletion"}
    except Exception as e:
                write_log(f"Error deleting file {file_path}: {e}")
                return {"result" : False, "message" : f"Error deleting file {file_path}: {e}"}
    
def get_unique_file_path(save_dir_path, filename):
    """
    Ensure the file path is unique by appending a number (1), (2), etc., if the file already exists.
    """
    save_dir_path = Path(save_dir_path)
    file_path = save_dir_path / filename

    if not file_path.exists():
        return file_path

    name, ext = os.path.splitext(filename)
    counter = 1

    while file_path.exists():
        new_filename = f"{name}({counter}){ext}"
        file_path = save_dir_path / new_filename
        counter += 1

    return file_path

def get_file_size_in_kb(file_path):
    return os.path.getsize(file_path) / 1024.0