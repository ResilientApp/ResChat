"""
I think we can copy from IPFS part from ResShare
"""
import os

import requests
from helper import write_log
ipfs_cluster_api_url = None
ipfs_gateway_url = None


def read_config_file():
    """
    Reads the IPFS Cluster API URL and IPFS Gateway URL from the configuration file.
    Sets the values of global variables ipfs_cluster_api_url and ipfs_gateway_url.
    """
    global ipfs_cluster_api_url, ipfs_gateway_url
    with open("config/ipfs.config") as f:
        ipfs_cluster_api_url = f.readline().strip()
        ipfs_gateway_url = f.readline().strip()


def add_file_to_cluster(file_path):
    """
    Adds a file to the IPFS Cluster.

    :param file_path: The path to the file to be added.
    :return: The CID (Content Identifier) of the file if successful, otherwise None.
    """
    if ipfs_cluster_api_url is None or ipfs_gateway_url is None:
        read_config_file()

    url = ipfs_cluster_api_url + "add"
    files = {'file': open(file_path, 'rb')}
    response = requests.post(url, files=files)
    write_log(f"Uploading {os.path.basename(file_path)} to IPFS")
    if response.status_code == 200:
        cid = response.json()['cid']['/']
        write_log(f"{os.path.basename(file_path)} Uploaded successfully")
        return cid
    else:
        write_log(f"fail to upload {os.path.basename(file_path)}, with {response.text} error message from IPFS")
        return None


def get_file_status(cid):
    """
    Retrieves the status of a file in the IPFS Cluster.

    :param cid: The CID of the file.
    :return: The status information of the file if successful, otherwise None.
    """
    if ipfs_cluster_api_url is None or ipfs_gateway_url is None:
        read_config_file()

    url = f"{ipfs_cluster_api_url}pins/{cid}"
    response = requests.get(url)

    if response.status_code == 200:
        file_info = response.json()
        return file_info
    else:
        print("Failed to get file status from IPFS Cluster.")
        print(response.text)


def download_file_from_ipfs(cid, save_path):
    if ipfs_cluster_api_url is None or ipfs_gateway_url is None:
        read_config_file()

    # Print the configuration to verify
    print(f"IPFS Cluster API URL: {ipfs_cluster_api_url}")
    print(f"IPFS Gateway URL: {ipfs_gateway_url}")

    url = f"{ipfs_gateway_url}ipfs/{cid}"
    print(f"Download URL: {url}")

    try:
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code == 200:
            with open(save_path, "wb") as file:
                for chunk in response.iter_content(chunk_size=8192):
                    file.write(chunk)
            print(f"File downloaded successfully and saved to {save_path}")
            return {"success": True, "message": f"File downloaded successfully and saved to {save_path}"}
        else:
            error_message = f"Failed to download file. Status code: {response.status_code}. Response: {response.text}"
            print(error_message)
            return {"success": False, "message": error_message}
    except requests.exceptions.RequestException as e:
        error_message = f"Error downloading file from IPFS: {e}"
        print(error_message)
        return {"success": False, "message": error_message}

# QmZCG1a88VCF2Vbej5iijQ8PvURupnetPytLkvTgEyUrhw
