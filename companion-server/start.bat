@echo off
chcp 65001 >nul
title D35E 本地玩家伴侣服务
cd /d %~dp0
echo ============================================
echo  D35E 本地玩家伴侣服务
echo  启动后手机浏览器访问: http://<本机局域网IP>:30001
echo  关闭本窗口即停止服务
echo ============================================
node server.js
pause
