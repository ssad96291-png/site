@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
)
node -e "if(Number(process.versions.node.split('.')[0])<24) process.exit(1)" >nul 2>nul
if errorlevel 1 goto missing
if not exist "node_modules\.bin\vite.cmd" (
  echo Gerekli paketler kuruluyor. Internet baglantisi gereklidir.
  call npm ci
  if errorlevel 1 goto failed
)
echo.
echo Site: http://localhost:5173
echo Yonetim: http://localhost:5173/yonetim
echo Bu pencere acik kalmali. Durdurmak icin Ctrl+C.
echo Ilk sifre: .data\initial-admin-password dosyasinda, sadece ilk kurulumda.
echo.
call npm run dev
if errorlevel 1 goto failed
exit /b 0
:missing
echo.
echo Node.js 24 veya daha yeni bir surum gerekiyor.
echo https://nodejs.org/en/download adresinden Windows Installer MSI kurun.
echo Kurulumda Add to PATH secenegi acik kalsin.
echo Kurulumdan sonra bu pencereyi kapatip dosyayi tekrar acin.
pause
exit /b 1
:failed
echo.
echo Baslatilamadi. Yukaridaki hata mesajini kontrol edin.
pause
exit /b 1
