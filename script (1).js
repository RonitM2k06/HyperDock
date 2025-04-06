document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");
    const outputDiv = document.getElementById("output");
    const formsContainer = document.getElementById("forms-container");

    // Event listener for theme toggle
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        themeIcon.classList.toggle("fa-sun");
        themeIcon.classList.toggle("fa-moon");
    });

    // Function to toggle the visibility of slide-in forms
    window.toggleForm = (formId) => {
        const form = document.getElementById(formId);
        if (form) {
            form.classList.toggle("show"); // Assuming you have a 'show' class in your CSS
        }
    };

    // Function to handle flipping the API box
    window.flipBox = (containerId, action) => {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add("flipped");
            // Hide all back forms
            const backForms = container.querySelectorAll(".back > div");
            backForms.forEach(form => form.classList.remove("show-back"));

            // Show the relevant back form
            const targetForm = document.getElementById(`${action}-containers-form-inner`);
            if (targetForm) {
                targetForm.classList.add("show-back");
            }
        }
    };

    // Function to unflip the API box
    window.unflipBox = (containerId) => {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.remove("flipped");
            // Optionally, you could also hide the back form when flipping back
            // const backForms = container.querySelectorAll(".back > div");
            // backForms.forEach(form => form.classList.remove("show-back"));
        }
    };

    // Generic function to handle GET requests
    async function fetchData(endpoint, successMessage = "Data fetched successfully:") {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                outputDiv.textContent = `Error: ${response.status} - ${response.statusText}`;
                return null;
            }
            const data = await response.json();
            outputDiv.textContent = `${successMessage}\n${JSON.stringify(data, null, 2)}`;
            return data; // Optionally return the data if needed
        } catch (error) {
            console.error(`Error fetching data from ${endpoint}:`, error);
            outputDiv.textContent = `Error fetching data: ${error.message}`;
            return null;
        }
    }

    // Generic function to handle POST requests
    async function postData(endpoint, payload, successMessage = "Data posted successfully:") {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null) || response.statusText;
                outputDiv.textContent = `Error: ${response.status} - ${response.statusText}\n${errorData ? JSON.stringify(errorData, null, 2) : ''}`;
                return null;
            }
            const data = await response.json();
            outputDiv.textContent = `${successMessage}\n${JSON.stringify(data, null, 2)}`;
            return data; // Optionally return the data if needed
        } catch (error) {
            console.error(`Error posting data to ${endpoint}:`, error);
            outputDiv.textContent = `Error posting data: ${error.message}`;
            return null;
        }
    }

    // --- API Interaction Functions ---

    // Containers
    window.getContainers = () => {
        const containerIdInput = document.getElementById("container-id-get");
        const containerId = containerIdInput ? containerIdInput.value : "";
        const endpoint = containerId ? `/api/containers/${containerId}` : `/api/containers`; // Adjust your API endpoint
        fetchData(endpoint, "Containers retrieved:");
        unflipBox('containers-box');
        if (containerIdInput) containerIdInput.value = ""; // Clear input
    };

    window.addContainer = () => {
        const containerIdInput = document.getElementById("containerId-add");
        const zoneInput = document.getElementById("zone-add");
        const widthInput = document.getElementById("width-add");
        const depthInput = document.getElementById("depth-add");
        const heightInput = document.getElementById("height-add");

        const containerId = containerIdInput.value;
        const zone = zoneInput.value;
        const width = parseFloat(widthInput.value);
        const depth = parseFloat(depthInput.value);
        const height = parseFloat(heightInput.value);

        const payload = { containerId, zone, width, depth, height };
        postData("/api/containers", payload, "Container added successfully:");

        unflipBox('containers-box');

        // Clear the input fields
        containerIdInput.value = "";
        zoneInput.value = "";
        widthInput.value = "";
        depthInput.value = "";
        heightInput.value = "";
    };

    // Items
    window.getItems = () => {
        fetchData("/api/items", "Items retrieved:"); // Adjust your API endpoint
        toggleForm('get-items-form');
    };

    window.addItem = () => {
        const nameInput = document.getElementById("addItemName");
        const descriptionInput = document.getElementById("addItemDescription");
        const quantityInput = document.getElementById("addItemQuantity");
        const weightInput = document.getElementById("addItemWeight");

        const name = nameInput.value;
        const description = descriptionInput.value;
        const quantity = parseInt(quantityInput.value);
        const weight = parseFloat(weightInput.value);
        // Get other item properties

        const payload = { name, description, quantity, weight }; // Adjust payload
        postData("/api/items", payload, "Item added successfully:"); // Adjust your API endpoint
        toggleForm('add-items-form');

        nameInput.value = "";
        descriptionInput.value = "";
        quantityInput.value = "";
        weightInput.value = "";
    };

    window.getItemById = () => {
        const itemIdInput = document.getElementById("getItemId");
        const itemId = itemIdInput.value;
        fetchData(`/api/items/${itemId}`, `Item with ID ${itemId} retrieved:`); // Adjust your API endpoint
        toggleForm('get-item-form');
        itemIdInput.value = "";
    };

    // Placement
    window.optimizePlacement = () => {
        const itemIdInput = document.getElementById("item-id");
        const containerIdInput = document.getElementById("container-id");
        const itemId = itemIdInput.value;
        const containerId = containerIdInput?.value;
        const payload = { itemId, containerId }; // Adjust payload
        postData("/api/placement/optimize", payload, "Placement optimized:"); // Adjust your API endpoint
        toggleForm('placement-form');
        itemIdInput.value = "";
        if (containerIdInput) containerIdInput.value = "";
    };

    window.placeItem = () => {
        const itemIdInput = document.getElementById("placeItemId");
        const containerIdInput = document.getElementById("placeContainerId");
        const locationInput = document.getElementById("placeLocation");

        const itemId = itemIdInput.value;
        const containerId = containerIdInput?.value;
        const location = locationInput.value;
        const payload = { itemId, containerId, location }; // Adjust payload
        postData("/api/placement/place", payload, "Item placed successfully:"); // Adjust your API endpoint
        toggleForm('place-item-form');

        itemIdInput.value = "";
        if (containerIdInput) containerIdInput.value = "";
        locationInput.value = "";
    };

    // Search & Retrieve
    window.searchItem = () => {
        const queryInput = document.getElementById("search-item-id");
        const query = queryInput.value;
        fetchData(`/api/items/search?query=${query}`, `Search results for "${query}":`); // Adjust your API endpoint
        toggleForm('search-item-form');
        queryInput.value = "";
    };

    window.retrieveItem = () => {
        const itemIdInput = document.getElementById("retrieve-item-id");
        const itemId = itemIdInput.value;
        postData(`/api/items/${itemId}/retrieve`, {}, `Item with ID ${itemId} marked as retrieved:`); // Adjust your API endpoint and method if needed
        toggleForm('retrieve-item-form');
        itemIdInput.value = "";
    };

    // Waste Management
    window.identifyWaste = () => {
        const descriptionInput = document.getElementById("wasteDescription");
        const categoryInput = document.getElementById("wasteCategory");

        const description = descriptionInput.value;
        const category = categoryInput?.value;
        const payload = { description, category }; // Adjust payload
        postData("/api/waste/identify", payload, "Waste identified:"); // Adjust your API endpoint
        toggleForm('identify-waste-form');

        descriptionInput.value = "";
        if (categoryInput) categoryInput.value = "";
    };

    window.createWasteReturnPlan = () => {
        const wasteItemsInput = document.getElementById("wasteItemsToReturn");
        const plannedReturnDateInput = document.getElementById("plannedReturnDate");

        const wasteItems = wasteItemsInput.value.split('\n').filter(item => item.trim() !== '');
        const plannedReturnDate = plannedReturnDateInput.value;
        const payload = { items: wasteItems, plannedDate: plannedReturnDate }; // Adjust payload
        postData("/api/waste/return-plan", payload, "Waste return plan created:"); // Adjust your API endpoint
        toggleForm('return-plan-form');

        wasteItemsInput.value = "";
        plannedReturnDateInput.value = "";
    };

    window.completeUndocking = () => {
        const vesselIdInput = document.getElementById("undockingVesselId");
        const vesselId = vesselIdInput.value;
        postData(`/api/undocking/${vesselId}/complete`, {}, `Undocking of ${vesselId} completed:`); // Adjust your API endpoint and method
        toggleForm('complete-undocking-form');
        vesselIdInput.value = "";
    };

    // Time Simulation
    window.simulateDay = () => {
        const numberOfDaysInput = document.getElementById("num-of-days");
        const numberOfDays = parseInt(numberOfDaysInput.value);
        postData("/api/time/simulate", { days: numberOfDays }, `Simulated ${numberOfDays} day(s):`); // Adjust your API endpoint
        toggleForm('simulate-day-form');
        numberOfDaysInput.value = "";
    };

    // Import/Export
    window.importItems = () => {
        const itemsToImportInput = document.getElementById("itemsToImport");
        const itemsData = itemsToImportInput.value;
        try {
            const payload = JSON.parse(itemsData); // Assuming JSON format
            postData("/api/import/items", payload, "Items imported successfully:"); // Adjust your API endpoint
            toggleForm('import-items-form');
            itemsToImportInput.value = "";
        } catch (error) {
            outputDiv.textContent = "Error parsing import data. Please ensure it's valid JSON.";
            console.error("Error parsing import items:", error);
        }
    };

    window.importContainers = () => {
        const containersToImportInput = document.getElementById("containersToImport");
        const containersData = containersToImportInput.value;
        try {
            const payload = JSON.parse(containersData); // Assuming JSON format
            postData("/api/import/containers", payload, "Containers imported successfully:"); // Adjust your API endpoint
            toggleForm('import-containers-form');
            containersToImportInput.value = "";
        } catch (error) {
            outputDiv.textContent = "Error parsing import data. Please ensure it's valid JSON.";
            console.error("Error parsing import containers:", error);
        }
    };

    window.exportArrangement = () => {
        const itemsToExportInput = document.getElementById("itemsToExport");
        const exportDestinationInput = document.getElementById("exportDestination");

        const itemIds = itemsToExportInput.value.split('\n').filter(id => id.trim() !== '');
        const destination = exportDestinationInput.value;
        const payload = { itemIds, destination }; // Adjust payload
        postData("/api/export/arrangement", payload, "Export arrangement initiated:"); // Adjust your API endpoint
        toggleForm('export-arrangement-form');

        itemsToExportInput.value = "";
        exportDestinationInput.value = "";
    };

    // Logs
    window.getLogs = () => {
        fetchData("/api/logs", "Logs retrieved:"); // Adjust your API endpoint
        toggleForm('logs-form');
    };
});