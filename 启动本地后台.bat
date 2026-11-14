@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动本地后台...
echo.
echo [1/2] 启动 Decap 本地服务（8081 端口）
start "Decap 本地服务" cmd /k npx decap-server
echo [2/2] 启动 Hexo 预览（4000 端口）
start "Hexo 预览" cmd /k npm run dev
echo.
echo 等 10 秒后会自动打开浏览器；如果没开，手动访问 http://localhost:4000/admin/
timeout /t 10 >nul
start http://localhost:4000/admin/
exit
