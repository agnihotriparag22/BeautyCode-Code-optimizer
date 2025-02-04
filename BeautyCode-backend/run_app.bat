@echo off
REM run_app.bat

REM Check if the virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo Virtual environment not found. Please create a virtual environment in the current directory.
    exit /b 1
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Setting Python Path...
set PYTHONPATH=%cd%;%PYTHONPATH%

echo Starting the application...
python -u "app\run.py"

REM Keep the window open if there's an error
if errorlevel 1 (
    echo.
    echo Application exited with an error!
    pause
)

REM Deactivate virtual environment
deactivate