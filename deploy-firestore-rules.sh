#!/bin/bash

echo "🔥 Deploying Firestore Security Rules for SSB Student Portal"
echo "=================================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Login check
echo "🔐 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "firebase login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if we're in the right project
echo "📋 Current Firebase project:"
firebase use --current

echo ""
read -p "Is this the correct project (scaler-school-of-business)? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set the correct project with: firebase use scaler-school-of-business"
    exit 1
fi

# Deploy Firestore rules
echo "🚀 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore security rules deployed successfully!"
    echo ""
    echo "Your Firebase security rules have been updated to:"
    echo "• Allow authenticated users with @ssb.scaler.com emails only"
    echo "• Restrict access to user's own data"
    echo "• Allow reading shared content"
    echo "• Deny all other requests"
    echo ""
    echo "🎉 Your Firebase database is now secure and accessible again!"
else
    echo "❌ Failed to deploy Firestore rules. Please check the error messages above."
    exit 1
fi