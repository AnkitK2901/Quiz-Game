#!/bin/bash

# ================== CONFIGURE YOUR DETAILS HERE ==================

# Your username on the GCE server
GCE_USER="ankit_anjul"

# The external IP address of your GCE server
GCE_HOST="34.93.194.88"

# The full path to your project's directory on the server
APP_DIR="/home/ankit_anjul/Quiz-Game"

# The name of the systemd service you created in Part 1
SERVICE_NAME="quiz-game"

# The commit message to use for your git push
COMMIT_MESSAGE="Deploying latest updates"

# =================================================================

echo "➡️  STEP 1: Committing and pushing local changes..."
# Add all changed files
git add .

# Commit with the message defined above
# This will only create a commit if there are staged changes
git commit -m "$COMMIT_MESSAGE"

# Push to the main branch on GitHub
git push origin main

echo "✅ Local changes pushed successfully."
echo "----------------------------------------"
echo "🚀 STEP 2: Starting deployment to GCE server..."

# Connect to the server via SSH and run the deployment steps
ssh $GCE_USER@$GCE_HOST "
    echo '➡️  Navigating to app directory: $APP_DIR'
    cd $APP_DIR || { echo '❌ App directory not found on server!'; exit 1; }

    # --- NEW: Forcefully clean the repository on the server ---
    echo '🧹  Resetting any local changes on the server...'
    git reset --hard HEAD
    
    echo '🗑️  Cleaning untracked files and directories...'
    git clean -fd

    echo '🔄  Pulling latest changes from Git...'
    git pull origin main || { echo '❌ Git pull failed on server!'; exit 1; }

    echo '🔨  Building project with Maven on the server...'
    mvn clean package || { echo '❌ Maven build failed on server!'; exit 1; }

    echo '♻️  Restarting the $SERVICE_NAME application service...'
    sudo systemctl restart $SERVICE_NAME

    echo '✅  Checking service status...'
    sudo systemctl status $SERVICE_NAME --no-pager
"

echo "✨ Deployment script finished."