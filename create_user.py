import os
import sys
from app.password_logic import PasswordManager
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_new_user():
    logger.info("--- Create New User ---")
    master_password = input("Enter a master password for the new user: ")

    if not master_password:
        logger.warning("Master password cannot be empty. User creation aborted.")
        return

    # Create an instance of PasswordManager with the new master password as user_id
    pm = PasswordManager(master_password)

    # Check if salt file already exists for this user_id
    if os.path.exists(pm.salt_filename):
        logger.warning(f"A user with this master password already exists. Salt file found at: {pm.salt_filename}")
        logger.warning("If you wish to create a new user, please choose a different master password.")
        return

    # Set the key, which will generate a new salt and an empty credentials file
    pm.set_key(master_password)

    if pm.key is None:
        logger.error("Failed to set encryption key. User creation failed.")
        return

    logger.info(f"\nUser successfully created!")
    logger.info(f"Credentials will be stored in: {pm.filename}")
    logger.info(f"Salt will be stored in: {pm.salt_filename}")
    logger.info("You can now use this master password to log in to the main application.")

if __name__ == "__main__":
    # Ensure the 'instance' directory exists
    instance_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
    if not os.path.exists(instance_dir):
        try:
            os.makedirs(instance_dir)
            logger.info(f"Created instance directory: {instance_dir}")
        except OSError as e:
            logger.critical(f"Failed to create instance directory {instance_dir}: {e}")
            sys.exit(1) # Exit if we can't create the instance directory

    create_new_user()