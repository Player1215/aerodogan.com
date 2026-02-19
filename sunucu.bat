@echo off
TITLE Forum Test Tuneli
echo [1/2] Eski tuneller temizleniyor...
taskkill /f /im cloudflared.exe /t >nul 2>&1

echo [2/2] Localhost:5500 internete aciliyor...
echo ---------------------------------------------------
echo DIKKAT: VS Code Live Server (Port 5500) acik olmalidir!
echo ---------------------------------------------------

:: cloudflared.exe yolunu kendi bilgisayarına göre kontrol et
C:\LabelStudio\cloudflared.exe tunnel --url http://127.0.0.1:5500

pause