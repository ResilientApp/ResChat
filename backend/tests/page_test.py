import unittest
import numpy as np
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from page import Page, from_string

class TestPageClass(unittest.TestCase):
    def setUp(self):
        self.page = Page()
        self.sample_messages = [
            {
                "sender": "SenderUserName1",
                "type": "TEXT",
                "timestamp": "2025-01-14 16:44:19",
                "message": "Hello, this is a text message.",
                "sender_key": "EncryptedAESKey1",
                "receiver_key": "EncryptedAESKey2"
            },
            {
                "sender": "SenderUserName2",
                "type": "FILE",
                "timestamp": "2025-01-13 16:44:19",
                "message": '{"file_size": 12356, "file_name": "test.txt", "cid": 12345678}',
                "sender_key": "EncryptedAESKey1",
                "receiver_key": "EncryptedAESKey2"
            }
        ]
        
        for msg in self.sample_messages:
            self.page.add_message(
                msg["sender"], msg["type"], msg["timestamp"],
                msg["message"], msg["sender_key"], msg["receiver_key"]
            )

    def test_initialization(self):
        new_page = Page()
        self.assertEqual(new_page.message_count, 0)
        self.assertTrue(np.all(new_page.message == np.empty((20, 6), dtype=object)))

    def test_add_message(self):
        initial_count = self.page.message_count
        result = self.page.add_message("NewSender", "TEXT", "2025-01-15 00:00:00", 
                                      "New message", "key1", "key2")
        self.assertTrue(result)
        self.assertEqual(self.page.message_count, initial_count + 1)

        full_page = Page()
        for i in range(20):
            full_page.add_message(f"Sender{i}", "TEXT", "2025-01-15 00:00:00", 
                                f"Message{i}", "key1", "key2")
        result = full_page.add_message("ExtraSender", "TEXT", "2025-01-15 00:00:00", 
                                     "Extra message", "key1", "key2")
        self.assertFalse(result)
        self.assertEqual(full_page.message_count, 20)

    def test_is_full(self):
        self.assertFalse(self.page.is_full())
        
        full_page = Page()
        for i in range(20):
            full_page.add_message(f"Sender{i}", "TEXT", "2025-01-15 00:00:00", 
                                f"Message{i}", "key1", "key2")
        self.assertTrue(full_page.is_full())

    def test_sort_by_time(self):
        original_timestamps = [msg[2] for msg in self.page.all_messages()]
        self.assertEqual(original_timestamps, [m["timestamp"] for m in self.sample_messages])

        self.page.sort_by_time()
        sorted_timestamps = [msg[2] for msg in self.page.all_messages()]
        expected_order = sorted([m["timestamp"] for m in self.sample_messages])
        self.assertEqual(sorted_timestamps, expected_order)

    def test_to_string(self):
        page_str = self.page.to_string()
        lines = page_str.strip().split('\n')
        self.assertEqual(len(lines), 12)
        self.assertEqual(lines[0], self.sample_messages[0]["sender"])
        self.assertEqual(lines[1], self.sample_messages[0]["type"])

    def test_from_string(self):
        page_str = self.page.to_string()
        reconstructed = from_string(page_str)
        self.assertEqual(self.page.message_count, reconstructed.message_count)
        np.testing.assert_array_equal(self.page.all_messages(), reconstructed.all_messages())

    def test_all_messages(self):
        messages = self.page.all_messages()
        self.assertEqual(messages.shape, (2, 6))
        self.assertEqual(messages[0][0], self.sample_messages[0]["sender"])
        self.assertEqual(messages[1][3], self.sample_messages[1]["message"])

if __name__ == '__main__':
    unittest.main(verbosity=2)