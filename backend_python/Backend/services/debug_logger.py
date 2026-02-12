import logging
import os

# Create a custom logger
logger = logging.getLogger("InterviewDebugger")
logger.setLevel(logging.DEBUG)

# Create handlers
file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "interview_debug.log")
f_handler = logging.FileHandler(file_path, mode='w')
f_handler.setLevel(logging.DEBUG)

# Create formatters and add it to handlers
f_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
f_handler.setFormatter(f_format)

# Add handlers to the logger
logger.addHandler(f_handler)

def log_debug(msg):
    logger.debug(msg)
    print(msg) # Also print to console
