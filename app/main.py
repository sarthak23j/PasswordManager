from flask import Flask, render_template, request, jsonify
from app.password_logic import PasswordManager

app = Flask(__name__, template_folder='templates', static_folder='static')
pm = PasswordManager()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    password = data.get('password')
    print(f"Received password for login: {password}") # Debugging line
    pm.set_key(password)
    credentials = pm.load_credentials()
    if credentials is not None:
        return jsonify({"success": True})
    else:
        return jsonify({"success": False}), 401

@app.route('/api/credentials', methods=['GET'])
def get_credentials():
    credentials = pm.load_credentials()
    if credentials is not None:
        return jsonify(credentials)
    else:
        return jsonify({"error": "Failed to load credentials"}), 500

@app.route('/api/credentials', methods=['POST'])
def add_credential():
    data = request.get_json()
    service = data.get('service')
    service_type = data.get('service_type')
    fields = data.get('fields')
    if pm.create_credential(service, service_type, fields):
        return jsonify({"success": True})
    else:
        return jsonify({"success": False}), 500

@app.route('/api/credentials/<service>', methods=['DELETE'])
def delete_credential(service):
    if pm.delete_credential(service):
        return jsonify({"success": True})
    else:
        return jsonify({"success": False}), 500

@app.route('/api/credentials/<service>', methods=['PUT'])
def update_credential(service):
    data = request.get_json()
    new_service_type = data.get('service_type')
    new_fields = data.get('fields')
    if pm.update_credential(service, new_service_type, new_fields):
        return jsonify({"success": True})
    else:
        return jsonify({"success": False}), 500

@app.route('/api/credentials/search', methods=['GET'])
def search_credentials():
    query = request.args.get('q', '')
    results = pm.search_credentials(query)
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
