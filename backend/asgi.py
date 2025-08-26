from stock_sentiment import app as flask_app
from uvicorn.middleware.wsgi import WSGIMiddleware

# Optional ASGI adapter. Not used by default.
app = WSGIMiddleware(flask_app)


