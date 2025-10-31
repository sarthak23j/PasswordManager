## Project Overview

This is a secure password manager with a web-based user interface built using Flask. The backend handles credential management and encryption, while the frontend provides an interactive experience for users. The project uses the `cryptography` library for encryption.

## New Features and UI Improvements

*   **Master Password Login:** Pressing 'Enter' in the master password field now submits the login form.
*   **Enhanced Search:** The search functionality now allows searching by service type and triggers results after 2 or more characters are typed.
*   **Credential Card UI:**
    *   The credential card popup is now more 'boxy' and less wide.
    *   The 'Delete' button is positioned in the bottom right corner.
    *   The popup closes when clicking anywhere outside the card.
    *   The credential card popup now appears above other elements (e.g., search results) due to `z-index` adjustments.
*   **Update Credential:** A new 'Update' button has been added to the credential card, allowing users to modify existing credentials. The 'Add Credential' form dynamically changes to 'Update Credential' when editing.
*   **Browse Section Scrollability:** The browse section is now scrollable when there are too many credentials, preventing overflow.
*   **Themed Buttons:** The 'Browse' and 'Add' buttons on the home screen have subtle blue and green color hints, respectively.

## Building and Running

1.  Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```
2.  Run the Flask application:
    ```bash
    python app.py
    ```
3.  Open your web browser and go to `http://127.0.0.1:5000`.
4.  The first time you access the application, you will be prompted to create a master password.
5.  On subsequent accesses, you will need to enter your master password to decrypt your credentials.

## Development Conventions

The project follows standard Python coding conventions for the backend (Flask and `password_logic.py`). The frontend is built using HTML, CSS, and JavaScript. The `PasswordManager` class encapsulates all the core password management functionality, and the `cryptography` library is used for all encryption and decryption operations.

**Note:** This project includes `print` statements in Python files and `console.log` statements in JavaScript files for debugging and development purposes. These do not interfere with the user experience.