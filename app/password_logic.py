import json
import os
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
from difflib import get_close_matches
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PasswordManager:
    def __init__(self, user_id):
        hashed_user_id = hashlib.sha256(user_id.encode()).hexdigest()
        self.filename = os.path.join('instance', f'{hashed_user_id}_credentials.json')
        self.salt_filename = os.path.join('instance', f'{hashed_user_id}_salt.key')
        self.key = None

    def derive_key(self, password, salt):
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return base64.urlsafe_b64encode(kdf.derive(password.encode()))

    def generate_salt(self):
        try:
            salt = os.urandom(16)
            with open(self.salt_filename, 'wb') as f:
                f.write(salt)
            logger.info("Salt generated and saved to %s", self.salt_filename)
            return salt
        except IOError as e:
            logger.error("Error generating or saving salt to %s: %s", self.salt_filename, e)
            return None

    def load_salt(self):
        try:
            with open(self.salt_filename, 'rb') as f:
                salt = f.read()
            logger.info("Salt loaded from %s", self.salt_filename)
            return salt
        except IOError as e:
            logger.error("Error loading salt from %s: %s", self.salt_filename, e)
            return None

    def set_key(self, password):
        if not os.path.exists(self.salt_filename):
            salt = self.generate_salt()
            if salt is None: # Handle error in salt generation
                self.key = None
                return
            # Also create an empty credentials file
            try:
                with open(self.filename, 'wb') as f:
                    pass
                logger.info("Empty credentials file created at %s", self.filename)
            except IOError as e:
                logger.error("Error creating empty credentials file at %s: %s", self.filename, e)
                self.key = None
                return
        else:
            salt = self.load_salt()
            if salt is None: # Handle error in salt loading
                self.key = None
                return
        self.key = self.derive_key(password, salt)
        logger.info("Encryption key set.")

    def load_credentials(self):
        if not self.key:
            logger.warning("Attempted to load credentials without a key being set.")
            return None

        if os.path.exists(self.filename):
            try:
                with open(self.filename, 'rb') as f:
                    encrypted_data = f.read()
                if not encrypted_data:
                    logger.info("Credentials file %s is empty.", self.filename)
                    return {}
                fernet = Fernet(self.key)
                decrypted_data = fernet.decrypt(encrypted_data)
                logger.info("Credentials loaded and decrypted from %s.", self.filename)
                return json.loads(decrypted_data)
            except Exception as e:
                logger.error("Decryption failed for %s. Wrong master password or corrupted data. Error: %s", self.filename, e)
                return None
        logger.info("Credentials file %s does not exist. Returning empty credentials.", self.filename)
        return {}

    def save_credentials(self, credentials):
        if not self.key:
            logger.warning("Attempted to save credentials without a key being set.")
            return False

        try:
            fernet = Fernet(self.key)
            encrypted_data = fernet.encrypt(json.dumps(credentials, indent=4).encode())
            with open(self.filename, 'wb') as f:
                f.write(encrypted_data)
            logger.info("Credentials saved and encrypted to %s.", self.filename)
            return True
        except IOError as e:
            logger.error("Error saving credentials to %s: %s", self.filename, e)
            return False
        except Exception as e:
            logger.error("Error encrypting or saving credentials to %s: %s", self.filename, e)
            return False

    def create_credential(self, service, tags, fields):
        credentials = self.load_credentials()
        if credentials is None:
            logger.error("Failed to load credentials for creating new credential.")
            return False

        if not service or not tags or not fields:
            logger.warning("Attempted to create credential with missing service, tags, or fields.")
            return False

        credentials[service] = {
            'tags': tags,
            'fields': fields
        }
        logger.info("Credential '%s' created.", service)
        return self.save_credentials(credentials)

    def delete_credential(self, service):
        credentials = self.load_credentials()
        if credentials is None:
            logger.error("Failed to load credentials for deleting credential.")
            return False

        if service in credentials:
            del credentials[service]
            logger.info("Credential '%s' deleted.", service)
            return self.save_credentials(credentials)
        logger.warning("Attempted to delete non-existent credential '%s'.", service)
        return False

    def update_credential(self, service, new_tags, new_fields):
        credentials = self.load_credentials()
        if credentials is None:
            logger.error("Failed to load credentials for updating credential.")
            return False

        if service in credentials:
            credentials[service]['tags'] = new_tags
            credentials[service]['fields'] = new_fields
            logger.info("Credential '%s' updated.", service)
            return self.save_credentials(credentials)
        logger.warning("Attempted to update non-existent credential '%s'.", service)
        return False

    def search_credentials(self, query):
        credentials = self.load_credentials()
        if credentials is None:
            logger.error("Failed to load credentials for searching.")
            return []
        
        query_lower = query.lower()
        results = []
        for service, data in credentials.items():
            if query_lower in service.lower() or any(query_lower in tag.lower() for tag in data.get('tags', [])):
                results.append(service)
        logger.info("Search for '%s' returned %d results.", query, len(results))
        return results

    def get_all_tags(self):
        credentials = self.load_credentials()
        if credentials is None:
            logger.error("Failed to load credentials for getting all tags.")
            return {}
        
        tag_counts = {}
        for data in credentials.values():
            for tag in data.get('tags', []):
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        logger.info("Retrieved %d unique tags.", len(tag_counts))
        return tag_counts