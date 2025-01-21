"""
This file contains all function needed for the fronted
"""
from datetime import datetime
from backend.helper import combine_string_in_ascii, download_avatar
from backend.page import from_string
from crypto_service import *
from user import *
from friend_list import *

from page import *
import Crypto
from Crypto.PublicKey import RSA

"""Global Variables"""
"""
Group 1
Following variables will be only initialize once after user login successfully 
"""
my_username: str
my_public_key: Crypto.PublicKey.RSA.RsaKey
my_private_key: Crypto.PublicKey.RSA.RsaKey
my_friend_list: dict
my_password: str
my_public_key_string: str

"""
Group 2
Following variables will be initialized and reinitialized everytime user choose a friend to talk with
"""
current_chatting_friend_username: str
current_chatting_friend_public_key: Crypto.PublicKey.RSA.RsaKey
current_chatting_page_name: str
current_chat_previous_page_number: int

"""This variable will be initialized and reinitialized everytime user choose a friend to talk with and every two seconds"""
current_chat_history: {}


def login(username: str, password: str) -> {}:
    """
    This function includes the whole process of login, if it runs successfully, it will assign all Group 1 variables
    """
    global my_username, my_public_key, my_friend_list, my_password, my_public_key_string, my_private_key

    # Load RSA key pair from local disk
    rsa_key_load_res = load_user(username, password)
    if rsa_key_load_res["result"] is False:
        return {"result": False, "message": rsa_key_load_res["message"]}

    # Assign global variables
    my_public_key = rsa_key_load_res["message"][0]
    my_private_key = rsa_key_load_res["message"][1]
    my_username = username
    my_password = password
    my_public_key_string = public_key_to_string(my_public_key)
    my_friend_list = load_my_friend_list(my_username)

    # Update avatar list
    my_friend_list = update_avatar_list(my_friend_list)
    update_rsdb_friend_list(my_friend_list, my_username)

    # Download avatars
    res = download_avatar(my_friend_list)
    if res["result"]:
        return {"result": True, "message": "Login in successfully"}
    else:
        return res




def signup(username: str, password: str, avatar_location: str) -> {}:
    global my_username, my_public_key, my_friend_list, my_private_key, my_public_key_string, my_password
    res = create_user(username, password, avatar_location)
    if res["result"]:
        my_username = username
        my_password = password
        my_public_key = res["message"][0]
        my_private_key = res["message"][1]
        my_friend_list = {}
        my_public_key_string = public_key_to_string(my_public_key)
        return {"result": True, "message": "Sign up successfully"}
    else:
        return res


def select_friend(target_username: str) -> {}:
    global current_chatting_friend_username, current_chatting_friend_public_key, current_chatting_page_name, \
        current_chat_previous_page_number, my_friend_list

    # Check if this friend is in my friend list
    if target_username not in my_friend_list:
        return {"result": False, "message": f"{target_username} is not in your friend list"}

    # Assign variables
    current_chatting_friend_username = target_username
    current_chatting_friend_public_key =  string_to_public_key(get_kv(target_username))
    current_chatting_page_name = combine_string_in_ascii(my_username, target_username)
    current_chatting_page_number = int(get_kv(current_chatting_page_name + " PAGE_NUM"))
    if current_chatting_page_number > 2:
        current_chat_previous_page_number = current_chatting_page_number
    else:
        current_chat_previous_page_number = 0
    # TODO: Load chat history
    return


def encapsulated_change_nickname(target_username: str, new_nickname: str) -> {}:
    global my_friend_list, my_username
    res = change_nickname(target_username, my_friend_list, new_nickname)
    if res["result"]:
        my_friend_list = res["message"]
        update_rsdb_friend_list(my_friend_list, my_username)
        return {"result": True, "message": f"{target_username} as been renamed to {new_nickname}"}
    else:
        return res


def encapsulated_delete_friend(target_username: str) -> {}:
    global my_friend_list, my_username
    res = delete_friend(target_username, my_friend_list)
    if res["result"]:
        my_friend_list = res["message"]
        update_rsdb_friend_list(my_friend_list, my_username)
        return {"result": True, "message": f"{target_username} has been removed from your friend list"}
    else:
        return res


def encapsulated_add_friend(target_username: str, nickname: str) -> {}:
    global my_friend_list, my_username
    add_friend_result = add_friend(target_username, my_friend_list, nickname)

    # Check if result is True
    if add_friend_result["result"] is False:
        return add_friend_result

    # Update my friend list in RSDB
    my_friend_list = add_friend_result["message"]
    update_rsdb_friend_list(my_friend_list, my_username)

    # Download this friend's avatar
    res = download_avatar(my_friend_list, target_username)
    if res["result"]:
        return {"result": True, "message": f"{target_username} has added into your friend list"}
    else:
        return res



def send_text_message(plain_text: str):
    try:
        # Encrypt message for two users
        aes_key = generate_random_aes_key()
        encrypted_message = encrypt_text_with_aes(plain_text, aes_key)
        encrypted_aes_key_sender = encrypt_aes_key_with_rsa(aes_key, my_public_key)
        encrypted_aes_key_receiver = encrypt_aes_key_with_rsa(aes_key, current_chatting_friend_public_key)

        # Get current page number
        page_numer = int(get_kv(current_chatting_page_name + " PAGE_NUM"))

        # Get current page and convert it into Page()
        try:
            page = get_kv(current_chatting_page_name + " " + str(page_numer))
        except Exception as e:
            page = Page()

        # Sort page
        page.sort_by_time()

        # Check if the page is full
        # Page is not full
        if not page.is_full():
            # Add message into page
            page.add_message(my_username, "TEXT", datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                             encrypted_message, encrypted_aes_key_sender, encrypted_aes_key_receiver)
        # Page is full
        else:
            # Create a new page
            page = Page()

            # Update page number in RSDB
            page_numer += 1
            set_kv(current_chatting_page_name + " PAGE_NUM", str(page_numer))

            # Add message into page
            page.add_message(my_username, "TEXT", datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                             encrypted_message, encrypted_aes_key_sender, encrypted_aes_key_receiver)

        # Send page
        set_kv(current_chatting_page_name + " " + str(page_numer), page.to_string())
        return {"result": True, "message": "Message sent successfully"}

    except Exception as e:
        return {"result": False, "message": str(e)}


def send_file(file_path: str):
    # Encrypt file for two users
    aes_key = generate_random_aes_key()
    if not os.path.exists(file_path):
        return {"result": False, "message": f"{file_path} doesn't exist"}
    res = encrypt_file_with_aes(file_path, aes_key)

    if not res["result"]:
        return res

    encrypted_file_path = res["message"]

    # Add file to IPFS
    add_file_to_cluster(encrypted_file_path)

    # TODO
    # Get current page number

    # Get current page and convert it into Page()

    # Sort page

    # Check if the page is full

    return


def update_chat_history():
    #TODO
    return


def load_previous_chat_history():
    #TODO
    return


def download_and_decrypt_file(save_path: str, file_cid: str):
    # TODO
    return

