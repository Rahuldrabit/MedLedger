"""
IPFS Client wrapper for EHR system
Handles file upload, download, and pinning operations
"""

import ipfshttpclient
from typing import Optional, Dict, Any
import os
import logging

logger = logging.getLogger(__name__)


class IPFSClient:
    """IPFS client for managing encrypted EHR files"""

    def __init__(self, api_url: str = "/ip4/127.0.0.1/tcp/5001"):
        """
        Initialize IPFS client

        Args:
            api_url: IPFS API endpoint (default: localhost:5001)
        """
        try:
            self.client = ipfshttpclient.connect(api_url)
            logger.info(f"Connected to IPFS node: {self.get_version()}")
        except Exception as e:
            logger.error(f"Failed to connect to IPFS: {e}")
            raise

    def get_version(self) -> str:
        """Get IPFS node version"""
        return self.client.version()["Version"]

    def add_file(self, file_path: str, pin: bool = True) -> str:
        """
        Upload file to IPFS

        Args:
            file_path: Path to file to upload
            pin: Whether to pin file (prevent garbage collection)

        Returns:
            IPFS hash (CID) of uploaded file
        """
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")

            result = self.client.add(file_path, pin=pin)
            cid = result["Hash"]

            logger.info(f"Uploaded file to IPFS: {cid}")
            return cid
        except Exception as e:
            logger.error(f"Failed to upload file to IPFS: {e}")
            raise

    def add_bytes(self, data: bytes, pin: bool = True) -> str:
        """
        Upload bytes to IPFS

        Args:
            data: Bytes to upload
            pin: Whether to pin data

        Returns:
            IPFS hash (CID)
        """
        try:
            result = self.client.add_bytes(data)
            if pin:
                self.client.pin.add(result)

            logger.info(f"Uploaded {len(data)} bytes to IPFS: {result}")
            return result
        except Exception as e:
            logger.error(f"Failed to upload bytes to IPFS: {e}")
            raise

    def get_file(self, cid: str, output_path: str) -> str:
        """
        Download file from IPFS

        Args:
            cid: IPFS hash of file
            output_path: Where to save downloaded file

        Returns:
            Path to downloaded file
        """
        try:
            self.client.get(cid, target=output_path)
            downloaded_file = os.path.join(output_path, cid)

            logger.info(f"Downloaded file from IPFS: {cid}")
            return downloaded_file
        except Exception as e:
            logger.error(f"Failed to download file from IPFS: {e}")
            raise

    def get_bytes(self, cid: str) -> bytes:
        """
        Get file content as bytes

        Args:
            cid: IPFS hash of file

        Returns:
            File content as bytes
        """
        try:
            data = self.client.cat(cid)
            logger.info(f"Retrieved {len(data)} bytes from IPFS: {cid}")
            return data
        except Exception as e:
            logger.error(f"Failed to retrieve bytes from IPFS: {e}")
            raise

    def pin(self, cid: str) -> None:
        """Pin content to prevent garbage collection"""
        try:
            self.client.pin.add(cid)
            logger.info(f"Pinned content: {cid}")
        except Exception as e:
            logger.error(f"Failed to pin content: {e}")
            raise

    def unpin(self, cid: str) -> None:
        """Unpin content (allow garbage collection)"""
        try:
            self.client.pin.rm(cid)
            logger.info(f"Unpinned content: {cid}")
        except Exception as e:
            logger.error(f"Failed to unpin content: {e}")
            raise

    def is_pinned(self, cid: str) -> bool:
        """Check if content is pinned"""
        try:
            pins = self.client.pin.ls(type="recursive")
            return cid in pins["Keys"]
        except Exception as e:
            logger.error(f"Failed to check pin status: {e}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Get IPFS repository statistics"""
        try:
            stats = self.client.repo.stat()
            return {
                "repo_size": stats["RepoSize"],
                "storage_max": stats["StorageMax"],
                "num_objects": stats["NumObjects"],
            }
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {}

    def garbage_collect(self) -> None:
        """Run garbage collection to free up space"""
        try:
            self.client.repo.gc()
            logger.info("Garbage collection completed")
        except Exception as e:
            logger.error(f"Failed to run garbage collection: {e}")
            raise

    def close(self) -> None:
        """Close IPFS client connection"""
        if self.client:
            self.client.close()
            logger.info("IPFS client closed")


# Example usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Initialize client
    ipfs = IPFSClient()

    # Example: Upload encrypted file
    # cid = ipfs.add_file("encrypted_ehr.enc", pin=True)
    # print(f"Uploaded file, CID: {cid}")

    # Example: Download file
    # ipfs.get_file(cid, "./downloads/")

    # Example: Get stats
    stats = ipfs.get_stats()
    print(f"IPFS Stats: {stats}")

    # Close connection
    ipfs.close()
