#!/bin/bash

# Send Group Message Test Script
# Sends "Hello guys" to 3RD Section A
# Usage: ./send_group_message.sh YOUR_TOKEN "Hello guys"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Configuration
NODE_URL="http://tigerservers.in:7001"
CLASS_ID="3RD"
SECTION_ID="Section A"
MESSAGE="${2:-Hello guys}"

# Check if token is provided
if [ -z "$1" ]; then
    echo -e "${RED}ERROR: Please provide a token!${NC}"
    echo -e "${CYAN}Usage: ./send_group_message.sh YOUR_TOKEN \"Your message\"${NC}"
    echo -e "${CYAN}Example: ./send_group_message.sh \"eyJhbG...\" \"Hello guys\"${NC}"
    exit 1
fi

TOKEN="$1"

echo -e "\n${YELLOW}========================================"
echo -e "Send Group Message Test"
echo -e "========================================${NC}\n"

echo -e "${CYAN}Token: ${TOKEN:0:30}...${NC}"
echo -e "${CYAN}Message: $MESSAGE${NC}"
echo -e "${CYAN}Class: $CLASS_ID${NC}"
echo -e "${CYAN}Section: $SECTION_ID${NC}\n"

# Prepare JSON payload
PAYLOAD=$(cat <<EOF
{
  "message": "$MESSAGE",
  "type": "group",
  "class_id": "$CLASS_ID",
  "section_id": "$SECTION_ID",
  "token": "$TOKEN",
  "auth": "$TOKEN"
}
EOF
)

echo -e "${YELLOW}========================================"
echo -e "Sending Message to Group"
echo -e "========================================${NC}"
echo -e "${CYAN}Endpoint: $NODE_URL/api/communication/sendMessage${NC}"
echo -e "${CYAN}Method: POST${NC}\n"

echo -e "${CYAN}Payload:${NC}"
echo -e "${GRAY}$PAYLOAD${NC}\n"

# Send message
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$NODE_URL/api/communication/sendMessage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Authorization: Bearer $TOKEN" \
  -H "auth: $TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✅ MESSAGE SENT SUCCESSFULLY! (HTTP $HTTP_CODE)${NC}\n"
    echo -e "${CYAN}Response:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo -e "\n${GREEN}Message '$MESSAGE' has been sent to class $CLASS_ID section $SECTION_ID${NC}"
else
    echo -e "${RED}❌ FAILED TO SEND MESSAGE! (HTTP $HTTP_CODE)${NC}\n"
    echo -e "${RED}Response:${NC}"
    echo "$BODY"
    
    if [ "$HTTP_CODE" -eq 401 ]; then
        echo -e "\n${CYAN}Possible causes:${NC}"
        echo -e "${CYAN}- Token is invalid or expired${NC}"
        echo -e "${CYAN}- Token format is incorrect${NC}"
        echo -e "\n${CYAN}Solution: Get a fresh token by logging in again${NC}"
    elif [ "$HTTP_CODE" -eq 400 ]; then
        echo -e "\n${CYAN}Possible causes:${NC}"
        echo -e "${CYAN}- Missing required fields${NC}"
        echo -e "${CYAN}- Invalid data format${NC}"
        echo -e "\n${CYAN}Solution: Check the payload format${NC}"
    elif [ "$HTTP_CODE" -eq 500 ]; then
        echo -e "\n${CYAN}Possible causes:${NC}"
        echo -e "${CYAN}- Server error${NC}"
        echo -e "${CYAN}- Database connection issue${NC}"
        echo -e "\n${CYAN}Solution: Check server logs${NC}"
    fi
fi

# Verify message delivery
echo -e "\n${YELLOW}========================================"
echo -e "Verifying Message Delivery"
echo -e "========================================${NC}"
echo -e "${CYAN}Fetching recent messages...${NC}\n"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$NODE_URL/api/communication/getGroupMessages?classId=$CLASS_ID&sectionId=$SECTION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "auth: $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Messages retrieved successfully${NC}\n"
    
    # Check if our message is in the response
    if echo "$BODY" | grep -q "$MESSAGE"; then
        echo -e "${GREEN}✅ Message verified in group chat!${NC}\n"
    else
        echo -e "${CYAN}Message sent but not found in recent messages (may take a moment to sync)${NC}\n"
    fi
    
    # Show message count
    MESSAGE_COUNT=$(echo "$BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "unknown")
    echo -e "${CYAN}Total messages in group: $MESSAGE_COUNT${NC}"
    
    # Show recent messages
    echo -e "\n${CYAN}Recent messages:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}Could not verify message delivery${NC}"
    echo -e "${CYAN}This doesn't mean the message failed - check the app to confirm${NC}"
fi

echo -e "\n${YELLOW}========================================"
echo -e "Test Complete"
echo -e "========================================${NC}\n"
