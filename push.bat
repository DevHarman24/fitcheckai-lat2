@echo off
echo [GitHub Repository Setup and Push]
echo.
echo 1. Initializing Git...
git init
echo.
echo 2. Checking or Adding remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/DevHarman24/Fitcheck-ai.git
echo.
echo 3. Staging code...
git add .
echo.
echo 4. Commiting...
git commit -m "Fix TryOn section GARMENT image URL and sync latest local changes for Vercel"
echo.
echo 5. Setting branch to main...
git branch -M main
echo.
echo 6. Pushing to GitHub (origin/main)...
git push -u origin main
echo.
echo [Process Complete] If it says "non-fast-forward", you may need to force push. Otherwise, check your Vercel Dashboard!
echo Press any key to close this window.
pause
