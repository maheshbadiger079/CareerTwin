@echo off
title CareerTwin - Streamlit Runner
echo ==========================================
echo Starting CareerTwin AI Career Co-Pilot...
echo ==========================================
echo.
python -m pip install -r requirements.txt
echo.
echo Launching Streamlit at http://localhost:8501 ...
streamlit run streamlit_app.py
pause
