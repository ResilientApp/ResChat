import asyncio
from aiohttp import web
from aiohttp_cors import setup as cors_setup, ResourceOptions
import json
import sys
import os
import aiohttp

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import client

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def run_sync(func, *args, **kwargs):
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
    
    friend_list = client.load_my_friend_list(client.my_username)
    return web.json_response({"result": True, "friend_list": friend_list})

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
    web.post('/download_file', download_file_handler),
    web.get('/get_friend_list', get_friend_list_handler)
]

for route in routes:
    cors.add(app.router.add_route(route.method, route.path, route.handler))

if __name__ == '__main__':
    web.run_app(app, host="127.0.0.1", port=8000)
