from pydantic import BaseModel,constr

class code_format_schema(BaseModel):
    text : str
    language : str

class code_chat_schema(BaseModel):
    text : str
    