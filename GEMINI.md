## Project Overview

This is a secure password manager with a web-based user interface built using Flask. The backend handles credential management and encryption, while the frontend provides an interactive experience for users. The project uses the `cryptography` library for encryption.

## New Features and UI Improvements

*   **Strengthened Core Security & Reliability:**
    *   **Comprehensive Unit Tests:** A suite of unit tests for `app/password_logic.py` using `pytest` ensures the core encryption, decryption, and credential management logic is robust.
    *   **Enhanced Error Handling:** Improved error handling in `app/password_logic.py` and `create_user.py` for file operations and cryptographic processes, with graceful failure mechanisms.
    *   **Robust Logging:** Integrated Python's `logging` module across `app/password_logic.py`, `create_user.py`, and `app/main.py` to provide detailed internal logs for debugging and auditing, without exposing sensitive information.

*   **Refined Existing UI/UX & Input Validation:**
    *   **User Feedback System:** A new `message-container` in `index.html` and a `displayMessage` JavaScript function in `script.js` provide clear, temporary success and error notifications to the user.
    *   **Improved Login/Logout Feedback:** User-friendly messages are now displayed for login and logout actions.
    *   **Client-Side Form Validation:** Basic client-side validation for the "Service" input and dynamic fields in the add/update credential form, with user-friendly error messages.
    *   **CRUD Operation Feedback:** Success and failure messages are now displayed to the user for adding, updating, and deleting credentials.
    *   **Updated Browse Button Color:** The 'Browse' button now features a slightly more saturated blueish-grey color for better visual appeal.

*   **Import/Export Functionality:**
    *   **Secure Export:** Users can now export their encrypted credentials to a JSON file for backup or migration.
    *   **Credential Import:** Users can import credentials from a JSON file, which will be merged with their existing credentials (overwriting existing entries with the same service name).

*   **Interactive Dynamic Fields:**
    *   The credential input form now features a highly interactive and minimalist system for adding custom fields.
    *   A single input element dynamically serves to first accept the field name (on Enter), then its corresponding value.
    *   Each dynamic field row includes a minimalistic Font Awesome trash icon (`far fa-trash-can`) for easy deletion.

*   **Improved Button Layout & Styling:**
    *   In the add/update view, the 'Add' and 'Back' buttons are now right-aligned, with the 'Back' button positioned to the left of 'Add'.
    *   The 'Add' button features a muted green color, while the 'Reset' tag filter button has a more muted red.

*   **Full-Width Tag Input:**
    *   The Tagify input field for tags now spans the full width of its container, improving usability and visual consistency.

*   **Advanced Tagging System:**
    *   Credentials now support multiple tags instead of a single service type.
    *   The backend has been updated to store, process, and search by tags.

*   **Interactive Tag Input (Tagify):**
    *   The text input for tags has been replaced with the Tagify library, providing a modern and user-friendly UI for adding tags.
    *   The tag input now provides autocomplete suggestions based on existing tags to improve consistency.

*   **Multi-Select Filtering:**
    *   The 'Browse' view now features a powerful multi-select filtering system.
    *   Users can select multiple tags to filter credentials.
    *   The results are sorted by relevance, with credentials matching the most tags appearing first.

*   **Dynamic Tag Display:**
    *   The most frequently used tags are displayed in a clean, two-row layout that can be expanded with a "Show More" button.
    *   The tag buttons are now justify-aligned for a cleaner look.
    *   The tag counts have been removed from the display for a cleaner UI.

*   **Clickable Tags:**
    *   Tags within the credential pop-up card are now clickable, allowing for quick filtering.

## Building and Running

1.  Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```
2.  **Create a User (First Time Setup):**
    *   Before running the main application, you need to create a user. Open your terminal in the project's root directory and run:
        ```bash
        python create_user.py
        ```
    *   Follow the prompts to set a master password for your new user. This will generate user-specific `salt.key` and `credentials.json` files in the `instance/` directory.
3.  Run the Flask application:
    ```bash
    python -m app.main
    ```
4.  Open your web browser and go to `http://127.0.0.1:5000`.
5.  **Login:** On the login screen, enter the master password you set during the user creation step to decrypt and access your credentials. The application will only allow login for existing users; it will not create a new user if the password doesn't match an existing one.

## Development Conventions

The project follows standard Python coding conventions for the backend (Flask and `password_logic.py`). The frontend is built using HTML, CSS, and JavaScript. The `PasswordManager` class encapsulates all the core password management functionality, and the `cryptography` library is used for all encryption and decryption operations.

**Note:** This project uses Python's `logging` module for detailed internal logs in Python files and `console.log` statements in JavaScript files for debugging and development purposes. These do not interfere with the user experience.
