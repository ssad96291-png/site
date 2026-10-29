@echo off
setlocal
cd /d "%~dp0"
rem Prefer the installed Windows runtime over an inherited older PATH entry.
set "NODE_EXE="
if exist "%ProgramW6432%\nodejs\node.exe" set "NODE_EXE=%ProgramW6432%\nodejs\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"
if not defined NODE_EXE for /f "delims=" %%N in ('where node.exe 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"
if not defined NODE_EXE goto missing
for %%N in ("%NODE_EXE%") do set "NODE_HOME=%%~dpN"
set "PATH=%NODE_HOME%;%PATH%"
echo Node konumu: "%NODE_EXE%"
"%NODE_EXE%" --version
if errorlevel 1 goto node_failed
"%NODE_EXE%" -e "process.exit(Number(process.versions.node.split('.')[0]) < 24 ? 2 : 0)"
if errorlevel 2 goto outdated
if errorlevel 1 goto node_failed
if not exist "%NODE_HOME%npm.cmd" goto npm_missing
if not exist "package.json" goto project_missing
if not exist "node_modules\.bin\vite.cmd" (
  echo Gerekli paketler kuruluyor. Internet baglantisi gereklidir.
  call "%NODE_HOME%npm.cmd" ci
  if errorlevel 1 goto failed
)
echo.
echo Site: http://localhost:5173
echo Yonetim: http://localhost:5173/yonetim
echo Musteri paneli: http://localhost:5173/hesabim
echo Bu pencere acik kalmali. Durdurmak icin Ctrl+C.
echo Ilk sifre: .data.initial-admin-password dosyasinda, sadece ilk kurulumda.
echo.
call "%NODE_HOME%npm.cmd" run dev
if errorlevel 1 goto failed
exit /b 0
:missing
echo Node.js kurulumu bulunamadi. Node.js 24 veya uzeri Windows MSI kurun.
echo https://nodejs.org/en/download
pause
exit /b 1
:outdated
echo Secilen Node surumu eski. Yukaridaki konumu ve surumu kontrol edin.
echo Node.js 24 veya daha yeni bir surum gerekiyor.
pause
exit /b 1
:node_failed
echo Node bulundu ancak calistirilamadi. Yukaridaki asil hata mesajini paylasin.
pause
exit /b 1
:npm_missing
echo Node bulundu ancak ayni klasorde npm.cmd bulunamadi.
echo Node.js Windows MSI kurulumunda npm ozelligini onarin.
pause
exit /b 1
:project_missing
echo package.json bulunamadi. Bu dosyayi proje klasorunden calistirin.
pause
exit /b 1
:failed
echo Baslatilamadi. Yukaridaki hata mesajini kontrol edin.
pause
exit /b 1
