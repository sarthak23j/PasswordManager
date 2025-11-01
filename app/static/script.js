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

    let currentServiceToUpdate = null;

    // Navigation
    function showView(view) {
        homeView.style.display = 'none';
        addView.style.display = 'none';
        browseView.style.display = 'none';
        view.style.display = 'block';
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
        } else {
            console.log('Login failed. Please check your master password.');
        }
    });

    // Logout
    logoutButton.addEventListener('click', async () => {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });

        if (response.ok) {
            console.log('Logged out successfully!');
            loginContainer.style.display = 'block';
            mainContainer.style.display = 'none';
            logoutButton.style.display = 'none';
            masterPasswordInput.value = ''; // Clear master password field
        } else {
            console.log('Logout failed.');
        }
    });

    // Add/Update Credential
    addButton.addEventListener('click', async () => {
        const service = serviceInput.value;
        const tags = tagify.value.map(tag => tag.value);

        const fields = {};
        document.querySelectorAll('.dynamic-field-row').forEach(row => {
            const fieldName = row.dataset.fieldName;
            const fieldValue = row.dataset.fieldValue;

            if (fieldName && fieldValue) {
                fields[fieldName] = fieldValue;
            }
        });

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
            console.log(`Credential ${action === 'update' ? 'updated' : 'added'} successfully!`);
            serviceInput.value = '';
            tagify.removeAllTags();
            dynamicFieldsDisplay.innerHTML = ''; // Clear dynamic fields
            createInteractiveFieldRow(); // Add an initial empty field
            addButton.textContent = 'Add';
            addButton.dataset.action = 'add';
            currentServiceToUpdate = null;
            showView(homeView);
        } else {
            console.log(`Failed to ${action === 'update' ? 'update' : 'add'} credential.`);
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
                    alert('Field cannot be empty.');
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
                console.log('Credential deleted successfully!');
                closeCredentialCardPopup();
                loadCredentials(credentialsList);
                loadTags();
                searchResults.innerHTML = '';
                searchBox.value = '';
            } else {
                console.log('Failed to delete credential.');
            }
        }
    });
});