# **HyperDock** 🚀  
A FastAPI-based Space Cargo Management System designed to optimize cargo placement, manage inventory, and enhance logistics in a simulated space environment.  

## **Features**  
✅ **Storage Management** – Add, retrieve, and manage storage containers.  
✅ **Cargo Tracking** – Search, retrieve, and place cargo efficiently.  
✅ **Placement Optimization** – Smart placement of items based on constraints.  
✅ **Waste Management** – Identify and process waste cargo.  
✅ **Time Simulation** – Simulate time-based changes in cargo status.  
✅ **Import/Export** – Support for CSV-based data handling.  
✅ **Logging & Monitoring** – System logs for debugging and performance tracking.  

---

## **Tech Stack**  
- **Backend:** FastAPI, Python, Uvicorn  
- **Frontend:** HTML, CSS, JavaScript  
- **Database:** SQLite  
- **Containerization:** Docker  

---

## **Frontend Navogation**  

Start the application from landing.html and navigate to different sections of the webpage 

---

## **Setup & Installation**  

### **1️⃣ Clone the Repository**  
```bash
git clone https://github.com/RonitM2k06/HyperDock.git
cd HyperDock
```

### **2️⃣ Install Dependencies**  
```bash
pip install -r requirements.txt
```

### **3️⃣ Run the FastAPI Server**  
```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

### **4️⃣ (Optional) Run Using Docker**  
```bash
docker build -t rm2k06/space-cargo-manager .
docker run -p 8000:8000 rm2k06/space-cargo-manager
```

---

## **API Endpoints**  

| **Method** | **Endpoint**          | **Description**                           |
|-----------|----------------------|-------------------------------------------|
| POST      | `/storage/add`       | Add a new storage container              |
| GET       | `/storage/list`      | Retrieve all storage containers          |
| POST      | `/cargo/add`         | Add new cargo item                       |
| GET       | `/cargo/list`        | Retrieve all cargo items                 |
| GET       | `/cargo/search/{id}` | Search for a specific cargo item         |
| POST      | `/cargo/place`       | Optimize and place cargo                 |
| GET       | `/waste/manage`      | Identify and process waste cargo         |
| GET       | `/time/simulate`     | Simulate time passage                    |
| POST      | `/import`            | Import cargo and storage data from CSV   |
| GET       | `/export`            | Export cargo and storage data to CSV     |
| GET       | `/logs`              | Retrieve system logs                     |

---

## **Contributors**  
👨‍💻 **Ronit Mongia** – Lead Developer  
👨‍💻 **Rhythm Shokeen** – System Architect  

---
