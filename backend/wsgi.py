from app import app as application

# Ensure the application is loaded for WSGI servers
app = application

# This file is used by WSGI servers (e.g., gunicorn)
# Command example:
# gunicorn -w 2 -b 0.0.0.0:5000 wsgi:application


