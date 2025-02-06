import uvicorn
import secrets
import databases
from fastapi import *
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import create_engine, Column, Integer, String
import sqlalchemy
from pydantic import BaseModel
from passlib.context import CryptContext
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from fastapi_cache import FastAPICache


DATABASE_URL = r"sqlite:///D:\PYTHON\fastAPI_Tutorial\db\database.db"

database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# class EmailSchema(BaseModel):
#     email: str
#     subject: str
#     message: str

# conf = ConnectionConfig(
#     MAIL_USERNAME="prakhar.kabra@yash.com",
#     MAIL_PASSWORD="Jail@8989,YashT@1",
#     MAIL_FROM="your_email@example.com",
#     MAIL_PORT=587,
#     MAIL_SERVER="mail.google.com",
#     MAIL_TLS=True,
#     MAIL_SSL=False,
# )

users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("username", sqlalchemy.String, unique=True),
    sqlalchemy.Column("email", sqlalchemy.String, unique=True),
    sqlalchemy.Column("password", sqlalchemy.String),
    sqlalchemy.Column("role", sqlalchemy.String, insert_default="user")
)

# event name
# event desciption
# event id
# email
# 
events = sqlalchemy.Table(
    "events",
    metadata,
    sqlalchemy.Column("event_id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("event_name", sqlalchemy.String),
    sqlalchemy.Column("event_location", sqlalchemy.String),
    sqlalchemy.Column("event_description", sqlalchemy.String),
    sqlalchemy.Column("event_date", sqlalchemy.DateTime)

)

engine = sqlalchemy.create_engine(DATABASE_URL)
metadata.create_all(engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()
templates = Jinja2Templates(directory=r"D:\PYTHON\fastAPI_Tutorial\templates")

# engine = create_engine(DATABASE_URL, connect_args={"check_same_thread":False})

# sessionlocal = sessionmaker(autocommin=False, autoflush=False, bind=engine)

# Base = declarative_base()

# class User(Base):
#     __tablename__ ="users"
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, index=True)
#     password = Column(String, unique=True, index=True)

# Base.metadata.create_all(bind=engine)

# def get_db():
#     db = sessionlocal()
#     try:
#         yield db
#     finally:
#         db.close()

# class UserCreate(BaseModel):
#     name: str
#     password: str

# class UserResponse(BaseModel):
#     id: int
#     name: str
#     password: str

#     class config:
#         orm_mode = True

# Session Storage  
sessions = {}

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get('/', response_class=HTMLResponse)
async def home(request:Request):
    return templates.TemplateResponse('home.html', {"request":request})

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})


@app.post("/register")
async def register(username: str = Form(...), email: str = Form(...), password: str = Form(...)):
    query = users.select().where(users.c.username == username)
    existing_user = await database.fetch_one(query)

    if existing_user:
        # status code 400 - Bad Request
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = pwd_context.hash(password)
    query = users.insert().values(username=username, email=email, password=hashed_password)
    await database.execute(query)



    # status code 303 - HTTP response that indicates that a requested resource has been moved to a new location
    return RedirectResponse(url='/login', status_code=303)

@app.get('/login', response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post('/login')
async def login(response: Response, username: str = Form(...), password: str = Form(...)):
    
    query = users.select().where(users.c.username == username)
    user = await database.fetch_one(query)

    if not user or not pwd_context.verify(password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    session_id = secrets.token_urlsafe(32)
    sessions[session_id] = username
    response = RedirectResponse('/dashboard', status_code=303)
    response.set_cookie(key="session_id", value=session_id)
    return response

@app.get('/dashboard', response_class=HTMLResponse)
async def dashboard(request: Request):
    session_id = request.cookies.get("session_id")
    if not session_id or session_id not in sessions:
        return RedirectResponse(url="/login")
    username = sessions[session_id]
    #test
    query = users.select().where(users.c.username == username)
    user = await database.fetch_one(query)
    email = user["email"]
    
    return templates.TemplateResponse("dashboard.html", {"request":request, "username":username, "email":email})


@app.get('/logout')
# @cache_control(no_cache=True, must_revalidate=True)
async def logout(response: Response):
    response.headers['Cache-Control'] = "no-cache"
    response = RedirectResponse(url="/login")
    response.delete_cookie(key="session_id")
    return response

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)