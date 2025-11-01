import json
import os
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
from difflib import get_close_matches

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
        salt = os.urandom(16)
        with open(self.salt_filename, 'wb') as f:
            f.write(salt)
        return salt

    def load_salt(self):
        with open(self.salt_filename, 'rb') as f:
            return f.read()

    def set_key(self, password):
        if not os.path.exists(self.salt_filename):
            salt = self.generate_salt()
            # Also create an empty credentials file
            with open(self.filename, 'wb') as f:
                pass
        else:
            salt = self.load_salt()
        self.key = self.derive_key(password, salt)

    def load_credentials(self):
        if not self.key:
            # This case should be handled by the login endpoint
            return None

        if os.path.exists(self.filename):
            with open(self.filename, 'rb') as f:
                encrypted_data = f.read()
                if not encrypted_data:
                    return {}
                try:
                    fernet = Fernet(self.key)
                    decrypted_data = fernet.decrypt(encrypted_data)
                    return json.loads(decrypted_data)
                except Exception as e:
                    print(f"Decryption failed. Wrong master password or corrupted data. Error: {e}")
                    return None
        return {}

    def save_credentials(self, credentials):
        if not self.key:
            return False

        fernet = Fernet(self.key)
        encrypted_data = fernet.encrypt(json.dumps(credentials, indent=4).encode())
        with open(self.filename, 'wb') as f:
            f.write(encrypted_data)
        return True

    def create_credential(self, service, tags, fields):
        credentials = self.load_credentials()
        if credentials is None:
            return False

        if not service or not tags or not fields:
            return False

        credentials[service] = {
            'tags': tags,
            'fields': fields
        }
        return self.save_credentials(credentials)

    def delete_credential(self, service):
        credentials = self.load_credentials()
        if credentials is None:
            return False

        if service in credentials:
            del credentials[service]
            return self.save_credentials(credentials)
        return False

    def update_credential(self, service, new_tags, new_fields):
        credentials = self.load_credentials()
        if credentials is None:
            return False

        if service in credentials:
            credentials[service]['tags'] = new_tags
            credentials[service]['fields'] = new_fields
            return self.save_credentials(credentials)
        return False

    def search_credentials(self, query):
        credentials = self.load_credentials()
        if credentials is None:
            return []
        
        query_lower = query.lower()
        results = []
        for service, data in credentials.items():
            if query_lower in service.lower() or any(query_lower in tag.lower() for tag in data.get('tags', [])):
                results.append(service)
        return results

    def get_all_tags(self):
        credentials = self.load_credentials()
        if credentials is None:
            return {}
        
        tag_counts = {}
        for data in credentials.values():
            for tag in data.get('tags', []):
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        return tag_counts
