"""
This file contains all function needed for the fronted
"""
from datetime import datetime
from backend.helper import combine_string_in_ascii, download_avatar, string_to_file_message_dict
from backend.page import from_string
from crypto_service import *
from user import *
from friend_list import *
import shutil
from page import *
import Crypto
from Crypto.PublicKey import RSA
from helper import write_log_client
from file_service import get_file_size_in_kb

"""Global Variables"""
"""
Group 1
Following variables will be only initialize once after user login successfully 
"""
my_username: str = None
my_public_key: Crypto.PublicKey.RSA.RsaKey = None
my_private_key: Crypto.PublicKey.RSA.RsaKey = None
my_friend_list: dict = {}
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

"""
This variable will be initialized and reinitialized everytime user choose a friend to talk with and every two seconds
current_chat_history = {1: [{"sender": True/False (To identify I am the send or receiver),
                        "message_type": "FILE" or "TEXT", 
                        "message": str or dict (If is a text message it will be string, decrypted message, otherwise dict),
                        "time_stamp": str} (Message 1 in page 1),
                        
                        {"sender": True/False (To identify I am the send or receiver),
                        "message_type": "FILE" or "TEXT", 
                        "message": str or dict (If is a text message it will be string, decrypted message, otherwise dict),
                        "time_stamp": str} (Message 2 in page 1),],
                        ...
                        
                        2: [Max 20 messages]}
message = {"cid": FILE CID, "key": DECRYPTED AES KEY, "file_name": FILE NAME, "file_size": FILE SIZE (Bytes)}
"""
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
    res = download_avatar(my_friend_list, my_username)
    if res["result"]:
        return {"result": True, "message": "Login in successfully", "user_cid": res["user_cid"]}
    else:
        return res




def signup(username: str, password: str, avatar_location: str) -> {}:
    global my_username, my_public_key, my_friend_list, my_private_key, my_public_key_string, my_password
    user_exists = check_user_exists(username)
    if user_exists:
        return {
            "result": False,
            "message": "Username already exists"
        }
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
    current_chat_previous_page_number = current_chatting_page_number - 2
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
    add_friend_result = add_friend(target_username, my_friend_list, nickname, my_username)

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
        page_number = int(get_kv(current_chatting_page_name + " PAGE_NUM"))

        # Get current page and convert it into Page()
        try:
            page_string = get_kv(current_chatting_page_name + " " + str(page_number))
        except Exception as e:
            page = Page()

        # Sort page
        page = from_string(page_string)
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
            page_number += 1
            set_kv(current_chatting_page_name + " PAGE_NUM", str(page_number))

            # Add message into page
            page.add_message(my_username, "TEXT", datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                             encrypted_message, encrypted_aes_key_sender, encrypted_aes_key_receiver)

        # Send page
        set_kv(current_chatting_page_name + " " + str(page_number), page.to_string())
        update_chat_history()
        return {"result": True, "message": "Message sent successfully", "chat_history": current_chat_history}

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
    cid = add_file_to_cluster(encrypted_file_path)

    # Encrypt AES key
    encrypted_aes_key_sender = encrypt_aes_key_with_rsa(aes_key, my_public_key)
    encrypted_aes_key_receiver = encrypt_aes_key_with_rsa(aes_key, current_chatting_friend_public_key)


    # Get current page number
    page_number = int(get_kv(current_chatting_page_name + " PAGE_NUM"))

    # Get current page and convert it into Page()
    try:
        page_string = get_kv(current_chatting_page_name + " " + str(page_number))
    except Exception as e:
        page = Page()

    # Sort page
    page = from_string(page_string)
    page.sort_by_time()

    # Check if the page is full
    # Page is not full
    size_in_kb = get_file_size_in_kb(file_path)
    if not page.is_full():
        page.add_message(my_username, "FILE", datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                         {"file_size": size_in_kb, "file_name": os.path.basename(file_path), "cid": cid}
                         ,encrypted_aes_key_sender, encrypted_aes_key_receiver)
    else:
        # Create new page
        page = Page()

        # Update page number in RSDB
        page_number += 1
        set_kv(current_chatting_page_name + " PAGE_NUM", str(page_number))

        # Add message into page
        page.add_message(my_username, "FILE", datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                         {"file_size": size_in_kb, "file_name": os.path.basename(file_path), "cid": cid},
                         encrypted_aes_key_sender, encrypted_aes_key_receiver)

    # Send page
    set_kv(current_chatting_page_name + " " + str(page_number), page.to_string())
    update_chat_history()
    return {"result": True, "message": "Message sent successfully", "chat_history": current_chat_history}


def update_chat_history():
    global current_chat_history
    current_chat_history = {}

    # Get current page number
    page_number = int(get_kv(current_chatting_page_name + " PAGE_NUM"))

    # Get page
    page_string = get_kv(current_chatting_page_name + " " + str(page_number))

    # Check if page string is empty
    if page_string == "" or page_string == " " or page_string == "\n":
        return

    # Convert into Page()
    page = from_string(page_string)
    page.sort_by_time()

    # Get all messages
    all_messages = page.all_messages()

    # Check if current_chat_history and all_messages are empty
    if len(current_chat_history) == 0 and len(all_messages) == 0:
        return

    # Ensure current_chat_history contains the current page
    if page_number not in current_chat_history:
        current_chat_history[page_number] = []
        if page_number == 1:
            return initial_load_chat_history()

        current_chat_history = load_previous_chat_history()["chat_history"]
        previous_page_local_messages = current_chat_history.get(page_number - 1, [])

        if len(previous_page_local_messages) != 20:
            previous_page_string = get_kv(current_chatting_page_name + " " + str(page_number - 1))
            previous_page = from_string(previous_page_string)
            previous_page_all_messages = previous_page.all_messages()

            i = len(previous_page_all_messages) - 1
            tmp_list = []
            if previous_page_local_messages:
                last_time_stamp = previous_page_local_messages[-1]["time_stamp"]
                while i >= 0 and last_time_stamp != previous_page_all_messages[i][2]:
                    message = previous_page_all_messages[i]
                    sender = message[0] == my_username

                    if message[1] == "FILE":
                        file_info = message[3]
                        encrypted_aes_key = message[4] if sender else message[5]
                        file_info["key"] = decrypt_aes_key_with_rsa(encrypted_aes_key, my_private_key)
                        tmp_list.insert(0, {"sender": sender, "message_type": "FILE", "time_stamp": message[2], "message": file_info})
                    else:
                        encrypted_aes_key = message[4] if sender else message[5]
                        decrypted_message = decrypt_text_with_aes(message[3], decrypt_aes_key_with_rsa(encrypted_aes_key, my_private_key))
                        tmp_list.insert(0, {"sender": sender, "message_type": "TEXT", "time_stamp": message[2], "message": decrypted_message})
                    i -= 1

            current_chat_history.setdefault(page_number - 1, []).extend(tmp_list)

    # Check for new messages
    if current_chat_history[page_number] and all_messages[-1][2] != current_chat_history[page_number][-1]["time_stamp"]:
        i = len(all_messages) - 1
        tmp_list = []
        last_time_stamp = current_chat_history[page_number][-1]["time_stamp"]
        while i >= 0 and all_messages[i][2] != last_time_stamp:
            message = all_messages[i]
            sender = message[0] == my_username

            if message[1] == "FILE":
                file_info = message[3]
                encrypted_aes_key = message[4] if sender else message[5]
                file_info["key"] = decrypt_aes_key_with_rsa(encrypted_aes_key, my_private_key)
                tmp_list.insert(0, {"sender": sender, "message_type": "FILE", "time_stamp": message[2], "message": file_info})
            else:
                encrypted_aes_key = message[4] if sender else message[5]
                decrypted_message = decrypt_text_with_aes(message[3], decrypt_aes_key_with_rsa(encrypted_aes_key, my_private_key))
                tmp_list.insert(0, {"sender": sender, "message_type": "TEXT", "time_stamp": message[2], "message": decrypted_message})
            i -= 1

        current_chat_history[page_number].extend(tmp_list)
    return current_chat_history


def initial_load_chat_history():
    global current_chat_history
    current_chat_history = {}
    # get page number
    write_log_client("Claled initial load chat")
    page_number = int(get_kv(current_chatting_page_name + " PAGE_NUM"))

    current_page_list = []
    # get current page and all messages
    current_page_string = get_kv(current_chatting_page_name + " " + str(page_number))

    if current_page_string != "" and current_page_string != " " and current_page_string != "\n":
        current_page_all_messages = from_string(current_page_string).all_messages()
        for message in current_page_all_messages:
            # Check sender
            sender = (message[0] == my_username)

            if message[1] == "FILE":
                file_info = string_to_file_message_dict(message[3])
                encrypted_aes_key = message[4] if sender else message[5]
                file_info["key"] = decrypt_aes_key_with_rsa(encrypted_aes_key, my_private_key)
                current_page_list.append({"sender": sender, "message_type": "FILE", "time_stamp": message[2],
                                    "message": file_info})
            else:
                encrypted_aes_key = message[4] if sender else message[5]
                decrypted_message = decrypt_text_with_aes(message[3],
                                                          decrypt_aes_key_with_rsa(encrypted_aes_key, my_private_key))
                current_page_list.append({"sender": sender, "message_type": "TEXT", "time_stamp": message[2],
                                 "message": decrypted_message})
        current_chat_history[page_number] = current_page_list

    if page_number >= 2:
        previous_page_list = []
        previous_page_string = get_kv(current_chatting_page_name + " " + str(page_number - 1))
        previous_page_all_messages = from_string(previous_page_string).all_messages()
        for message in previous_page_all_messages:
            # Check sender
            sender = (message[0] == my_username)

            if message[1] == "FILE":
                file_info = string_to_file_message_dict(message[3])
                encrypted_aes_key = message[4] if sender else message[5]
                just_a_val = decrypt_aes_key_with_rsa(encrypted_aes_key, my_private_key)
                file_info["key"] = just_a_val
                previous_page_list.append({"sender": sender, "message_type": "FILE", "time_stamp": message[2],
                                    "message": file_info})

            else:
                encrypted_aes_key = message[4] if sender else message[5]
                decrypted_message = decrypt_text_with_aes(message[3],
                                                          decrypt_aes_key_with_rsa(encrypted_aes_key, my_private_key))
                previous_page_list.append({"sender": sender, "message_type": "TEXT", "time_stamp": message[2],
                                     "message": decrypted_message})
        current_chat_history[page_number - 1] = previous_page_list
    return current_chat_history


def load_previous_chat_history() -> {}:
    global current_chat_previous_page_number, current_chat_history

    if current_chat_previous_page_number < 1:    
        return {"result": True, "message": f"page {current_chat_previous_page_number + 2} loaded successfully", 
            "chat_history": initial_load_chat_history()}

    # Get target previous page's all messages
    previous_page_string = get_kv(current_chatting_page_name + " " + str(current_chat_previous_page_number))
    previous_page_all_messages = from_string(previous_page_string).all_messages()

    # Process all messages
    temp_list = []
    for message in previous_page_all_messages:
        # Check sender
        sender = (message[0] == my_username)

        if message[1] == "FILE":
            file_info = message[3]
            encrypted_aes_key = message[4] if sender else message[5]
            file_info["key"] = decrypt_aes_key_with_rsa(encrypted_aes_key, my_private_key)
            temp_list.append({"sender": sender, "message_type": "FILE", "time_stamp": message[2],
                                      "message": file_info})
        else:
            encrypted_aes_key = message[4] if sender else message[5]
            decrypted_message = decrypt_text_with_aes(message[3],
                                                      decrypt_aes_key_with_rsa(encrypted_aes_key, my_private_key))
            temp_list.append({"sender": sender, "message_type": "TEXT", "time_stamp": message[2],
                                      "message": decrypted_message})
    current_chat_history[current_chat_previous_page_number] = temp_list
    current_chat_previous_page_number -= 1
    return {"result": True, "message": f"page {current_chat_previous_page_number + 1} loaded successfully", 
            "chat_history": current_chat_history}

def load_specific_page(page_number: int) -> {}:
    """
    Load a specific page of chat history by page number.
    This allows the frontend to request pages in any order.
    """
    global current_chat_history
    
    # Validate page number - it must be positive
    if page_number < 1:
        return {"result": False, "message": f"Invalid page number {page_number}", "chat_history": {}}
    
    # Check if we already have this page loaded
    if page_number in current_chat_history:
        return {"result": True, "message": f"Page {page_number} already loaded", 
                "chat_history": {page_number: current_chat_history[page_number]}}
    
    # Get the max page number to make sure we're not requesting a non-existent page
    max_page = int(get_kv(current_chatting_page_name + " PAGE_NUM"))
    if page_number > max_page:
        return {"result": False, "message": f"Page {page_number} does not exist (max is {max_page})", 
                "chat_history": {}}
    
    # Get the requested page's messages
    page_string = get_kv(current_chatting_page_name + " " + str(page_number))
    
    # If page is empty or doesn't exist
    if not page_string or page_string == "" or page_string == " " or page_string == "\n":
        return {"result": False, "message": f"Page {page_number} is empty or does not exist", 
                "chat_history": {}}
    
    # Process all messages from the page
    page_messages = from_string(page_string).all_messages()
    message_list = []
    
    for message in page_messages:
        # Check sender
        sender = (message[0] == my_username)

        if message[1] == "FILE":
            try:
                file_info = string_to_file_message_dict(message[3]) if callable(globals().get('string_to_file_message_dict')) else message[3]
                encrypted_aes_key = message[4] if sender else message[5]
                file_info["key"] = decrypt_aes_key_with_rsa(encrypted_aes_key, my_private_key)
                message_list.append({
                    "sender": sender, 
                    "message_type": "FILE", 
                    "time_stamp": message[2],
                    "message": file_info
                })
            except Exception as e:
                write_log_client(f"Error processing file message on page {page_number}: {str(e)}")
        else:
            try:
                encrypted_aes_key = message[4] if sender else message[5]
                decrypted_message = decrypt_text_with_aes(
                    message[3],
                    decrypt_aes_key_with_rsa(encrypted_aes_key, my_private_key)
                )
                message_list.append({
                    "sender": sender, 
                    "message_type": "TEXT", 
                    "time_stamp": message[2],
                    "message": decrypted_message
                })
            except Exception as e:
                write_log_client(f"Error processing text message on page {page_number}: {str(e)}")
    
    # Save the loaded page in our chat history
    current_chat_history[page_number] = message_list
    
    # Return just this page to avoid sending unnecessary data
    return {
        "result": True, 
        "message": f"Page {page_number} loaded successfully", 
        "chat_history": {page_number: message_list}
    }


def download_and_decrypt_file(save_path: str, file_info: {}) -> {}:
    aes_key = file_info["key"]
    cid = file_info["cid"]
    file_name = file_info["file_name"]
    file_peer_map = get_file_status(cid)["peer_map"]
    file_status_checker = False

    # Check file's availability
    for peer in file_peer_map.values():
        if peer["status"] == "pinned":
            file_status_checker = True
            break
    if not file_status_checker:
        return {"result": False, "Message": f"{cid} is currently unavailable"}

    # Download encrypted file from ipfs
    download_file_from_ipfs(cid, f"temp/{file_name}.enc")

    # Decrypt file and move it to target dir
    decrypt_file_with_aes(f"temp/{file_name}.enc", aes_key, f"{save_path}")
    # TODO: Base on frontend component we decide to use to see if save_path includes file name or not.


    return {"result": True, "message": f"Your file has successfully saved to {save_path}"}
def check_user_exists(username: str) -> bool:
    try:
        if not username or not isinstance(username, str):
            return False
        temp = get_kv(username)
        if temp == "" or temp is None or temp.isspace():
            return False
        return True
    except Exception:
        return False

