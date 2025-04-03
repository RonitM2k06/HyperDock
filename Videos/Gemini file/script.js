document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initApp();
});

async function initApp() {
    // Setup navigation
    setupNavigation();

    // Initialize first section
    if (document.querySelector('.nav-item.active')) {
        const activeSection = document.querySelector('.nav-item.active').getAttribute('data-section');
        await loadSectionData(activeSection);
    }

    // Update date/time every minute
    updateDateTime();
    setInterval(updateDateTime, 60000);
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.dashboard-section');

    navItems.forEach(navItem => {
        navItem.addEventListener('click', async () => {
            // Remove active class from all nav items and sections
            navItems.forEach(item => item.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked nav item
            navItem.classList.add('active');

            // Show corresponding section
            const sectionId = navItem.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');

            // Load section data
            await loadSectionData(sectionId);
        });
    });
}

async function loadSectionData(sectionId) {
    try {
        showLoading(sectionId);

        switch(sectionId) {
            case 'inventory-overview':
                await loadInventoryOverview();
                break;
            case 'containers':
                await loadContainersSection();
                break;
            case 'items':
                await loadItemsSection();
                break;
            case 'placement':
                await loadPlacementSection();
                break;
            case 'search-retrieve':
                await loadSearchRetrieveSection();
                break;
            case 'waste-management':
                await loadWasteManagementSection();
                break;
            case 'time-simulation':
                await loadTimeSimulationSection();
                break;
            case 'import-export':
                const section = document.getElementById('import-export');
                if (!section.querySelector('.import-export-controls')) {
                    section.innerHTML = `
                        <div class="import-export-controls">
                            <h3>Import Data</h3>
                            <div class="import-section">
                                <h4>Import Items from CSV</h4>
                                <input type="file" id="importItemsFile" accept=".csv">
                                <button id="importItemsBtn">Import Items</button>
                                <div id="importItemsStatus"></div>
                            </div>
                            <div class="import-section">
                                <h4>Import Containers from CSV</h4>
                                <input type="file" id="importContainersFile" accept=".csv">
                                <button id="importContainersBtn">Import Containers</button>
                                <div id="importContainersStatus"></div>
                            </div>
                            <h3>Export Data</h3>
                            <div class="export-section">
                                <h4>Export Current Arrangement to CSV</h4>
                                <button id="exportArrangementBtn">Export Arrangement</button>
                                <div id="exportArrangementStatus"></div>
                            </div>
                        </div>
                    `;

                    const importItemsBtn = document.getElementById('importItemsBtn');
                    const importContainersBtn = document.getElementById('importContainersBtn');
                    const exportArrangementBtn = document.getElementById('exportArrangementBtn');

                    if (importItemsBtn) {
                        importItemsBtn.addEventListener('click', async () => {
                            const fileInput = document.getElementById('importItemsFile');
                            if (fileInput.files.length > 0) {
                                await importData('items', fileInput.files[0]);
                            } else {
                                showError("Please select a CSV file to import items.");
                            }
                        });
                    }

                    if (importContainersBtn) {
                        importContainersBtn.addEventListener('click', async () => {
                            const fileInput = document.getElementById('importContainersFile');
                            if (fileInput.files.length > 0) {
                                await importData('containers', fileInput.files[0]);
                            } else {
                                showError("Please select a CSV file to import containers.");
                            }
                        });
                    }

                    if (exportArrangementBtn) {
                        exportArrangementBtn.addEventListener('click', async () => {
                            await exportArrangement();
                        });
                    }
                }
                // Optionally clear previous status messages
                document.getElementById('importItemsStatus').textContent = '';
                document.getElementById('importContainersStatus').textContent = '';
                document.getElementById('exportArrangementStatus').textContent = '';
                break;
            case 'logs':
                await loadLogsSection();
                break;
        }
    } catch (error) {
        console.error(`Error loading ${sectionId}:`, error);
        showError(`Failed to load ${sectionId.replace('-', ' ')} data: ${error.message}`);
    } finally {
        hideLoading(sectionId);
    }
}

/* ====================== */
/* Utility Functions     */
/* ====================== */

function updateDateTime() {
    const now = new Date();
    const dateTimeElement = document.querySelector('.date-time');
    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleString();
    }
}

function showLoading(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = '<div class="loader"></div>';
        loader.id = `${sectionId}-loader`;
        section.appendChild(loader);
    }
}

function hideLoading(sectionId) {
    const loader = document.getElementById(`${sectionId}-loader`);
    if (loader) {
        loader.remove();
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification error';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'notification success';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 5000);
}

async function fetchWithErrorHandling(url, options = {}) {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

async function importData(dataType, file) {
    const formData = new FormData();
    formData.append('file', file);
    const statusDivId = `import${dataType.charAt(0).toUpperCase() + dataType.slice(1)}Status`;
    const statusDiv = document.getElementById(statusDivId);

    try {
        showLoading('import-export');
        const response = await fetch(`http://localhost:8000/api/import/${dataType}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            statusDiv.className = 'success-message';
            statusDiv.textContent = `${data.itemsImported || data.itemsImported} ${dataType} imported successfully.`; // Corrected typo
            if (dataType === 'items') await displayItems();
            if (dataType === 'containers') await displayContainers();
        } else {
            statusDiv.className = 'error-message';
            let errorText = `Error importing ${dataType}: `;
            if (data.errors && data.errors.length > 0) {
                errorText += data.errors.map(err => `Row: ${JSON.stringify(err.row)}, Message: ${err.message}`).join('; ');
            } else if (data.detail) {
                errorText += data.detail;
            } else {
                errorText += 'Check server logs for details.';
            }
            statusDiv.textContent = errorText;
        }
    } catch (error) {
        statusDiv.className = 'error-message';
        statusDiv.textContent = `Error during file upload: ${error.message}`;
    } finally {
        hideLoading('import-export');
    }
}

async function exportArrangement() {
    const statusDiv = document.getElementById('exportArrangementStatus');
    try {
        showLoading('import-export');
        const response = await fetch('http://localhost:8000/api/export/arrangement');
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'space_arrangement.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            statusDiv.className = 'success-message';
            statusDiv.textContent = 'Arrangement exported successfully!';
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        statusDiv.className = 'error-message';
        statusDiv.textContent = `Error exporting arrangement: ${error.message}`;
    } finally {
        hideLoading('import-export');
    }
}

/* ====================== */
/* Section Loaders       */
/* ====================== */

async function loadInventoryOverview() {
    try {
        const [itemsRes, containersRes] = await Promise.all([
            fetchWithErrorHandling('http://localhost:8000/api/items'),
            fetchWithErrorHandling('http://localhost:8000/api/containers')
        ]);

        // Update container list
        const containerList = document.querySelector('.container-list-ul');
        if (containerList) {
            containerList.innerHTML = containersRes.containers.map(container =>
                `<li>${container.containerId} - <span class="math-inline">\{container\.zone\} \(</span>{container.width}×<span class="math-inline">\{container\.depth\}×</span>{container.height} cm)</li>`
            ).join('');
        }

        // Update item summary
        const itemCount = itemsRes.items.length;
        document.querySelector('.summary-value:nth-child(1)').textContent = itemCount;

        // Placeholder for other summary items
        document.querySelector('.alert-item .alert-value').textContent = 'All systems normal';
    } catch (error) {
        console.error('Error loading inventory overview:', error);
        throw error;
    }
}

async function loadContainersSection() {
    const section = document.getElementById('containers');

    // Only initialize once
    if (!section.querySelector('.container-management')) {
        section.innerHTML = `
            <div class="container-management">
                <div class="container-list-container">
                    <h3>Existing Containers</h3>
                    <ul class="container-list"></ul>
                </div>
                <div class="add-container-form">
                    <h3>Add New Container</h3>
                    <form id="containerForm">
                        <div class="form-group">
                            <label for="containerId">Container ID:</label>
                            <input type="text" id="containerId" required>
                        </div>
                        <div class="form-group">
                            <label for="zone">Zone:</label>
                            <input type="text" id="zone" required>
                        </div>
                        <div class="form-group">
                            <label for="width">Width (cm):</label>
                            <input type="number" id="width" min="1" required>
                        </div>
                        <div class="form-group">
                            <label for="depth">Depth (cm):</label>
                            <input type="number" id="depth" min="1" required>
                        </div>
                        <div class="form-group">
                            <label for="height">Height (cm):</label>
                            <input type="number" id="height" min="1" required>
                        </div>
                        <button type="submit">Add Container</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('containerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await addContainer();
        });
    }

    await displayContainers();
}

async function displayContainers() {
    try {
        const data = await fetchWithErrorHandling('http://localhost:8000/api/containers');
        const containerList = document.querySelector('#containers .container-list');

        if (containerList) {
            containerList.innerHTML = data.containers.map(container =>
                `<li>
                    ${container.containerId} - <span class="math-inline">\{container\.zone\}
\(</span>{container.width}cm × ${container.depth}cm × <span class="math-inline">\{container\.height\}cm\)
<button class\="delete\-btn" data\-id\="</span>{container.containerId}">Delete</button>
                </li>`
            ).join('');

            // Add event listeners to delete buttons
            document.querySelectorAll('#containers .delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await deleteContainer(btn.dataset.id);
                });
            });
        }
    } catch (error) {
        console.error('Error displaying containers:', error);
        throw error;
    }
}

async function addContainer() {
    try {
        const containerData = {
            containerId: document.getElementById('containerId').value.trim(),
            zone: document.getElementById('zone').value.trim(),
            width: parseInt(document.getElementById('width').value),
            depth: parseInt(document.getElementById('depth').value),
            height: parseInt(document.getElementById('height').value)
        };

        // Validate inputs
        if (!containerData.containerId || !containerData.zone ||
            isNaN(containerData.width) || isNaN(containerData.depth) || isNaN(containerData.height)) {
            throw new Error('Please fill all fields with valid data');
        }

        const response = await fetchWithErrorHandling('http://localhost:8000/api/containers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([containerData])
        });

        showSuccess('Container added successfully!');
        document.getElementById('containerForm').reset();
        await displayContainers();
    } catch (error) {
        console.error('Error adding container:', error);
        showError(error.message);
    }
}

async function deleteContainer(containerId) {
    try {
        if (!confirm(`Are you sure you want to delete container ${containerId}?`)) return;

        // Note: You'll need to implement this endpoint in your FastAPI backend
        const response = await fetchWithErrorHandling(`http://localhost:8000/api/containers/${containerId}`, {
            method: 'DELETE'
        });

        showSuccess(`Container ${containerId} deleted successfully`);
        await displayContainers();
    } catch (error) {
        console.error('Error deleting container:', error);
        showError(error.message);
    }
}

/* ====================== */
/* Other Sections        */
/* ====================== */

async function loadItemsSection() {
    const section = document.getElementById('items');

    if (!section.querySelector('.item-management')) {
        section.innerHTML = `
            <div class="item-management">
                <div class="item-list-container">
                    <h3>Existing Items</h3>
                    <table class="item-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Priority</th>
                                <th>Dimensions</th>
                                <th>Mass</th>
                                <th>Zone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
                <div class="add-item-form">
                    <h3>Add New Item</h3>
                    <form id="itemForm">
                        <div class="form-group">
                            <label for="itemId">Item ID:</label>
                            <input type="text" id="itemId" required>
                        </div>
                        <div class="form-group">
                            <label for="name">Name:</label>
                            <input type="text" id="name" required>
                        </div>
                        <div class="form-group">
                            <label for="width">Width (cm):</label>
                            <input type="number" id="width" min="1" required>
                        </div>
                        <div class="form-group">
                            <label for="depth">Depth (cm):</label>
                            <input type="number" id="depth" min="1" required>
                        </div>
                        <div class="form-group">
                            <label for="height">Height (cm):</label>
                            <input type="number" id="height" min="1" required>
                        </div>
                        <div class="form-group">
                            <label for="mass">Mass (kg):</label>
                            <input type="number" id="mass" min="0" step="0.01" required></div>
                        <div class="form-group">
                            <label for="priority">Priority:</label>
                            <input type="number" id="priority" min="1" max="5" value="3" required>
                        </div>
                        <div class="form-group">
                            <label for="preferredZone">Preferred Zone:</label>
                            <input type="text" id="preferredZone">
                        </div>
                        <button type="submit">Add Item</button>
                    </form>
                </div>
            </div>
        `;

        // Initialize item form submission
        document.getElementById('itemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await addItem();
        });
    }

    await displayItems();
}

async function displayItems() {
    try {
        const data = await fetchWithErrorHandling('http://localhost:8000/api/items');
        const tbody = document.querySelector('#items .item-table tbody');

        if (tbody) {
            tbody.innerHTML = data.items.map(item => `
                <tr>
                    <td>${item.itemId}</td>
                    <td>${item.name}</td>
                    <td>${item.priority}</td>
                    <td>${item.width}×${item.depth}×${item.height} cm</td>
                    <td>${item.mass} kg</td>
                    <td>${item.preferredZone}</td>
                    <td>
                        <button class="delete-btn" data-id="${item.itemId}">Delete</button>
                    </td>
                </tr>
            `).join('');

            // Add event listeners to delete buttons
            document.querySelectorAll('#items .delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await deleteItem(btn.dataset.id);
                });
            });
        }
    } catch (error) {
        console.error('Error displaying items:', error);
        throw error;
    }
}

async function addItem() {
    try {
        const itemData = {
            itemId: document.getElementById('itemId').value.trim(),
            name: document.getElementById('name').value.trim(),
            width: parseInt(document.getElementById('width').value),
            depth: parseInt(document.getElementById('depth').value),
            height: parseInt(document.getElementById('height').value),
            mass: parseFloat(document.getElementById('mass').value),
            priority: parseInt(document.getElementById('priority').value),
            preferredZone: document.getElementById('preferredZone').value.trim()
        };

        // Validate inputs (basic validation)
        if (!itemData.itemId || !itemData.name || isNaN(itemData.width) || isNaN(itemData.depth) || isNaN(itemData.height) || isNaN(itemData.mass) || isNaN(itemData.priority)) {
            throw new Error('Please fill all fields with valid data.');
        }

        const response = await fetchWithErrorHandling('http://localhost:8000/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData)
        });

        showSuccess('Item added successfully!');
        document.getElementById('itemForm').reset();
        await displayItems();
    } catch (error) {
        console.error('Error adding item:', error);
        showError(error.message);
    }
}

async function deleteItem(itemId) {
    try {
        if (!confirm(`Are you sure you want to delete item ${itemId}?`)) return;

        const response = await fetchWithErrorHandling(`http://localhost:8000/api/items/${itemId}`, {
            method: 'DELETE'
        });

        showSuccess(`Item ${itemId} deleted successfully`);
        await displayItems();
    } catch (error) {
        console.error('Error deleting item:', error);
        showError(error.message);
    }
}

// Placeholder functions for other sections
async function loadPlacementSection() {
    document.getElementById('placement').innerHTML = `
        <div class="placement-interface">
            <h3>Placement Recommendations</h3>
            <div class="placement-results"></div>
        </div>
    `;
}

async function loadSearchRetrieveSection() {
    document.getElementById('search-retrieve').innerHTML = `
        <div class="search-interface">
            <h3>Search Items</h3>
            <input type="text" id="searchQuery" placeholder="Enter item ID or name">
            <button id="searchBtn">Search</button>
            <div class="search-results"></div>
        </div>
    `;
    const searchBtn = document.getElementById('searchBtn');
    const searchResultsDiv = document.querySelector('#search-retrieve .search-results');
    const searchQueryInput = document.getElementById('searchQuery');

    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const query = searchQueryInput.value.trim();
            if (query) {
                try {
                    showLoading('search-retrieve');
                    const data = await fetchWithErrorHandling(`http://localhost:8000/api/items?query=${encodeURIComponent(query)}`);
                    if (data && data.items && data.items.length > 0) {
                        let resultsHTML = '<h3>Search Results</h3><ul>';
                        data.items.forEach(item => {
                            resultsHTML += `<li>${item.name} (${item.itemId}) - Zone: ${item.preferredZone}</li>`;
                        });
                        resultsHTML += '</ul>';
                        searchResultsDiv.innerHTML = resultsHTML;
                    } else {
                        searchResultsDiv.innerHTML = '<p>No items found matching your query.</p>';
                    }
                } catch (error) {
                    console.error('Error searching items:', error);
                    showError(`Error searching: ${error.message}`);
                    searchResultsDiv.innerHTML = '<p>Error occurred during search.</p>';
                } finally {
                    hideLoading('search-retrieve');
                }
            } else {
                searchResultsDiv.innerHTML = '<p>Please enter a search query.</p>';
            }
        });
    }
}

async function loadWasteManagementSection() {
    document.getElementById('waste-management').innerHTML = `
        <div class="waste-management-interface">
            <h3>Waste Management</h3>
            <p>Functionality for tracking and managing waste items will be implemented here.</p>
        </div>
    `;
}

async function loadTimeSimulationSection() {
    document.getElementById('time-simulation').innerHTML = `
        <div class="time-simulation-interface">
            <h3>Time Simulation</h3>
            <p>Tools for simulating the passage of time and its effects on inventory (e.g., expiration) will be added here.</p>
        </div>
    `;
}

async function loadLogsSection() {
    document.getElementById('logs').innerHTML = `
        <div class="logs-interface">
            <h3>Activity Logs</h3>
            <p>A history of actions performed within the system will be displayed here.</p>
        </div>
    `;
}

/* ====================== */
/* Initialization         */
/* ====================== */

// Initialize the first section
if (document.querySelector('.nav-item.active')) {
    const activeSection = document.querySelector('.nav-item.active').getAttribute('data-section');
    loadSectionData(activeSection);
}/* ====================== */
/* Import/Export Section  */
/* ====================== */

async function loadImportExportSection() {
    const section = document.getElementById('import-export');
    if (!section.querySelector('.import-export-controls')) {
        section.innerHTML = `
            <div class="import-export-controls">
                <h3>Import Data</h3>
                <div class="import-section">
                    <h4>Import Items from CSV</h4>
                    <input type="file" id="importItemsFile" accept=".csv">
                    <button id="importItemsBtn">Import Items</button>
                    <div id="importItemsStatus"></div>
                </div>
                <div class="import-section">
                    <h4>Import Containers from CSV</h4>
                    <input type="file" id="importContainersFile" accept=".csv">
                    <button id="importContainersBtn">Import Containers</button>
                    <div id="importContainersStatus"></div>
                </div>
                <h3>Export Data</h3>
                <div class="export-section">
                    <h4>Export Current Arrangement to CSV</h4>
                    <button id="exportArrangementBtn">Export Arrangement</button>
                    <div id="exportArrangementStatus"></div>
                </div>
            </div>
        `;

        const importItemsBtn = document.getElementById('importItemsBtn');
        const importContainersBtn = document.getElementById('importContainersBtn');
        const exportArrangementBtn = document.getElementById('exportArrangementBtn');

        if (importItemsBtn) {
            importItemsBtn.addEventListener('click', async () => {
                const fileInput = document.getElementById('importItemsFile');
                if (fileInput.files.length > 0) {
                    await importData('items', fileInput.files[0]);
                } else {
                    showError("Please select a CSV file to import items.");
                }
            });
        }

        if (importContainersBtn) {
            importContainersBtn.addEventListener('click', async () => {
                const fileInput = document.getElementById('importContainersFile');
                if (fileInput.files.length > 0) {
                    await importData('containers', fileInput.files[0]);
                } else {
                    showError("Please select a CSV file to import containers.");
                }
            });
        }

        if (exportArrangementBtn) {
            exportArrangementBtn.addEventListener('click', async () => {
                await exportArrangement();
            });
        }
    }
    // Optionally clear previous status messages
    document.getElementById('importItemsStatus').textContent = '';
    document.getElementById('importContainersStatus').textContent = '';
    document.getElementById('exportArrangementStatus').textContent = '';
}

async function importData(dataType, file) {
    const formData = new FormData();
    formData.append('file', file);
    const statusDivId = `import${dataType.charAt(0).toUpperCase() + dataType.slice(1)}Status`;
    const statusDiv = document.getElementById(statusDivId);

    try {
        showLoading('import-export');
        const response = await fetch(`http://localhost:8000/api/import/${dataType}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            statusDiv.className = 'success-message';
            statusDiv.textContent = `${data.itemsImported || data.itemsImported} ${dataType} imported successfully.`; // Corrected typo
            if (dataType === 'items') await displayItems();
            if (dataType === 'containers') await displayContainers();
        } else {
            statusDiv.className = 'error-message';
            let errorText = `Error importing ${dataType}: `;
            if (data.errors && data.errors.length > 0) {
                errorText += data.errors.map(err => `Row: ${JSON.stringify(err.row)}, Message: ${err.message}`).join('; ');
            } else if (data.detail) {
                errorText += data.detail;
            } else {
                errorText += 'Check server logs for details.';
            }
            statusDiv.textContent = errorText;
        }
    } catch (error) {
        statusDiv.className = 'error-message';
        statusDiv.textContent = `Error during file upload: ${error.message}`;
    } finally {
        hideLoading('import-export');
    }
}

async function exportArrangement() {
    const statusDiv = document.getElementById('exportArrangementStatus');
    try {
        showLoading('import-export');
        const response = await fetch('http://localhost:8000/api/export/arrangement');
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'space_arrangement.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            statusDiv.className = 'success-message';
            statusDiv.textContent = 'Arrangement exported successfully!';
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        statusDiv.className = 'error-message';
        statusDiv.textContent = `Error exporting arrangement: ${error.message}`;
    } finally {
        hideLoading('import-export');
    }
}

async function loadLogsSection() {
    const section = document.getElementById('logs');
    if (!section.querySelector('.logs-container')) {
        section.innerHTML = `
            <div class="logs-container">
                <h3>Activity Logs</h3>
                <div class="logs-filter">
                    <label for="startDate">Start Date:</label>
                    <input type="date" id="startDate">
                    <label for="endDate">End Date:</label>
                    <input type="date" id="endDate">
                    <label for="itemId">Item ID:</label>
                    <input type="text" id="itemId">
                    <label for="userId">User ID:</label>
                    <input type="text" id="userId">
                    <label for="actionType">Action Type:</label>
                    <select id="actionType">
                        <option value="">All</option>
                        <option value="placement">Placement</option>
                        <option value="retrieval">Retrieval</option>
                        </select>
                    <button id="filterLogsBtn">Filter Logs</button>
                </div>
                <div class="logs-output">
                    <table class="logs-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User ID</th>
                                <th>Action</th>
                                <th>Item ID</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('filterLogsBtn').addEventListener('click', async () => {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const itemId = document.getElementById('itemId').value;
            const userId = document.getElementById('userId').value;
            const actionType = document.getElementById('actionType').value;

            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);
            if (itemId) queryParams.append('itemId', itemId);
            if (userId) queryParams.append('userId', userId);
            if (actionType) queryParams.append('actionType', actionType);

            const url = `http://localhost:8000/api/logs?${queryParams.toString()}`;
            await fetchLogs(url);
        });
    }
    // Load all logs initially
    await fetchLogs('http://localhost:8000/api/logs');
}

async function fetchLogs(url) {
    try {
        showLoading('logs');
        const data = await fetchWithErrorHandling(url);
        displayLogs(data.logs);
    } catch (error) {
        showError(`Error fetching logs: ${error.message}`);
    } finally {
        hideLoading('logs');
    }
}

function displayLogs(logs) {
    const tbody = document.querySelector('#logs .logs-table tbody');
    if (tbody) {
        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${log.timestamp}</td>
                <td>${log.userId}</td>
                <td>${log.actionType}</td>
                <td>${log.itemId}</td>
                <td>${JSON.stringify(log.details)}</td>
            </tr>
        `).join('');
    }
}/* ====================== */
/* Time Simulation Section (Continued) */
/* ====================== */

async function loadTimeSimulationSection() {
    const section = document.getElementById('time-simulation');
    if (!section.querySelector('.time-simulation-controls')) {
        section.innerHTML = `
            <div class="time-simulation-controls">
                <h3>Simulate Time</h3>
                <div class="simulation-options">
                    <label for="simulateDays">Simulate for (days):</label>
                    <input type="number" id="simulateDays" min="1" value="1">
                    <button id="simulateByDaysBtn">Simulate</button>
                </div>
                <div class="simulation-options">
                    <label for="simulateTo">Simulate to Timestamp:</label>
                    <input type="datetime-local" id="simulateTo">
                    <button id="simulateToBtn">Simulate To</button>
                </div>
                <div class="usage-input">
                    <h3>Items to Use Today</h3>
                    <div id="itemsToUseList">
                        <div class="item-usage">
                            <input type="text" class="itemIdToUse" placeholder="Item ID">
                        </div>
                    </div>
                    <button id="addItemToUseBtn">Add Item</button>
                </div>
                <div class="simulation-results"></div>
            </div>
        `;

        document.getElementById('simulateByDaysBtn').addEventListener('click', async () => {
            const numOfDays = parseInt(document.getElementById('simulateDays').value);
            if (!isNaN(numOfDays) && numOfDays > 0) {
                await simulateTime({ numOfDays });
            } else {
                showError("Please enter a valid number of days.");
            }
        });

        document.getElementById('simulateToBtn').addEventListener('click', async () => {
            const toTimestampInput = document.getElementById('simulateTo').value;
            if (toTimestampInput) {
                await simulateTime({ toTimestamp: toTimestampInput + ':00Z' }); // Ensure UTC format
            } else {
                showError("Please select a target timestamp.");
            }
        });

        document.getElementById('addItemToUseBtn').addEventListener('click', () => {
            const itemsToUseList = document.getElementById('itemsToUseList');
            const newItemUsage = document.createElement('div');
            newItemUsage.className = 'item-usage';
            newItemUsage.innerHTML = `
                <input type="text" class="itemIdToUse" placeholder="Item ID">
                <button class="removeItemToUseBtn">Remove</button>
            `;
            itemsToUseList.appendChild(newItemUsage);
            newItemUsage.querySelector('.removeItemToUseBtn').addEventListener('click', (e) => {
                e.target.parentNode.remove();
            });
        });
    }
    // Optionally clear previous results
    document.querySelector('#time-simulation .simulation-results').innerHTML = '';
}

async function simulateTime(payload) {
    try {
        showLoading('time-simulation');
        const itemsToBeUsedPerDay = Array.from(document.querySelectorAll('#itemsToUseList .itemIdToUse'))
            .map(input => ({ itemId: input.value }))
            .filter(item => item.itemId); // Only include if itemId is not empty
        const fullPayload = { ...payload, itemsToBeUsedPerDay };
        const data = await fetchWithErrorHandling('http://localhost:8000/api/simulate/day', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullPayload)
        });
        displaySimulationResults(data);
    } catch (error) {
        showError(`Error simulating time: ${error.message}`);
    } finally {
        hideLoading('time-simulation');
    }
}

function displaySimulationResults(data) {
    const resultsDiv = document.querySelector('#time-simulation .simulation-results');
    if (resultsDiv) {
        let html = `<h3>Simulation Results</h3><p>New Date: ${data.newDate}</p>`;
        if (data.changes) {
            if (data.changes.itemsUsed && data.changes.itemsUsed.length > 0) {
                html += '<h4>Items Used</h4><ul>';
                data.changes.itemsUsed.forEach(item => {
                    html += `<li>${item.name} (${item.itemId}) - Remaining Uses: ${item.remainingUses}</li>`;
                });
                html += '</ul>';
            }
            if (data.changes.itemsExpired && data.changes.itemsExpired.length > 0) {
                html += '<h4>Items Expired</h4><ul>';
                data.changes.itemsExpired.forEach(item => {
                    html += `<li>${item.name} (${item.itemId})</li>`;
                });
                html += '</ul>';
            }
            if (data.changes.itemsDepletedToday && data.changes.itemsDepletedToday.length > 0) {
                html += '<h4>Items Depleted Today</h4><ul>';
                data.changes.itemsDepletedToday.forEach(item => {
                    html += `<li>${item.name} (${item.itemId})</li>`;
                });
                html += '</ul>';
            }
            if (Object.keys(data.changes).every(key => data.changes[key].length === 0)) {
                html += '<p>No significant changes during this simulation.</p>';
            }
        }
        resultsDiv.innerHTML = html;
    }
}

async function loadWasteManagementSection() {
    document.getElementById('waste-management').innerHTML = `
        <div class="waste-management-interface">
            <h3>Waste Management</h3>
            <div class="waste-actions">
                <button id="identifyWasteBtn">Identify Waste Items</button>
                <button id="generateReturnPlanBtn">Generate Return Plan</button>
                <button id="completeUndockingBtn">Complete Undocking</button>
            </div>
            <div class="waste-results"></div>
        </div>
    `;

    document.getElementById('identifyWasteBtn').addEventListener('click', async () => {
        try {
            showLoading('waste-management');
            const data = await fetchWithErrorHandling('http://localhost:8000/api/waste/identify');
            displayWasteItems(data.wasteItems);
        } catch (error) {
            showError(`Error identifying waste: ${error.message}`);
        } finally {
            hideLoading('waste-management');
        }
    });

    document.getElementById('generateReturnPlanBtn').addEventListener('click', async () => {
        // Implement a modal or form to get undocking container ID and date
        const undockingContainerId = prompt("Enter Undocking Container ID:");
        const undockingDate = prompt("Enter Undocking Date (YYYY-MM-DD):");
        const maxWeight = parseFloat(prompt("Enter Maximum Return Weight:"));

        if (undockingContainerId && undockingDate && !isNaN(maxWeight)) {
            try {
                showLoading('waste-management');
                const payload = { undockingContainerId, undockingDate, maxWeight };
                const data = await fetchWithErrorHandling('http://localhost:8000/api/waste/return-plan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                displayReturnPlan(data);
            } catch (error) {
                showError(`Error generating return plan: ${error.message}`);
            } finally {
                hideLoading('waste-management');
            }
        } else {
            showError("Please provide valid container ID, date, and max weight.");
        }
    });

    document.getElementById('completeUndockingBtn').addEventListener('click', async () => {
        const undockingContainerId = prompt("Enter Undocking Container ID for completion:");
        const timestamp = new Date().toISOString(); // Or allow user input

        if (undockingContainerId) {
            try {
                showLoading('waste-management');
                const payload = { undockingContainerId, timestamp };
                const data = await fetchWithErrorHandling('http://localhost:8000/api/waste/complete-undocking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                showSuccess(`Undocking of ${undockingContainerId} completed. Items removed: ${data.itemsRemoved}`);
                document.querySelector('.waste-results').innerHTML = ''; // Clear previous results
            } catch (error) {
                showError(`Error completing undocking: ${error.message}`);
            } finally {
                hideLoading('waste-management');
            }
        } else {
            showError("Please provide the undocking container ID.");
        }
    });
}

function displayWasteItems(wasteItems) {
    const resultsDiv = document.querySelector('#waste-management .waste-results');
    if (resultsDiv) {
        if (wasteItems && wasteItems.length > 0) {
            let html = '<h3>Identified Waste Items</h3><ul>';
            wasteItems.forEach(item => {
                html += `<li>${item.name} (${item.itemId}) - Reason: ${item.reason}</li>`;
            });
            html += '</ul>';
            resultsDiv.innerHTML = html;
        } else {
            resultsDiv.innerHTML = '<p>No waste items identified.</p>';
        }
    }
}

function displayReturnPlan(data) {
    const resultsDiv = document.querySelector('#waste-management .waste-results');
    if (resultsDiv) {
        let html = '<h3>Waste Return Plan</h3>';
        if (data.returnManifest && data.returnManifest.returnItems.length > 0) {
            html += '<h4>Return Manifest</h4><ul>';
            data.returnManifest.returnItems.forEach(item => {
                html += `<li>${item.name} (${item.itemId}) - Expires: ${item.expiryDate}</li>`;
            });
            html += `</ul><p>Total Volume: ${data.returnManifest.totalVolume} cm³</p><p>Total Weight: ${data.returnManifest.totalWeight} kg</p>`;
        } else {
            html += '<p>No items to return based on the criteria.</p>';
        }

        if (data.retrievalSteps && data.retrievalSteps.length > 0) {
            html += '<h4>Retrieval Steps</h4><ol>';
            data.retrievalSteps.forEach(step => {
                html += `<li>Step ${step.step}: ${step.action} item ${step.itemName} (${step.itemId})</li>`;
            });
            html += '</ol>';
        }
        resultsDiv.innerHTML = html;
    }
}/* ====================== */
/* Search & Retrieve Section (Continued) */
/* ====================== */

async function loadSearchRetrieveSection() {
    const section = document.getElementById('search-retrieve');
    if (!section.querySelector('.search-interface')) {
        section.innerHTML = `
            <div class="search-interface">
                <h3>Search Items</h3>
                <div class="search-input">
                    <input type="text" id="searchQuery" placeholder="Enter item ID or name">
                    <button id="searchBtn">Search</button>
                </div>
                <div class="search-results"></div>
            </div>
            <div class="retrieve-interface">
                <h3>Retrieve Item</h3>
                <div class="retrieve-input">
                    <input type="text" id="retrieveItemId" placeholder="Enter Item ID to retrieve">
                    <button id="retrieveBtn">Retrieve</button>
                </div>
                <div class="retrieve-results"></div>
            </div>
        `;

        const searchBtn = document.getElementById('searchBtn');
        const searchResultsDiv = document.querySelector('#search-retrieve .search-results');
        const searchQueryInput = document.getElementById('searchQuery');
        const retrieveBtn = document.getElementById('retrieveBtn');
        const retrieveResultsDiv = document.querySelector('#search-retrieve .retrieve-results');
        const retrieveItemIdInput = document.getElementById('retrieveItemId');

        if (searchBtn) {
            searchBtn.addEventListener('click', async () => {
                const query = searchQueryInput.value.trim();
                if (query) {
                    try {
                        showLoading('search-retrieve');
                        const data = await fetchWithErrorHandling(`http://localhost:8000/api/items?query=${encodeURIComponent(query)}`);
                        if (data && data.items && data.items.length > 0) {
                            let resultsHTML = '<h3>Search Results</h3><ul>';
                            data.items.forEach(item => {
                                resultsHTML += `<li>${item.name} (${item.itemId}) - Zone: ${item.preferredZone}</li>`;
                            });
                            resultsHTML += '</ul>';
                            searchResultsDiv.innerHTML = resultsHTML;
                        } else {
                            searchResultsDiv.innerHTML = '<p>No items found matching your query.</p>';
                        }
                    } catch (error) {
                        console.error('Error searching items:', error);
                        showError(`Error searching: ${error.message}`);
                        searchResultsDiv.innerHTML = '<p>Error occurred during search.</p>';
                    } finally {
                        hideLoading('search-retrieve');
                    }
                } else {
                    searchResultsDiv.innerHTML = '<p>Please enter a search query.</p>';
                }
            });
        }

        if (retrieveBtn) {
            retrieveBtn.addEventListener('click', async () => {
                const itemId = retrieveItemIdInput.value.trim();
                if (itemId) {
                    try {
                        showLoading('search-retrieve');
                        const data = await fetchWithErrorHandling(`http://localhost:8000/api/items/${encodeURIComponent(itemId)}`);
                        if (data && data.item) {
                            retrieveResultsDiv.innerHTML = `<h3>Item Details</h3><ul>
                                <li>ID: ${data.item.itemId}</li>
                                <li>Name: ${data.item.name}</li>
                                <li>Priority: ${data.item.priority}</li>
                                <li>Dimensions: ${data.item.width}x${data.item.depth}x${data.item.height} cm</li>
                                <li>Mass: ${data.item.mass} kg</li>
                                <li>Preferred Zone: ${data.item.preferredZone}</li>
                            </ul>`;
                        } else {
                            retrieveResultsDiv.innerHTML = `<p>Item with ID '${itemId}' not found.</p>`;
                        }
                    } catch (error) {
                        console.error('Error retrieving item:', error);
                        showError(`Error retrieving: ${error.message}`);
                        retrieveResultsDiv.innerHTML = `<p>Error occurred while retrieving item '${itemId}'.</p>`;
                    } finally {
                        hideLoading('search-retrieve');
                    }
                } else {
                    retrieveResultsDiv.innerHTML = '<p>Please enter an Item ID to retrieve.</p>';
                }
            });
        }
    }
    // Clear previous results on navigation
    document.querySelector('#search-retrieve .search-results').innerHTML = '';
    document.querySelector('#search-retrieve .retrieve-results').innerHTML = '';
}/* ====================== */
/* Placement Section (Continued) */
/* ====================== */

async function loadPlacementSection() {
    const section = document.getElementById('placement');
    if (!section.querySelector('.placement-interface')) {
        section.innerHTML = `
            <div class="placement-interface">
                <h3>Placement Recommendations</h3>
                <div class="placement-input">
                    <label for="placementItemId">Item ID:</label>
                    <input type="text" id="placementItemId" placeholder="Enter Item ID">
                    <label for="placementContainerId">Container ID (Optional):</label>
                    <input type="text" id="placementContainerId" placeholder="Enter Container ID">
                    <button id="getPlacementBtn">Get Recommendations</button>
                </div>
                <div class="placement-results"></div>
            </div>
        `;

        const getPlacementBtn = document.getElementById('getPlacementBtn');
        const placementResultsDiv = document.querySelector('#placement .placement-results');
        const placementItemIdInput = document.getElementById('placementItemId');
        const placementContainerIdInput = document.getElementById('placementContainerId');

        if (getPlacementBtn) {
            getPlacementBtn.addEventListener('click', async () => {
                const itemId = placementItemIdInput.value.trim();
                const containerId = placementContainerIdInput.value.trim();

                if (itemId) {
                    try {
                        showLoading('placement');
                        let url = `http://localhost:8000/api/placement/${encodeURIComponent(itemId)}`;
                        if (containerId) {
                            url += `?containerId=${encodeURIComponent(containerId)}`;
                        }
                        const data = await fetchWithErrorHandling(url);
                        if (data && data.recommendations && data.recommendations.length > 0) {
                            let resultsHTML = '<h3>Placement Recommendations</h3><ul>';
                            data.recommendations.forEach(rec => {
                                resultsHTML += `<li>Container: ${rec.containerId}, Zone: ${rec.zone}</li>`;
                            });
                            resultsHTML += '</ul>';
                            placementResultsDiv.innerHTML = resultsHTML;
                        } else if (data && data.message) {
                            placementResultsDiv.innerHTML = `<p>${data.message}</p>`;
                        }
                         else {
                            placementResultsDiv.innerHTML = '<p>No placement recommendations found.</p>';
                        }
                    } catch (error) {
                        console.error('Error getting placement recommendations:', error);
                        showError(`Error getting recommendations: ${error.message}`);
                        placementResultsDiv.innerHTML = '<p>Error occurred while fetching recommendations.</p>';
                    } finally {
                        hideLoading('placement');
                    }
                } else {
                    placementResultsDiv.innerHTML = '<p>Please enter an Item ID to get placement recommendations.</p>';
                }
            });
        }
    }
    // Clear previous results on navigation
    document.querySelector('#placement .placement-results').innerHTML = '';
}/* ====================== */
/* Waste Management Section (Continued) */
/* ====================== */

async function loadWasteManagementSection() {
    const section = document.getElementById('waste-management');
    if (!section.querySelector('.waste-management-interface')) {
        section.innerHTML = `
            <div class="waste-management-interface">
                <h3>Waste Management</h3>
                <div class="waste-actions">
                    <button id="identifyWasteBtn">Identify Waste Items</button>
                    <button id="generateReturnPlanBtn">Generate Return Plan</button>
                    <button id="completeUndockingBtn">Complete Undocking</button>
                </div>
                <div class="waste-results"></div>
            </div>
        `;

        document.getElementById('identifyWasteBtn').addEventListener('click', async () => {
            try {
                showLoading('waste-management');
                const data = await fetchWithErrorHandling('http://localhost:8000/api/waste/identify');
                displayWasteItems(data.wasteItems);
            } catch (error) {
                showError(`Error identifying waste: ${error.message}`);
            } finally {
                hideLoading('waste-management');
            }
        });

        document.getElementById('generateReturnPlanBtn').addEventListener('click', async () => {
            const undockingContainerId = prompt("Enter Undocking Container ID:");
            const undockingDate = prompt("Enter Undocking Date (YYYY-MM-DD):");
            const maxWeight = parseFloat(prompt("Enter Maximum Return Weight:"));

            if (undockingContainerId && undockingDate && !isNaN(maxWeight)) {
                try {
                    showLoading('waste-management');
                    const payload = { undockingContainerId, undockingDate, maxWeight };
                    const data = await fetchWithErrorHandling('http://localhost:8000/api/waste/return-plan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    displayReturnPlan(data);
                } catch (error) {
                    showError(`Error generating return plan: ${error.message}`);
                } finally {
                    hideLoading('waste-management');
                }
            } else {
                showError("Please provide valid container ID, date, and max weight.");
            }
        });

        document.getElementById('completeUndockingBtn').addEventListener('click', async () => {
            const undockingContainerId = prompt("Enter Undocking Container ID for completion:");
            const timestamp = new Date().toISOString(); // Or allow user input

            if (undockingContainerId) {
                try {
                    showLoading('waste-management');
                    const payload = { undockingContainerId, timestamp };
                    const data = await fetchWithErrorHandling('http://localhost:8000/api/waste/complete-undocking', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    showSuccess(`Undocking of ${undockingContainerId} completed. Items removed: ${data.itemsRemoved}`);
                    document.querySelector('.waste-results').innerHTML = ''; // Clear previous results
                } catch (error) {
                    showError(`Error completing undocking: ${error.message}`);
                } finally {
                    hideLoading('waste-management');
                }
            } else {
                showError("Please provide the undocking container ID.");
            }
        });
    }
    // Clear previous results on navigation
    document.querySelector('#waste-management .waste-results').innerHTML = '';
}

function displayWasteItems(wasteItems) {
    const resultsDiv = document.querySelector('#waste-management .waste-results');
    if (resultsDiv) {
        if (wasteItems && wasteItems.length > 0) {
            let html = '<h3>Identified Waste Items</h3><ul>';
            wasteItems.forEach(item => {
                html += `<li>${item.name} (${item.itemId}) - Reason: ${item.reason}</li>`;
            });
            html += '</ul>';
            resultsDiv.innerHTML = html;
        } else {
            resultsDiv.innerHTML = '<p>No waste items identified.</p>';
        }
    }
}

function displayReturnPlan(data) {
    const resultsDiv = document.querySelector('#waste-management .waste-results');
    if (resultsDiv) {
        let html = '<h3>Waste Return Plan</h3>';
        if (data.returnManifest && data.returnManifest.returnItems.length > 0) {
            html += '<h4>Return Manifest</h4><ul>';
            data.returnManifest.returnItems.forEach(item => {
                html += `<li>${item.name} (${item.itemId}) - Expires: ${item.expiryDate}</li>`;
            });
            html += `</ul><p>Total Volume: ${data.returnManifest.totalVolume} cm³</p><p>Total Weight: ${data.returnManifest.totalWeight} kg</p>`;
        } else {
            html += '<p>No items to return based on the criteria.</p>';
        }

        if (data.retrievalSteps && data.retrievalSteps.length > 0) {
            html += '<h4>Retrieval Steps</h4><ol>';
            data.retrievalSteps.forEach(step => {
                html += `<li>Step ${step.step}: ${step.action} item ${step.itemName} (${step.itemId})</li>`;
            });
            html += '</ol>';
        }
        resultsDiv.innerHTML = html;
    }
}/* ====================== */
/* Time Simulation Section (Continued - Final Part) */
/* ====================== */

async function loadTimeSimulationSection() {
    const section = document.getElementById('time-simulation');
    if (!section.querySelector('.time-simulation-controls')) {
        section.innerHTML = `
            <div class="time-simulation-controls">
                <h3>Simulate Time</h3>
                <div class="simulation-options">
                    <label for="simulateDays">Simulate for (days):</label>
                    <input type="number" id="simulateDays" min="1" value="1">
                    <button id="simulateByDaysBtn">Simulate</button>
                </div>
                <div class="simulation-options">
                    <label for="simulateTo">Simulate to Timestamp:</label>
                    <input type="datetime-local" id="simulateTo">
                    <button id="simulateToBtn">Simulate To</button>
                </div>
                <div class="usage-input">
                    <h3>Items to Use Today</h3>
                    <div id="itemsToUseList">
                        <div class="item-usage">
                            <input type="text" class="itemIdToUse" placeholder="Item ID">
                        </div>
                    </div>
                    <button id="addItemToUseBtn">Add Item</button>
                </div>
                <div class="simulation-results"></div>
            </div>
        `;

        document.getElementById('simulateByDaysBtn').addEventListener('click', async () => {
            const numOfDays = parseInt(document.getElementById('simulateDays').value);
            if (!isNaN(numOfDays) && numOfDays > 0) {
                await simulateTime({ numOfDays });
            } else {
                showError("Please enter a valid number of days.");
            }
        });

        document.getElementById('simulateToBtn').addEventListener('click', async () => {
            const toTimestampInput = document.getElementById('simulateTo').value;
            if (toTimestampInput) {
                await simulateTime({ toTimestamp: toTimestampInput + ':00Z' }); // Ensure UTC format
            } else {
                showError("Please select a target timestamp.");
            }
        });

        document.getElementById('addItemToUseBtn').addEventListener('click', () => {
            const itemsToUseList = document.getElementById('itemsToUseList');
            const newItemUsage = document.createElement('div');
            newItemUsage.className = 'item-usage';
            newItemUsage.innerHTML = `
                <input type="text" class="itemIdToUse" placeholder="Item ID">
                <button class="removeItemToUseBtn">Remove</button>
            `;
            itemsToUseList.appendChild(newItemUsage);
            newItemUsage.querySelector('.removeItemToUseBtn').addEventListener('click', (e) => {
                e.target.parentNode.remove();
            });
        });
    }
    // Optionally clear previous results
    document.querySelector('#time-simulation .simulation-results').innerHTML = '';
}

async function simulateTime(payload) {
    try {
        showLoading('time-simulation');
        const itemsToBeUsedPerDay = Array.from(document.querySelectorAll('#itemsToUseList .itemIdToUse'))
            .map(input => ({ itemId: input.value }))
            .filter(item => item.itemId); // Only include if itemId is not empty
        const fullPayload = { ...payload, itemsToBeUsedPerDay };
        const data = await fetchWithErrorHandling('http://localhost:8000/api/simulate/day', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullPayload)
        });
        displaySimulationResults(data);
    } catch (error) {
        showError(`Error simulating time: ${error.message}`);
    } finally {
        hideLoading('time-simulation');
    }
}

function displaySimulationResults(data) {
    const resultsDiv = document.querySelector('#time-simulation .simulation-results');
    if (resultsDiv) {
        let html = `<h3>Simulation Results</h3><p>New Date: ${new Date(data.newDate).toLocaleString()}</p>`;
        if (data.changes) {
            if (data.changes.itemsUsed && data.changes.itemsUsed.length > 0) {
                html += '<h4>Items Used</h4><ul>';
                data.changes.itemsUsed.forEach(item => {
                    html += `<li>${item.name} (${item.itemId}) - Remaining Uses: ${item.remainingUses !== undefined ? item.remainingUses : 'N/A'}</li>`;
                });
                html += '</ul>';
            }
            if (data.changes.itemsExpired && data.changes.itemsExpired.length > 0) {
                html += '<h4>Items Expired</h4><ul>';
                data.changes.itemsExpired.forEach(item => {
                    html += `<li>${item.name} (${item.itemId}) - Expired on: ${new Date(item.expiryDate).toLocaleDateString()}</li>`;
                });
                html += '</ul>';
            }
            if (data.changes.itemsDepletedToday && data.changes.itemsDepletedToday.length > 0) {
                html += '<h4>Items Depleted Today</h4><ul>';
                data.changes.itemsDepletedToday.forEach(item => {
                    html += `<li>${item.name} (${item.itemId})</li>`;
                });
                html += '</ul>';
            }
            if (Object.keys(data.changes).every(key => !data.changes[key] || data.changes[key].length === 0)) {
                html += '<p>No significant changes during this simulation.</p>';
            }
        }
        resultsDiv.innerHTML = html;
    }
}