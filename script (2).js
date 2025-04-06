document.addEventListener("DOMContentLoaded", () => {
    // --- Element Selectors ---
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");
    const navLinks = document.querySelectorAll(".sidebar .main-nav ul li a"); // More specific selector
    const contentArea = document.getElementById("content-area");
    const contentHeader = document.querySelector(".content-header h2");
    const formsContainer = document.getElementById("forms-container");
    const slideInForms = document.querySelectorAll(".slide-in-form");
    const outputDiv = document.getElementById("output");

    // --- Theme Toggle ---
    if (themeToggle && themeIcon) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            themeIcon.classList.toggle("fa-sun");
            themeIcon.classList.toggle("fa-moon");
        });
    }

    // --- Navigation Links ---
    navLinks.forEach(link => {
        if (link) {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                console.log("Sidebar link clicked:", link.dataset.section); // Keeping this for debugging
                const section = link.dataset.section;
                if (contentHeader) {
                    contentHeader.textContent = section.charAt(0).toUpperCase() + section.slice(1).replace('-', ' ');
                }
                loadContent(section);

                // Add active class to the clicked link and remove from others
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                link.classList.add('active');
            });
        }
    });

    // --- Load Content Function ---
    function loadContent(section) {
        if (contentArea) {
            contentArea.innerHTML = ''; // Clear previous content
        }
        if (formsContainer) {
            formsContainer.classList.remove('show'); // Hide all forms by default
        }
        slideInForms.forEach(form => {
            if (form) {
                form.classList.remove('show');
            }
        });

        let moduleActionsHTML = '';
        if (section === 'containers') {
            if (contentHeader) {
                contentHeader.textContent = 'Containers';
            }
            moduleActionsHTML = `
                <div class="module-actions">
                    <button class="icon-button" data-form="get-containers-form">
                        <i class="fa-solid fa-list"></i> Get Containers
                    </button>
                    <button class="icon-button" data-form="add-containers-form">
                        <i class="fa-solid fa-plus"></i> Add Container
                    </button>
                </div>
                `;
        } else if (section === 'items') {
            if (contentHeader) {
                contentHeader.textContent = 'Items';
            }
            moduleActionsHTML = `
                <div class="module-actions">
                    <button class="icon-button" data-form="get-items-form">
                        <i class="fa-solid fa-list"></i> Get Items
                    </button>
                    <button class="icon-button" data-form="add-items-form">
                        <i class="fa-solid fa-plus"></i> Add Item
                    </button>
                    <button class="icon-button" data-form="get-item-form">
                        <i class="fa-solid fa-search"></i> Get Item by ID
                    </button>
                </div>
                `;
        } else if (section === 'placement') {
            if (contentHeader) {
                contentHeader.textContent = 'Placement';
            }
            showForm('placement-form'); // Directly show the placement form
        } else if (section === 'search-retrieve') {
            if (contentHeader) {
                contentHeader.textContent = 'Search & Retrieve';
            }
            moduleActionsHTML = `
                <div class="module-actions">
                    <button class="icon-button" data-form="search-item-form">
                        <i class="fa-solid fa-magnifying-glass"></i> Search Item
                    </button>
                    <button class="icon-button" data-form="retrieve-item-form">
                        <i class="fa-solid fa-box-open"></i> Retrieve Item
                    </button>
                    <button class="icon-button" data-form="place-item-form">
                        <i class="fa-solid fa-location-dot"></i> Place Item
                    </button>
                </div>
                `;
        } else if (section === 'waste-management') {
            if (contentHeader) {
                contentHeader.textContent = 'Waste Management';
            }
            moduleActionsHTML = `
                <div class="module-actions">
                    <button class="icon-button" data-form="identify-waste-form">
                        <i class="fa-solid fa-exclamation-triangle"></i> Identify Waste
                    </button>
                    <button class="icon-button" data-form="return-plan-form">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i> Waste Return Plan
                    </button>
                    <button class="icon-button" data-form="complete-undocking-form">
                        <i class="fa-solid fa-space-shuttle"></i> Complete Undocking
                    </button>
                </div>
                `;
        } else if (section === 'time-simulation') {
            if (contentHeader) {
                contentHeader.textContent = 'Time Simulation';
            }
            showForm('simulate-day-form'); // Directly show the time simulation form
        } else if (section === 'import-export') {
            if (contentHeader) {
                contentHeader.textContent = 'Import/Export';
            }
            moduleActionsHTML = `
                <div class="module-actions">
                    <button class="icon-button" data-form="import-items-form">
                        <i class="fa-solid fa-file-import"></i> Import Items
                    </button>
                    <button class="icon-button" data-form="import-containers-form">
                        <i class="fa-solid fa-file-import"></i> Import Containers
                    </button>
                    <button class="icon-button" data-form="export-arrangement-form">
                        <i class="fa-solid fa-file-export"></i> Export Arrangement
                    </button>
                </div>
                `;
        } else if (section === 'logs') {
            if (contentHeader) {
                contentHeader.textContent = 'Logs';
            }
            showForm('logs-form'); // Directly show the logs form
        }

        if (contentArea) {
            contentArea.innerHTML = moduleActionsHTML;

            // Attach event listeners to module action buttons
            const actionButtons = contentArea.querySelectorAll('.module-actions .icon-button');
            actionButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const formId = button.dataset.form;
                    if (formId) {
                        showForm(formId);
                    }
                });
            });
        }
        // If a module has direct actions (buttons in contentArea), the forms container might still be hidden.
        // We only explicitly show forms for modules where the *primary* interaction is through a form.
        if (formsContainer && (section === 'placement' || section === 'time-simulation' || section === 'logs')) {
            formsContainer.classList.add('show');
        }
    }

    // --- Show Form Function ---
    window.showForm = (formId) => {
        if (formsContainer) {
            formsContainer.classList.add('show');
        }
        slideInForms.forEach(form => {
            if (form) {
                form.classList.remove('show');
            }
        });
        const formToShow = document.getElementById(formId);
        if (formToShow) {
            formToShow.classList.add('show');
        }
    };

    // --- Toggle Form Function ---
    window.toggleForm = (formId) => { // Keep this for the close button in forms
        if (formsContainer) {
            formsContainer.classList.remove('show');
        }
        const formToClose = document.getElementById(formId);
        if (formToClose) {
            formToClose.classList.remove('show');
        }
    };

    // --- API Interaction Functions ---
    window.getContainers = () => {
        if (outputDiv) {
            outputDiv.textContent = "Fetching containers...";
        }
        fetch('/api/containers')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Containers received:", data);
                if (data && data.containers) {
                    let containerListHTML = "<h3>Available Containers:</h3><ul>";
                    data.containers.forEach(container => {
                        containerListHTML += `<li>ID: ${container.containerId}, Zone: ${container.zone}, Dimensions: <span class="math-inline">\{container\.width\}x</span>{container.depth}x${container.height}</li>`;
                    });
                    containerListHTML += "</ul>";
                    if (outputDiv) {
                        outputDiv.innerHTML = containerListHTML;
                    }
                } else if (outputDiv) {
                    outputDiv.textContent = "No containers found.";
                }
            })
            .catch(error => {
                console.error("Error fetching containers:", error);
                if (outputDiv) {
                    outputDiv.textContent = `Error fetching containers: ${error.message}`;
                }
            });
    };

    window.addContainer = () => {
        const containerIdInput = document.getElementById("containerId");
        const zoneInput = document.getElementById("zone");
        const widthInput = document.getElementById("width");
        const depthInput = document.getElementById("depth");
        const heightInput = document.getElementById("height");

        const containerId = containerIdInput ? containerIdInput.value : "";
        const zone = zoneInput ? zoneInput.value : "";
        const width = widthInput ? parseInt(widthInput.value) : NaN;
        const depth = depthInput ? parseInt(depthInput.value) : NaN;
        const height = heightInput ? parseInt(heightInput.value) : NaN;

        if (!containerId || !zone || isNaN(width) || isNaN(depth) || isNaN(height)) {
            if (outputDiv) {
                outputDiv.textContent = "Please fill in all container details.";
            }
            return;
        }

        const newContainer = {
            containerId: containerId,
            zone: zone,
            width: width,
            depth: depth,
            height: height
        };

        if (outputDiv) {
            outputDiv.textContent = "Adding container...";
        }

        fetch('/api/containers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([newContainer]),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Container added:", data);
            if (outputDiv) {
                outputDiv.textContent = `Container "${containerId}" added successfully. ${data.message || ''} (Total: ${data.total || 1})`;
            }
            if (containerIdInput) containerIdInput.value = '';
            if (zoneInput) zoneInput.value = '';
            if (widthInput) widthInput.value = '';
            if (depthInput) depthInput.value = '';
            if (heightInput) heightInput.value = '';
            toggleForm('add-containers-form');
        })
        .catch(error => {
            console.error("Error adding container:", error);
            if (outputDiv) {
                outputDiv.textContent = `Error adding container: ${error.message}`;
            }
        });
    };

    window.getItems = () => {
        if (outputDiv) {
            outputDiv.textContent = "Fetching items...";
        }
        fetch('/api/items')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Items received:", data);
                if (data && data.items) {
                    let itemListHTML = "<h3>Available Items:</h3><ul>";
                    data.items.forEach(item => {
                        itemListHTML += `<li>ID: ${item.itemId}, Name: ${item.name}, Priority: ${item.priority}</li>`;
                    });
                    itemListHTML += "</ul>";
                    if (outputDiv) {
                        outputDiv.innerHTML = itemListHTML;
                    }
                } else if (outputDiv) {
                    outputDiv.textContent = "No items found.";
                }
            })
            .catch(error => {
                console.error("Error fetching items:", error);
                if (outputDiv) {
                    outputDiv.textContent = `Error fetching items: ${error.message}`;
                }
            });
    };

    window.addItem = () => {
        const itemIdInput = document.getElementById("addItemId");
        const nameInput = document.getElementById("addItemName");
        const widthInput = document.getElementById("addItemWidth");
        const depthInput = document.getElementById("addItemDepth");
        const heightInput = document.getElementById("addItemHeight");
        const massInput = document.getElementById("addItemMass");
        const priorityInput = document.getElementById("addItemPriority");
        const expiryDateInput = document.getElementById("addItemExpiryDate");
        const usageLimitInput = document.getElementById("addItemUsageLimit");
        const preferredZoneInput = document.getElementById("addItemPreferredZone");

        const itemId = itemIdInput ? itemIdInput.value : "";
        const name = nameInput ? nameInput.value : "";
        const width = widthInput ? parseInt(widthInput.value) : NaN;
        const depth = depthInput ? parseInt(depthInput.value) : NaN;
        const height = heightInput ? parseInt(heightInput.value) : NaN;
        const mass = massInput ? parseFloat(massInput.value) : NaN;
        const priority = priorityInput ? parseInt(priorityInput.value) : NaN;
        const expiryDate = expiryDateInput ? expiryDateInput.value || null : null;
        const usageLimit = usageLimitInput ? parseInt(usageLimitInput.value) : NaN;
        const preferredZone = preferredZoneInput ? preferredZoneInput.value : "";

        if (!itemId || !name || isNaN(width) || isNaN(depth) || isNaN(height) || isNaN(mass) || isNaN(priority) || isNaN(usageLimit) || !preferredZone) {
            if (outputDiv) {
                outputDiv.textContent = "Please fill in all item details.";
            }
            return;
        }

        const newItem = {
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

        if (outputDiv) {
            outputDiv.textContent = "Adding item...";
        }

        fetch('/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([newItem]),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Item added:", data);
            if (outputDiv) {
                outputDiv.textContent = `Item "${name}" added successfully. ${data.message || ''} (Total: ${data.total || 1})`;
            }
            if (itemIdInput) itemIdInput.value = '';
            if (nameInput) nameInput.value = '';
            if (widthInput) widthInput.value = '';
            if (depthInput) depthInput.value = '';
            if (heightInput) heightInput.value = '';
            if (massInput) massInput.value = '';
            if (priorityInput) priorityInput.value = '';
            if (expiryDateInput) expiryDateInput.value = '';
            if (usageLimitInput) usageLimitInput.value = '';
            if (preferredZoneInput) preferredZoneInput.value = '';
            toggleForm('add-items-form');
        })
        .catch(error => {
            console.error("Error adding item:", error);
            if (outputDiv) {
                outputDiv.textContent = `Error adding item: ${error.message}`;
            }
        });
    };

    window.getItemById = () => {
        const itemIdInput = document.getElementById("getItemId");
        const itemId = itemIdInput ? itemIdInput.value : "";

        if (!itemId) {
            if (outputDiv) {
                outputDiv.textContent = "Please enter an Item ID.";
            }
            return;
        }

        if (outputDiv) {
            outputDiv.textContent = `Fetching item with ID: ${itemId}...`;
        }

        fetch(`/api/items/${itemId}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || `HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(item => {
                console.log("Item received:", item);
                if (item && !item.error && outputDiv) {
                    const itemDetailsHTML = `<h3>Item Details:</h3>
                        <p>ID: ${item.itemId}</p>
                        <p>Name: ${item.name}</p>
                        <p>Width: ${item.width}, Depth: ${item.depth}, Height: ${item.height}</p>
                        <p>Mass: ${item.mass}, Priority: ${item.priority}</p>
                        <p>Expiry Date: ${item.expiryDate || 'N/A'}, Usage Limit: ${item.usageLimit}</p>
                        <p>Preferred Zone: ${item.preferredZone}</p>`;
                    outputDiv.innerHTML = itemDetailsHTML;
                } else if (outputDiv) {
                    outputDiv.textContent = `Item with ID "${itemId}" not found.`;
                }
            })
            .catch(error => {
                console.error("Error fetching item:", error);
                if (outputDiv) {
                    outputDiv.textContent = `Error fetching item: ${error.message}`;
                }
            });
    };

    window.getPlacement = () => {
        const itemsTextareaElement = document.getElementById("placementItems");
        const containersTextareaElement = document.getElementById("placementContainers");

        const itemsTextarea = itemsTextareaElement ? itemsTextareaElement.value : "";
        const containersTextarea = containersTextareaElement ? containersTextareaElement.value : "";

        let items = [];
        let containers = [];

        try {
            items = JSON.parse(itemsTextarea);
            containers = JSON.parse(containersTextarea);
        } catch (error) {
            if (outputDiv) {
                outputDiv.textContent = "Invalid JSON format for Items or Containers.";
            }
            console.error("JSON Parse Error:", error);
            return;
        }

        if (!Array.isArray(items) || !Array.isArray(containers)) {
            if (outputDiv) {
                outputDiv.textContent = "Items and Containers must be JSON arrays.";
            }
            return;
        }

        if (outputDiv) {
            outputDiv.textContent = "Requesting placement recommendations...";
        }

        fetch('/api/placement', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: items, containers: containers }),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Placement recommendations received:", data);
            if (data && data.success && data.placements) {
                let placementHTML = "<h3>Placement Recommendations:</h3><ul>";
                data.placements.forEach(placement => {
                    placementHTML += `<li>Item ID: ${placement.itemId}, Container ID: ${placement.containerId}, Position: ${JSON.stringify(placement.position)}</li>`;
                });
                placementHTML += "</ul>";
                if (data.rearrangements) {
                    placementHTML += "<h3>Rearrangements Recommended:</h3><ul>";
                    data.rearrangements.forEach(rearrangement => {
                        placementHTML += `<li>Item ID: ${rearrangement.itemId} needs to be moved from Container ID: ${rearrangement.fromContainerId} to Container ID: ${rearrangement.toContainerId}</li>`; // Adjust based on your API response structure
                    });
                    placementHTML += "</ul>";
                }
                outputDiv.innerHTML = placementHTML;
                toggleForm('placement-form'); // Assuming you want to close the form after displaying results
            } else if (outputDiv) {
                outputDiv.textContent = "No placement recommendations found.";
            }
        })
        .catch(error => {
            console.error("Error getting placement:", error);
            if (outputDiv) {
                outputDiv.textContent = `Error getting placement: ${error.message}`;
            }
        });
    };

    window.placeItem = () => {
        const itemIdInput = document.getElementById("placeItemId");
        const containerIdInput = document.getElementById("placeContainerId");
        const locationInput = document.getElementById("placeLocation");

        const itemId = itemIdInput ? itemIdInput.value : "";
        const containerId = containerIdInput ? containerIdInput.value : "";
        const location = locationInput ? locationInput.value : "";

        if (!itemId || !location) {
            if (outputDiv) {
                outputDiv.textContent = "Please provide Item ID and Location.";
            }
            return;
        }

        const placementData = {
            itemId: itemId,
            location: location,
            containerId: containerId || null
        };

        if (outputDiv) {
            outputDiv.textContent = "Placing item...";
        }

        fetch('/api/placement/place', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(placementData),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Item placed:", data);
            if (outputDiv) {
                outputDiv.textContent = `Item "${itemId}" placed successfully. ${data.message || ''}`;
            }
            if (itemIdInput) itemIdInput.value = '';
            if (containerIdInput) containerIdInput.value = '';
            if (locationInput) locationInput.value = '';
            toggleForm('place-item-form');
        })
        .catch(error => {
            console.error("Error placing item:", error);
            if (outputDiv) {
                outputDiv.textContent = `Error placing item: ${error.message}`;
            }
        });
    };

    window.identifyWaste = () => {
        if (outputDiv) {
            outputDiv.textContent = "Identifying waste...";
        }
        fetch('/api/waste/identify')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Waste identified:", data);
                if (data && data.wasteItems) {
                    let wasteHTML = "<h3>Identified Waste Items:</h3><ul>";
                    data.wasteItems.forEach(item => {
                        wasteHTML += `<li>ID: ${item.itemId}, Name: ${item.name} (Reason: ${item.reason || 'N/A'})</li>`;
                    });
                    wasteHTML += "</ul>";
                    if (outputDiv) {
                        outputDiv.innerHTML = wasteHTML;
                    }
                } else if (outputDiv) {
                    outputDiv.textContent = "No waste items identified.";
                }
            })
            .catch(error => {
                console.error("Error identifying waste:", error);
                if (outputDiv) {
                    outputDiv.textContent = `Error identifying waste: ${error.message}`;
                }
            });
    };

    window.createWasteReturnPlan = () => {
        const undockingContainerIdInput = document.getElementById("undockingContainerId");
        const undockingDateInput = document.getElementById("undockingDate");
        const maxWeightInput = document.getElementById("maxWeight");

        const undockingContainerId = undockingContainerIdInput ? undockingContainerId.value : "";
        const undockingDate = undockingDateInput ? undockingDateInput.value : "";
        const maxWeight = maxWeightInput ? maxWeightInput.value : null;

        if (!undockingContainerId || !undockingDate) {
            if (outputDiv) {
                outputDiv.textContent = "Please provide Undocking Container ID and Date.";
            }
            return;
        }

        const planData = {
            undockingContainerId: undockingContainerId,
            undockingDate: undockingDate,
            maxWeight: maxWeight ? parseFloat(maxWeight) : null
        };

        if (outputDiv) {
            outputDiv.textContent = "Creating waste return plan...";
        }

        fetch('/api/waste/plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(planData),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Waste return plan created:", data);
            if (outputDiv) {
                outputDiv.textContent = `Waste return plan created for container "${undockingContainerId}" on ${undockingDate}. ${data.message || ''}`;
            }
            if (undockingContainerIdInput) undockingContainerIdInput.value = '';
            if (undockingDateInput) undockingDateInput.value = '';
            if (maxWeightInput) maxWeightInput.value = '';
            toggleForm('return-plan-form');
        })
        .catch(error => {
            console.error("Error creating waste return plan:", error);
            if (outputDiv) {
                outputDiv.textContent = `Error creating waste return plan: ${error.message}`;
            }
        });
    };

    window.completeUndocking = () => {
        const undockingVesselIdInput = document.getElementById("undockingVesselId");
        const undockingTimestampInput = document.getElementById("undockingTimestamp");

        const undockingVesselId = undockingVesselIdInput ? undockingVesselId.value : "";
        const undockingTimestamp = undockingTimestampInput ? undockingTimestampInput.value : "";

        if (!undockingVesselId || !undockingTimestamp) {
            if (outputDiv) {
                outputDiv.textContent = "Please provide Undocking Container ID and Timestamp.";
            }
            return;
        }

        const undockingData = {
            vesselId: undockingVesselId,
            timestamp: undockingTimestamp
        };

        if (outputDiv) {
            outputDiv.textContent = "Completing undocking...";
        }

        fetch('/api/waste/undock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(undockingData),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Undocking completed:", data);
            if (outputDiv) {
                outputDiv.textContent = `Undocking of container "${undockingVesselId}" completed at ${undockingTimestamp}. ${data.message || ''}`;
            }
            if (undockingVesselIdInput) undockingVesselIdInput.value = '';
            if (undockingTimestampInput) undockingTimestampInput.value = '';
            toggleForm('complete-undocking-form');
        })
        .catch(error => {
            console.error("Error completing undocking:", error);
            if (outputDiv) {
                outputDiv.textContent = `Error completing undocking: ${error.message}`;
            }
        });
    };

    window.importItems = () => {
        const fileInput = document.getElementById("importItemsFile");
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;

        if (!file) {
            if (outputDiv) {
                outputDiv.textContent = "Please select a CSV file to import items.";
            }
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        if (outputDiv) {
            outputDiv.textContent = "Importing items...";
        }

        fetch('/api/import/items', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Items imported:", data);
            if (outputDiv) {
                outputDiv.textContent = `Items imported successfully. ${data.message || ''} (Imported: ${data.importedCount || 'unknown'})`;
            }
            if (fileInput) fileInput.value = ''; // Reset file input
            toggleForm('import-items-form');
        })
        .catch(error => {
            console.error("Error importing items:", error);
            if (outputDiv) {
                outputDiv.textContent = `Error importing items: ${error.message}`;
            }
        });
    };

    window.importContainers = () => {
        const fileInput = document.getElementById("importContainersFile");
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;

        if (!file) {
            if (outputDiv) {
                outputDiv.textContent = "Please select a CSV file to import containers.";
            }
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        if (outputDiv) {
            outputDiv.textContent = "Importing containers...";
        }

        fetch('/api/import/containers', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Containers imported:", data);
            if (outputDiv) {
                outputDiv.textContent = `Containers imported successfully. ${data.message || ''} (Imported: ${data.importedCount || 'unknown'})`;
            }
            if (fileInput) fileInput.value = ''; // Reset file input
            toggleForm('import-containers-form');
        })
        .catch(error => {
            console.error("Error importing containers:", error);
            if (outputDiv) {
                outputDiv.textContent = `Error importing containers: ${error.message}`;
            }
        });
    };

    window.exportArrangement = () => {
        if (outputDiv) {
            outputDiv.textContent = "Preparing arrangement for export...";
        }
        fetch('/api/export/arrangement')
            .then(response => {
                if (!response.ok) {
                    return response.blob().then(err => {
                        throw new Error(err.detail || `HTTP error! status: ${response.status}`);
                    });
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cargo_arrangement.csv';
                if (document.body) {
                    document.body.appendChild(a);
                }
                a.click();
                if (document.body) {
                    document.body.removeChild(a);
                }
                window.URL.revokeObjectURL(url);
                if (outputDiv) {
                    outputDiv.textContent = "Arrangement exported successfully.";
                }
                toggleForm('export-arrangement-form');
            })
            .catch(error => {
                console.error("Error exporting arrangement:", error);
                if (outputDiv) {
                    outputDiv.textContent = `Error exporting arrangement: ${error.message}`;
                }
            });
    };

    window.searchItem = () => {
        const itemIdInput = document.getElementById("searchItemId");
        const itemNameInput = document.getElementById("searchItemName");

        const itemId = itemIdInput ? itemIdInput.value : "";
        const itemName = itemNameInput ? itemNameInput.value : "";

        if (!itemId && !itemName) {
            if (outputDiv) {
                outputDiv.textContent = "Please enter either Item ID or Item Name to search.";
            }
            return;
        }

        let queryParams = [];
        if (itemId) {
            queryParams.push(`name=${itemName}`);
        }
        const queryString = queryParams.join('&');

        if (outputDiv) {
            outputDiv.textContent = `Searching for items...`;
        }

        fetch(`/api/items/search?${queryString}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || `HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log("Search results:", data);
                if (data && data.items) {
                    let searchResultsHTML = "<h3>Search Results:</h3><ul>";
                    if (data.items.length > 0) {
                        data.items.forEach(item => {
                            searchResultsHTML += `<li>ID: ${item.itemId}, Name: ${item.name}, Priority: ${item.priority}</li>`;
                        });
                    } else {
                        searchResultsHTML += "<li>No items found matching your search criteria.</li>";
                    }
                    searchResultsHTML += "</ul>";
                    if (outputDiv) {
                        outputDiv.innerHTML = searchResultsHTML;
                    }
                } else if (outputDiv) {
                    outputDiv.textContent = "No items found matching your search criteria.";
                }
            })
            .catch(error => {
                console.error("Error searching items:", error);
                if (outputDiv) {
                    outputDiv.textContent = `Error searching items: ${error.message}`;
                }
            });
    };

    window.retrieveItem = () => {
        const itemIdInput = document.getElementById("retrieveItemId");
        const itemId = itemIdInput ? itemIdInput.value : "";

        if (!itemId) {
            if (outputDiv) {
                outputDiv.textContent = "Please enter an Item ID to retrieve.";
            }
            return;
        }

        if (outputDiv) {
            outputDiv.textContent = `Retrieving item with ID: ${itemId}...`;
        }

        fetch(`/api/items/retrieve/${itemId}`, {
            method: 'POST',
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || `HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Item retrieval result:", data);
                if (data && data.success && outputDiv) {
                    outputDiv.textContent = `Item with ID "${itemId}" retrieved successfully.`;
                } else if (outputDiv) {
                    outputDiv.textContent = `Error retrieving item with ID "${itemId}": ${data.message || 'Unknown error'}`;
                }
            })
            .catch(error => {
                console.error("Error retrieving item:", error);
                if (outputDiv) {
                    outputDiv.textContent = `Error retrieving item: ${error.message}`;
                }
            });
    };

    window.simulateDay = () => {
        const numOfDaysInput = document.getElementById("numOfDays");
        const toTimestampInput = document.getElementById("toTimestamp");
        const itemsToBeUsedPerDayTextarea = document.getElementById("itemsToBeUsedPerDay").value;
        let itemsToBeUsedPerDay = [];
        let numOfDays = null;
        let toTimestamp = null;

        // Validate numOfDays
        if (numOfDaysInput && numOfDaysInput.value.trim() !== "") {
            const parsedNumOfDays = parseInt(numOfDaysInput.value);
            if (!isNaN(parsedNumOfDays) && parsedNumOfDays > 0) {
                numOfDays = parsedNumOfDays;
            } else {
                if (outputDiv) {
                    outputDiv.textContent = "Please enter a valid number of days.";
                }
                return;
            }
        }

        //Basic toTimestamp validation (you might need a more robust date library)
        if (toTimestampInput && toTimestampInput.value.trim() !== "") {
            // A more robust validation is needed here, depending on your expected format
            toTimestamp = toTimestampInput.value;
        }

        if (itemsToBeUsedPerDayTextarea) {
            try {
                itemsToBeUsedPerDay = JSON.parse(itemsToBeUsedPerDayTextarea);
                if (!Array.isArray(itemsToBeUsedPerDay)) {
                    if (outputDiv) {
                        outputDiv.textContent = "Items to be used per day must be a JSON array.";
                    }
                    return;
                }
            } catch (error) {
                if (outputDiv) {
                    outputDiv.textContent = "Invalid JSON format for items to be used.";
                }
                console.error("JSON Parse Error:", error);
                return;
            }
        }

        const simulationData = {
            numOfDays: numOfDays,
            toTimestamp: toTimestamp,
            itemsToBeUsed: itemsToBeUsedPerDay
        };

        if (outputDiv) {
            outputDiv.textContent = "Simulating time...";
        }

        fetch('/api/simulate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(simulationData),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Time simulated:", data);
            if (outputDiv) {
                outputDiv.textContent = `Time simulated successfully. ${data.message || ''} (New Timestamp: ${data.newTimestamp || 'N/A'})`;
            }
            if (numOfDaysInput) numOfDaysInput.value = '';
            if (toTimestampInput) toTimestampInput.value = '';
            document.getElementById("itemsToBeUsedPerDay").value = '';
            toggleForm('simulate-day-form');
        })
        .catch(error => {
            console.error("Error simulating time:", error);
            if (outputDiv) {
                outputDiv.textContent = `Error simulating time: ${error.message}`;
            }
        });
    };

    window.getLogs = () => {
        const logStartDateInput = document.getElementById("logStartDate");
        const logEndDateInput = document.getElementById("logEndDate");
        const logItemIdInput = document.getElementById("logItemId");
        const logUserIdInput = document.getElementById("logUserId");
        const logActionTypeInput = document.getElementById("logActionType");

        let queryParams = [];
        if (logStartDateInput && logStartDateInput.value) {
            queryParams.push(`startDate=${logStartDateInput.value}`);
        }
        if (logEndDateInput && logEndDateInput.value) {
            queryParams.push(`endDate=${logEndDateInput.value}`);
        }
        if (logItemIdInput && logItemIdInput.value) {
            queryParams.push(`itemId=${logItemIdInput.value}`);
        }
        if (logUserIdInput && logUserIdInput.value) {
            queryParams.push(`userId=${logUserIdInput.value}`);
        }
        if (logActionTypeInput && logActionTypeInput.value) {
            queryParams.push(`actionType=${logActionTypeInput.value}`);
        }
        const queryString = queryParams.join('&');

        if (outputDiv) {
            outputDiv.textContent = "Fetching logs...";
        }
        fetch(`/api/logs?${queryString}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.message || `HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
        })
        .then(data => {
            console.log("Logs received:", data);
            let logsHTML = "<h3>Logs:</h3><ul>";

            if (data && data.logs && data.logs.length > 0) {
                data.logs.forEach(log => {
                    logsHTML += `<li>Timestamp: ${log.timestamp}, Action: ${log.actionType}, Item ID: ${log.itemId || 'N/A'}, User ID: ${log.userId || 'N/A'}</li>`;
                });
            } else {
                logsHTML += "<li>No logs found matching your criteria.</li>";
                if (outputDiv) {
                    outputDiv.textContent = "No logs found matching your criteria.";
                }
            }
            logsHTML += "</ul>";
            if (outputDiv) {
                outputDiv.innerHTML = logsHTML;
            }
            toggleForm('logs-form');
        })
        .catch(error => {
            console.error("Error fetching logs:", error);
            if (outputDiv) {
                outputDiv.textContent = `Error fetching logs: ${error.message}`;
            }
        });
    };
});