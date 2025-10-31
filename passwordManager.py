import json
import os
import time
import getpass
from difflib import get_close_matches
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

class PasswordManager:
    def __init__(self, filename='./credentials.json', salt_filename='./salt.key'):
        self.filename = filename
        self.salt_filename = salt_filename
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
        else:
            salt = self.load_salt()
        self.key = self.derive_key(password, salt)

    def load_credentials(self):
        if not self.key:
            raise Exception("Key not set. Please set a master password.")

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
            raise Exception("Key not set. Please set a master password.")

        fernet = Fernet(self.key)
        encrypted_data = fernet.encrypt(json.dumps(credentials, indent=4).encode())
        with open(self.filename, 'wb') as f:
            f.write(encrypted_data)

    def create_credential(self):
        credentials = self.load_credentials()
        if credentials is None:
            return

        service = input("Enter service name: ").strip()
        service_type = input("Enter service type (e.g. Email, Social, Bank): ").strip()

        print("Enter fields for this credential (leave field name empty to stop):")
        fields = {}
        while True:
            field_name = input("Field name: ").strip()
            if not field_name:
                break
            field_value = input(f"Value for '{field_name}': ").strip()
            fields[field_name] = field_value

        if not fields:
            print("No fields entered, credential not saved.")
            return

        credentials[service] = {
            'service_type': service_type,
            'fields': fields
        }
        self.save_credentials(credentials)
        print(f"Credential for {service} saved.")

    def search_credential(self):
        credentials = self.load_credentials()
        if credentials is None or not credentials:
            print("No credentials stored or failed to decrypt.")
            return

        query = input("Enter service name or service type to search: ").strip().lower()
        
        all_services = list(credentials.keys())
        all_service_types = list(set(
            cred.get('service_type', '').lower() for cred in credentials.values()
        ))

        service_matches = get_close_matches(query, [s.lower() for s in all_services], cutoff=0.5)
        type_matches = get_close_matches(query, all_service_types, cutoff=0.5)

        results = {}
        for s in all_services:
            if s.lower() in service_matches:
                results[s] = credentials[s]

        for s, data in credentials.items():
            if data.get('service_type', '').lower() in type_matches and s not in results:
                results[s] = data

        if results:
            print(f"\nFound {len(results)} matching credential(s):")
            for service, data in results.items():
                print(f"\nService: {service}")
                print(f"Type: {data['service_type']}")
                print("Fields:")
                for field, value in data['fields'].items():
                    print(f"  {field}: {value}")
        else:
            print("No matches found.")

    def delete_credential(self):
        credentials = self.load_credentials()
        if credentials is None:
            return

        service = input("Enter service name to delete: ").strip()
        if service in credentials:
            del credentials[service]
            self.save_credentials(credentials)
            print(f"Credential for {service} deleted.")
        else:
            print(f"No credential found for {service}.")


def main():
    pm = PasswordManager()

    if not os.path.exists(pm.salt_filename):
        print("First time setup: Please create a master password.")
        password = getpass.getpass("Enter master password: ")
        password_confirm = getpass.getpass("Confirm master password: ")
        if password != password_confirm:
            print("Passwords do not match. Exiting.")
            return
        pm.set_key(password)
        pm.save_credentials({}) # Save an empty encrypted file
        print("Master password set and credentials file initialized.")
    else:
        password = getpass.getpass("Enter master password: ")
        pm.set_key(password)

    # Verify password by trying to load credentials
    if pm.load_credentials() is None:
        return # Exit if password is wrong

    while True:    
        time.sleep(1)
        print("---------Password Manager---------")
        print("----------------------------------")
        print("1 | Create Credential")
        print("2 | Search Credential")
        print("3 | Delete Credential")
        print("0 | Exit")
        print("----------------------------------")

        try:
            menuInput = int(input("Enter a menu number: "))
        except ValueError:
            print("Invalid input.")
            continue

        match menuInput:
            case 1:
                pm.create_credential()
            case 2:
                pm.search_credential()
            case 3:
                pm.delete_credential()
            case 0:
                print("Exiting.")
                break
            case _:
                print("Invalid selection.")

if __name__ == "__main__":
    main()
