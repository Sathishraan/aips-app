#!/bin/bash

# API Test Script for Group Messages - 3RD Section A
# Usage: ./test_group_messages.sh YOUR_TOKEN_HERE

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NODE_URL="http://tigerservers.in:7001"
PHP_URL="https://tigerservers.in/aips"
CLASS_ID="3RD"
SECTION_ID="Section A"
SECTION_ENCODED="Section%20A"

# Check if token is provided
if [ -z "$1" ]; then
    echo -e "${RED}ERROR: Please provide a token!${NC}"
    echo -e "${CYAN}Usage: ./test_group_messages.sh YOUR_TOKEN${NC}"
    echo -e "${CYAN}To get a token, log into the app and check the console logs for:${NC}"
    echo -e "${CYAN}🔑 [nodeApi] Token attached: YOUR_TOKEN...${NC}"
    exit 1
fi

TOKEN="$1"

echo -e "\n${YELLOW}========================================"
echo -e "API Testing Script - Group Messages"
echo -e "========================================${NC}\n"

echo -e "${CYAN}Token: ${TOKEN:0:30}...${NC}"
echo -e "${CYAN}Class: $CLASS_ID${NC}"
echo -e "${CYAN}Section: $SECTION_ID${NC}\n"

# Test 1: Get Group Messages
echo -e "${YELLOW}========================================"
echo -e "Test 1: Get Group Messages"
echo -e "========================================${NC}"
echo -e "${CYAN}Endpoint: $NODE_URL/api/communication/getGroupMessages${NC}"
echo -e "${CYAN}Params: classId=$CLASS_ID, sectionId=$SECTION_ID${NC}\n"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$NODE_URL/api/communication/getGroupMessages?classId=$CLASS_ID&sectionId=$SECTION_ENCODED" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Authorization: Bearer $TOKEN" \
  -H "auth: $TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ SUCCESS! (HTTP $HTTP_CODE)${NC}\n"
    echo -e "${CYAN}Response:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ FAILED! (HTTP $HTTP_CODE)${NC}\n"
    echo -e "${RED}Response:${NC}"
    echo "$BODY"
    
    if [ "$HTTP_CODE" -eq 401 ]; then
        echo -e "\n${CYAN}Possible causes:${NC}"
        echo -e "${CYAN}- Token is invalid or expired${NC}"
        echo -e "${CYAN}- Token format is incorrect${NC}"
        echo -e "${CYAN}- Server secret key mismatch${NC}"
        echo -e "\n${CYAN}Solution: Get a fresh token by logging in again${NC}"
    fi
fi

# Test 2: Get Students List
echo -e "\n${YELLOW}========================================"
echo -e "Test 2: Get Students List"
echo -e "========================================${NC}"
echo -e "${CYAN}Endpoint: $PHP_URL/api/communication/students/$CLASS_ID/$SECTION_ID${NC}\n"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$PHP_URL/api/communication/students/$CLASS_ID/$SECTION_ENCODED" \
  -H "Authorization: Bearer $TOKEN" \
  -H "auth: $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ SUCCESS! (HTTP $HTTP_CODE)${NC}\n"
    echo -e "${CYAN}Response:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ FAILED! (HTTP $HTTP_CODE)${NC}\n"
    echo -e "${RED}Response:${NC}"
    echo "$BODY"
    
    if [ "$HTTP_CODE" -eq 500 ]; then
        echo -e "\n${CYAN}Possible causes:${NC}"
        echo -e "${CYAN}- Endpoint doesn't exist on the server${NC}"
        echo -e "${CYAN}- Database query error${NC}"
        echo -e "${CYAN}- Server configuration issue${NC}"
        echo -e "\n${CYAN}Solution: Check BACKEND_API_FIX_REQUIRED.md${NC}"
    fi
fi

# Test 3: Server Health Check
echo -e "\n${YELLOW}========================================"
echo -e "Test 3: Server Health Check"
echo -e "========================================${NC}"

echo -e "${CYAN}Checking Node.js server at $NODE_URL${NC}\n"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$NODE_URL")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${GREEN}✅ Node.js server is running (Port 7001)${NC}"
else
    echo -e "${RED}❌ Node.js server is not responding${NC}"
fi

echo -e "\n${CYAN}Checking PHP server at $PHP_URL${NC}\n"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PHP_URL")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 302 ]; then
    echo -e "${GREEN}✅ PHP server is running${NC}"
else
    echo -e "${RED}❌ PHP server is not responding${NC}"
fi

# Summary
echo -e "\n${YELLOW}========================================"
echo -e "Test Summary"
echo -e "========================================${NC}"
echo -e "${CYAN}Class: $CLASS_ID${NC}"
echo -e "${CYAN}Section: $SECTION_ID${NC}"
echo -e "${CYAN}Node.js URL: $NODE_URL${NC}"
echo -e "${CYAN}PHP URL: $PHP_URL${NC}"
echo -e "\n${GREEN}Tests complete!${NC}\n"
