# Password Manager (Web-based)

This is a secure web-based password manager built using Flask, providing a user-friendly interface for managing your credentials.

## Description

The application allows you to securely store, retrieve, update, and delete your credentials for various services. It uses strong encryption to protect your data, accessible via a master password.

## Features

*   **Secure Master Password Login:** Protects your stored credentials with a master password.
*   **Advanced Tagging System:** Assign multiple tags to each credential for flexible organization.
*   **Interactive Tag Filtering:**
    *   Quickly filter credentials by clicking on tags.
    *   Multi-select tags to see credentials that match all selected tags (AND search) or any of the selected tags (OR search).
    *   Results are sorted by relevance, showing the credentials with the most matching tags first.
*   **Dynamic Tag UI:**
    *   The most frequently used tags are displayed in a clean, expandable two-row layout.
    *   Autocomplete suggestions help maintain tag consistency when adding or updating credentials.
*   **Full Credential Management (CRUD):**
    *   Easily add new credentials with multiple tags and dynamic custom fields.
    *   **Interactive Dynamic Fields:** Add custom fields (e.g., 'email', 'card_number') with a single input that switches between field name and value entry. Includes a minimalistic Font Awesome trash icon for deletion.
    *   **Improved Button Layout:** In the add/update view, the 'Add' and 'Back' buttons are now right-aligned, with the 'Back' button positioned to the left of 'Add'. The 'Add' button features a muted green color.
    *   **Full-Width Tag Input:** The tag input field now spans the full width for better usability.
    *   View and update existing credentials from a clean, pop-up card.
    *   Delete credentials you no longer need.
*   **Dynamic Search:** Quickly find credentials by service name or by tags.

## Security

Your credentials are encrypted using Fernet symmetric encryption from the `cryptography` library. The encryption key is derived from your master password using PBKDF2HMAC, ensuring robust security.

## Building and Running

1.  **Clone the repository** (if you haven't already).
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Create a User (First Time Setup):**
    *   Before running the main application, you need to create a user. Open your terminal in the project's root directory and run:
        ```bash
        python create_user.py
        ```
    *   Follow the prompts to set a master password for your new user. This will generate user-specific `salt.key` and `credentials.json` files in the `instance/` directory.
4.  **Run the Flask application:**
    ```bash
    python -m app.main
    ```
5.  **Access the application:** Open your web browser and navigate to `http://127.0.0.1:5000`.
6.  **Login:** On the login screen, enter the master password you set during the user creation step to decrypt and access your credentials. The application will only allow login for existing users; it will not create a new user if the password doesn't match an existing one.

## File Descriptions

*   `create_user.py`: A utility script used to create new user accounts. Each user is defined by a master password, which is used to generate unique `salt.key` and `credentials.json` files.
*   `instance/`: This directory holds instance-specific data, which should not be version controlled.\
    *   `instance/[hashed_master_password]_credentials.json`: The file where a user's encrypted credentials are stored in JSON format. The filename is derived from a hash of the user's master password. **Do not modify this file directly.**\
    *   `instance/[hashed_master_password]_salt.key`: A file that stores a unique salt used to derive the encryption key from a user's master password. The filename is derived from a hash of the user's master password. **Do not delete or modify this file.**

**Note on Debugging:** This project includes `print` statements in Python files and `console.log` statements in JavaScript files for development and debugging purposes. These are intended to aid in understanding application flow and troubleshooting, and do not interfere with the user experience.