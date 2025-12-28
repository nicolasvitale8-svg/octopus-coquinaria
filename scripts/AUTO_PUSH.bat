@echo off
echo Desplegando a Produccion...
git add .
git commit -m "update: cambios automaticos %date% %time%"
git push origin main
echo Listo.
pause
