@echo off
chcp 65001 > nul
echo ===================================================
echo   VEE RUBBER GPROCUREMENT TRACKER - SEND EMAIL DIGEST
echo ===================================================
echo กำลังเริ่มระบบส่งอีเมลสรุปงาน...
echo.
cd /d "%~dp0\scraper"
node src/send-now.js
echo.
pause
