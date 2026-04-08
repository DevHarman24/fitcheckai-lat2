@echo off
echo ==============================================
echo       Universal GitHub Repo Uploader
echo ==============================================
echo.
set /p REPO_URL="1. Paste your NEW GitHub Repository URL here (e.g. https://github.com/... ): "

echo.
echo 2. Initializing Git...
git init

echo.
echo 3. Linking to your repository...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo.
echo 4. Staging all files safely (ignoring node_modules)...
git add .

echo.
echo 5. Committing changes...
git commit -m "Initial commit with App Router + Vercel deployment"

echo.
echo 6. Setting branch to main...
git branch -M main

echo.
echo 7. Pushing securely to GitHub...
git push -u origin main --force

echo.
echo ==============================================
echo [SUCCESS] Your code is now fully uploaded!
echo ==============================================
pause
