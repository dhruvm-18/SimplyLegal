@echo off
echo 🚀 Building SimplyLegal for Railway deployment...

echo 📦 Building React frontend...
call npm install --legacy-peer-deps
call npm run build

echo 📁 Copying build files...
if exist static rmdir /s /q static
xcopy build static /e /i /h

echo 🚢 Deploying to Railway...
railway up --dockerfile Dockerfile.minimal

echo ✅ Deployment complete!
echo Check your Railway dashboard for the deployment URL.
pause