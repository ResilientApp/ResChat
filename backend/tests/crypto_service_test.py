import unittest
import sys
import os
import tempfile
import shutil
from Crypto.PublicKey import RSA
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from crypto_service import *

class TestEncryptionModule(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create temporary directory for test files
        cls.test_dir = tempfile.mkdtemp()
        cls.password = "test_password_123"
        
        # Disable logging during tests
        global write_log
        write_log = lambda *args: None

    @classmethod
    def tearDownClass(cls):
        # Clean up temporary directory
        shutil.rmtree(cls.test_dir)

    def setUp(self):
        # Generate fresh keys for each test
        self.keys = generate_rsa_keys(self.password)
        self.public_key = self.keys[0]
        self.private_key = load_rsa_private_key(self.keys[1], self.password)["message"]
        self.aes_key = generate_random_aes_key()

    def test_01_key_generation(self):
        # Test RSA key generation
        self.assertEqual(len(self.keys), 2)
        self.assertIsInstance(self.public_key, RSA.RsaKey)
        self.assertIsInstance(self.private_key, RSA.RsaKey)
        
        # Test AES key generation
        self.assertEqual(len(self.aes_key), 32)
        self.assertIsInstance(self.aes_key, str)

    def test_02_key_conversion(self):
        # Test public key string conversion
        key_str = public_key_to_string(self.public_key)
        self.assertIsInstance(key_str, str)
        self.assertTrue("BEGIN PUBLIC KEY" in key_str)
        
        # Test string to public key conversion
        converted_key = string_to_public_key(key_str)
        self.assertEqual(self.public_key.export_key(), converted_key.export_key())

    def test_03_private_key_loading(self):
        # Test valid password
        result = load_rsa_private_key(self.keys[1], self.password)
        self.assertTrue(result["result"])
        self.assertIsInstance(result["message"], RSA.RsaKey)
        
        # Test invalid password
        result = load_rsa_private_key(self.keys[1], "wrong_password")
        self.assertFalse(result["result"])

    def test_04_aes_encryption_decryption(self):
        # Test text encryption/decryption
        plaintext = "Secret message 123"
        ciphertext = encrypt_text_with_aes(plaintext, self.aes_key)
        decrypted = decrypt_text_with_aes(ciphertext, self.aes_key)
        self.assertEqual(decrypted, plaintext)
        
        # Test empty string
        empty_cipher = encrypt_text_with_aes("", self.aes_key)
        self.assertEqual(decrypt_text_with_aes(empty_cipher, self.aes_key), "")
        
        # Test invalid key
        self.assertEqual(decrypt_text_with_aes(ciphertext, "Invalid key"), "")

    def test_05_rsa_encryption_decryption(self):
        # Test AES key encryption/decryption
        encrypted_aes = encrypt_aes_key_with_rsa(self.aes_key, self.public_key)
        decrypted_aes = decrypt_aes_key_with_rsa(encrypted_aes, self.private_key)
        self.assertEqual(decrypted_aes, self.aes_key)
        # Test with wrong private key
        wrong_keys = generate_rsa_keys(self.password)
        wrong_private = load_rsa_private_key(wrong_keys[1], self.password)["message"]
        self.assertEqual(decrypt_aes_key_with_rsa(encrypted_aes, wrong_private), "")

    def test_06_file_operations(self):
        test_content = "Test file content\nLine 2\nLine 3"
        original_path = os.path.join(self.test_dir, "test.txt")
        encrypted_path = ""
        decrypted_path = os.path.join(self.test_dir, "decrypted.txt")
        aes_key_1 = generate_random_aes_key()
        with open(original_path, "w") as f:
            f.write(test_content)
        
        try:
            encrypt_result = encrypt_file_with_aes(original_path, aes_key_1)
            self.assertTrue(encrypt_result["result"])
            encrypted_path = encrypt_result["message"]
            print(f"Encrypted file path: {encrypted_path}")
            
            decrypt_result = decrypt_file_with_aes(encrypted_path, aes_key_1, decrypted_path)
            self.assertTrue(decrypt_result["result"])
            
            with open(decrypted_path, "r") as f:
                self.assertEqual(f.read(), test_content)
        finally:
            if os.path.exists(encrypted_path):
                os.remove(encrypted_path)
            if os.path.exists(decrypted_path):
                os.remove(decrypted_path)

    def test_07_key_verification(self):
        self.assertTrue(verify_key_pair(self.public_key, self.private_key))
        
        new_keys = generate_rsa_keys(self.password)
        self.assertFalse(verify_key_pair(new_keys[0], self.private_key))

    def test_08_disk_operations(self):
        # Test writing/loading keys
        write_keys_in_disk(self.public_key, self.keys[1])
        
        # Load public key
        loaded_public = load_public_key_from_disk()
        
        # Verify public keys match by comparing their PEM strings
        original_public_pem = public_key_to_string(self.public_key)
        loaded_public_pem = public_key_to_string(loaded_public)
        self.assertEqual(original_public_pem, loaded_public_pem, "Public keys mismatch")
        
        # Load private key
        private_result = load_private_key_from_disk(self.password)
        self.assertTrue(private_result["result"], 
                    f"Private key load failed: {private_result['message']}")
        
        # Unwrap nested result
        loaded_private_wrapper = private_result["message"]
        self.assertTrue(loaded_private_wrapper["result"], 
                    f"Key parsing failed: {loaded_private_wrapper['message']}")
        loaded_private = loaded_private_wrapper["message"]
        
        # Verify private keys match by checking they form a valid pair
        self.assertTrue(
            verify_key_pair(self.public_key, loaded_private),
            "Loaded private key doesn't match original public key"
        )
        
        # Additional check: verify the inverse relationship
        self.assertTrue(
            verify_key_pair(loaded_public, self.private_key),
            "Original private key doesn't match loaded public key"
        )

if __name__ == '__main__':
    unittest.main(verbosity=2)