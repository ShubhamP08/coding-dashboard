from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "AI service is running"}

@app.post("/generate-insights")
def generate_insights():
    return {"insights": "Sample AI insight response"}
