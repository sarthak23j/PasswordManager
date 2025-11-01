import os
import sys
from app.password_logic import PasswordManager

def create_new_user():
    print("--- Create New User ---")
    master_password = input("Enter a master password for the new user: ")

    if not master_password:
        print("Master password cannot be empty. User creation aborted.")
        return

    # Create an instance of PasswordManager with the new master password as user_id
    pm = PasswordManager(master_password)

    # Check if salt file already exists for this user_id
    if os.path.exists(pm.salt_filename):
        print(f"A user with this master password already exists. Salt file found at: {pm.salt_filename}")
        print("If you wish to create a new user, please choose a different master password.")
        return

    # Set the key, which will generate a new salt and an empty credentials file
    pm.set_key(master_password)

    print(f"\nUser successfully created!")
    print(f"Credentials will be stored in: {pm.filename}")
    print(f"Salt will be stored in: {pm.salt_filename}")
    print("You can now use this master password to log in to the main application.")

if __name__ == "__main__":
    # Ensure the 'instance' directory exists
    instance_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
    if not os.path.exists(instance_dir):
        os.makedirs(instance_dir)
        print(f"Created instance directory: {instance_dir}")

    create_new_user()
