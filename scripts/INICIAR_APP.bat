@echo off
echo Iniciando Octopus Coquinaria...
:: Cambiar al directorio del proyecto
cd /d "c:\Users\nicol\OneDrive\Desktop\Octopus app"

:: Ejecutar la aplicación y abrir el navegador
:: El parametro -- --open le dice a Vite que abra el navegador automaticamente
call npm run dev -- --open

:: Pausa para ver si hubo errores si se cierra
pause
