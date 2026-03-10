"""Entry point: python -m nasus_sidecar"""
import uvicorn
from nasus_sidecar.app import app

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=4751,
        log_level="info",
    )
