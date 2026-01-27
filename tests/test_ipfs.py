"""
Test IPFS client functionality
"""

import pytest
import os
import tempfile
from ehr_system.ipfs import IPFSClient


@pytest.fixture
def ipfs_client():
    """Create IPFS client for testing"""
    try:
        client = IPFSClient()
        yield client
        client.close()
    except Exception as e:
        pytest.skip(f"IPFS node not available: {e}")


def test_ipfs_connection(ipfs_client):
    """Test IPFS connection"""
    version = ipfs_client.get_version()
    assert version is not None
    assert len(version) > 0


def test_upload_and_download_bytes(ipfs_client):
    """Test uploading and downloading bytes"""
    test_data = b"Test EHR data for IPFS"
    
    # Upload
    cid = ipfs_client.add_bytes(test_data, pin=True)
    assert cid is not None
    assert len(cid) > 0
    
    # Download
    downloaded_data = ipfs_client.get_bytes(cid)
    assert downloaded_data == test_data
    
    # Cleanup
    ipfs_client.unpin(cid)


def test_upload_and_download_file(ipfs_client):
    """Test uploading and downloading file"""
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, mode='wb') as f:
        test_data = b"Test EHR file content"
        f.write(test_data)
        temp_file = f.name
    
    try:
        # Upload
        cid = ipfs_client.add_file(temp_file, pin=True)
        assert cid is not None
        
        # Download
        with tempfile.TemporaryDirectory() as temp_dir:
            downloaded_path = ipfs_client.get_file(cid, temp_dir)
            
            with open(downloaded_path, 'rb') as f:
                downloaded_data = f.read()
            
            assert downloaded_data == test_data
        
        # Cleanup
        ipfs_client.unpin(cid)
    
    finally:
        os.unlink(temp_file)


def test_pin_operations(ipfs_client):
    """Test pinning and unpinning"""
    test_data = b"Pin test data"
    
    # Upload with pin
    cid = ipfs_client.add_bytes(test_data, pin=True)
    
    # Check if pinned
    assert ipfs_client.is_pinned(cid)
    
    # Unpin
    ipfs_client.unpin(cid)
    
    # Pin again
    ipfs_client.pin(cid)
    assert ipfs_client.is_pinned(cid)
    
    # Cleanup
    ipfs_client.unpin(cid)


def test_get_stats(ipfs_client):
    """Test getting repository statistics"""
    stats = ipfs_client.get_stats()
    
    assert "repo_size" in stats
    assert "storage_max" in stats
    assert "num_objects" in stats
    assert stats["repo_size"] >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
