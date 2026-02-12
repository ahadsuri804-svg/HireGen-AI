from ultralytics import YOLO
import sys

try:
    print("Loading YOLOv8s (Upgraded Model)...")
    model = YOLO("yolov8s.pt")
    names = model.names
    print(f"Total classes: {len(names)}")
    
    cell_phone_id = None
    for k, v in names.items():
        if v == "cell phone":
            cell_phone_id = k
            break
            
    if cell_phone_id is not None:
        print(f"✅ SUCCESS: 'cell phone' found at ID {cell_phone_id} in YOLOv8s")
    else:
        print("❌ FAILURE: 'cell phone' NOT FOUND in YOLOv8s model classes!")
        print(f"Classes: {names}")
        
except Exception as e:
    print(f"❌ ERROR: {e}")
