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
        loadTags();
    });

    addNavButton.addEventListener('click', async () => {
        // Reset form for adding new credential
        serviceInput.value = '';
        tagify.removeAllTags();
        usernameInput.value = '';
        passwordInput.value = '';
        addButton.textContent = 'Add';
        addButton.dataset.action = 'add';
        currentServiceToUpdate = null;
        addEditTitle.textContent = 'Add New Credential'; // Set title for adding

        // Fetch tags for suggestions
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
            showView(homeView);
        } else {
            console.log('Login failed. Please check your master password.');
        }
    });

    // Add/Update Credential
    addButton.addEventListener('click', async () => {
        const service = serviceInput.value;
        const tags = tagify.value.map(tag => tag.value);
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
            body: JSON.stringify({ service: service, tags: tags, fields: { username: username, password: password } })
        });

        if (response.ok) {
            console.log(`Credential ${action === 'update' ? 'updated' : 'added'} successfully!`);
            serviceInput.value = '';
            tagify.removeAllTags();
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

        // Remove existing show more button if it exists
        const existingShowMoreButton = document.getElementById('show-more-tags-button');
        if (existingShowMoreButton) {
            existingShowMoreButton.remove();
        }

        const sortedTags = Object.entries(tags).sort((a, b) => b[1] - a[1]);

        const resetButton = document.createElement('button');
        resetButton.className = 'tag-filter-button';
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

        // Use a timeout to allow the DOM to update before checking for overflow
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

                item.style.display = 'none'; // Hide all items initially

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

    // Function to open credential card popup
    function openCredentialCardPopup(service, credential) {
        currentServiceToUpdate = service; // Store the service for update operations
        const tagsHtml = credential.tags.map(tag => `<span class="clickable-tag" data-tag="${tag}">${tag}</span>`).join(', ');
        popupContent.innerHTML = `
            <span class="close-button">&times;</span>
            <h2>${service}</h2>
            <p><strong>Tags:</strong> ${tagsHtml}</p>
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

        // Handle clickable tags in popup
        if (e.target.classList.contains('clickable-tag')) {
            const tagToFilter = e.target.dataset.tag;
            closeCredentialCardPopup();
            showView(browseView);
            // Use a timeout to ensure the browse view is rendered before filtering
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
            const response = await fetch('/api/credentials'); // Fetch all to get details
            const credentials = await response.json();
            const credential = credentials[serviceToUpdate];

            if (credential) {
                serviceInput.value = serviceToUpdate;
                tagify.loadOriginalValues(credential.tags);
                usernameInput.value = credential.fields.username;
                passwordInput.value = credential.fields.password;
                addButton.textContent = 'Update';
                addButton.dataset.action = 'update';
                currentServiceToUpdate = serviceToUpdate;
                addEditTitle.textContent = 'Update Credential'; // Set title for updating

                // Fetch tags for suggestions
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
                closeCredentialCardPopup(); // Close popup after deletion
                loadCredentials(credentialsList); // Refresh browse view
                loadTags(); // Refresh tags
                searchResults.innerHTML = ''; // Clear search results
                searchBox.value = '';
            } else {
                console.log('Failed to delete credential.');
            }
        }
    });
});

