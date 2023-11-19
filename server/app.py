import base64
from pydantic import BaseModel
from PIL import Image
from io import BytesIO
import imageio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from engine import Engine
import time
import os
import glob
import httpx
from starlette.requests import Request
from starlette.responses import StreamingResponse
from starlette.background import BackgroundTask

class Req(BaseModel):
  prompt: str
  img: str

running = False
last = None

# Inference Engine
engine = Engine()

# Proxy Engine (for making CORS requests)
client = httpx.AsyncClient()

# Server
app = FastAPI()
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")
@app.get("/items/{count}")
def items(count: int):
  all_files = glob.glob(os.path.join("static", '*'))
  sorted_files = sorted(all_files, key=os.path.getmtime, reverse=True)
  last_updated_files = sorted_files[:count]
  return last_updated_files

@app.get("/proxy")
async def proxy(url: str):
  global client
  req = client.build_request("GET", url)
  r = await client.send(req, stream=True)
  return StreamingResponse(
    r.aiter_raw(),
    background=BackgroundTask(r.aclose),
    headers=r.headers
  )
  
@app.post("/predict")
def predict(req: Req):
  global running
  if running:
    return { "filename": last }
  else:
    running = True

    im_bytes = base64.b64decode(req.img)
    im_file = BytesIO(im_bytes)  # convert image to file-like object
    img = Image.open(im_file)   # img is now PIL Image object
    imageio.imsave("src.png", img)

    img = img.convert('RGB')
    img = img.resize((512,512))

    generated = engine.generate(req.prompt,img) 
    filename = f"static/{str(int(time.time_ns() / 1e6))}.png"
    last = filename
    imageio.imsave(filename, generated)

    running = False
    return { "filename": last }
