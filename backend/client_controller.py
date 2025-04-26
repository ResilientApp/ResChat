import asyncio
from aiohttp import web
from aiohttp_cors import setup as cors_setup, ResourceOptions
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import client
from friend_list import *
import file_service

PROFILE_PIC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'profile_pictures')
os.makedirs(PROFILE_PIC_FOLDER, exist_ok=True)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def run_sync(func, *args, **kwargs):
    if asyncio.iscoroutinefunction(func):
        return asyncio.ensure_future(func(*args, **kwargs))
    return asyncio.get_event_loop().run_in_executor(None, lambda: func(*args, **kwargs))

async def welcome_handler(request):
    return web.Response(text="Welcome to ResChat!", content_type='text/html')

async def login_handler(request):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    result = await run_sync(client.login, username, password)
    return web.json_response(result)


async def signup_handler(request):
    try:
       
        username,password, avatar_location = await handle_signup_multipart(request)
        result = await run_sync(client.signup, username, password, avatar_location)
        return web.json_response(result)
        
    except Exception as e:
        return web.json_response({
            "result": False,
            "message": str(e)
        })

async def select_friend_handler(request):
    data = await request.json()
    target_username = data.get("target_username")
    result = await run_sync(client.select_friend, target_username)
    return web.json_response(result if result is not None else {"result": True, "message": "Friend selected"})

async def change_nickname_handler(request):
    data = await request.json()
    target_username = data.get("target_username")
    new_nickname = data.get("new_nickname")
    result = await run_sync(client.encapsulated_change_nickname, target_username, new_nickname)
    return web.json_response(result)

async def delete_friend_handler(request):
    data = await request.json()
    target_username = data.get("target_username")
    result = await run_sync(client.encapsulated_delete_friend, target_username)
    return web.json_response(result)

async def add_friend_handler(request):
    data = await request.json()
    target_username = data.get("target_username")
    nickname = data.get("nickname")
    result = await run_sync(client.encapsulated_add_friend, target_username, nickname)
    return web.json_response(result)

async def send_text_handler(request):
    data = await request.json()
    plain_text = data.get("plain_text")
    result = await run_sync(client.send_text_message, plain_text)
    return web.json_response(result)

async def send_file_handler(request):
    data = await request.json()
    file_path = data.get("file_path")
    result = await run_sync(client.send_file, file_path)
    return web.json_response(result)

async def update_chat_history_handler(request):
    chat_history = await run_sync(client.update_chat_history)
    return web.json_response({"result": True, "message": "Chat history updated", "chat_history": chat_history})

async def initial_load_handler(request):
    chat_history = await run_sync(client.initial_load_chat_history)
    return web.json_response({"result": True, "message": "Initial chat history loaded", "chat_history": chat_history})

async def load_previous_handler(request):
    result = await run_sync(client.load_previous_chat_history)
    return web.json_response(result)

async def load_specific_page_handler(request):
    # Get the page number from query parameters
    try:
        page_number = int(request.query.get('page_number', 0))
        if page_number <= 0:
            return web.json_response({
                "result": False, 
                "message": f"Invalid page number: {page_number}", 
                "chat_history": {}
            })
    except ValueError:
        return web.json_response({
            "result": False, 
            "message": "Invalid page number format, must be an integer", 
            "chat_history": {}
        })
        
    # Call the client function to load the specific page
    result = await run_sync(client.load_specific_page, page_number)
    return web.json_response(result)

async def download_file_handler(request):
    data = await request.json()
    save_path = data.get("save_path")
    file_info = data.get("file_info")
    result = await run_sync(client.download_and_decrypt_file, save_path, file_info)
    return web.json_response(result)

async def handle_signup_multipart(request):
            reader = await request.multipart()
            
            field = await reader.next()
            username = await field.read(decode=True)
            username = username.decode('utf-8')
            
            field = await reader.next()
            password = await field.read(decode=True)
            password = password.decode('utf-8')
            
            field = await reader.next()
            avatar_location = ''
            if field and field.name == 'avatar':
                filename = f"{username}_{field.filename}"
                filepath = os.path.join(UPLOAD_DIR, filename)
                
                with open(filepath, 'wb') as f:
                    while True:
                        chunk = await field.read_chunk()
                        if not chunk:
                            break
                        f.write(chunk)
                avatar_location = filepath
            
            return username, password, avatar_location

async def get_friend_list_handler(request):
    friend_list_res = load_my_friend_list(client.my_username)
    return web.json_response({"result": True, "friend_list": friend_list_res})

async def refresh_avatars_handler(request):
    """
    Endpoint to refresh avatar CIDs for all friends in the user's friend list.
    This is used to get the latest avatars of friends who may have updated their profile pictures.
    """
    try:
        if not client.my_username:
            return web.json_response({
                "result": False,
                "message": "Not logged in"
            }, status=401)
        
        # Get the current friend list
        friend_list = load_my_friend_list(client.my_username)
        
        # Update avatar CIDs in the friend list
        updated_friend_list = await run_sync(update_avatar_list, friend_list)
        
        # Update the global friend list
        client.my_friend_list = updated_friend_list
        
        # Save the updated friend list back to RSDB
        await run_sync(update_rsdb_friend_list, updated_friend_list, client.my_username)
        
        # Download any new avatars
        for username, friend_info in updated_friend_list.items():
            avatar_cid = friend_info.get("avatar_cid")
            if avatar_cid:
                await run_sync(download_avatar, avatar_cid)
        
        return web.json_response({
            "result": True, 
            "message": "Avatars refreshed successfully",
            "friend_list": updated_friend_list
        })
    except Exception as e:
        return web.json_response({
            "result": False,
            "message": f"Error refreshing avatars: {str(e)}"
        }, status=500)

async def temp_file_upload_handler(request):
    try:
        reader = await request.multipart()
        field = await reader.next()

        if not field or not hasattr(field, 'filename') or not field.filename:
            return web.json_response(
                {"error": "File field 'file' with a filename missing in upload"},
                status=400
            )
        
        original_filename = field.filename
        file_content = bytearray()
        while True:
            chunk = await field.read_chunk(size=8192)
            if not chunk:
                break
            file_content.extend(chunk)

        if not file_content:
             return web.json_response({"error": "Received empty file"}, status=400)
        
        save_result = await run_sync(file_service.handle_temporary_file_upload, file_content, original_filename)
        if save_result:
            unique_filename, temp_file_path = save_result
            return web.json_response({"result" : True, "temp_file_path" : temp_file_path,
                                       "unique_filename":unique_filename,"orignal_file_name":original_filename})
        else:
            return web.json_response({"error": "Failed to save uploaded file."}, status=500)
    except Exception as e:
        return web.Response(text=e, status=500)
    
async def delete_file_handler(request):
    unique_filename = request.match_info.get('filename')
    if not unique_filename:
        return web.json_response({"error": "Filename parameter missing."}, status=400)
    delete_result = await run_sync(file_service.delete_temporary_file, unique_filename)

    return web.json_response(delete_result)
    

app = web.Application()

# Setup CORS
cors = cors_setup(app, defaults={
    "*": ResourceOptions(
        allow_credentials=True,
        allow_headers="*",
        allow_methods="*",
        expose_headers="*",
        max_age=3600
    )
})

# Update routes with CORS
async def update_avatar_handler(request):
    try:
        # Process multipart request to get avatar file
        reader = await request.multipart()
        
        # Get avatar field
        field = await reader.next()
        if not field or not field.name == 'avatar':
            return web.json_response({
                "result": False,
                "message": "No avatar field found in request"
            }, status=400)
        
        # Get current username from session
        username = client.my_username
        if not username:
            return web.json_response({
                "result": False,
                "message": "Not logged in"
            }, status=401)
        
        # Save avatar file temporarily
        filename = f"{username}_avatar_{field.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, 'wb') as f:
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                f.write(chunk)
        
        # Upload avatar to IPFS and update user's avatar CID
        result = await run_sync(client.update_user_avatar, filepath)
        
        return web.json_response(result)
    except Exception as e:
        return web.json_response({
            "result": False,
            "message": f"Error updating avatar: {str(e)}"
        }, status=500)

routes = [
    web.get('/', welcome_handler),
    web.post('/login', login_handler),
    web.post('/signup', signup_handler),
    web.post('/select_friend', select_friend_handler),
    web.put('/change_nickname', change_nickname_handler),
    web.delete('/delete_friend', delete_friend_handler),
    web.post('/add_friend', add_friend_handler),
    web.post('/send_text', send_text_handler),
    web.post('/send_file', send_file_handler),
    web.get('/update_chat_history', update_chat_history_handler),
    web.get('/initial_load_chat_history', initial_load_handler),
    web.get('/load_previous_chat_history', load_previous_handler),
    web.get('/load_specific_page', load_specific_page_handler),
    web.post('/download_file', download_file_handler),
    web.get('/get_friend_list', get_friend_list_handler),
    web.get('/refresh_avatars', refresh_avatars_handler),
    web.post('/upload_temp_file', temp_file_upload_handler),
    web.delete('/delete_temp_file/{filename}', delete_file_handler),
    web.post('/update_avatar', update_avatar_handler)
]

for route in routes:
    cors.add(app.router.add_route(route.method, route.path, route.handler))
app.router.add_static('/profile_pictures/', path=PROFILE_PIC_FOLDER, name='profile_pictures')

if __name__ == '__main__':
    web.run_app(app, host="127.0.0.1", port=8000)
