from fastapi import FastAPI

app = FastAPI(title="Patent360")

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.5.0"}
