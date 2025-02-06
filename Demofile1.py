import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
import json
from fastapi.responses import JSONResponse
 
app=FastAPI()
 
class request(BaseModel):
    text :str
 
def demoresponse():
   x = {
       "status":"Success",
       "message":"This is demo api"
   }
   return JSONResponse(content= x)
 
@app.post("/demoapi")
async def demoapi(request:request):
 
    return demoresponse(request)
 
 
if __name__ == "__main__":
    uvicorn.run("run:app", port=8000, log_level="info", workers=True, reload=True)