git add .
pause
@echo off
set /p variável=Informe o nome do commit:
pause
git commit -am "%variável%"
pause
git push heroku master
pause