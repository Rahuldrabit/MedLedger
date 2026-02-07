"""
Verification script to test the Python environment setup
"""

import sys


def check_imports():
    """Check if all required packages can be imported"""
    print("🔍 Checking Python environment...\n")

    packages = {
        "fastapi": "FastAPI",
        "uvicorn": "Uvicorn",
        "pydantic": "Pydantic",
        "cryptography": "Cryptography",
        "Crypto": "PyCryptodome",
        "ipfshttpclient": "IPFS HTTP Client",
        "sqlalchemy": "SQLAlchemy",
        "pytest": "Pytest",
        "jwt": "PyJWT",
        "requests": "Requests",
        "aiohttp": "aiohttp",
        "black": "Black",
        "isort": "isort",
    }

    failed = []

    for module, name in packages.items():
        try:
            __import__(module)
            print(f"✅ {name}")
        except ImportError as e:
            print(f"❌ {name} - {e}")
            failed.append(name)

    print(f"\n{'='*50}")
    if not failed:
        print("✨ All packages installed successfully!")
        print(f"🐍 Python version: {sys.version}")
        return True
    else:
        print(f"⚠️  Failed to import: {', '.join(failed)}")
        return False


if __name__ == "__main__":
    success = check_imports()
    sys.exit(0 if success else 1)
