import asyncio
from aiohttp import web
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import client

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
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    avatar_location = data.get("avatar_location")
    result = await run_sync(client.signup, username, password, avatar_location)
    return web.json_response(result)

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
    await run_sync(client.update_chat_history)
    return web.json_response({"result": True, "message": "Chat history updated"})

async def initial_load_handler(request):
    await run_sync(client.initial_load_chat_history)
    return web.json_response({"result": True, "message": "Initial chat history loaded"})

async def load_previous_handler(request):
    result = await run_sync(client.load_previous_chat_history)
    return web.json_response(result)

async def download_file_handler(request):
    data = await request.json()
    save_path = data.get("save_path")
    file_info = data.get("file_info")
    result = await run_sync(client.download_and_decrypt_file, save_path, file_info)
    return web.json_response(result)

app = web.Application()
app.router.add_get('/', welcome_handler)
app.router.add_post('/login', login_handler)
app.router.add_post('/signup', signup_handler)
app.router.add_post('/select_friend', select_friend_handler)
app.router.add_put('/change_nickname', change_nickname_handler)
app.router.add_delete('/delete_friend', delete_friend_handler)
app.router.add_post('/add_friend', add_friend_handler)
app.router.add_post('/send_text', send_text_handler)
app.router.add_post('/send_file', send_file_handler)
app.router.add_get('/update_chat_history', update_chat_history_handler)
app.router.add_get('/initial_load_chat_history', initial_load_handler)
app.router.add_get('/load_previous_chat_history', load_previous_handler)
app.router.add_post('/download_file', download_file_handler)

if __name__ == '__main__':
    web.run_app(app, host="127.0.0.1", port=8000)
