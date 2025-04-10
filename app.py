from fastapi import FastAPI, HTTPException, Depends, Query, UploadFile, File, Path
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, Date, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List, Optional
from datetime import date
import csv
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO)

DATABASE_URL = "sqlite:///./test.db"  # Consider environment variables for production

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    itemId = Column(String, index=True, unique=True)
    name = Column(String, index=True)
    width = Column(Integer, nullable=False)
    depth = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    mass = Column(Float, nullable=False)  # Use Float for mass
    priority = Column(Integer, index=True, nullable=False)
    expiryDate = Column(Date)
    usageLimit = Column(Integer, nullable=False, default=0)  # Default usage
    preferredZone = Column(String, nullable=False)


class Container(Base):
    __tablename__ = "containers"
    id = Column(Integer, primary_key=True, index=True)
    containerId = Column(String, index=True, unique=True)
    zone = Column(String, index=True, nullable=False)
    width = Column(Integer, nullable=False)
    depth = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)


Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()  # Rollback on any exception
        raise e
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Space Cargo API is running!", "frontend": "/static/index.html"}


# API Models
class ItemSchema(BaseModel):
    itemId: str = Field(..., example="item001")
    name: str = Field(..., example="Water Bottle")
    width: int = Field(..., example=10)
    depth: int = Field(..., example=10)
    height: int = Field(..., example=20)
    mass: float = Field(..., example=0.5)
    priority: int = Field(..., example=1)
    expiryDate: Optional[date] = Field(None, example="2025-12-25")
    usageLimit: Optional[int] = Field(default=None, example=50)  # ✅ This line
    preferredZone: str = Field(..., example="ZoneA")


class ContainerSchema(BaseModel):
    containerId: str = Field(..., example="container001")
    zone: str = Field(..., example="ZoneA")
    width: int = Field(..., example=100)
    depth: int = Field(..., example=100)
    height: int = Field(..., example=100)


class PlacementRequest(BaseModel):
    items: List[ItemSchema]
    containers: Optional[List[ContainerSchema]] = Field(default=None, example=[])


class PlacementResponse(BaseModel):
    success: bool
    placements: Optional[List[dict]] = Field(default=None, example=[])
    rearrangements: Optional[List[dict]] = Field(default=None, example=[])


class SearchResponse(BaseModel):
    success: bool
    found: bool
    item: Optional[dict]
    retrievalSteps: Optional[List[dict]]


class RetrieveRequest(BaseModel):
    itemId: str = Field(..., example="item001")
    userId: Optional[str] = Field(None, example="astronaut1")
    timestamp: Optional[str] = Field(None, example="2025-03-15T10:00:00")



class PlaceRequest(BaseModel):
    itemId: str = Field(..., example="item001")
    userId: Optional[str] = Field(None, example="astronaut1")
    timestamp: Optional[str] = Field(None, example="2025-03-15T10:00:00")
    containerId: str = Field(..., example="container001")
    position: dict = Field(..., example={
        "startCoordinates": {"width": 0, "depth": 0, "height": 0},
        "endCoordinates": {"width": 10, "depth": 10, "height": 20}
    })


class WasteIdentifyResponse(BaseModel):
    success: bool
    wasteItems: List[dict]


class WasteReturnPlanRequest(BaseModel):
    undockingContainerId: str = Field(..., example="container001")
    undockingDate: str = Field(..., example="2025-04-01")
    maxWeight: Optional[float] = Field(None, example=100.0)


class WasteReturnPlanResponse(BaseModel):
    success: bool
    returnPlan: Optional[List[dict]] = None
    retrievalSteps: Optional[List[dict]] = None
    returnManifest: Optional[dict] = None


class CompleteUndockingRequest(BaseModel):
    undockingContainerId: str = Field(..., example="container001")
    timestamp: Optional[str] = Field(None, example="2025-04-02T12:00:00")


class ApiResponse(BaseModel):
    success: bool


class TimeSimulationRequest(BaseModel):
    numOfDays: Optional[int] = Field(None, example=1)
    toTimestamp: Optional[str] = Field(None, example="2025-04-03T00:00:00")
    itemsToBeUsedPerDay: List[dict] = Field(..., example=[{"itemId": "item002"}])


class TimeSimulationResponse(BaseModel):
    success: bool
    newDate: str = Field(..., example="2025-04-02")
    changes: dict = Field(..., example={"itemsUsed": [{"itemId": "item002", "name": "Test Item", "remainingUses": 49}], "itemsExpired": [], "itemsDepletedToday": []})


class ImportResponse(BaseModel):
    success: bool
    itemsImported: int = Field(..., example=10)
    errors: Optional[List[dict]] = Field(
        default=None,
        example=[{"row": {"itemId": "bad_id"}, "message": "Invalid data"}]
    )

class ConfirmPlacementRequest(BaseModel):
    itemId: str = Field(..., example="item001")
    containerId: str = Field(..., example="container001")
    position: dict = Field(
        ...,
        example={
            "startCoordinates": {"width": 0, "depth": 0, "height": 0},
            "endCoordinates": {"width": 10, "depth": 10, "height": 20},
        },
    )
    userId: str = Field(..., example="astronaut1")
    timestamp: str = Field(..., example="2025-03-15T10:00:00")


class LogEntry(BaseModel):
    timestamp: str = Field(..., example="2025-03-13T10:00:00")
    userId: str = Field(..., example="astronaut1")
    actionType: str = Field(..., example="placement")
    itemId: str = Field(..., example="001")
    details: dict = Field(..., example={"fromContainer": "contA", "toContainer": "contB", "reason": "space optimization"})


from fastapi import HTTPException
from fastapi.responses import JSONResponse

@app.post("/api/containers")
def add_containers(containers: List[ContainerSchema], db: Session = Depends(get_db)):
    try:
        added_containers = []

        for container in containers:
            existing = db.query(Container).filter(Container.containerId == container.containerId).first()
            if existing:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "message": f"Container {container.containerId} already exists.",
                        "containersAdded": 0
                    }
                )

            db_container = Container(**container.dict())
            db.add(db_container)
            added_containers.append(container.containerId)

        db.commit()

        return {
            "success": True,
            "message": "Containers added successfully",
            "containersAdded": len(added_containers),
            "containerIds": added_containers
        }

    except Exception as e:
        logging.error(f"Error adding containers: {e}")
        return {
            "success": False,
            "message": "An unexpected error occurred while adding containers.",
            "containersAdded": 0,
            "containerIds": []
        }


# API: Add New Cargo Items
    @app.post("/api/items")
    def add_items(items: List[ItemSchema], db: Session = Depends(get_db)):
        try:
            added_items = []

            for item in items:
                db_item = Item(**item.dict())
                db.add(db_item)
                added_items.append(item.itemId)

            db.commit()

            return {
                "success": True,
                "message": "Items added successfully",
                "itemsAdded": len(added_items),
                "itemIds": added_items
            }

        except Exception as e:
            logging.error(f"Error adding items: {e}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "An error occurred while adding items.",
                    "itemsAdded": 0,
                    "itemIds": []
                }
            )


# API: Get All Containers
@app.get("/api/containers")
def get_containers(db: Session = Depends(get_db)):
    try:
        containers = db.query(Container).all()
        container_data = [ContainerSchema.model_validate(c).dict() for c in containers]

        return {
            "success": True,
            "containers": container_data
        }

    except Exception as e:
        logging.error(f"Error getting containers: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Failed to fetch containers.",
                "containers": []
            }
        )


@app.delete("/api/items/{item_id}")
async def delete_item(item_id: str, db: Session = Depends(get_db)):
    try:
        item = db.query(Item).filter(Item.itemId == item_id).first()
        if not item:
            return {
                "success": False,
                "message": f"Item with ID '{item_id}' not found"
            }

        db.delete(item)
        db.commit()
        return {
            "success": True,
            "message": f"Item with ID '{item_id}' deleted successfully"
        }

    except Exception as e:
        logging.error(f"Error deleting item '{item_id}': {e}")
        return {
            "success": False,
            "message": f"An error occurred while deleting item '{item_id}'"
        }

    
@app.delete("/api/containers/{container_id}", response_model=ApiResponse)
def delete_container(container_id: str, db: Session = Depends(get_db)):
    try:
        db_container = db.query(Container).filter(Container.containerId == container_id).first()
        if not db_container:
            return {
                "success": False,
                "message": f"Container with ID '{container_id}' not found"
            }

        db.delete(db_container)
        db.commit()
        return {
            "success": True,
            "message": f"Container with ID '{container_id}' deleted successfully"
        }

    except Exception as e:
        db.rollback()
        logging.error(f"Error deleting container '{container_id}': {e}")
        return {
            "success": False,
            "message": f"Failed to delete container '{container_id}' due to internal error"
        }

@app.get("/api/items")
def get_items(db: Session = Depends(get_db)):
    try:
        items = db.query(Item).all()
        item_list = [ItemSchema.model_validate(item).model_dump() for item in items]
        return {
            "success": True,
            "items": item_list,
            "total": len(item_list)
        }
    except Exception as e:
        logging.error(f"Error getting items: {e}")
        return {
            "success": False,
            "message": "Failed to fetch items due to internal error",
            "items": [],
            "total": 0
        }

# API: Get a Specific Item by ID
@app.get("/api/items/{item_id}", response_model=ItemSchema)
def get_item(item_id: str, db: Session = Depends(get_db)):
    try:
        logging.info(f"Getting item with ID: {item_id}")
        item = db.query(Item).filter(Item.itemId == item_id).first()
        if item:
            return ItemSchema.model_validate(item)
        logging.warning(f"Item with ID {item_id} not found")
        raise HTTPException(status_code=404, detail="Item not found")
    except Exception as e:
        logging.error(f"Error getting item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/placement", response_model=PlacementResponse)
def calculate_placement_recommendations(req: PlacementRequest, db: Session = Depends(get_db)):
    try:
        if not req.items:
            raise HTTPException(status_code=400, detail="Item data is required.")

        item = req.items[0]  # Assuming single item for simplicity
        db_item = db.query(Item).filter(Item.itemId == item.itemId).first()
        if not db_item:
            raise HTTPException(status_code=404, detail=f"Item with ID '{item.itemId}' not found.")

        container = db.query(Container).first()
        if not container:
            return PlacementResponse(
                success=False,
                placements=[],
                rearrangements=[]
            )

        placement = {
            "itemId": item.itemId,
            "containerId": container.containerId,
            "position": {
                "startCoordinates": {"width": 0, "depth": 0, "height": 0},
                "endCoordinates": {
                    "width": item.width,
                    "depth": item.depth,
                    "height": item.height
                }
            }
        }

        return PlacementResponse(
            success=True,
            placements=[placement],
            rearrangements=[]
        )

    except HTTPException as http_exc:
        return PlacementResponse(
            success=True,
            placements=[],
            rearrangements=[]
        )
    except Exception as e:
        logging.error(f"Error calculating placement: {e}")
        return PlacementResponse(
            success=False,
            placements=[],
            rearrangements=[]
        )

@app.post("/api/place", response_model=ApiResponse)
def confirm_placement(req: ConfirmPlacementRequest, db: Session = Depends(get_db)):
    try:
        logging.info(f"Placement Confirmation Request received: {req}")

        # Validate presence of required fields
        if not req.itemId or not req.containerId or not req.position:
            raise HTTPException(status_code=400, detail="Missing required placement fields.")

        item = db.query(Item).filter(Item.itemId == req.itemId).first()
        container = db.query(Container).filter(Container.containerId == req.containerId).first()

        if not item:
            raise HTTPException(status_code=404, detail=f"Item with ID {req.itemId} not found")
        if not container:
            raise HTTPException(status_code=404, detail=f"Container with ID {req.containerId} not found")

        # Defensive check for coordinates
        try:
            start = req.position["startCoordinates"]
            end = req.position["endCoordinates"]
            for dim in ["width", "depth", "height"]:
                if dim not in start or dim not in end:
                    raise ValueError(f"Missing coordinate field: {dim}")
        except Exception as coord_err:
            raise HTTPException(status_code=400, detail=f"Invalid position format: {coord_err}")

        # Validate that placement fits inside the container
        if not is_valid_position(req.position, container):
            raise HTTPException(status_code=400, detail="Invalid position within container")

        # Record placement
        item_placement = ItemPlacement(
            item_id=item.id,
            container_id=container.id,
            start_coordinates=start,
            end_coordinates=end
        )
        db.add(item_placement)

        # Create log
        create_log_entry(
            db,
            user_id=req.userId,
            action_type="placement",
            item_id=req.itemId,
            container_id=req.containerId,
            details=req.position
        )

        db.commit()
        return {"success": True}

    except HTTPException as e:
        db.rollback()
        raise e

    except Exception as e:
        db.rollback()
        logging.error(f"Error confirming placement: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to confirm placement")


def is_valid_position(position: dict, container: Container) -> bool:
    """
    Helper function to validate if the given position is within the container's bounds.
    """
    start = position["startCoordinates"]
    end = position["endCoordinates"]

    if (
        start["width"] < 0 or start["width"] > container.width or
        start["depth"] < 0 or start["depth"] > container.depth or
        start["height"] < 0 or start["height"] > container.height or
        end["width"] < 0 or end["width"] > container.width or
        end["depth"] < 0 or end["depth"] > container.depth or
        end["height"] < 0 or end["height"] > container.height or
        start["width"] > end["width"] or
        start["depth"] > end["depth"] or
        start["height"] > end["height"]
    ):
        return False
    return True


def create_log_entry(
    db: Session,
    user_id: str,
    action_type: str,
    item_id: str = None,
    container_id: str = None,
    details: dict = None
):
    """
    Safely create a log entry with error handling to prevent API failure.
    """
    try:
        log_entry = Log(
            user_id=user_id,
            action_type=action_type,
            item_id=item_id,
            container_id=container_id,
            details=details or {}  # Ensure it's always a dict
        )
        db.add(log_entry)
        db.commit()
        return log_entry
    except Exception as e:
        db.rollback()  # Very important for transactional integrity
        logging.error(f"Failed to create log entry: {e}", exc_info=True)
        # Do not raise here — avoid breaking the calling API route
        return None


# API: Item Search and Retrieval
@app.get("/api/search", response_model=SearchResponse)
def search_item(
    itemId: Optional[str] = Query(None),
    itemName: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        if not itemId and not itemName:
            raise HTTPException(status_code=400, detail="Either itemId or itemName must be provided")

        query = db.query(Item)
        item = query.filter(Item.itemId == itemId).first() if itemId else query.filter(Item.name == itemName).first()

        if not item:
            return {
                "success": True,
                "found": False,
                "item": None,
                "retrievalSteps": []
            }

        return {
            "success": True,
            "found": True,
            "item": {
                "itemId": item.itemId,
                "name": item.name,
                "containerId": "contA",  # Placeholder
                "zone": item.preferredZone,
                "position": {
                    "startCoordinates": {"width": 0, "depth": 0, "height": 0},
                    "endCoordinates": {"width": item.width, "depth": item.depth, "height": item.height}
                }
            },
            "retrievalSteps": [
                {"step": 1, "action": "retrieve", "itemId": item.itemId, "itemName": item.name}
            ]
        }

    except HTTPException as e:
        raise e  # Keep standard FastAPI behavior for expected errors
    except Exception as e:
        logging.error(f"Error searching item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# API: Retrieve Item
@app.post("/api/retrieve", response_model=ApiResponse)
def retrieve_item(req: RetrieveRequest, db: Session = Depends(get_db)):
    try:
        logging.info(f"Retrieve request received: {req}")

        item = db.query(Item).filter(Item.itemId == req.itemId).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"Item with ID {req.itemId} not found")

        # 1. Update usageLimit if applicable and not None
        if item.usageLimit is not None and item.usageLimit > 0:
            item.usageLimit -= 1
            db.commit()
            logging.info(f"Usage limit decremented for item {req.itemId}. New usageLimit: {item.usageLimit}")
        else:
            logging.info(f"No usage limit update needed for item {req.itemId} (usageLimit={item.usageLimit})")

        # 2. Create a log entry
        create_log_entry(
            db,
            user_id=req.userId,
            action_type="retrieval",
            item_id=req.itemId,
            details={"timestamp": req.timestamp}
        )
        logging.info(f"Log entry created for item {req.itemId} retrieval")

        return {"success": True}

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logging.error(f"Error retrieving item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve item")


# API: Identify Waste Items
@app.get("/api/waste/identify", response_model=WasteIdentifyResponse)
def identify_waste_items(db: Session = Depends(get_db)):
    try:
        today = datetime.now().date()
        waste_items = []
        items = db.query(Item).all()

        for item in items:
            reason = None

            # Handle expiry date
            if item.expiryDate and item.expiryDate < today:
                reason = "Expired"

            # Handle usage limit only if not None
            elif item.usageLimit is not None and item.usageLimit == 0:
                reason = "Out of Uses"

            if reason:
                waste_items.append({
                    "itemId": item.itemId,
                    "name": item.name,
                    "reason": reason,
                    "containerId": "contA",  # Placeholder
                    "position": {
                        "startCoordinates": {"width": 0, "depth": 0, "height": 0},
                        "endCoordinates": {
                            "width": item.width,
                            "depth": item.depth,
                            "height": item.height
                        }
                    }
                })

        return {
            "success": True,
            "wasteItems": waste_items
        }

    except Exception as e:
        logging.error(f"Error identifying waste: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to identify waste items")


# API: Generate Waste Return Plan
@app.post("/api/waste/return-plan", response_model=WasteReturnPlanResponse)
def generate_waste_return_plan(req: WasteReturnPlanRequest, db: Session = Depends(get_db)):
    try:
        return_plan = []
        retrieval_steps = []
        return_manifest = {
            "undockingContainerId": req.undockingContainerId,
            "undockingDate": req.undockingDate,
            "returnItems": [],
            "totalVolume": 0,
            "totalWeight": 0
        }

        # Safely parse undocking date
        try:
            undocking_date = datetime.strptime(req.undockingDate, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        # Filter items with a valid expiry date that is before the undocking date
        expired_items = db.query(Item).filter(
            Item.expiryDate.isnot(None),
            Item.expiryDate < undocking_date
        ).all()

        for item in expired_items:
            volume = (item.width or 0) * (item.depth or 0) * (item.height or 0)
            weight = item.mass or 0

            return_manifest["returnItems"].append({
                "itemId": item.itemId,
                "name": item.name,
                "expiryDate": item.expiryDate.strftime("%Y-%m-%d"),
                "containerId": req.undockingContainerId  # Still placeholder
            })
            return_manifest["totalVolume"] += volume
            return_manifest["totalWeight"] += weight

        return {
            "success": True,
            "returnPlan": return_plan,
            "retrievalSteps": retrieval_steps,
            "returnManifest": return_manifest
        }

    except HTTPException:
        raise  # re-raise known HTTP exceptions
    except Exception as e:
        logging.error(f"Error generating return plan: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate waste return plan")


# API: Complete Waste Undocking
@app.post("/api/waste/complete-undocking", response_model=ApiResponse)
def complete_undocking(req: CompleteUndockingRequest, db: Session = Depends(get_db)):
    try:
        # Basic validation
        if not req.undockingContainerId or not req.timestamp:
            raise HTTPException(status_code=400, detail="Both container ID and timestamp are required.")

        # Placeholder logic - assume 5 items removed
        removed_count = 5  # Replace with real count once logic is implemented

        # Optional logging
        logging.info(f"Undocking completed for container {req.undockingContainerId} at {req.timestamp}, items removed: {removed_count}")

        return {"success": True}  # Ensure only fields defined in ApiResponse are returned

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error completing undocking: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to complete undocking")


# API: Simulate Time
@app.post("/api/simulate/day", response_model=TimeSimulationResponse)
def simulate_time(req: TimeSimulationRequest, db: Session = Depends(get_db)):
    try:
        today = datetime.now().date()
        new_date = None
        if req.numOfDays:
            new_date = today + timedelta(days=req.numOfDays)
        elif req.toTimestamp:
            new_date = datetime.strptime(req.toTimestamp, "%Y-%m-%dT%H:%M:%S").date()
        else:
            raise HTTPException(status_code=400, detail="Either numOfDays or toTimestamp must be provided")

        items_used = []
        items_expired = []
        items_depleted = []

        items = db.query(Item).all()
        for item in items:
            if item.expiryDate and item.expiryDate < new_date:
                items_expired.append({"itemId": item.itemId, "name": item.name})
            if item.usageLimit == 0:
                items_depleted.append({"itemId": item.itemId, "name": item.name})

        #  Simulate item usage (Placeholder - Requires actual logic)
        #  This is just a basic example:
        for used_item in req.itemsToBeUsedPerDay:
            item_from_db = db.query(Item).filter(Item.itemId == used_item["itemId"]).first()
            if item_from_db:
                item_from_db.usageLimit = max(0, item_from_db.usageLimit - 1)  #  Decrement usage
                db.commit()
                items_used.append({"itemId": item_from_db.itemId, "name": item_from_db.name, "remainingUses": item_from_db.usageLimit})

        return {
            "success": True,
            "newDate": new_date.strftime("%Y-%m-%d"),
            "changes": {
                "itemsUsed": items_used,
                "itemsExpired": items_expired,
                "itemsDepletedToday": items_depleted
            }
        }
    except HTTPException as e:
        raise e  # Re-raise HTTP exceptions
    except Exception as e:
        logging.error(f"Error simulating time: {e}")
        raise


# API: Import Items from CSV
@app.post("/api/import/items", response_model=ImportResponse)
def import_items(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = file.file.read().decode('utf-8')
        reader = csv.DictReader(contents.splitlines())
        items_imported = 0
        errors = []

        for row in reader:
            try:
                #  Validate data types from CSV
                item_data = {}
                item_data["itemId"] = row["itemId"]
                item_data["name"] = row["name"]
                item_data["width"] = int(row["width"])
                item_data["depth"] = int(row["depth"])
                item_data["height"] = int(row["height"])
                item_data["mass"] = float(row["mass"])
                item_data["priority"] = int(row["priority"])
                if row.get("expiryDate"):
                    item_data["expiryDate"] = datetime.strptime(row["expiryDate"], "%Y-%m-%d").date()
                item_data["usageLimit"] = int(row["usageLimit"])
                item_data["preferredZone"] = row["preferredZone"]

                item = ItemSchema(**item_data)
                db_item = Item(**item.dict())
                db.add(db_item)
                db.commit()
                items_imported += 1
            except (ValueError, KeyError) as e:
                errors.append({"row": row, "message": str(e)})

        return {
            "success": True,
            "itemsImported": items_imported,
            "errors": errors
        }
    except Exception as e:
        logging.error(f"Error importing items: {e}")
        raise


# API: Import Containers from CSV
@app.post("/api/import/containers", response_model=ImportResponse)
def import_containers(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = file.file.read().decode('utf-8')
        reader = csv.DictReader(contents.splitlines())
        containers_imported = 0
        errors = []

        for row in reader:
            try:
                container_data = {
                    "containerId": row.get("containerId", "").strip(),
                    "zone": row.get("zone", "").strip(),
                    "width": int(row["width"]) if row.get("width") else 0,
                    "depth": int(row["depth"]) if row.get("depth") else 0,
                    "height": int(row["height"]) if row.get("height") else 0
                }

                container = ContainerSchema(**container_data)
                db_container = Container(**container.dict())
                db.add(db_container)
                db.commit()
                containers_imported += 1

            except (ValueError, KeyError, Exception) as e:
                db.rollback()
                errors.append({"row": row, "message": str(e)})

        return ImportResponse(
            success=True,
            itemsImported=containers_imported,  # Reuse `itemsImported` for compatibility
            errors=errors
        )

    except Exception as e:
        logging.error(f"Error importing containers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to import containers")

# API: Export Current Arrangement to CSV
@app.get("/api/export/arrangement")
def export_arrangement(db: Session = Depends(get_db)):
    try:
        rows = [["ItemID", "ContainerID", "Start Coordinates", "End Coordinates"]]  # Header row

        items = db.query(Item).all()
        for item in items:
            try:
                placement = db.query(ItemPlacement).filter(ItemPlacement.item_id == item.id).first()
                if placement:
                    container = db.query(Container).filter(Container.id == placement.container_id).first()
                    rows.append([
                        item.itemId or "N/A",
                        container.containerId if container else "N/A",
                        str(placement.start_coordinates) if placement.start_coordinates else "N/A",
                        str(placement.end_coordinates) if placement.end_coordinates else "N/A"
                    ])
                else:
                    rows.append([item.itemId or "N/A", "N/A", "N/A", "N/A"])
            except Exception as inner_err:
                logging.warning(f"Skipping item {item.itemId} due to error: {inner_err}")
                rows.append([item.itemId or "N/A", "Error", "Error", "Error"])

        output = "\n".join([",".join(map(str, row)) for row in rows])
        return Response(output, media_type="text/csv", headers={"Content-Disposition": "attachment;filename=arrangement.csv"})

    except Exception as e:
        logging.error(f"Error exporting arrangement: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export arrangement")

# API: Get Logs
@app.get("/api/logs")
def get_logs(
    startDate: Optional[str] = Query(None, example="2025-03-10"),
    endDate: Optional[str] = Query(None, example="2025-03-15"),
    itemId: Optional[str] = Query(None, example="item001"),
    userId: Optional[str] = Query(None, example="astronaut1"),
    actionType: Optional[str] = Query(None, example="placement"),
    db: Session = Depends(get_db),
):
    try:
        query = db.query(Log)

        if startDate:
            try:
                start_date = datetime.strptime(startDate, "%Y-%m-%d").date()
                query = query.filter(Log.timestamp >= start_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid startDate format. Use YYYY-MM-DD.")

        if endDate:
            try:
                end_date = datetime.strptime(endDate, "%Y-%m-%d").date()
                query = query.filter(Log.timestamp <= end_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid endDate format. Use YYYY-MM-DD.")

        if itemId:
            query = query.filter(Log.item_id == itemId)
        if userId:
            query = query.filter(Log.user_id == userId)
        if actionType:
            query = query.filter(Log.action_type == actionType)

        logs = query.all()
        return {"logs": logs}

    except HTTPException:
        raise  # Re-raise HTTPExceptions as-is
    except Exception as e:
        logging.error(f"Error getting logs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve logs")

# ✅ Test Route
@app.get("/")
def home():
    return {"message": "Space Cargo API is running!"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
