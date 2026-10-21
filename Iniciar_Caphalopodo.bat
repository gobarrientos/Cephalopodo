@echo off
title Caphalopodo - Delaire Evolution NextGen (Rust Standalone)
echo ============================================================================
echo   Caphalopodo - Delaire Evolution NextGen
echo   Iniciando estacion cefalometrica local en http://localhost:4173 ...
echo ============================================================================
start "" "http://localhost:4173"
"C:\Program Files\nodejs\node.exe" "%~dp0server.mjs"
pause
