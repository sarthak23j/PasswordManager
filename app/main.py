import os
from flask import Flask, render_template, request, jsonify, session
from app.password_logic import PasswordManager

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = 'super_secret_key_for_session_management' # In a real app, use an environment variable

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    password = data.get('password')
    print(f"Received password for login: {password}") # Debugging line

    pm_instance = PasswordManager(password)

    # Check if the salt file exists for this user_id (password)
    if not os.path.exists(pm_instance.salt_filename):
        print(f"Login failed: No user found for the provided password.")
        return jsonify({"success": False, "message": "No user found for this password. Please create a user first."}), 401

    pm_instance.set_key(password)
    credentials = pm_instance.load_credentials()

    if credentials is not None:
        session['logged_in'] = True
        session['user_id'] = password # Store the password as user_id in session
        return jsonify({"success": True})
    else:
        print(f"Login failed: Incorrect password or corrupted data.")
        return jsonify({"success": False, "message": "Incorrect password or corrupted data."}), 401

def get_password_manager():
    user_id = session.get('user_id')
    if not user_id:
        return None
    pm_instance = PasswordManager(user_id)
    pm_instance.set_key(user_id) # Re-set key for the current session
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
    if pm_instance.create_credential(service, tags, fields):
        return jsonify({"success": True})
    else:
        return jsonify({"success": False}), 500

@app.route('/api/credentials/<service>', methods=['DELETE'])
def delete_credential(service):
    pm_instance = get_password_manager()
    if not pm_instance:
        return jsonify({"error": "Not logged in"}), 401
    if pm_instance.delete_credential(service):
        return jsonify({"success": True})
    else:
        return jsonify({"success": False}), 500

@app.route('/api/credentials/<service>', methods=['PUT'])
def update_credential(service):
    pm_instance = get_password_manager()
    if not pm_instance:
        return jsonify({"error": "Not logged in"}), 401
    data = request.get_json()
    new_tags = data.get('tags')
    new_fields = data.get('fields')
    if pm_instance.update_credential(service, new_tags, new_fields):
        return jsonify({"success": True})
    else:
        return jsonify({"success": False}), 500

@app.route('/api/credentials/search', methods=['GET'])
def search_credentials():
    pm_instance = get_password_manager()
    if not pm_instance:
        return jsonify({"error": "Not logged in"}), 401
    query = request.args.get('q', '')
    results = pm_instance.search_credentials(query)
    return jsonify(results)

@app.route('/api/tags', methods=['GET'])
def get_tags():
    pm_instance = get_password_manager()
    if not pm_instance:
        return jsonify({"error": "Not logged in"}), 401
    tags = pm_instance.get_all_tags()
    return jsonify(tags)

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('logged_in', None)
    session.pop('user_id', None) # Also remove user_id from session
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True)
