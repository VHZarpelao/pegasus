git add .
pause
@echo off
set /p vari�vel=Informe o nome do commit:
pause
git commit -am "%vari�vel%"
pause
git push heroku master
pause