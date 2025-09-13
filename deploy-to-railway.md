# Deploy SimplyLegal to Railway

## Prerequisites
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login to Railway: `railway login`

## Deployment Steps

### 1. Initialize Railway Project
```bash
railway init
```

### 2. Set Environment Variables
Set these environment variables in your Railway dashboard or via CLI:

```bash
# Required environment variables
railway variables set GEMINI_API_KEY=your_actual_gemini_api_key_here
railway variables set SECRET_KEY=your_secret_key_here
railway variables set FLASK_ENV=production
railway variables set PORT=8080

# Optional environment variables
railway variables set MAX_CONTENT_LENGTH=16777216
railway variables set UPLOAD_FOLDER=uploads
railway variables set PROCESSED_FOLDER=processed
```

### 3. Deploy
```bash
railway up
```

## Important Notes

1. **Environment Variables**: Make sure to set your actual Gemini API key in the Railway dashboard
2. **Static Files**: The Docker build will automatically build your React frontend and serve it
3. **Health Check**: The app includes a health check endpoint at `/healthz`
4. **Production Server**: Uses Gunicorn for production-grade performance

## File Structure for Railway
```
your-project/
├── Dockerfile              # Multi-stage build for React + Flask
├── railway.json            # Railway configuration
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies
├── backend.py             # Your Flask backend
├── frontend_routes.py     # Frontend serving routes
├── src/                   # React source code
├── public/                # React public files
└── uploads/               # Upload directory (created automatically)
```

## Troubleshooting

### If deployment fails:
1. Check Railway logs: `railway logs`
2. Verify environment variables are set correctly
3. Make sure your Gemini API key is valid

### If frontend doesn't load:
1. Check that the build completed successfully in logs
2. Verify static files are being served correctly
3. Check browser console for any errors

### Performance optimization:
- The Docker image uses multi-stage builds to minimize size
- Gunicorn is configured with 2 workers for better performance
- Health checks ensure the app stays running

## Railway Dashboard
After deployment, you can:
- View logs and metrics in the Railway dashboard
- Set up custom domains
- Configure scaling options
- Monitor resource usage