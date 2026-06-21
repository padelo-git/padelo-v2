#!/bin/bash

echo "Deploying Padelo V2 to server..."

# Server configuration
SERVER="ec2-user@18.212.126.125"
SSH_KEY="/Users/lucianalujaniriarte/Desktop/AWS/padelo-key.pem"
REMOTE_DIR="~/padelo-v2"

# Stop existing services
ssh -i $SSH_KEY $SERVER "cd $REMOTE_DIR && docker-compose down"

# Pull latest code
ssh -i $SSH_KEY $SERVER "cd $REMOTE_DIR && git pull origin main"

# Build and start services
ssh -i $SSH_KEY $SERVER "cd $REMOTE_DIR && docker-compose up -d --build"

# Run migrations (if needed)
# ssh -i $SSH_KEY $SERVER "cd $REMOTE_DIR/backend && alembic upgrade head"

echo "Deployment completed successfully!"
