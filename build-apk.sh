#!/bin/bash

# Build APK script for Android
# This script builds a release APK locally

echo "Building Android APK..."

# Navigate to android directory
cd android

# Clean previous builds
echo "Cleaning previous builds..."
./gradlew clean

# Build release APK
echo "Building release APK..."
./gradlew assembleRelease

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK built successfully!"
    echo "📦 APK location: android/app/build/outputs/apk/release/app-release.apk"
    echo ""
    echo "To install on a connected device:"
    echo "  adb install android/app/build/outputs/apk/release/app-release.apk"
else
    echo ""
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

