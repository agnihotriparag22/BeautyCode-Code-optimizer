import os
import sys 
import tempfile
from io import StringIO
from pylint.lint import Run
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi.responses import JSONResponse

from app.models.code_format_model import code_format_schema
from app.models.code_format_model import code_chat_schema, code_format_schema

# Loading environment variables from .env file 
load_dotenv()

def configure_model():
    """Configures the Gemini model with the API key."""
    # genai.configure(api_key=gemini_api_key)
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    return genai.GenerativeModel("gemini-1.5-flash")

def code_format(request: code_format_schema):
    model = configure_model()
    script ="""Remove Comments: Eliminate all comments.
               Sort Imports: Organize import statements from shortest to longest.
               Code Formatting: Ensure adherence to industry standards for readability and style.
               Naming Conventions: Update variable and function names to best practices (camelCase for variables, PascalCase for classes).
               Syntactical Corrections: Fix any syntactical errors.
               Function Grouping: Group related functions logically.
               Error Handling: Implement appropriate error handling.
               Compact Code: Refactor for compactness while maintaining functionality.
               Refactor Redundant Code: Eliminate redundant code for efficiency.
               Statelessness: Ensure each API call is self-contained; avoid server-side session state.
               API Structure: If routes exist, structure APIs around resources (nouns) using HTTP methods (GET, POST, PUT, DELETE).
               Documentation: Add documentation comments for every function and API method based on its functionality.
               Output Language: Provide the final code in {request.language} only, without suggestions or feedback.
     """
    content = request.text + script
    try:
        response = model.generate_content(content)
        response_data = {"status": "Success", "text": response.text}
        return JSONResponse(response_data)
    except Exception as e:
        response_data = {"status": "Error", "message": str(e)}
        return JSONResponse(response_data, status_code=500)


def code_suggest(request: code_format_schema):
    model = configure_model()
    script = """Feedback: Offer constructive feedback on the code, highlighting strengths and areas for improvement.
                Suggestions for Optimization: Provide specific suggestions for further optimizing the code, focusing on performance readability, and maintainability.
                Real-Life Use Cases: Describe potential real-world applications of this code in industry settings, illustrating how it can be effectively utilized.
                Security Considerations: Identify any security vulnerabilities in the code and recommend modifications to enhance security.
            """
    content = request.text + script
    try:
        response = model.generate_content(content)
        response_data = {"status": "Success", "text": response.text}
        return JSONResponse(response_data)
    except Exception as e:
        response_data = {"status": "Error", "message": str(e)}
        return JSONResponse(response_data, status_code=500)


def code_chat(request: code_chat_schema):
    model = configure_model()
    content = request.text
    try:
        response = model.generate_content(content)
        response_data = {"status": "Success", "text": response.text}
        return JSONResponse(response_data)
    except Exception as e:
        response_data = {"status": "Error", "message": str(e)}
        return JSONResponse(response_data, status_code=500)
    
def normalize_line_endings(code_string):
    """
    Normalize line endings to Unix-style (\n)
    """
    # Replace Windows line endings with Unix line endings
    code_string = code_string.replace('\r\n', '\n')
    # Replace any remaining Mac-style line endings
    code_string = code_string.replace('\r', '\n')
    return code_string

def get_pylint_score(code_string:code_format_schema):
    """
    Get Pylint score for Python code
    
    Args:
        file_path (str): Path to Python file to analyze
        code_string (str): String containing Python code to analyze
    
    Returns:
        float: Pylint score (0-10)
    """
    # Create a temporary file if code string is provided
   
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False)
    text = normalize_line_endings(code_string.text)
    temp_file.write(text)
    temp_file.close()
    file_path = temp_file.name
    
    if not file_path:
        raise ValueError("Either file_path or code_string must be provided")

    # Configure pylint options
    options = [
        file_path,
        '--output-format=text',
        '--reports=yes',
        '--score=yes'
    ]
    
    # Capture the output
    original_stdout = sys.stdout
    sys.stdout = StringIO()
    
    try:
        Run(options, reporter=None, exit=False)
        
        # Extract score from the last line of the output
        output = sys.stdout.getvalue()
        sys.stdout = original_stdout
        for line in output.split('\n'):
            if "Your code has been rated at" in line:
                # Extract the score (first number in the string)
                score = float(line.split()[6].split('/')[0])
                text = f"Your pylint score is {score}"
                
                response_data = {"status": "Success", "text": text}
                return JSONResponse(response_data)

    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        return 0.0
    finally:
        sys.stdout = original_stdout