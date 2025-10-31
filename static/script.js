document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const mainContainer = document.getElementById('main-container');
    const masterPasswordInput = document.getElementById('master-password');
    const loginButton = document.getElementById('login-button');

    const homeView = document.getElementById('home-view');
    const addView = document.getElementById('add-view');
    const browseView = document.getElementById('browse-view');

    const browseButton = document.getElementById('browse-button');
    const addNavButton = document.getElementById('add-nav-button');
    const searchBox = document.getElementById('search-box');
    const searchResults = document.getElementById('search-results');

    const serviceInput = document.getElementById('service');
    const serviceTypeInput = document.getElementById('service-type');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const addButton = document.getElementById('add-button');
    const addEditTitle = document.getElementById('add-edit-title'); // Get reference to the title

    const credentialsList = document.getElementById('credentials-list');

    const credentialCardPopup = document.getElementById('credential-card-popup');
    const popupContent = credentialCardPopup.querySelector('.popup-content');

    let currentServiceToUpdate = null; // Global variable to store the service being updated

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
    });

    addNavButton.addEventListener('click', () => {
        // Reset form for adding new credential
        serviceInput.value = '';
        serviceTypeInput.value = '';
        usernameInput.value = '';
        passwordInput.value = '';
        addButton.textContent = 'Add';
        addButton.dataset.action = 'add';
        currentServiceToUpdate = null;
        addEditTitle.textContent = 'Add New Credential'; // Set title for adding
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
            showView(homeView);
        } else {
            console.log('Login failed. Please check your master password.');
        }
    });

    // Add/Update Credential
    addButton.addEventListener('click', async () => {
        const service = serviceInput.value;
        const service_type = serviceTypeInput.value;
        const username = usernameInput.value;
        const password = passwordInput.value;
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
            body: JSON.stringify({ service: service, service_type: service_type, fields: { username: username, password: password } })
        });

        if (response.ok) {
            console.log(`Credential ${action === 'update' ? 'updated' : 'added'} successfully!`);
            serviceInput.value = '';
            serviceTypeInput.value = '';
            usernameInput.value = '';
            passwordInput.value = '';
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
            listElement.appendChild(item);
        }
    }

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

    // Function to open credential card popup
    function openCredentialCardPopup(service, credential) {
        currentServiceToUpdate = service; // Store the service for update operations
        popupContent.innerHTML = `
            <span class="close-button">&times;</span>
            <h2>${service}</h2>
            <p><strong>Type:</strong> ${credential.service_type}</p>
            <p><strong>Username:</strong> ${credential.fields.username}</p>
            <p><strong>Password:</strong> ${credential.fields.password}</p>
            <button class="update-credential-button" data-service="${service}">Update</button>
            <button class="delete-credential-button" data-service="${service}">Delete</button>
        `;
        credentialCardPopup.style.display = 'block';

        // Add event listener to close popup when clicking outside
        // This listener is added *after* the popup is displayed
        setTimeout(() => {
            document.addEventListener('click', closePopupOutsideClick);
        }, 0);
    }

    // Function to close credential card popup
    function closeCredentialCardPopup() {
        credentialCardPopup.style.display = 'none';
        document.removeEventListener('click', closePopupOutsideClick);
        currentServiceToUpdate = null; // Clear the service being updated
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
            const response = await fetch('/api/credentials'); // Fetch all to get details
            const credentials = await response.json();
            const credential = credentials[service];

            if (credential) {
                openCredentialCardPopup(service, credential);
            }
        }

        // Close popup via close button
        if (e.target.classList.contains('close-button')) {
            closeCredentialCardPopup();
        }

        // Handle Update from popup
        if (e.target.classList.contains('update-credential-button')) {
            const serviceToUpdate = e.target.dataset.service;
            const response = await fetch('/api/credentials'); // Fetch all to get details
            const credentials = await response.json();
            const credential = credentials[serviceToUpdate];

            if (credential) {
                serviceInput.value = serviceToUpdate;
                serviceTypeInput.value = credential.service_type;
                usernameInput.value = credential.fields.username;
                passwordInput.value = credential.fields.password;
                addButton.textContent = 'Update';
                addButton.dataset.action = 'update';
                currentServiceToUpdate = serviceToUpdate;
                addEditTitle.textContent = 'Update Credential'; // Set title for updating
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
                closeCredentialCardPopup(); // Close popup after deletion
                loadCredentials(credentialsList); // Refresh browse view
                searchResults.innerHTML = ''; // Clear search results
                searchBox.value = '';
            } else {
                console.log('Failed to delete credential.');
            }
        }
    });
});

