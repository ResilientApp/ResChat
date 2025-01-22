#include <openssl/evp.h>
#include <openssl/aes.h>
#include <openssl/rand.h>
#include <iostream>
#include <cstring>
#include <vector>
#include <iomanip>
#include <sstream>
#include <pybind11/pybind11.h>
#include <pybind11/stl.h> // For using std::string with pybind11
#include <filesystem>
#include <openssl/bio.h>
#include <openssl/buffer.h>
#include <openssl/evp.h>
#include <fstream>



// Function to generate a random AES key of the specified length (in bytes) and return it as a hex string
std::string generate_random_key() {
    std::vector<unsigned char> key(16);
    if (!RAND_bytes(key.data(), 16)) {
        throw std::runtime_error("Error: Random key generation failed.");
    }

    // Convert key to hex string
    std::ostringstream oss;
    for (unsigned char c : key) {
        oss << std::hex << std::setw(2) << std::setfill('0') << (int)c;
    }
    return oss.str();
}

// Convert hex string to byte vector
std::vector<unsigned char> hex_string_to_bytes(const std::string& hex_str) {
    std::vector<unsigned char> bytes;
    for (size_t i = 0; i < hex_str.length(); i += 2) {
        std::string byte_string = hex_str.substr(i, 2);
        unsigned char byte = (unsigned char) strtol(byte_string.c_str(), nullptr, 16);
        bytes.push_back(byte);
    }
    return bytes;
}

bool aes_encrypt_file(const std::string& input_file, const std::string& hex_key, const std::string& output_path) {
    // Convert key from hex string to byte vector
    std::vector<unsigned char> key = hex_string_to_bytes(hex_key);

    // Open input file
    std::ifstream infile(input_file, std::ios::binary);
    if (!infile.is_open()) {
        std::cerr << "Error: Cannot open input file.\n";
        return false;
    }

    // Define the path for the temp folder relative to the executable location
    std::filesystem::path temp_folder = std::filesystem::current_path() / "temp";
    std::filesystem::create_directory(temp_folder);

    // Construct the output file path in the temp directory with .enc extension
    std::filesystem::path input_path(input_file);
//    std::filesystem::path output_path = temp_folder / (input_path.filename().string() + ".enc");

    // Open output file for encrypted content
    std::ofstream outfile(output_path, std::ios::binary);
    if (!outfile.is_open()) {
        std::cerr << "Error: Cannot open output file.\n";
        return false;
    }

    // Initialize context for encryption (AES-128-ECB)
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    EVP_EncryptInit_ex(ctx, EVP_aes_128_ecb(), nullptr, key.data(), nullptr);

    const int buffer_size = 4096;
    unsigned char buffer[buffer_size]; // Read buffer
    unsigned char cipher_buffer[buffer_size + AES_BLOCK_SIZE]; // Ciphertext buffer
    int len = 0, cipher_len = 0;

    // Read from input file and encrypt in chunks
    while (infile.good()) {
        infile.read(reinterpret_cast<char*>(buffer), buffer_size);
        int read_len = infile.gcount();

        // Encrypt the data read from the file
        if (!EVP_EncryptUpdate(ctx, cipher_buffer, &len, buffer, read_len)) {
            std::cerr << "Error: Encryption failed.\n";
            EVP_CIPHER_CTX_free(ctx);
            return false;
        }
        outfile.write(reinterpret_cast<char*>(cipher_buffer), len);
    }

    // Finalize encryption
    if (!EVP_EncryptFinal_ex(ctx, cipher_buffer, &cipher_len)) {
        std::cerr << "Error: Final encryption step failed.\n";
        EVP_CIPHER_CTX_free(ctx);
        return false;
    }
    outfile.write(reinterpret_cast<char*>(cipher_buffer), cipher_len);

    // Cleanup
    EVP_CIPHER_CTX_free(ctx);
    infile.close();
    outfile.close();
    return true;
}

bool aes_decrypt_file(const std::string& input_file, const std::string& output_file, const std::string& hex_key) {
    // Convert key from hex string to byte vector
    std::vector<unsigned char> key = hex_string_to_bytes(hex_key);

    // Open input file for decryption
    std::ifstream infile(input_file, std::ios::binary);
    if (!infile.is_open()) {
        std::cerr << "Error: Cannot open input file for decryption.\n";
        return false;
    }

    // Open output file for decrypted content
    std::ofstream outfile(output_file, std::ios::binary);
    if (!outfile.is_open()) {
        std::cerr << "Error: Cannot open output file for decryption.\n";
        return false;
    }

    // Initialize context for decryption (AES-128-ECB)
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    EVP_DecryptInit_ex(ctx, EVP_aes_128_ecb(), nullptr, key.data(), nullptr);

    const int buffer_size = 4096;
    unsigned char buffer[buffer_size]; // Read buffer
    unsigned char plain_buffer[buffer_size + AES_BLOCK_SIZE]; // Plaintext buffer
    int len = 0, plain_len = 0;

    // Read from input file and decrypt in chunks
    while (infile.good()) {
        infile.read(reinterpret_cast<char*>(buffer), buffer_size);
        int read_len = infile.gcount();

        // Decrypt the data read from the file
        if (!EVP_DecryptUpdate(ctx, plain_buffer, &len, buffer, read_len)) {
            std::cerr << "Error: Decryption failed.\n";
            EVP_CIPHER_CTX_free(ctx);
            return false;
        }
        outfile.write(reinterpret_cast<char*>(plain_buffer), len);
    }

    // Finalize decryption
    if (!EVP_DecryptFinal_ex(ctx, plain_buffer, &plain_len)) {
        std::cerr << "Error: Final decryption step failed.\n";
        EVP_CIPHER_CTX_free(ctx);
        return false;
    }
    outfile.write(reinterpret_cast<char*>(plain_buffer), plain_len);

    // Cleanup
    EVP_CIPHER_CTX_free(ctx);
    infile.close();
    outfile.close();
    return true;
}

std::string base64_encode(const std::vector<unsigned char>& input) {
    BIO* b64 = BIO_new(BIO_f_base64());
    BIO* bmem = BIO_new(BIO_s_mem());
    b64 = BIO_push(b64, bmem);

    BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL); // No newlines in base64 output
    BIO_write(b64, input.data(), input.size());
    BIO_flush(b64);

    BUF_MEM* bptr;
    BIO_get_mem_ptr(b64, &bptr);

    std::string output(bptr->data, bptr->length);
    BIO_free_all(b64);

    return output;
}

// Base64 decoding function
std::vector<unsigned char> base64_decode(const std::string& input) {
    BIO* b64 = BIO_new(BIO_f_base64());
    BIO* bmem = BIO_new_mem_buf(input.data(), input.size());
    b64 = BIO_push(b64, bmem);

    BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL); // No newlines in base64 input

    std::vector<unsigned char> output(input.size());
    int decoded_length = BIO_read(b64, output.data(), input.size());
    output.resize(decoded_length);
    BIO_free_all(b64);

    return output;
}

// Encrypt plaintext string using AES-128-ECB and return base64 encoded string
std::string aes_encrypt_text(const std::string& plaintext, const std::string& hex_key) {
    // Convert key from hex string to byte vector
    std::vector<unsigned char> key = hex_string_to_bytes(hex_key);

    // Initialize context for encryption (AES-128-ECB)
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    EVP_EncryptInit_ex(ctx, EVP_aes_128_ecb(), nullptr, key.data(), nullptr);

    // Prepare buffers
    const int buffer_size = plaintext.size() + AES_BLOCK_SIZE;
    std::vector<unsigned char> cipher_buffer(buffer_size);
    int len = 0, cipher_len = 0;

    // Encrypt the plaintext
    if (!EVP_EncryptUpdate(ctx, cipher_buffer.data(), &len,
                           reinterpret_cast<const unsigned char*>(plaintext.data()), plaintext.size())) {
        std::cerr << "Error: Encryption failed.\n";
        EVP_CIPHER_CTX_free(ctx);
        return "";
    }

    // Finalize encryption
    if (!EVP_EncryptFinal_ex(ctx, cipher_buffer.data() + len, &cipher_len)) {
        std::cerr << "Error: Final encryption step failed.\n";
        EVP_CIPHER_CTX_free(ctx);
        return "";
    }

    len += cipher_len;

    // Cleanup
    EVP_CIPHER_CTX_free(ctx);

    // Resize cipher buffer to actual length
    cipher_buffer.resize(len);

    // Return base64 encoded string
    return base64_encode(cipher_buffer);
}

// Decrypt base64 encoded ciphertext string using AES-128-ECB
std::string aes_decrypt_text(const std::string& base64_ciphertext, const std::string& hex_key) {
    // Convert key from hex string to byte vector
    std::vector<unsigned char> key = hex_string_to_bytes(hex_key);

    // Decode base64 ciphertext
    std::vector<unsigned char> ciphertext = base64_decode(base64_ciphertext);

    // Initialize context for decryption (AES-128-ECB)
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    EVP_DecryptInit_ex(ctx, EVP_aes_128_ecb(), nullptr, key.data(), nullptr);

    // Prepare buffers
    const int buffer_size = ciphertext.size() + AES_BLOCK_SIZE;
    std::vector<unsigned char> plain_buffer(buffer_size);
    int len = 0, plain_len = 0;

    // Decrypt the ciphertext
    if (!EVP_DecryptUpdate(ctx, plain_buffer.data(), &len,
                           ciphertext.data(), ciphertext.size())) {
        std::cerr << "Error: Decryption failed.\n";
        EVP_CIPHER_CTX_free(ctx);
        return "";
    }

    // Finalize decryption
    if (!EVP_DecryptFinal_ex(ctx, plain_buffer.data() + len, &plain_len)) {
        std::cerr << "Error: Final decryption step failed.\n";
        EVP_CIPHER_CTX_free(ctx);
        return "";
    }

    len += plain_len;

    // Cleanup
    EVP_CIPHER_CTX_free(ctx);

    // Convert decrypted data to string
    return std::string(plain_buffer.begin(), plain_buffer.begin() + len);
}

PYBIND11_MODULE(pybind_aes, m) {
    m.def("aes_encrypt_file", &aes_encrypt_file, "");
    m.def("aes_decrypt_file", &aes_decrypt_file, "");
    m.def("generate_random_key", &generate_random_key, "Generate random 16 bytes key");
    m.def("aes_encrypt_text", &aes_encrypt_text, "");
    m.def("aes_decrypt_text", &aes_decrypt_text, "");
}
