import pytest
import os
import hashlib
from app.password_logic import PasswordManager
from cryptography.fernet import Fernet
import json
from pathlib import Path # Import Path

# Fixture to create a temporary instance directory for each test
@pytest.fixture
def temp_password_manager(tmp_path):
    # Create a dummy user_id
    user_id = "test_user"
    hashed_user_id = hashlib.sha256(user_id.encode()).hexdigest()

    # Create a temporary 'instance' directory within tmp_path
    instance_path = tmp_path / "instance"
    instance_path.mkdir()

    # Patch os.path.join to use the temporary instance path
    original_os_path_join = os.path.join
    def mock_os_path_join(*args):
        if args[0] == 'instance':
            # If the first argument is 'instance', join it with the temporary path
            # Use Path to correctly join multiple path components
            return str(instance_path / Path(*args[1:]))
        return original_os_path_join(*args)
    
    os.path.join = mock_os_path_join

    manager = PasswordManager(user_id)
    yield manager

    # Restore original os.path.join after the test
    os.path.join = original_os_path_join

def test_derive_key_consistency(temp_password_manager):
    manager = temp_password_manager
    password = "test_password"
    salt = os.urandom(16)
    key1 = manager.derive_key(password, salt)
    key2 = manager.derive_key(password, salt)
    assert key1 == key2

def test_set_key_new_user(temp_password_manager):
    manager = temp_password_manager
    password = "master_password"
    
    # Ensure salt and credentials file do not exist initially
    assert not os.path.exists(manager.salt_filename)
    assert not os.path.exists(manager.filename)

    manager.set_key(password)

    # Check if key is set
    assert manager.key is not None
    # Check if salt file was created
    assert os.path.exists(manager.salt_filename)
    # Check if credentials file was created (empty)
    assert os.path.exists(manager.filename)
    with open(manager.filename, 'rb') as f:
        assert f.read() == b'' # Should be empty initially

def test_set_key_existing_user(temp_password_manager):
    manager = temp_password_manager
    password = "master_password"

    # Simulate an existing user by creating a salt file
    initial_salt = os.urandom(16)
    with open(manager.salt_filename, 'wb') as f:
        f.write(initial_salt)
    
    # Ensure credentials file does not exist initially
    assert not os.path.exists(manager.filename)

    manager.set_key(password)

    # Check if key is set
    assert manager.key is not None
    # Check if the same salt was loaded
    loaded_salt = manager.load_salt()
    assert loaded_salt == initial_salt
    # Credentials file should still not exist if it wasn't created by set_key
    # (set_key only creates it if salt_filename doesn't exist)
    assert not os.path.exists(manager.filename) # This is important, set_key only creates credentials.json if salt is new

def test_save_and_load_credentials(temp_password_manager):
    manager = temp_password_manager
    password = "master_password"
    manager.set_key(password)

    test_credentials = {
        "google": {
            "tags": ["email", "work"],
            "fields": {"username": "test@example.com", "password": "secure_password"}
        },
        "github": {
            "tags": ["dev"],
            "fields": {"username": "testdev", "token": "ghp_123"}
        }
    }

    # Save credentials
    assert manager.save_credentials(test_credentials)

    # Load credentials and verify
    loaded_creds = manager.load_credentials()
    assert loaded_creds == test_credentials

def test_load_credentials_empty_file(temp_password_manager):
    manager = temp_password_manager
    password = "master_password"
    manager.set_key(password) # This creates an empty credentials file

    loaded_creds = manager.load_credentials()
    assert loaded_creds == {}

def test_load_credentials_wrong_password(temp_password_manager):
    manager = temp_password_manager
    
    # Set key with correct password and save some credentials
    correct_password = "correct_master_password"
    manager.set_key(correct_password)
    manager.save_credentials({"test": {"tags": [], "fields": {}}})

    # Create a new manager instance (or reset key) and try to load with wrong password
    # We need to ensure the salt file exists for the new manager to load
    # For this test, we'll simulate a new login attempt with a wrong password
    
    # First, ensure the salt file is present for the new manager to load
    # The fixture already ensures the instance path is mocked, so we just need to
    # create a new manager instance with the same user_id but a different password attempt.
    
    # Re-initialize manager to simulate a new session
    user_id = "test_user"
    new_manager = PasswordManager(user_id)
    
    # Load the salt that was created by the first manager instance
    assert os.path.exists(new_manager.salt_filename)
    
    wrong_password = "wrong_master_password"
    new_manager.set_key(wrong_password) # This will derive a different key

    loaded_creds = new_manager.load_credentials()
    assert loaded_creds is None # Should return None on decryption failure

# New tests for CRUD operations, search, and tags

def test_create_credential(temp_password_manager):
    manager = temp_password_manager
    password = "master_password"
    manager.set_key(password)

    service = "new_service"
    tags = ["web", "social"]
    fields = {"username": "user1", "password": "pass1"}

    assert manager.create_credential(service, tags, fields)
    creds = manager.load_credentials()
    assert service in creds
    assert creds[service]['tags'] == tags
    assert creds[service]['fields'] == fields

    # Test with invalid inputs
    assert not manager.create_credential("", tags, fields)
    assert not manager.create_credential(service, [], fields)
    assert not manager.create_credential(service, tags, {})

    # Test when key is not set
    manager.key = None
    assert not manager.create_credential("another_service", ["tag"], {"f": "v"})

def test_delete_credential(temp_password_manager):
    manager = temp_password_manager
    password = "master_password"
    manager.set_key(password)

    service = "to_delete"
    manager.create_credential(service, ["tag"], {"f": "v"})
    assert service in manager.load_credentials()

    assert manager.delete_credential(service)
    assert service not in manager.load_credentials()

    # Test deleting non-existent credential
    assert not manager.delete_credential("non_existent")

    # Test when key is not set
    manager.key = None
    assert not manager.delete_credential(service)

def test_update_credential(temp_password_manager):
    manager = temp_password_manager
    password = "master_password"
    manager.set_key(password)

    service = "to_update"
    manager.create_credential(service, ["old_tag"], {"old_field": "old_value"})
    assert service in manager.load_credentials()

    new_tags = ["new_tag", "updated"]
    new_fields = {"new_field": "new_value"}

    assert manager.update_credential(service, new_tags, new_fields)
    creds = manager.load_credentials()
    assert creds[service]['tags'] == new_tags
    assert creds[service]['fields'] == new_fields

    # Test updating non-existent credential
    assert not manager.update_credential("non_existent", [], {})

    # Test when key is not set
    manager.key = None
    assert not manager.update_credential(service, [], {})

def test_search_credentials(temp_password_manager):
    manager = temp_password_manager
    password = "master_password"
    manager.set_key(password)

    manager.create_credential("Google", ["email", "work"], {"u": "a"})
    manager.create_credential("GitHub", ["dev", "code"], {"u": "b"})
    manager.create_credential("Amazon", ["shopping"], {"u": "c"})

    # Search by service name
    assert "Google" in manager.search_credentials("google")
    assert "GitHub" in manager.search_credentials("hub")
    assert "Amazon" in manager.search_credentials("amazon")
    assert len(manager.search_credentials("google")) == 1

    # Search by tag
    assert "Google" in manager.search_credentials("work")
    assert "GitHub" in manager.search_credentials("dev")
    assert len(manager.search_credentials("code")) == 1

    # Case-insensitivity
    assert "Google" in manager.search_credentials("GOOGLE")
    assert "GitHub" in manager.search_credentials("dev")

    # No match
    assert len(manager.search_credentials("non_existent")) == 0

    # Test when key is not set
    manager.key = None
    assert manager.search_credentials("google") == []

def test_get_all_tags(temp_password_manager):
    manager = temp_password_manager
    password = "master_password"
    manager.set_key(password)

    manager.create_credential("Google", ["email", "work"], {"u": "a"})
    manager.create_credential("GitHub", ["dev", "code", "work"], {"u": "b"})
    manager.create_credential("Amazon", ["shopping"], {"u": "c"})
    manager.create_credential("LinkedIn", ["social", "work"], {"u": "d"})

    tags = manager.get_all_tags()
    assert tags == {
        "email": 1,
        "work": 3,
        "dev": 1,
        "code": 1,
        "shopping": 1,
        "social": 1
    }

    # Test with no credentials
    manager.delete_credential("Google")
    manager.delete_credential("GitHub")
    manager.delete_credential("Amazon")
    manager.delete_credential("LinkedIn")
    assert manager.get_all_tags() == {}

    # Test with credentials having no tags
    manager.create_credential("NoTags", [], {"u": "e"})
    assert manager.get_all_tags() == {}

    # Test when key is not set
    manager.key = None
    assert manager.get_all_tags() == {}
