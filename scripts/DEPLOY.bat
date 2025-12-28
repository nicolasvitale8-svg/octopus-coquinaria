@echo off
echo ========================================================
echo      OCTOPUS DEPLOYER - Despliegue a Produccion
echo ========================================================
echo.
echo 1. Preparando archivos...
git add .
echo.

set /p commitMsg="2. Escribe que cambios hiciste (ej: arregle el login): "
echo.

echo 3. Guardando version local...
git commit -m "%commitMsg%"
echo.

echo 4. Enviando a la Nube (GitHub + Vercel)...
git push origin main
echo.

echo ========================================================
echo      EXITO! Tu web se actualizara en 2-3 minutos.
echo      Puedes cerrar esta ventana.
echo ========================================================
pause
