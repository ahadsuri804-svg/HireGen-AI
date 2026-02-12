import cv2
import mediapipe as mp
import time
from ultralytics import YOLO
import numpy as np

class InterviewCheatingDetector:
    def __init__(self, max_suspicious_time=2.0, camera_index=0, confidence_threshold=0.35, alert_cooldown=5.0):
        self.max_suspicious_time = max_suspicious_time
        self.confidence_threshold = confidence_threshold 
        self.alert_cooldown = alert_cooldown
        
        # TIMERS (Decoupled for specific tuning)
        self.face_start_time = None
        self.hand_start_time = None
        self.phone_start_time = None
        
        self.last_alert_time = 0
        self.alert_count = 0
        self.warnings = []
        
        # STRICT RULE: Only these 3 keys are allowed
        self.counts = {"Face not detected": 0, "Cell Phone Detected": 0, "Both hands not visible": 0}

        self.latest_frame_bytes = None
        self.best_face_frame_bytes = None 
        self.best_face_confidence = 0.0   
        self.camera_index = camera_index

        # Initialize MediaPipe with Fallback
        try:
            self.mp_face = mp.solutions.face_detection
            self.mp_draw = mp.solutions.drawing_utils
            self.mp_hands = mp.solutions.hands
        except AttributeError:
            print("⚠️ Standard MediaPipe import failed. Trying fallback...")
            import mediapipe.python.solutions.face_detection as mp_face
            import mediapipe.python.solutions.drawing_utils as mp_draw
            import mediapipe.python.solutions.hands as mp_hands
            self.mp_face = mp_face
            self.mp_draw = mp_draw
            self.mp_hands = mp_hands

        # "Stronger" Face Detection: Use model_selection=1 (Full Range) for better robustness
        self.face_detection = self.mp_face.FaceDetection(model_selection=1, min_detection_confidence=0.6)
        # HAND DETECTION OPTIMIZED: Ultra-High sensitivity (0.15) and tolerant logic
        self.hands = self.mp_hands.Hands(
            model_complexity=1,
            max_num_hands=2, 
            min_detection_confidence=0.15, 
            min_tracking_confidence=0.15
        )

        print("[INFO] Loading YOLO model...")
        # OPTION B: Upgrade to YOLOv8s for better detection
        self.model = YOLO("yolov8s.pt")
        
        # VERIFY MODEL CLASSES
        print(f"[DEBUG] YOLO Model Classes Loaded: {len(self.model.names)} classes")
        if 67 in self.model.names:
             print(f"[DEBUG] ✅ Class 67 '{self.model.names[67]}' CONFIRMED in model.")
        else:
             print(f"[CRITICAL WARNING] ❌ Class 67 'cell phone' NOT FOUND in model!")

        # STRICT RULE: Only Cell Phones allowed.
        self.suspicious_classes = ["cell phone", "mobile phone", "telephone"]
        self.cap = None 

    def process_frame(self, frame):
        """
        Process a single frame for cheating detection.
        Returns: (processed_frame, list_of_new_warnings)
        """
        current_warnings = []
        if frame is None:
            return frame, current_warnings

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, _ = frame.shape
        frame_area = w * h

        # ==========================================================
        # 1. FACE DETECTION
        # ==========================================================
        face_results = self.face_detection.process(rgb_frame)
        face_detected = bool(face_results.detections)

        if face_detected:
            self.face_start_time = None # Reset timer
            for detection in face_results.detections:
                # Save best face for report
                score = detection.score[0]
                if score > 0.85:
                     _, jpeg = cv2.imencode('.jpg', frame)
                     self.best_face_frame_bytes = jpeg.tobytes()
                     self.best_face_confidence = score

                bboxC = detection.location_data.relative_bounding_box
                x, y, w_box, h_box = int(bboxC.xmin * w), int(bboxC.ymin * h), int(bboxC.width * w), int(bboxC.height * h)
                cv2.rectangle(frame, (x, y), (x + w_box, y + h_box), (0, 255, 0), 2)
                cv2.putText(frame, "Face", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        else:
            if self.face_start_time is None:
                self.face_start_time = time.time()

        # ==========================================================
        # 2. HAND DETECTION (STRICT: AT LEAST ONE HAND VISIBLE)
        # ==========================================================
        hand_results = self.hands.process(rgb_frame)
        num_hands_detected = 0
        if hand_results.multi_hand_landmarks:
            for hand_landmarks in hand_results.multi_hand_landmarks:
                num_hands_detected += 1
                self.mp_draw.draw_landmarks(frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS)

        # TRIGGER CONDITION: Less than 2 hands visible (Strict Rule per user requirement)
        # Optimized: With 0.15 confidence, model should find both hands if visible.
        hands_violation = (num_hands_detected < 2)
        
        if not hands_violation:
            self.hand_start_time = None # Reset if BOTH hands seen
        else:
            if self.hand_start_time is None:
                self.hand_start_time = time.time()

        # ==========================================================
        # 3. YOLO DETECTION (Objects - PHONES ONLY - STRICT ID 67)
        # ==========================================================
        # RAW UNFILTERED PREDICTION
        results = self.model.predict(frame, verbose=False, conf=0.1)[0] 
        phone_detected = False
        
        if len(results.boxes) > 0:
            for b in results.boxes:
                cls_id = int(b.cls[0])
                conf = float(b.conf[0])
                name = results.names[cls_id]
                x1, y1, x2, y2 = map(int, b.xyxy[0])
                
                box_w = x2 - x1
                box_h = y2 - y1
                area = box_w * box_h
                aspect_ratio = box_w / box_h if box_h > 0 else 0

                # STRICT PHONE CHECK (ID 67)
                if cls_id == 67:
                    # FIX: Confidence >= 0.35 (Strict "Zero Mercy")
                    if conf < 0.35:
                         continue
                         
                    # REMOVED: All Area & Aspect Ratio Filters.
                    # If YOLO says it's a phone with >35% confidence, IT IS A PHONE.
                        
                    # ACCEPTED
                    phone_detected = True
                    # print(f"[DEBUG] ✅ CELL PHONE CONFIRMED: Strike candidate! Conf={conf:.2f}")
                    
                    # Draw Box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                    cv2.putText(frame, f"PHONE ({conf:.2f})", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                    break # One phone is enough
        
        if phone_detected:
            # IMMEDIATE TRIGGER logic (User says "If ANY phone is detected -> increment phone strike")
            # But we need time logic to execute strikes correctly in the loop below.
            # We force start time to be "long enough ago" to trigger immediately on next check if needed?
            # Or just set a short threshold.
            if self.phone_start_time is None:
                self.phone_start_time = time.time()
        else:
            self.phone_start_time = None

        # ==========================================================
        # 4. ALERT LOGIC (SEPARATE TIMERS)
        # ==========================================================
        current_time = time.time()
        violation_reason = None
        
        # Check Limits
        # 1. Phone (Priority 1) -> Threshold 1.5s (Reduced for responsiveness)
        if self.phone_start_time and (current_time - self.phone_start_time >= 1.5):
            violation_reason = "Cell Phone Detected"
            
        # 2. Face (Priority 2) -> Threshold 2.0s
        elif self.face_start_time and (current_time - self.face_start_time >= self.max_suspicious_time):
            violation_reason = "Face not detected"
            
        # 3. Hands (Priority 3) -> Threshold > 3.0s (USER REQ)
        elif self.hand_start_time and (current_time - self.hand_start_time > 3.0):
            violation_reason = "Both hands not visible"


        # Trigger Warning if Cooldown Passed
        if violation_reason:
            if current_time - self.last_alert_time >= self.alert_cooldown:
                self.alert_count += 1
                self.last_alert_time = current_time
                
                # Reset the specific timer that triggered it
                if violation_reason == "Cell Phone Detected": self.phone_start_time = None
                if violation_reason == "Face not detected": self.face_start_time = None
                if violation_reason == "Both hands not visible": self.hand_start_time = None # Reset to give grace period
                
                # Increment Rule Count
                if violation_reason in self.counts:
                    self.counts[violation_reason] += 1
                    
                    warning_msg = f"{violation_reason} {self.counts[violation_reason]}/3"
                    full_debug_msg = f"[Warning] {warning_msg} (Terminates at 3/3)"
                    print(full_debug_msg)
                    
                    self.warnings.append(warning_msg)
                    current_warnings.append(warning_msg)

        return frame, current_warnings