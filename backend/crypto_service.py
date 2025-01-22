"""
This file contains all the encryption and decryption functions
"""
import os, datetime
from helper import write_log
import Crypto
from Crypto.Cipher import PKCS1_OAEP, AES
from Crypto.PublicKey import RSA
import binascii
import sys
sys.path.append("bazel/bazel-bin/aes_encryption")
import pybind_aes

def public_key_to_string(public_key: Crypto.PublicKey.RSA.RsaKey) -> str:
    """Convert RSA public key into string"""
    write_log("Converting RSA public key to string")
    return public_key.exportKey(format='PEM').decode('utf-8')


def string_to_public_key(public_key_string: str) -> Crypto.PublicKey.RSA.RsaKey:
    """Convert RSA public key string into RSA public key"""
    write_log("Converting string to RSA public key")
    return RSA.importKey(public_key_string.encode('utf-8'))


def load_rsa_private_key(private_key: bytes, password: str) -> {}:
    """Convert RSA private key from bytes to Crypto.PublicKey.RSA.RsaKey"""
    write_log("Loading RSA private key")
    try:
        key = RSA.import_key(private_key, passphrase=password)
        write_log("RSA key successfully loaded")
        return {"result": True, "message": key}
    except Exception as e:
        write_log(e)
        return {"result": False, "message": str(e)}


def generate_rsa_keys(password: str) -> list:
    """
    Generate a random RSA key pair and assign password to RSA private key
    : return [RSA public key(Crypto.PublicKey.RSA.RsaKey), RSA private key(bytes)]
    !!!!! this RSA private key can not be used directly,
        it has to call load_rsa_private_key to change RSA
        private key from bytes to Crypto.PublicKey.RSA.RsaKey!!!!!
    """
    write_log("Generating RSA key pair")
    try:
        key = RSA.generate(2048)
        private_key = key.exportKey(passphrase=password, pkcs=8)
        public_key = key.public_key()
        return [public_key, private_key]
    except Exception as e:
        write_log(e)
        return []


def write_keys_in_disk(public_key: Crypto.PublicKey.RSA.RsaKey, private_key: bytes):
    try:
        write_log("Writing RSA public key into disk")
        os.makedirs("keys", exist_ok=True)
        public_key = public_key_to_string(public_key)
        with open(f"keys/public_key.pem", "wb") as pub_key_f:
            pub_key_f.write(public_key.encode('utf-8'))
            pub_key_f.close()

        write_log("Writing RSA private key into disk")
        os.makedirs("keys", exist_ok=True)
        with open("keys/private_key.pem", "wb") as pri_key_f:
            pri_key_f.write(private_key)
            pri_key_f.close()
    except Exception as e:
        write_log(e)
    return


def encrypt_aes_key_with_rsa(aes_key: str, public_key: Crypto.PublicKey.RSA.RsaKey) -> str:
    """User RSA public key to encrypt AES key"""
    write_log("Encrypting AES key with RSA")
    try:
        cipher_rsa = PKCS1_OAEP.new(public_key)
        encrypted_aes_key = cipher_rsa.encrypt(aes_key.encode('utf-8'))
        write_log("AES key encryption success")
        return binascii.hexlify(encrypted_aes_key).decode('ascii')
    except Exception as e:
        write_log(e)
        return ""


def decrypt_aes_key_with_rsa(encrypted_aes_key: str, rsa_private_key) -> str:
    """Use RSA private key to decrypt AES key"""
    write_log("Decrypting AES key with RSA")
    try:
        encrypted_aes_key_bytes = binascii.unhexlify(encrypted_aes_key)
        cipher_rsa = PKCS1_OAEP.new(rsa_private_key)
        aes_key = cipher_rsa.decrypt(encrypted_aes_key_bytes)
        write_log("AES key decryption success")
        return aes_key.decode('utf-8')
    except Exception as e:
        write_log(e)
        return ""


def encrypt_text_with_aes(plain_text: str, aes_key: str) -> str:
    """Use AES to encrypt a string"""
    write_log("Encrypting text")
    try:
        cipher_text =  pybind_aes.aes_encrypt_text(plain_text, aes_key)
        write_log("AES encryption success")
        return cipher_text
    except Exception as e:
        write_log(e)
        return ""


def decrypt_text_with_aes(cipher_text: str, aes_key: str) -> str:
    """Use AES to decrypt a string"""
    write_log("Decrypting text")
    try:
        plain_text = pybind_aes.aes_decrypt_text(cipher_text, aes_key)
        write_log("AES decryption success")
        return plain_text
    except Exception as e:
        write_log(e)
        return ""


def generate_random_aes_key():
    """Random generate one AES key"""
    write_log("Generating AES key")
    return pybind_aes.generate_random_key()


def load_public_key_from_disk() -> Crypto.PublicKey.RSA.RsaKey:
    """
    Load RSA public key from disk(/keys/public_key.pem)
    : return RSA key type object (Not a string or bytes)
    """
    write_log("Loading RSA public key from disk")
    try:
        with open("keys/public_key.pem", "rb") as pub_key_f:
            public_key_string = pub_key_f.read().decode('utf-8')
            public_key = string_to_public_key(public_key_string)
            write_log("RSA public key successfully loaded")
            return public_key
    except FileNotFoundError:
        write_log("Public key file not found")
    except Exception as e:
        write_log(e)
    return None


def load_private_key_from_disk(password: str) -> {}:
    """
    Load RSA private key from disk(/keys/private_key.pem)
    : return {"result": True/False, "message": RSA private key(RSA key type object)/Error message}
    """
    write_log("Loading RSA private key from disk")
    try:
        with open("keys/private_key.pem", "rb") as pri_key_f:
            private_key_bytes = pri_key_f.read()
            private_key = load_rsa_private_key(private_key_bytes, password)
            write_log("RSA private key successfully loaded")
            return {"result": True, "message": private_key}
    except FileNotFoundError:
        write_log("Private key file not found")
        return {"result": False, "message": "Private key file not found"}
    except Exception as e:
        write_log(e)
        return {"result": False, "message": str(e)}


def verify_key_pair(public_key: Crypto.PublicKey.RSA.RsaKey, private_key: Crypto.PublicKey.RSA.RsaKey) -> bool:
    """Verify if the RSA key pair matches"""
    write_log("Verifying RSA key pair")
    try:
        test_message = binascii.hexlify(os.urandom(20)).decode('utf-8')
        cipher_rsa_enc = PKCS1_OAEP.new(public_key)
        encrypted_message = cipher_rsa_enc.encrypt(test_message.encode('utf-8'))
        cipher_rsa_dec = PKCS1_OAEP.new(private_key)
        decrypted_message = cipher_rsa_dec.decrypt(encrypted_message).decode('utf-8')
        res = decrypted_message == test_message
        if res:
            write_log("RSA key pair verified")
            return True
        else:
            write_log("RSA key pair doesn't match")
            return False
    except Exception as e:
        write_log(e)
        return False


def encrypt_file_with_aes(file_path: str, aes_key: str) -> {}:
    """
    This function will encrypt a file and return the encrypted file path
    """
    # Check input file path
    if not os.path.exists(file_path):
        return {"result": False, "message": f"{file_path} does not exists."}

    # Check output path
    output_path = "temp/" + os.path.basename(file_path) + ".enc"
    count = 1
    while True:
        if os.path.exists(output_path):
            output_path = "temp/" + os.path.basename(file_path) + f"({count})" + ".enc"
            count += 1
        else:
            break

    # encrypt
    res = pybind_aes.aes_encrypt_file(file_path, aes_key, output_path)

    if res:
        return {"result": True, "message": output_path}
    else:
        return {"result": False, "message": "Fail to encrypt file"}


def decrypt_file_with_aes(encrypted_file_path: str, aes_key: str, output_path):
    """
    Decrypt a file and return output file path
    """

    # Check if input path exists
    if not os.path.exists(encrypted_file_path):
        return {"result": False, "message": f"{encrypted_file_path} does not exists"}

    # Decrypt file
    res = pybind_aes.aes_decrypt_file(encrypted_file_path, output_path, aes_key)

    if res:
        return {"result": True, "message": output_path}
    else:
        return {"result": False, "message": "Fail to decrypt file"}


