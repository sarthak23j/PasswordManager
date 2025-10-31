# Password Manager (Web-based)

This is a secure web-based password manager built using Flask, providing a user-friendly interface for managing your credentials.

## Description

The application allows you to securely store, retrieve, update, and delete your credentials for various services. It uses strong encryption to protect your data, accessible via a master password.

## Features

*   **Secure Master Password Login:** Protects your stored credentials with a master password. Pressing 'Enter' in the master password field now submits the login form.
*   **Add New Credentials:** Easily add new service entries with associated usernames and passwords.
*   **Browse Credentials:** View all your stored credentials.
*   **Enhanced Search Functionality:** Quickly find credentials by service name or service type. Search results appear dynamically after typing 2 or more characters.
*   **Update Existing Credentials:** Modify the details of any stored credential directly from its card.
*   **Delete Credentials:** Remove unwanted credential entries.
*   **Intuitive UI:**
    *   Credential cards are now more compact and visually appealing.
    *   'Update' and 'Delete' buttons are conveniently placed on the credential card.
    *   Credential cards close when clicking outside of them.
    *   The browse section is scrollable to handle a large number of entries.
    *   Home page buttons ('Browse' and 'Add') have subtle color hints and are uniformly sized and aligned.

## Security

Your credentials are encrypted using Fernet symmetric encryption from the `cryptography` library. The encryption key is derived from your master password using PBKDF2HMAC, ensuring robust security.

## Building and Running

1.  **Clone the repository** (if you haven't already).
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Run the Flask application:**
    ```bash
    python -m app.main
    ```
4.  **Access the application:** Open your web browser and navigate to `http://127.0.0.1:5000`.
5.  **Master Password Setup:** The first time you access the application, you will be prompted to create a master password. This will generate a `salt.key` file and an empty `credentials.json` file within the `instance/` directory.
6.  **Login:** On subsequent accesses, enter your master password to decrypt and access your credentials.

## File Descriptions

*   `app/`: This directory contains the main Flask application code.
    *   `app/__init__.py`: Makes the `app` directory a Python package.
    *   `app/main.py`: The main Flask application script, handling web routes and API endpoints.
    *   `app/password_logic.py`: Contains the core logic for password management, including encryption/decryption, and CRUD operations for credentials.
    *   `app/static/`: Contains static files (CSS, JavaScript) for the frontend.
        *   `app/static/style.css`: Defines the visual styles of the application.
        *   `app/static/script.js`: Handles frontend interactivity, API calls, and UI logic.
    *   `app/templates/`: Contains HTML template files.
        *   `app/templates/index.html`: The main HTML structure of the single-page application.
*   `instance/`: This directory holds instance-specific data, which should not be version controlled.
    *   `instance/credentials.json`: The file where your encrypted credentials areRED in JSON format. **Do not modify this file directly.**
    *   `instance/salt.key`: A file that stores a unique salt used to derive the encryption key from your master password. **Do not delete or modify this file.**

**Note on Debugging:** This project includes `print` statements in Python files and `console.log` statements in JavaScript files for development and debugging purposes. These are intended to aid in understanding application flow and troubleshooting, and do not interfere with the user experience.