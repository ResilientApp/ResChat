import json

from RSDB_kv_service import get_kv, set_kv
from typing import Dict

from backend.helper import combine_string_in_ascii

"""
Friend list is a JSON/Python dict object stores all friend information
{
    FRIEND1's USER NAME:    {
                                "nick_name": FRIEND1's NICK NAME,
                                "public_key": FRIEND1's PUBLIC KEY,
                                "avatar_cid": FRIEND1's AVATAR CID,
                            },
    FRIEND2's USER NAME:    {
                                "nick_name": FRIEND2's NICK NAME,
                                "public_key": FRIEND2's PUBLIC KEY,
                                "avatar_cid": FRIEND2's AVATAR CID,
                            },
}
"""

def load_my_friend_list(username: str) -> {}:
    """
    Load friend list from RSDB
    : return a python dict friend list

    """
    friend_list_str = get_kv(username + " FRIEND")
    try:
        return json.loads(friend_list_str)
    except:
        return {}


def update_rsdb_friend_list(friend_list: {}, username: str) -> None:
    """
    All modification of friend list are only done in local, call this function to update friend list in RSDB after
        any modification to friend list
    : return None
    """
    set_kv(username + " FRIEND", json.dumps(friend_list))
    return


def update_avatar_list(friend_list: {}) -> {}:
    """
    Update friends' avatar cid
    : return an updated python dict
    """
    for username in friend_list.keys():
        new_avatar_cid = get_kv(username + " AVATAR")
        if new_avatar_cid == "\n" or new_avatar_cid == "" or new_avatar_cid == " ":
            friend_list[username]["avatar_cid"] = ""
        else:
            friend_list[username]["avatar_cid"] = new_avatar_cid
    return friend_list


def add_friend(username: str, friend_list: {}, nickname: str, my_username: str) -> {}:
    """
    Add a new friend to friend list, and set corresponding kv pairs in RSDB
    : return an updated friend list python dict with status True if success
        {"result": True, "message": {UPDATED FRIEND LIST}}
    : return result False with an error message
    """
    friend_public_key = get_kv(username)
    friend_avatar_cid = get_kv(username + " AVATAR")
    if friend_public_key == " " or friend_public_key == "\n" or friend_public_key == "":
        return {"result": False, "message": "Friend doesn't exists"}
    else:
        if friend_avatar_cid == "\n" or friend_avatar_cid == " " or friend_avatar_cid == "":
            friend_avatar_cid = ""
        friend_list[username] = {"nick_name": nickname, "public_key": friend_public_key, "avatar_cid": friend_avatar_cid}
        friendship_key = combine_string_in_ascii(username, my_username)
        existing_page_num = get_kv(friendship_key + " PAGE_NUM")
        if existing_page_num == "\n" or existing_page_num == "" or existing_page_num == " ":
            set_kv(friendship_key + " PAGE_NUM", "1")
        return {"result": True, "message": friend_list}


def update_avatar(username: str, avatar_cid: str) -> Dict[str, str]:
    """
    Update a user's avatar CID in RSDB
    :param username: The username whose avatar needs to be updated
    :param avatar_cid: The new avatar CID to set
    :return: Dictionary with result status and message
    """
    if username == "" or username.isspace():
        return {"result": False, "message": "Invalid username"}
    
    if avatar_cid is None:
        avatar_cid = ""
    
    try:
        set_kv(username + " AVATAR", avatar_cid)        # Update avatar in RSDB
        return {"result": True, "message": "Avatar updated successfully"}
    except Exception as e:
        return {"result": False, "message": f"Failed to update avatar: {str(e)}"}

def delete_friend(target_username: str, friend_list: Dict[str, Dict]) -> {}:
    """
    Delete a friend from the friend list
    :param target_username: Username of the friend to delete
    :param friend_list: Current friend list dictionary
    :return: Dictionary with result status and updated friend list or error message
    """
    if target_username not in friend_list:
        return {"result": False, "message": "Friend not found in friend list"}
    
    try:
        del friend_list[target_username]
        
        return {
            "result": True,
            "message": friend_list
        }
    except Exception as e:
        return {
            "result": False,
            "message": f"Failed to delete friend: {str(e)}"
        }

def change_nickname(username: str, friend_list: Dict[str, Dict], new_nickname: str) -> {}:
    """
    Change the nickname of a friend in the friend list and update RSDB
    :param username: Username of the friend whose nickname needs to be changed
    :param friend_list: Current friend list dictionary
    :param new_nickname: New nickname to set for the friend
    :param my_username: Username of the current user for RSDB update
    :return: Dictionary with result status and updated friend list or error message
    """
    if username not in friend_list:
        return {
            "result": False,
            "message": "Friend not found in friend list",
        }
    
    if not new_nickname or new_nickname.isspace():
        return {
            "result": False,
            "message": "Invalid nickname provided"
        }
    
    try:
        # Update the nickname while preserving other friend information
        friend_list[username]["nick_name"] = new_nickname
        
        return {
            "result": True,
            "message": friend_list
        }
    except Exception as e:
        return {
            "result": False,
            "message": f"Failed to update nickname: {str(e)}"
        }


def test_friend_list_functions():
    my_username = "user1"
    friend_username = "friend1"
    set_kv(friend_username, "public_key")
   
    set_kv(my_username + " FRIEND", json.dumps({})) 

    # Test loading friend list
    print("=== Test: Loading Friend List ===")
    friend_list = load_my_friend_list(my_username)
    print("Friend List (Should be empty):", friend_list)

    # Test adding a friend
    print("\n=== Test: Adding a Friend ===")
    result = add_friend(friend_username, friend_list, "Best Friend", my_username)
    print("Add Friend Result:", result)
    print("Friend List After Adding Friend:", result["message"])

    # Test updating RSDB with new friend list
    print("\n=== Test: Updating RSDB Friend List ===")
    update_rsdb_friend_list(friend_list, my_username)
    print("RSDB Friend List (From RSDB):", json.loads(get_kv(my_username + " FRIEND")))

    # Test updating avatar list
    print("\n=== Test: Updating Avatar List ===")
    set_kv(friend_username + " AVATAR", "new_avatar_cid")
    updated_friend_list = update_avatar_list(friend_list)
    print("Updated Friend List with Avatars:", updated_friend_list)

    # Test changing nickname
    print("\n=== Test: Changing Nickname ===")
    result = change_nickname(friend_username, friend_list, "Buddy", my_username)
    print("Change Nickname Result:", result)
    print("Friend List After Changing Nickname:", result["message"])

    # Test updating avatar
    print("\n=== Test: Updating Avatar ===")
    avatar_result = update_avatar(friend_username, "updated_avatar_cid")
    print("Update Avatar Result:", avatar_result)
    print("Updated Avatar in RSDB (From RSDB):", get_kv(friend_username + " AVATAR"))

    print("\n === Test: Getting Page Number ===")
    sorted_names = sorted([my_username, friend_username])

    friendship_key = f"{sorted_names[0]} {sorted_names[1]}"
    print(get_kv(friendship_key + " PAGE_NUM"))

    # Test deleting a friend
    print("\n=== Test: Deleting a Friend ===")
    delete_result = delete_friend(friend_username, friend_list, my_username)
    print("Delete Friend Result:", delete_result)
    print("Friend List After Deleting Friend:", delete_result["message"])

if __name__ == "__main__":
        print("=== Running Friend List Functions Test ===")
        test_friend_list_functions()
