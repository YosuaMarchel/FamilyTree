@echo off
REM Menjalankan server lokal silsilah keluarga (klik dua kali berkas ini).
REM Selama server hidup, setiap perubahan data di halaman langsung ditulis
REM ke js/data.js.

cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  py -3 serve.py %*
) else (
  python serve.py %*
)

echo.
pause
