document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const mainContainer = document.getElementById('main-container');
    const masterPasswordInput = document.getElementById('master-password');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');

    const homeView = document.getElementById('home-view');
    const addView = document.getElementById('add-view');
    const browseView = document.getElementById('browse-view');

    const browseButton = document.getElementById('browse-button');
    const addNavButton = document.getElementById('add-nav-button');
    const searchBox = document.getElementById('search-box');
    const searchResults = document.getElementById('search-results');

    const serviceInput = document.getElementById('service');
    const tagsInput = document.getElementById('tags');
    const tagify = new Tagify(tagsInput, {
        whitelist: [],
        dropdown: {
            maxItems: 20,
            classname: "tags-look",
            enabled: 1,
            closeOnSelect: false
        }
    });
    const addButton = document.getElementById('add-button');
    const addEditTitle = document.getElementById('add-edit-title');

    const credentialsList = document.getElementById('credentials-list');

    const credentialCardPopup = document.getElementById('credential-card-popup');
    const popupContent = credentialCardPopup.querySelector('.popup-content');

    // Dynamic Fields Elements
    const dynamicFieldsDisplay = document.getElementById('dynamic-fields-display');
    const addFieldButton = document.getElementById('add-field-button');

    // Message Container
    const messageContainer = document.getElementById('message-container');

    // Import/Export Elements
    const exportButton = document.getElementById('export-button');
    const importButton = document.getElementById('import-button');
    const importFileInput = document.getElementById('import-file-input');

    let currentServiceToUpdate = null;

    // Function to display messages to the user
    function displayMessage(message, isError = false) {
        messageContainer.textContent = message;
        messageContainer.className = isError ? 'message-error' : 'message-success';
        messageContainer.style.display = 'block';
        setTimeout(() => {
            messageContainer.style.display = 'none';
            messageContainer.textContent = '';
        }, 3000); // Message disappears after 3 seconds
    }

    // Navigation
    function showView(view) {
        homeView.style.display = 'none';
        addView.style.display = 'none';
        browseView.style.display = 'none';
        view.style.display = 'block';
        messageContainer.style.display = 'none'; // Hide messages on view change
    }

    browseButton.addEventListener('click', () => {
        showView(browseView);
        loadCredentials(credentialsList);
        loadTags();
    });

    addNavButton.addEventListener('click', async () => {
        serviceInput.value = '';
        tagify.removeAllTags();
        dynamicFieldsDisplay.innerHTML = ''; // Clear dynamic fields
        createInteractiveFieldRow(); // Add an initial empty field
        addButton.textContent = 'Add';
        addButton.dataset.action = 'add';
        currentServiceToUpdate = null;
        addEditTitle.textContent = 'Add New Credential';

        const response = await fetch('/api/tags');
        const tags = await response.json();
        tagify.settings.whitelist = Object.keys(tags);

        showView(addView);
    });

    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', () => {
            showView(homeView);
        });
    });

    masterPasswordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            loginButton.click();
        }
    });

    // Login
    loginButton.addEventListener('click', async () => {
        const password = masterPasswordInput.value;
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        if (response.ok) {
            loginContainer.style.display = 'none';
            mainContainer.style.display = 'block';
            logoutButton.style.display = 'block';
            showView(homeView);
            displayMessage('Login successful!');
        } else {
            const errorData = await response.json();
            displayMessage(`Login failed: ${errorData.message || 'Unknown error'}.`, true);
        }
    });

    // Logout
    logoutButton.addEventListener('click', async () => {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });

        if (response.ok) {
            displayMessage('Logged out successfully!');
            loginContainer.style.display = 'block';
            mainContainer.style.display = 'none';
            logoutButton.style.display = 'none';
            masterPasswordInput.value = ''; // Clear master password field
        } else {
            displayMessage('Logout failed.', true);
        }
    });

    // Add/Update Credential
    addButton.addEventListener('click', async () => {
        const service = serviceInput.value.trim(); // Trim whitespace
        const tags = tagify.value.map(tag => tag.value);

        if (!service) {
            displayMessage('Service name cannot be empty.', true);
            return;
        }

        const fields = {};
        let allFieldsValid = true;
        document.querySelectorAll('.dynamic-field-row').forEach(row => {
            const fieldName = row.dataset.fieldName;
            const fieldValue = row.dataset.fieldValue;

            if (fieldName && fieldValue) {
                fields[fieldName] = fieldValue;
            } else if (fieldName && !fieldValue) {
                // If field name is set but value is empty, it's an invalid field
                allFieldsValid = false;
            } else if (!fieldName && fieldValue) {
                // If field value is set but name is empty, it's an invalid field
                allFieldsValid = false;
            }
        });

        if (!allFieldsValid) {
            displayMessage('All dynamic fields must have both a name and a value.', true);
            return;
        }

        const action = addButton.dataset.action;

        let url = '/api/credentials';
        let method = 'POST';

        if (action === 'update' && currentServiceToUpdate) {
            url = `/api/credentials/${currentServiceToUpdate}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ service: service, tags: tags, fields: fields })
        });

        if (response.ok) {
            displayMessage(`Credential ${action === 'update' ? 'updated' : 'added'} successfully!`);
            serviceInput.value = '';
            tagify.removeAllTags();
            dynamicFieldsDisplay.innerHTML = ''; // Clear dynamic fields
            createInteractiveFieldRow(); // Add an initial empty field
            addButton.textContent = 'Add';
            addButton.dataset.action = 'add';
            currentServiceToUpdate = null;
            showView(homeView);
        } else {
            const errorData = await response.json();
            displayMessage(`Failed to ${action === 'update' ? 'update' : 'add'} credential: ${errorData.message || 'Unknown error'}.`, true);
        }
    });

    // Load Credentials (for Browse view)
    async function loadCredentials(listElement) {
        const response = await fetch('/api/credentials');
        const credentials = await response.json();
        listElement.innerHTML = '';
        for (const service in credentials) {
            const item = document.createElement('div');
            item.className = 'credential-item';
            item.textContent = service;
            item.dataset.service = service;
            item.dataset.tags = credentials[service].tags.join(',');
            listElement.appendChild(item);
        }
    }

    // Load Tags (for Browse view)
    async function loadTags() {
        const response = await fetch('/api/tags');
        const tags = await response.json();
        const tagFilterWrapper = document.getElementById('tag-filter-wrapper');
        const tagFilterContainer = document.getElementById('tag-filter-container');
        tagFilterContainer.innerHTML = '';
        tagFilterWrapper.classList.remove('expanded');

        const existingShowMoreButton = document.getElementById('show-more-tags-button');
        if (existingShowMoreButton) {
            existingShowMoreButton.remove();
        }

        const sortedTags = Object.entries(tags).sort((a, b) => b[1] - a[1]);

        const resetButton = document.createElement('button');
        resetButton.className = 'tag-filter-button reset-tag-button';
        resetButton.textContent = 'Reset';
        resetButton.dataset.tag = 'all';
        tagFilterContainer.appendChild(resetButton);

        sortedTags.forEach(([tag, count]) => {
            const button = document.createElement('button');
            button.className = 'tag-filter-button';
            button.textContent = tag;
            button.dataset.tag = tag;
            tagFilterContainer.appendChild(button);
        });

        setTimeout(() => {
            if (tagFilterContainer.scrollHeight > tagFilterContainer.clientHeight) {
                const showMoreButton = document.createElement('button');
                showMoreButton.id = 'show-more-tags-button';
                showMoreButton.textContent = 'Show More';
                showMoreButton.addEventListener('click', () => {
                    const isExpanded = tagFilterWrapper.classList.toggle('expanded');
                    showMoreButton.textContent = isExpanded ? 'Show Less' : 'Show More';
                });
                tagFilterWrapper.appendChild(showMoreButton);
            }
        }, 100);
    }

    // Tag Filtering
    let activeFilters = [];
    document.getElementById('tag-filter-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('tag-filter-button')) {
            const button = e.target;
            const tagToFilter = button.dataset.tag;

            if (tagToFilter === 'all') {
                activeFilters = [];
                document.querySelectorAll('.tag-filter-button.active').forEach(btn => btn.classList.remove('active'));
            } else {
                button.classList.toggle('active');
                if (activeFilters.includes(tagToFilter)) {
                    activeFilters = activeFilters.filter(t => t !== tagToFilter);
                } else {
                    activeFilters.push(tagToFilter);
                }
            }

            const credentialItems = Array.from(document.querySelectorAll('.credential-item'));
            const results = [];

            credentialItems.forEach(item => {
                const itemTags = item.dataset.tags.split(',');
                let matchCount = 0;
                if (activeFilters.length > 0) {
                    activeFilters.forEach(filter => {
                        if (itemTags.includes(filter)) {
                            matchCount++;
                        }
                    });
                }

                item.style.display = 'none';

                if (activeFilters.length === 0) {
                    item.style.display = 'block';
                } else if (matchCount > 0) {
                    results.push({ item: item, matches: matchCount });
                }
            });

            if (activeFilters.length > 0) {
                results.sort((a, b) => b.matches - a.matches);

                results.forEach(result => {
                    result.item.style.display = 'block';
                    credentialsList.appendChild(result.item);
                });
            }
        }
    });

    // Search Functionality
    searchBox.addEventListener('input', async () => {
        const query = searchBox.value;
        if (query.length >= 2) {
            const response = await fetch(`/api/credentials/search?q=${query}`);
            const results = await response.json();
            searchResults.innerHTML = '';
            results.forEach(service => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.textContent = service;
                item.dataset.service = service;
                searchResults.appendChild(item);
            });
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
        }
    });

    // Create Interactive Field Row
    function createInteractiveFieldRow(initialFieldName = '', initialFieldValue = '') {
        const fieldRow = document.createElement('div');
        fieldRow.className = 'dynamic-field-row';
        fieldRow.dataset.isNameSet = initialFieldName ? 'true' : 'false';
        if (initialFieldName) fieldRow.dataset.fieldName = initialFieldName;
        if (initialFieldValue) fieldRow.dataset.fieldValue = initialFieldValue;

        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.className = 'field-input';

        if (initialFieldName) {
            inputField.placeholder = `Enter ${initialFieldName} value`;
            inputField.value = initialFieldValue;
        } else {
            inputField.placeholder = 'Enter field name';
        }

        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const value = inputField.value.trim();
                if (!value) {
                    displayMessage('Field cannot be empty.', true); // Changed from alert
                    return;
                }

                if (fieldRow.dataset.isNameSet === 'false') {
                    // Setting field name
                    fieldRow.dataset.fieldName = value;
                    fieldRow.dataset.isNameSet = 'true';
                    inputField.placeholder = `Enter ${value} value`;
                    inputField.value = ''; // Clear for value input
                } else {
                    // Setting field value
                    fieldRow.dataset.fieldValue = value;
                    inputField.value = value; // Keep value displayed
                }
            }
        });

        inputField.addEventListener('blur', () => {
            const value = inputField.value.trim();
            if (fieldRow.dataset.isNameSet === 'true') {
                fieldRow.dataset.fieldValue = value;
            }
        });

        const removeIcon = document.createElement('span');
        removeIcon.className = 'remove-field-icon';
        removeIcon.innerHTML = '<i class="far fa-trash-can"></i>'; // Font Awesome trash can icon
        removeIcon.title = 'Remove Field';
        removeIcon.addEventListener('click', () => {
            fieldRow.remove();
        });

        fieldRow.appendChild(inputField);
        fieldRow.appendChild(removeIcon);

        dynamicFieldsDisplay.appendChild(fieldRow);

        inputField.focus();
    }

    // Event Listener for Add Field Button
    addFieldButton.addEventListener('click', () => createInteractiveFieldRow());

    // Function to open credential card popup
    function openCredentialCardPopup(service, credential) {
        currentServiceToUpdate = service;
        const tagsHtml = credential.tags.map(tag => `<span class="clickable-tag" data-tag="${tag}">${tag}</span>`).join(', ');

        let fieldsHtml = '';
        for (const key in credential.fields) {
            fieldsHtml += `<p><strong>${key}:</strong> ${credential.fields[key]}</p>`;
        }

        popupContent.innerHTML = `
            <span class="close-button">&times;</span>
            <h2>${service}</h2>
            <p><strong>Tags:</strong> ${tagsHtml}</p>
            ${fieldsHtml}
            <button class="update-credential-button" data-service="${service}">Update</button>
            <button class="delete-credential-button" data-service="${service}">Delete</button>
        `;
        credentialCardPopup.style.display = 'block';

        setTimeout(() => {
            document.addEventListener('click', closePopupOutsideClick);
        }, 0);
    }

    // Function to close credential card popup
    function closeCredentialCardPopup() {
        credentialCardPopup.style.display = 'none';
        document.removeEventListener('click', closePopupOutsideClick);
        currentServiceToUpdate = null;
    }

    // Event handler for clicking outside the popup
    function closePopupOutsideClick(e) {
        if (!popupContent.contains(e.target)) {
            closeCredentialCardPopup();
        }
    }

    // Handle clicks on search results and browse items
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('search-result-item') || e.target.classList.contains('credential-item')) {
            const service = e.target.dataset.service;
            const response = await fetch('/api/credentials');
            const credentials = await response.json();
            const credential = credentials[service];

            if (credential) {
                openCredentialCardPopup(service, credential);
            }
        }

        if (e.target.classList.contains('close-button')) {
            closeCredentialCardPopup();
        }

        if (e.target.classList.contains('clickable-tag')) {
            const tagToFilter = e.target.dataset.tag;
            closeCredentialCardPopup();
            showView(browseView);
            setTimeout(() => {
                const credentialItems = document.querySelectorAll('.credential-item');
                credentialItems.forEach(item => {
                    if (item.dataset.tags.includes(tagToFilter)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            }, 0);
        }

        // Handle Update from popup
        if (e.target.classList.contains('update-credential-button')) {
            const serviceToUpdate = e.target.dataset.service;
            const response = await fetch('/api/credentials');
            const credentials = await response.json();
            const credential = credentials[serviceToUpdate];

            if (credential) {
                serviceInput.value = serviceToUpdate;
                tagify.loadOriginalValues(credential.tags);
                dynamicFieldsDisplay.innerHTML = ''; // Clear existing fields
                for (const key in credential.fields) {
                    createInteractiveFieldRow(key, credential.fields[key]);
                }
                addButton.textContent = 'Update';
                addButton.dataset.action = 'update';
                currentServiceToUpdate = serviceToUpdate;
                addEditTitle.textContent = 'Update Credential';

                const tagsResponse = await fetch('/api/tags');
                const tags = await tagsResponse.json();
                tagify.settings.whitelist = Object.keys(tags);

                showView(addView);
                closeCredentialCardPopup();
            }
        }

        // Delete from popup
        if (e.target.classList.contains('delete-credential-button')) {
            const serviceToDelete = e.target.dataset.service;
            const response = await fetch(`/api/credentials/${serviceToDelete}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                displayMessage('Credential deleted successfully!');
                closeCredentialCardPopup();
                loadCredentials(credentialsList);
                loadTags();
                searchResults.innerHTML = '';
                searchBox.value = '';
            } else {
                displayMessage('Failed to delete credential.', true);
            }
        }
    });

    // Export Credentials
    exportButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'credentials.json'; // Filename
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                displayMessage('Credentials exported successfully!');
            } else {
                const errorData = await response.json();
                displayMessage(`Failed to export credentials: ${errorData.message || 'Unknown error'}.`, true);
            }
        } catch (error) {
            displayMessage(`An error occurred during export: ${error}.`, true);
        }
    });

    // Import Credentials
    importButton.addEventListener('click', () => {
        importFileInput.click(); // Trigger the hidden file input
    });

    importFileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            displayMessage('No file selected for import.', true);
            return;
        }

        if (file.type !== 'application/json') {
            displayMessage('Only JSON files can be imported.', true);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/import', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                displayMessage(result.message || 'Credentials imported successfully!');
                loadCredentials(credentialsList);
                loadTags();
            } else {
                const errorData = await response.json();
                displayMessage(`Failed to import credentials: ${errorData.message || 'Unknown error'}.`, true);
            }
        } catch (error) {
            displayMessage(`An error occurred during import: ${error}.`, true);
        }
        // Clear the file input value to allow re-importing the same file
        event.target.value = '';
    });
});