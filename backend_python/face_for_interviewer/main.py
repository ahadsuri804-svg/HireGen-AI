import cv2
import mediapipe as mp
import time
from ultralytics import YOLO

class InterviewCheatingDetector:
    def __init__(self, max_suspicious_time=2.0, camera_index=0, confidence_threshold=0.3, alert_cooldown=5.0):
        self.max_suspicious_time = max_suspicious_time
        self.confidence_threshold = confidence_threshold
        self.alert_cooldown = alert_cooldown
        self.suspicious_start_time = None
        self.last_alert_time = 0
        self.alert_count = 0
        self.warnings = []
        self.latest_frame_bytes = None
        self.camera_index = camera_index

        # Initialize MediaPipe
        self.mp_face = mp.solutions.face_detection
        self.mp_draw = mp.solutions.drawing_utils
        self.face_detection = self.mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5)

        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.5, min_tracking_confidence=0.5)

        # Initialize YOLO after confirming camera
        print(f"[INFO] Opening camera index {camera_index}...")
        self.cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)

        # Retry logic
        if not self.cap.isOpened():
            print(f"⚠️ Camera index {camera_index} failed. Retrying with other indexes...")
            for i in range(3):
                temp_cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
                if temp_cap.isOpened():
                    print(f"✅ Camera successfully opened at index {i}.")
                    self.cap = temp_cap
                    self.camera_index = i
                    break
            else:
                raise RuntimeError("❌ Could not open any available camera!")

        time.sleep(2)  # Let camera warm up before YOLO load

        print("[INFO] Loading YOLO model (first time may take a few seconds)...")
        self.model = YOLO("yolov8n.pt")
        self.suspicious_classes = ["cell phone", "book", "handbag", "paper"]

    def run(self, stop_event):
        print(f"[INFO] Cheating detector running on camera index {self.camera_index}...")

        while not stop_event.is_set() and self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                print("⚠️ Frame read failed, skipping...")
                time.sleep(0.2)
                continue

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # FACE DETECTION
            face_results = self.face_detection.process(rgb_frame)
            face_detected = bool(face_results.detections)

            if face_detected:
                for detection in face_results.detections:
                    bboxC = detection.location_data.relative_bounding_box
                    h, w, _ = frame.shape
                    x, y, w_box, h_box = int(bboxC.xmin * w), int(bboxC.ymin * h), int(bboxC.width * w), int(bboxC.height * h)
                    cv2.rectangle(frame, (x, y), (x + w_box, y + h_box), (0, 255, 0), 2)
                    cv2.putText(frame, "Face", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            # HAND DETECTION
            hand_results = self.hands.process(rgb_frame)
            num_hands_detected = 0
            if hand_results.multi_hand_landmarks:
                for hand_landmarks in hand_results.multi_hand_landmarks:
                    num_hands_detected += 1
                    self.mp_draw.draw_landmarks(frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS)

            hands_missing = num_hands_detected < 2

            # YOLO DETECTION
            results = self.model.predict(frame, verbose=False)[0]
            suspicious_detected = False
            for obj in results.boxes:
                class_name = results.names[int(obj.cls[0])]
                conf = float(obj.conf[0])
                if class_name in self.suspicious_classes and conf >= self.confidence_threshold:
                    suspicious_detected = True
                    x1, y1, x2, y2 = map(int, obj.xyxy[0])
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(frame, f"{class_name} ({conf:.2f})", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

            # VIOLATION LOGIC
            violation = not face_detected or suspicious_detected or hands_missing
            current_time = time.time()

            if violation:
                if self.suspicious_start_time is None:
                    self.suspicious_start_time = current_time
                elif current_time - self.suspicious_start_time >= self.max_suspicious_time:
                    if current_time - self.last_alert_time >= self.alert_cooldown:
                        self.alert_count += 1
                        self.last_alert_time = current_time
                        self.suspicious_start_time = None
                        reason = ("Face not detected" if not face_detected else
                                  "Both hands not detected" if hands_missing else
                                  "Suspicious object detected")
                        print(f"[Warning] {reason}")
                        self.warnings.append(reason)
                        _, jpeg = cv2.imencode('.jpg', frame)
                        self.latest_frame_bytes = jpeg.tobytes()

                        if self.alert_count >= 3:
                            self.warnings.append("Interview canceled due to repeated suspicious activities.")
                            stop_event.set()
            else:
                self.suspicious_start_time = None

            cv2.imshow("Interview Cheating Detector", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                stop_event.set()
                break

        self.cap.release()
        cv2.destroyAllWindows()
        print("[INFO] Camera released and window closed.")
        return self.warnings



def run_vision_module(stop_event, max_suspicious_time=2.0, camera_index=0, alert_cooldown=8.0):
    detector = InterviewCheatingDetector(
        max_suspicious_time=max_suspicious_time,
        camera_index=camera_index,
        alert_cooldown=alert_cooldown
    )
    return detector