"""
Cryptography utilities for EHR system
Handles AES encryption/decryption and RSA key management
"""

import os
import hashlib
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
import base64


class AESCipher:
    """AES-256-GCM encryption/decryption"""

    @staticmethod
    def generate_key() -> bytes:
        """Generate a random 256-bit AES key"""
        return get_random_bytes(32)  # 256 bits

    @staticmethod
    def encrypt(data: bytes, key: bytes) -> tuple[bytes, bytes, bytes]:
        """
        Encrypt data with AES-256-GCM

        Args:
            data: Data to encrypt
            key: 256-bit AES key

        Returns:
            Tuple of (ciphertext, nonce, tag)
        """
        cipher = AES.new(key, AES.MODE_GCM)
        ciphertext, tag = cipher.encrypt_and_digest(data)
        return ciphertext, cipher.nonce, tag

    @staticmethod
    def decrypt(ciphertext: bytes, key: bytes, nonce: bytes, tag: bytes) -> bytes:
        """
        Decrypt data with AES-256-GCM

        Args:
            ciphertext: Encrypted data
            key: 256-bit AES key
            nonce: Nonce used during encryption
            tag: Authentication tag

        Returns:
            Decrypted data
        """
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        data = cipher.decrypt_and_verify(ciphertext, tag)
        return data

    @staticmethod
    def encrypt_file(input_path: str, output_path: str, key: bytes) -> dict:
        """
        Encrypt a file

        Args:
            input_path: Path to file to encrypt
            output_path: Path for encrypted file
            key: AES encryption key

        Returns:
            Dictionary with nonce and tag (needed for decryption)
        """
        with open(input_path, "rb") as f:
            data = f.read()

        ciphertext, nonce, tag = AESCipher.encrypt(data, key)

        with open(output_path, "wb") as f:
            f.write(ciphertext)

        return {
            "nonce": base64.b64encode(nonce).decode("utf-8"),
            "tag": base64.b64encode(tag).decode("utf-8"),
        }

    @staticmethod
    def decrypt_file(input_path: str, output_path: str, key: bytes, nonce: str, tag: str) -> None:
        """
        Decrypt a file

        Args:
            input_path: Path to encrypted file
            output_path: Path for decrypted file
            key: AES decryption key
            nonce: Base64-encoded nonce
            tag: Base64-encoded authentication tag
        """
        with open(input_path, "rb") as f:
            ciphertext = f.read()

        nonce_bytes = base64.b64decode(nonce)
        tag_bytes = base64.b64decode(tag)

        data = AESCipher.decrypt(ciphertext, key, nonce_bytes, tag_bytes)

        with open(output_path, "wb") as f:
            f.write(data)


class RSACipher:
    """RSA-2048 encryption for key exchange"""

    @staticmethod
    def generate_keypair(key_size: int = 2048) -> tuple[bytes, bytes]:
        """
        Generate RSA key pair

        Args:
            key_size: Key size in bits (default 2048)

        Returns:
            Tuple of (private_key_pem, public_key_pem)
        """
        key = RSA.generate(key_size)
        private_key = key.export_key()
        public_key = key.publickey().export_key()
        return private_key, public_key

    @staticmethod
    def encrypt(data: bytes, public_key_pem: bytes) -> bytes:
        """
        Encrypt data with RSA public key

        Args:
            data: Data to encrypt (max 190 bytes for 2048-bit key)
            public_key_pem: RSA public key in PEM format

        Returns:
            Encrypted data
        """
        public_key = RSA.import_key(public_key_pem)
        cipher = PKCS1_OAEP.new(public_key)
        return cipher.encrypt(data)

    @staticmethod
    def decrypt(ciphertext: bytes, private_key_pem: bytes) -> bytes:
        """
        Decrypt data with RSA private key

        Args:
            ciphertext: Encrypted data
            private_key_pem: RSA private key in PEM format

        Returns:
            Decrypted data
        """
        private_key = RSA.import_key(private_key_pem)
        cipher = PKCS1_OAEP.new(private_key)
        return cipher.decrypt(ciphertext)

    @staticmethod
    def save_key(key: bytes, path: str) -> None:
        """Save key to file"""
        with open(path, "wb") as f:
            f.write(key)

    @staticmethod
    def load_key(path: str) -> bytes:
        """Load key from file"""
        with open(path, "rb") as f:
            return f.read()


def hash_sha256(data: bytes) -> str:
    """Calculate SHA-256 hash of data"""
    return hashlib.sha256(data).hexdigest()


def hash_file(file_path: str) -> str:
    """Calculate SHA-256 hash of a file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


# Example usage
if __name__ == "__main__":
    # Generate RSA key pair
    private_key, public_key = RSACipher.generate_keypair()
    print("RSA key pair generated")

    # Generate AES key
    aes_key = AESCipher.generate_key()
    print(f"AES key generated: {len(aes_key)} bytes")

    # Encrypt AES key with RSA
    encrypted_aes_key = RSACipher.encrypt(aes_key, public_key)
    print(f"AES key encrypted with RSA: {len(encrypted_aes_key)} bytes")

    # Decrypt AES key
    decrypted_aes_key = RSACipher.decrypt(encrypted_aes_key, private_key)
    assert decrypted_aes_key == aes_key
    print("AES key decryption successful")

    # Test AES encryption
    test_data = b"Sensitive EHR data"
    ciphertext, nonce, tag = AESCipher.encrypt(test_data, aes_key)
    print(f"Data encrypted: {len(ciphertext)} bytes")

    # Decrypt
    decrypted = AESCipher.decrypt(ciphertext, aes_key, nonce, tag)
    assert decrypted == test_data
    print("AES encryption/decryption successful")
