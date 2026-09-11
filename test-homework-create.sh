#!/bin/bash

# Homework Create API - Quick Test Script
# Replace YOUR_USERNAME and YOUR_PASSWORD with actual credentials

echo "🔐 Step 1: Getting authentication token..."

# Login and get token
LOGIN_RESPONSE=$(curl -s -X POST "https://tigerservers.in/aips/api/login" \
  -F "username=YOUR_USERNAME" \
  -F "password=YOUR_PASSWORD")

echo "Login Response: $LOGIN_RESPONSE"

# Extract token (requires jq - install with: apt-get install jq or brew install jq)
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token. Please check your credentials."
    exit 1
fi

echo "✅ Token received: ${TOKEN:0:20}..."
echo ""
echo "📝 Step 2: Creating homework..."

# Create homework
HOMEWORK_RESPONSE=$(curl -s -X POST "https://tigerservers.in/aips/api/homework/create" \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Homework - $(date +%Y-%m-%d)" \
  -F "class_id=10" \
  -F "section_id=A" \
  -F "submission_date=2026-02-25" \
  -F "status=1" \
  -F "homework_date=$(date +%Y-%m-%d)" \
  -F "teacher_id=1" \
  -F "submission_methods[0]=whatsapp" \
  -F "submission_methods[1]=mobile_app" \
  -F "subject_ids[0]=MATHS" \
  -F "subject_ids[1]=ENGLISH" \
  -F "descriptions[MATHS]=Complete exercises 5.1 to 5.5 from the textbook" \
  -F "descriptions[ENGLISH]=Read Chapter 3 and write a summary")

echo "Homework Response:"
echo "$HOMEWORK_RESPONSE" | jq '.'

# Check if successful
SUCCESS=$(echo $HOMEWORK_RESPONSE | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
    echo ""
    echo "✅ Homework created successfully!"
else
    echo ""
    echo "❌ Failed to create homework. Check the response above."
fi
