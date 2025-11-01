import os
from flask import Flask, render_template, request, jsonify, session, send_file
from app.password_logic import PasswordManager
import io
import json
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = 'super_secret_key_for_session_management' # In a real app, use an environment variable

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    password = data.get('password')
    logger.info("Attempting login for user.")

    if not password:
        logger.warning("Login attempt with empty password.")
        return jsonify({"success": False, "message": "Password cannot be empty."}), 400

    pm_instance = PasswordManager(password)

    # Check if the salt file exists for this user_id (password)
    if not os.path.exists(pm_instance.salt_filename):
        logger.warning("Login failed: No user found for the provided password.")
        return jsonify({"success": False, "message": "No user found for this password. Please create a user first."}), 401

    pm_instance.set_key(password)
    credentials = pm_instance.load_credentials()

    if credentials is not None:
        session['logged_in'] = True
        session['user_id'] = password # Store the password as user_id in session
        logger.info("User logged in successfully.")
        return jsonify({"success": True})
    else:
        logger.warning("Login failed: Incorrect password or corrupted data.")
        return jsonify({"success": False, "message": "Incorrect password or corrupted data."}), 401

def get_password_manager():
    user_id = session.get('user_id')
    if not user_id:
        logger.warning("Attempted API access without being logged in.")
        return None
    pm_instance = PasswordManager(user_id)
    pm_instance.set_key(user_id) # Re-set key for the current session
    if pm_instance.key is None:
        logger.error("Failed to set key for session user_id. Session might be invalid.")
        session.pop('logged_in', None)
        session.pop('user_id', None)
        return None
    return pm_instance

@app.route('/api/credentials', methods=['GET'])
def get_credentials():
    pm_instance = get_password_manager()
    if not pm_instance:
        return jsonify({"error": "Not logged in"}), 401
    credentials = pm_instance.load_credentials()
    if credentials is not None:
        return jsonify(credentials)
    else:
        logger.error("Failed to load credentials for logged in user.")
        return jsonify({"error": "Failed to load credentials"}), 500

@app.route('/api/credentials', methods=['POST'])
def add_credential():
    pm_instance = get_password_manager()
    if not pm_instance:
        return jsonify({"error": "Not logged in"}), 401
    data = request.get_json()
    service = data.get('service')
    tags = data.get('tags')
    fields = data.get('fields')

    if not service or not tags or not fields:
        logger.warning("Attempted to add credential with missing data.")
        return jsonify({"success": False, "message": "Missing service, tags, or fields."}), 400

    if pm_instance.create_credential(service, tags, fields):
        logger.info("Credential '%s' added successfully.", service)
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "message": "Failed to add credential."}), 500

@app.route('/api/credentials/<service>', methods=['DELETE'])
def delete_credential(service):
    pm_instance = get_password_manager()
    if not pm_instance:
        return jsonify({"error": "Not logged in"}), 401
    if pm_instance.delete_credential(service):
        logger.info("Credential '%s' deleted successfully.", service)
        return jsonify({"success": True})
    else:
        logger.error("Failed to delete credential '%s'.", service)
        return jsonify({"success": False, "message": "Failed to delete credential."}), 500

@app.route('/api/credentials/<service>', methods=['PUT'])
def update_credential(service):
    pm_instance = get_password_manager()
    if not pm_instance:
        return jsonify({"error": "Not logged in"}), 401
    data = request.get_json()
    new_tags = data.get('tags')
    new_fields = data.get('fields')

    if not new_tags or not new_fields:
        logger.warning("Attempted to update credential with missing tags or fields.")
        return jsonify({"success": False, "message": "Missing tags or fields for update."}), 400

    if pm_instance.update_credential(service, new_tags, new_fields):
        logger.info("Credential '%s' updated successfully.", service)
        return jsonify({"success": True})
    else:
        logger.error("Failed to update credential '%s'.", service)
        return jsonify({"success": False, "message": "Failed to update credential."}), 500

@app.route('/api/credentials/search', methods=['GET'])
def search_credentials():
    pm_instance = get_password_manager()
    if not pm_instance:
        return jsonify({"error": "Not logged in"}), 401
    query = request.args.get('q', '')
    results = pm_instance.search_credentials(query)
    logger.info("Search for '%s' returned %d results.", query, len(results))
    return jsonify(results)

@app.route('/api/tags', methods=['GET'])
def get_tags():
    pm_instance = get_password_manager()
    if not pm_instance:
        return jsonify({"error": "Not logged in"}), 401
    tags = pm_instance.get_all_tags()
    logger.info("Retrieved %d unique tags.", len(tags))
    return jsonify(tags)

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('logged_in', None)
    session.pop('user_id', None) # Also remove user_id from session
    logger.info("User logged out successfully.")
    return jsonify({"success": True})

@app.route('/api/export', methods=['POST'])
def export_credentials():
    pm_instance = get_password_manager()
    if not pm_instance:
        return jsonify({"error": "Not logged in"}), 401

    credentials = pm_instance.load_credentials()
    if credentials is None:
        logger.error("Failed to load credentials for export.")
        return jsonify({"success": False, "message": "Failed to load credentials for export."}), 500

    # Convert credentials to JSON string
    json_data = json.dumps(credentials, indent=4)
    # Create an in-memory file-like object
    buffer = io.BytesIO(json_data.encode('utf-8'))
    buffer.seek(0)

    logger.info("Credentials exported successfully.")
    return send_file(
        buffer,
        mimetype='application/json',
        as_attachment=True,
        download_name='credentials.json'
    )

@app.route('/api/import', methods=['POST'])
def import_credentials():
    pm_instance = get_password_manager()
    if not pm_instance:
        return jsonify({"error": "Not logged in"}), 401

    if 'file' not in request.files:
        logger.warning("Import attempt without a file.")
        return jsonify({"success": False, "message": "No file part in the request."}), 400

    file = request.files['file']
    if file.filename == '':
        logger.warning("Import attempt with empty filename.")
        return jsonify({"success": False, "message": "No selected file."}), 400

    if file and file.filename.endswith('.json'):
        try:
            file_content = file.read().decode('utf-8')
            imported_creds = json.loads(file_content)

            if not isinstance(imported_creds, dict):
                logger.warning("Imported file is not a valid JSON object.")
                return jsonify({"success": False, "message": "Invalid JSON format. Expected a JSON object."}), 400

            existing_creds = pm_instance.load_credentials()
            if existing_creds is None:
                logger.error("Failed to load existing credentials for import merge.")
                return jsonify({"success": False, "message": "Failed to load existing credentials."}), 500

            # Merge: imported credentials overwrite existing ones with the same service name
            existing_creds.update(imported_creds)

            if pm_instance.save_credentials(existing_creds):
                logger.info("Credentials imported and merged successfully.")
                return jsonify({"success": True, "message": "Credentials imported and merged successfully."})
            else:
                logger.error("Failed to save merged credentials after import.")
                return jsonify({"success": False, "message": "Failed to save merged credentials."}), 500
        except json.JSONDecodeError as e:
            logger.warning("Import failed: Invalid JSON format in uploaded file. Error: %s", e)
            return jsonify({"success": False, "message": f"Invalid JSON format: {e}"}), 400
        except Exception as e:
            logger.error("An unexpected error occurred during import: %s", e)
            return jsonify({"success": False, "message": f"An unexpected error occurred: {e}"}), 500
    else:
        logger.warning("Import attempt with non-JSON file or invalid filename.")
        return jsonify({"success": False, "message": "Only JSON files are supported for import."}), 400

if __name__ == '__main__':
    app.run(debug=True)