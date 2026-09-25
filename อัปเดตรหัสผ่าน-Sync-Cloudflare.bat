@echo off
chcp 65001 > nul
echo ===================================================
echo   VEE RUBBER GPROCUREMENT TRACKER - PASSWORD SYNC
echo ===================================================
echo กำลังซิงค์รหัสผ่านจาก .env ไปยัง Cloudflare...
echo.
cd /d "%~dp0"
node sync-credentials.cjs
echo.
pause
