#!/bin/bash

# Build and Deploy Script for Railway
echo "🚀 Building SimplyLegal for Railway deployment..."

# Build React frontend locally
echo "📦 Building React frontend..."
npm install --legacy-peer-deps
npm run build

# Copy build to static folder for Docker
echo "📁 Copying build files..."
rm -rf static
cp -r build static

# Deploy to Railway
echo "🚢 Deploying to Railway..."
railway up --dockerfile Dockerfile.minimal

echo "✅ Deployment complete!"
echo "Check your Railway dashboard for the deployment URL."