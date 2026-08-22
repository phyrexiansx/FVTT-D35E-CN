@echo off
chcp 65001 >nul
echo ============================================
echo  D35E 玩家伴侣服务 - 开机自启管理
echo ============================================
echo.
echo  [1] 注册开机自启（登录时自动启动服务）
echo  [2] 取消开机自启
echo  [3] 立即启动服务（前台）
echo  [4] 退出
echo.
set /p choice=请选择(1-4):
if "%choice%"=="1" goto install
if "%choice%"=="2" goto uninstall
if "%choice%"=="3" goto run
if "%choice%"=="4" exit /b
goto end

:install
schtasks /create /tn "D35E-CompanionServer" /tr "\"%~dp0start-hidden.bat\"" /sc onlogon /rl limited /f
if errorlevel 1 (
  echo 注册失败，尝试以管理员方式运行本脚本。
) else (
  echo 已注册开机自启：登录 Windows 时自动启动伴侣服务。
)
pause
exit /b

:uninstall
schtasks /delete /tn "D35E-CompanionServer" /f
echo 已取消开机自启。
pause
exit /b

:run
node "%~dp0server.js"
pause
exit /b

:end
pause
