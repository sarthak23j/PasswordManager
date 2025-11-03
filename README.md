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
*   **Import/Export Credentials:** Securely import credentials from a JSON file or export your current credentials to a JSON file for backup or migration.

## UI/UX Improvements

*   **Enhanced User Feedback:** A new message system provides clear, temporary success and error notifications for actions like login, logout, and credential management.
*   **Improved Client-Side Validation:** Client-side validation has been added for form inputs (e.g., service name, dynamic fields) to provide immediate feedback.
*   **Updated Browse Button Color:** The 'Browse' button now features a slightly more saturated blueish-grey color for better visual appeal.

## Security

Your credentials are encrypted using Fernet symmetric encryption from the `cryptography` library. The encryption key is derived from your master password using PBKDF2HMAC, ensuring robust security.

## Testing

Comprehensive unit tests have been added for the `PasswordManager` class (`app/password_logic.py`) using `pytest`. These tests ensure the correctness, reliability, and security of the core encryption, decryption, and credential management logic.

## Logging & Error Handling

Robust logging has been integrated across `app/password_logic.py`, `create_user.py`, and `app/main.py` using Python's `logging` module. This provides detailed internal logs for debugging and auditing, without exposing sensitive information. Error handling has also been enhanced to ensure graceful failure and informative messages for critical operations.

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

## Running with Docker

You can also run the application inside a Docker container, which is ideal for deployment on systems like a Raspberry Pi without needing to install Python or other dependencies on the host machine.

1.  **Build the Docker image:**
    From the project's root directory, run the following command:
    ```bash
    docker build -t password-manager .
    ```

2.  **Create a User (First Time Setup with Docker):**
    To create a user and the persistent data volume, run the following command. You will be prompted to enter and confirm your master password.
    
    **For Windows (Command Prompt):**
    ```bash
    docker run -it --rm -v "%cd%/instance:/app/instance" password-manager python create_user.py
    ```
    
    **For Windows (PowerShell):**
    ```powershell
    docker run -it --rm -v "${pwd}/instance:/app/instance" password-manager python create_user.py
    ```
    
    **For Linux/macOS:**
    ```bash
    docker run -it --rm -v "$(pwd)/instance:/app/instance" password-manager python create_user.py
    ```
    This command mounts the local `instance` directory into the container, so the generated user files are saved directly to your project folder.

3.  **Run the Application Container:**
    Once the user is created, run the application with the following command.

    **For Windows (Command Prompt):**
    ```bash
    docker run -d -p 5000:5000 --name password-manager-app -v "%cd%/instance:/app/instance" password-manager
    ```

    **For Windows (PowerShell):**
    ```powershell
    docker run -d -p 5000:5000 --name password-manager-app -v "${pwd}/instance:/app/instance" password-manager
    ```

    **For Linux/macOS:**
    ```bash
    docker run -d -p 5000:5000 --name password-manager-app -v "$(pwd)/instance:/app/instance" password-manager
    ```

4.  **Access the application:**
    Open your web browser and navigate to `http://<your-pi-ip-address>:5000` or `http://localhost:5000` if running on your local machine.

5.  **Stopping and Starting the container:**
    *   To stop the container: `docker stop password-manager-app`
    *   To start the container again: `docker start password-manager-app`

## File Descriptions

*   `create_user.py`: A utility script used to create new user accounts. Each user is defined by a master password, which is used to generate unique `salt.key` and `credentials.json` files.
*   `instance/`: This directory holds instance-specific data, which should not be version controlled.\    *   `instance/[hashed_master_password]_credentials.json`: The file where a user's encrypted credentials are stored in JSON format. The filename is derived from a hash of the user's master password. **Do not modify this file directly.**\
    *   `instance/[hashed_master_password]_salt.key`: A file that stores a unique salt used to derive the encryption key from a user's master password. The filename is derived from a hash of the user's master password. **Do not delete or modify this file.**
