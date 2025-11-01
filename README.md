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