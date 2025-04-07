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
                                <th>Expiry Date</th>
                                <th>Usage Limit</th>
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
                            <input type="number" id="mass" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="priority">Priority:</label>
                            <input type="number" id="priority" min="1" max="5" value="3" required>
                        </div>
                        <div class="form-group">
                            <label for="expiryDate">Expiry Date:</label>
                            <input type="date" id="expiryDate">
                        </div>
                        <div class="form-group">
                            <label for="usageLimit">Usage Limit:</label>
                            <input type="number" id="usageLimit" min="0">
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
                    <td>${item.expiryDate || ''}</td>
                    <td>${item.usageLimit !== undefined ? item.usageLimit : ''}</td>
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
        const itemId = document.getElementById('itemId').value.trim();
        const name = document.getElementById('name').value.trim();
        const widthStr = document.getElementById('width').value.trim();
        const depthStr = document.getElementById('depth').value.trim();
        const heightStr = document.getElementById('height').value.trim();
        const massStr = document.getElementById('mass').value.trim();
        const priorityStr = document.getElementById('priority').value.trim();
        const expiryDate = document.getElementById('expiryDate').value;
        const usageLimitStr = document.getElementById('usageLimit').value.trim();
        const preferredZone = document.getElementById('preferredZone').value.trim();

        // --- Validation ---
        let width, depth, height, mass, priority, usageLimit;

        if (!widthStr || isNaN(Number(widthStr)) || !Number.isInteger(Number(widthStr)) || Number(widthStr) <= 0) {
            showError('Please enter a valid positive integer for Width.');
            return;
        }
        width = Number(widthStr);
        

        if (!depthStr || isNaN(depthStr) || parseInt(depthStr, 10) <= 0 || parseInt(depthStr, 10).toString() !== depthStr) {
            showError('Please enter a valid positive integer for Depth.');
            return;
        }
        depth = parseInt(depthStr, 10);

        if (!heightStr || isNaN(heightStr) || parseInt(heightStr, 10) <= 0 || parseInt(heightStr, 10).toString() !== heightStr) {
            showError('Please enter a valid positive integer for Height.');
            return;
        }
        height = parseInt(heightStr, 10);

        if (!massStr || isNaN(massStr) || parseFloat(massStr) < 0) {
            showError('Please enter a valid non-negative number for Mass.');
            return;
        }
        mass = parseFloat(massStr);

        if (!priorityStr || isNaN(priorityStr) || parseInt(priorityStr, 10) < 1 || parseInt(priorityStr, 10) > 5 || parseInt(priorityStr, 10).toString() !== priorityStr) {
            showError('Please enter a valid integer (1-5) for Priority.');
            return;
        }
        priority = parseInt(priorityStr, 10);

        usageLimit = usageLimitStr ? parseInt(usageLimitStr, 10) : null;

        const itemData = {
            itemId: itemId,
            name: name,
            width: width,
            depth: depth,
            height: height,
            mass: mass,
            priority: priority,
            expiryDate: expiryDate,
            usageLimit: usageLimit,
            preferredZone: preferredZone
        };

        const response = await fetch('http://localhost:8000/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([itemData])
        });        

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        showSuccess('Item added successfully!');
        document.getElementById('itemForm').reset();
        await displayItems();

    } catch (error) {
        console.error('Error adding item:', error);
        showError(`Error adding item: ${error.message}`);
    }
}


async function fetchWithErrorHandling(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData) {
                    errorMessage = JSON.stringify(errorData, null, 2);
                }
            } catch (jsonError) {
                console.error("Failed to parse error JSON:", jsonError);
            }
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

function displayPlacementResults(data, resultsDiv) {
    if (data && data.success) {
        let resultsHTML = '<h4>Placement Results:</h4>';
        if (data.placements && data.placements.length > 0) {
            resultsHTML += '<ul>';
            data.placements.forEach(placement => {
                resultsHTML += `<li>Item ${placement.itemId} recommended for Container ${placement.containerId}</li>`;
            });
            resultsHTML += '</ul>';
        } else {
            resultsHTML += '<p>No suitable placements found.</p>';
        }

        if (data.rearrangements && data.rearrangements.length > 0) {
            resultsHTML += '<h4>Rearrangements:</h4><ul>';
            data.rearrangements.forEach(rearrangement => {
                resultsHTML += `<li>Move ${rearrangement.itemIdFrom} from Container ${rearrangement.containerIdFrom} to Container ${rearrangement.containerIdTo}</li>`;
            });
            resultsHTML += '</ul>';
        }

        resultsDiv.innerHTML = resultsHTML;

    } else {
        resultsDiv.innerHTML = '<p>Failed to retrieve placement results.</p>';
    }
}

function displayPlacementData(data, resultsDiv) {
    let html = '';
    if (data.success) {
        html += `<h4>Item Details:</h4>`;
        if (data.itemDetails) {
            html += `
                <p>Name: ${data.itemDetails.name}</p>
                <p>Width: ${data.itemDetails.width}</p>
                <p>Depth: ${data.itemDetails.depth}</p>
                <p>Height: ${data.itemDetails.height}</p>
                <p>Mass: ${data.itemDetails.mass}</p>
                <p>Priority: ${data.itemDetails.priority}</p>
                <p>Usage Limit: ${data.itemDetails.usageLimit}</p>
                <p>Preferred Zone: ${data.itemDetails.preferredZone}</p>
            `;
        }

        html += `<h4>Placement Recommendations:</h4>`;
        if (data.recommendations && data.recommendations.length > 0) {
            html += '<ul>';
            data.recommendations.forEach(rec => {
                html += `<li>Container: ${rec.containerId}, Zone: ${rec.zone}, Reason: ${rec.reason}</li>`;
            });
            html += '</ul>';
        } else {
            html += `<p>${data.message || 'No placement recommendations found.'}</p>`;
        }
    } else {
        html = `<p>Error: ${data.message || 'Failed to get placement data.'}</p>`;
    }
    resultsDiv.innerHTML = html;
}

//  holder functions for other sections
async function loadPlacementSection() {
    const section = document.getElementById('placement');
    section.innerHTML = `
        <div class="placement-interface">
            <h3>Placement Recommendations</h3>
            <div class="placement-input">
                <label for="placementItemId">Item ID:</label>
                <input type="text" id="placementItemId" placeholder="Enter Item ID" required><br>
                <button id="getPlacementBtn">Get Recommendations</button>
            </div>
            <div class="placement-results"></div>
        </div>
    `;

    const getPlacementBtn = document.getElementById('getPlacementBtn');
    const placementItemIdInput = document.getElementById('placementItemId');
    const placementResultsDiv = document.querySelector('#placement .placement-results');

    getPlacementBtn.addEventListener('click', async () => {
        const itemId = placementItemIdInput.value.trim();
        if (itemId) {
            try {
                showLoading('placement');
                const response = await fetchWithErrorHandling('http://localhost:8000/api/placement', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ items: [{ itemId: itemId }], containers: [] })
                });

                if (response) {
                    const data = await response.json();
                    displayPlacementData(data, placementResultsDiv);
                }

            } catch (error) {
                console.error("Error getting placement recommendations:", error);
                showError("Failed to get recommendations: " + error.message);
                placementResultsDiv.textContent = "Error: " + error.message;
            } finally {
                hideLoading('placement');
            }
        } else {
            showError("Please enter an Item ID.");
            placementResultsDiv.textContent = "Please enter an Item ID.";
        }
    });
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

        document.getElementById('ToUseBtn').addEventListener('click', () => {
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

    // Check if the placement interface is already loaded
    if (!section.querySelector('.placement-interface')) {
        section.innerHTML = `
            <div class="placement-interface">
                <h3>Placement Recommendations</h3>
                <div class="placement-input">
                    <label for="placementItemId">Item ID:</label>
                    <input type="text" id="placementItemId" placeholder="Enter Item ID" required><br>

                    <button id="fetchItemDetailsBtn">Fetch Item Details</button><br><br>

                    <label for="itemName">Item Name:</label>
                    <input type="text" id="itemName" placeholder="Item Name" readonly><br>

                    <label for="itemWidth">Item Width:</label>
                    <input type="number" id="itemWidth" placeholder="Item Width" readonly><br>

                    <label for="itemDepth">Item Depth:</label>
                    <input type="number" id="itemDepth" placeholder="Item Depth" readonly><br>

                    <label for="itemHeight">Item Height:</label>
                    <input type="number" id="itemHeight" placeholder="Item Height" readonly><br>

                    <label for="itemMass">Item Mass:</label>
                    <input type="number" id="itemMass" placeholder="Item Mass" step="0.1" readonly><br>

                    <label for="itemPriority">Item Priority:</label>
                    <input type="number" id="itemPriority" placeholder="Item Priority" readonly><br>

                    <label for="itemUsageLimit">Item Usage Limit:</label>
                    <input type="number" id="itemUsageLimit" placeholder="Item Usage Limit" readonly><br>

                    <label for="itemPreferredZone">Item Preferred Zone:</label>
                    <input type="text" id="itemPreferredZone" placeholder="Preferred Zone" readonly><br>

                    <label for="placementContainerId">Container ID (Optional):</label>
                    <input type="text" id="placementContainerId" placeholder="Enter Container ID"><br>

                    <label for="containerZone">Container Zone (Optional):</label>
                    <input type="text" id="containerZone" placeholder="Enter Container Zone"><br>

                    <label for="containerWidth">Container Width (Optional):</label>
                    <input type="number" id="containerWidth" placeholder="Enter Container Width"><br>

                    <label for="containerDepth">Container Depth (Optional):</label>
                    <input type="number" id="containerDepth" placeholder="Enter Container Depth"><br>

                    <label for="containerHeight">Container Height (Optional):</label>
                    <input type="number" id="containerHeight" placeholder="Enter Container Height"><br><br>

                    <button id="getPlacementBtn" disabled>Get Recommendations</button>
                </div>
                <div class="placement-results"></div>
            </div>
        `;

        const getPlacementBtn = document.getElementById('getPlacementBtn');
        const fetchItemDetailsBtn = document.getElementById('fetchItemDetailsBtn');
        const placementResultsDiv = document.querySelector('#placement .placement-results');
        const placementItemIdInput = document.getElementById('placementItemId');
        const placementContainerIdInput = document.getElementById('placementContainerId');

        const itemNameInput = document.getElementById('itemName');
        const itemWidthInput = document.getElementById('itemWidth');
        const itemDepthInput = document.getElementById('itemDepth');
        const itemHeightInput = document.getElementById('itemHeight');
        const itemMassInput = document.getElementById('itemMass');
        const itemPriorityInput = document.getElementById('itemPriority');
        const itemUsageLimitInput = document.getElementById('itemUsageLimit');
        const itemPreferredZoneInput = document.getElementById('itemPreferredZone');

        const containerZoneInput = document.getElementById('containerZone');
        const containerWidthInput = document.getElementById('containerWidth');
        const containerDepthInput = document.getElementById('containerDepth');
        const containerHeightInput = document.getElementById('containerHeight');

        // Function to fetch item details from the backend
        async function fetchItemDetails(itemId) {
            try {
                const response = await fetch(`/api/items/${itemId}`); // Replace with your actual API endpoint
                if (!response.ok) {
                    const errorData = await response.json();
                    showError(`Error fetching item details: ${errorData.detail || 'Item not found'}`);
                    // Optionally clear item details fields
                    clearItemDetails();
                    getPlacementBtn.disabled = true;
                    return null;
                }
                const itemData = await response.json();
                return itemData;
            } catch (error) {
                console.error('Error fetching item details:', error);
                showError(`Error fetching item details: ${error.message}`);
                clearItemDetails();
                getPlacementBtn.disabled = true;
                return null;
            }
        }

        // Function to populate item details in the form
        function populateItemDetails(item) {
            itemNameInput.value = item.name || '';
            itemWidthInput.value = item.width || '';
            itemDepthInput.value = item.depth || '';
            itemHeightInput.value = item.height || '';
            itemMassInput.value = item.mass || '';
            itemPriorityInput.value = item.priority || '';
            itemUsageLimitInput.value = item.usageLimit || '';
            itemPreferredZoneInput.value = item.preferredZone || '';
            getPlacementBtn.disabled = false;
        }

        // Function to clear item details fields
        function clearItemDetails() {
            itemNameInput.value = '';
            itemWidthInput.value = '';
            itemDepthInput.value = '';
            itemHeightInput.value = '';
            itemMassInput.value = '';
            itemPriorityInput.value = '';
            itemUsageLimitInput.value = '';
            itemPreferredZoneInput.value = '';
        }

        // Event listener for fetching item details
        if (fetchItemDetailsBtn) {
            fetchItemDetailsBtn.addEventListener('click', async () => {
                const itemId = placementItemIdInput.value.trim();
                if (itemId) {
                    showLoading('placement');
                    const itemDetails = await fetchItemDetails(itemId);
                    hideLoading('placement');
                    if (itemDetails) {
                        populateItemDetails(itemDetails);
                    }
                } else {
                    showError('Please enter an Item ID to fetch details.');
                    clearItemDetails();
                    getPlacementBtn.disabled = true;
                }
            });
        }

        // Event listener for getting placement recommendations
        if (getPlacementBtn) {
            getPlacementBtn.addEventListener('click', async () => {
                const itemId = placementItemIdInput.value.trim();
                const containerId = placementContainerIdInput.value.trim();

                if (itemId && !getPlacementBtn.disabled) { // Ensure Item ID is present and details are fetched
                    try {
                        showLoading('placement');
                        const url = `http://localhost:8000/api/placement`; // Base URL
                        const dataToSend = {
                            items: [{
                                itemId: itemId,
                                name: itemNameInput.value,
                                width: parseInt(itemWidthInput.value),
                                depth: parseInt(itemDepthInput.value),
                                height: parseInt(itemHeightInput.value),
                                mass: parseFloat(itemMassInput.value),
                                priority: parseInt(itemPriorityInput.value),
                                usageLimit: parseInt(itemUsageLimitInput.value),
                                preferredZone: itemPreferredZoneInput.value
                            }],
                            containers: containerId ? [{
                                containerId: containerId,
                                zone: containerZoneInput.value,
                                width: parseInt(containerWidthInput.value),
                                depth: parseInt(containerDepthInput.value),
                                height: parseInt(containerHeightInput.value)
                            }] : [],
                        };

                        const response = await fetchWithErrorHandling(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(dataToSend),
                        });

                        const data = await response.json(); // Parse the JSON response

                        if (data && data.recommendations && data.recommendations.length > 0) {
                            let resultsHTML = '<h3>Placement Recommendations</h3><ul>';
                            data.recommendations.forEach(rec => {
                                resultsHTML += `<li>Container: ${rec.containerId}, Zone: ${rec.zone}</li>`;
                            });
                            resultsHTML += '</ul>';
                            placementResultsDiv.innerHTML = resultsHTML;
                        } else if (data && data.message) {
                            placementResultsDiv.innerHTML = `<p>${data.message}</p>`;
                        } else {
                            placementResultsDiv.innerHTML = '<p>No placement recommendations found.</p>';
                        }
                    } catch (error) {
                        console.error('Error getting placement recommendations:', error);
                        showError(`Error getting recommendations: ${error.message}`);
                        placementResultsDiv.innerHTML = '<p>Error occurred while fetching recommendations.</p>';
                    } finally {
                        hideLoading('placement');
                    }
                } else if (!itemId) {
                    placementResultsDiv.innerHTML = '<p>Please enter an Item ID to get placement recommendations.</p>';
                } else if (getPlacementBtn.disabled) {
                    showError('Please fetch item details before getting recommendations.');
                }
            });
        }
    }

    // Clear previous results on navigation
    const resultsDiv = document.querySelector('#placement .placement-results');
    if (resultsDiv) {
        resultsDiv.innerHTML = '';
    }
}/* ====================== */
/* Waste Management Section (Continued) */
/* ====================== */

async function loadItemData(itemId) {
    try {
        showLoading('placement'); // Use the 'placement' loader since this is for that section
        const itemData = await fetchWithErrorHandling(`http://localhost:8000/api/items/${itemId}`);
        hideLoading('placement');

        if (itemData) {
            populateItemDetails(itemData); // Call the existing function to fill the form
        } else {
            clearItemDetails(); // Optionally clear fields if no data
        }
        return itemData;
    } catch (error) {
        console.error(`Error fetching item ${itemId}:`, error);
        showError(`Could not retrieve item ${itemId}.`);
        clearItemDetails(); // Clear fields on error
        hideLoading('placement');
        return null;
    }
}

function populateItemDetails(item) {
    document.getElementById('itemName').value = item.name || '';
    document.getElementById('itemWidth').value = item.width || '';
    document.getElementById('itemDepth').value = item.depth || '';
    document.getElementById('itemHeight').value = item.height || '';
    document.getElementById('itemMass').value = item.mass || '';
    document.getElementById('itemPriority').value = item.priority || '';
    document.getElementById('itemUsageLimit').value = item.usageLimit || '';
    document.getElementById('itemPreferredZone').value = item.preferredZone || '';
}

function clearItemDetails() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemWidth').value = '';
    document.getElementById('itemDepth').value = '';
    document.getElementById('itemHeight').value = '';
    document.getElementById('itemMass').value = '';
    document.getElementById('itemPriority').value = '';
    document.getElementById('itemUsageLimit').value = '';
    document.getElementById('itemPreferredZone').value = '';
}

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
