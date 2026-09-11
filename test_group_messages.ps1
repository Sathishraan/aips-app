# API Test Script for Group Messages - 3RD Section A
# Replace YOUR_TOKEN_HERE with your actual authentication token

param(
    [Parameter(Mandatory=$false)]
    [string]$Token = "YOUR_TOKEN_HERE"
)

# Configuration
$nodeUrl = "http://tigerservers.in:7001"
$phpUrl = "https://tigerservers.in/aips"
$classId = "3RD"
$sectionId = "Section A"

# Colors for output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "API Testing Script - Group Messages" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# Check if token is provided
if ($Token -eq "YOUR_TOKEN_HERE") {
    Write-Error "ERROR: Please provide a valid token!"
    Write-Info "Usage: .\test_group_messages.ps1 -Token 'YOUR_ACTUAL_TOKEN'"
    Write-Info "`nTo get a token, log into the app and check the console logs for:"
    Write-Info "🔑 [nodeApi] Token attached: YOUR_TOKEN..."
    exit 1
}

Write-Info "Token: $($Token.Substring(0, [Math]::Min(30, $Token.Length)))..."
Write-Info "Class: $classId"
Write-Info "Section: $sectionId`n"

# Prepare headers
$headers = @{
    "Authorization" = "Bearer $Token"
    "X-Authorization" = "Bearer $Token"
    "auth" = $Token
    "Accept" = "application/json"
    "Content-Type" = "application/json"
}

# Test 1: Get Group Messages
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Test 1: Get Group Messages" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Info "Endpoint: $nodeUrl/api/communication/getGroupMessages"
Write-Info "Params: classId=$classId, sectionId=$sectionId`n"

try {
    $url = "$nodeUrl/api/communication/getGroupMessages?classId=$classId&sectionId=$sectionId"
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -ErrorAction Stop
    
    Write-Success "✅ SUCCESS! Response received:`n"
    
    if ($response.data) {
        $messageCount = $response.data.Count
        Write-Success "Found $messageCount message(s)`n"
        
        if ($messageCount -gt 0) {
            Write-Info "Sample message:"
            $response.data[0] | Format-List
        } else {
            Write-Info "No messages found for this class/section."
        }
    } else {
        Write-Info "Response:"
        $response | ConvertTo-Json -Depth 10
    }
} catch {
    Write-Error "❌ FAILED!"
    Write-Error "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Error "Error: $($_.Exception.Message)"
    
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Info "`nPossible causes:"
        Write-Info "- Token is invalid or expired"
        Write-Info "- Token format is incorrect"
        Write-Info "- Server secret key mismatch"
        Write-Info "`nSolution: Get a fresh token by logging in again"
    }
}

# Test 2: Get Students List
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Test 2: Get Students List" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Info "Endpoint: $phpUrl/api/communication/students/$classId/$sectionId`n"

try {
    $url = "$phpUrl/api/communication/students/$classId/$sectionId"
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -ErrorAction Stop
    
    Write-Success "✅ SUCCESS! Response received:`n"
    
    if ($response.data) {
        $studentCount = $response.data.Count
        Write-Success "Found $studentCount student(s)`n"
        
        if ($studentCount -gt 0) {
            Write-Info "Sample student:"
            $response.data[0] | Format-List
        } else {
            Write-Info "No students found for this class/section."
        }
    } else {
        Write-Info "Response:"
        $response | ConvertTo-Json -Depth 10
    }
} catch {
    Write-Error "❌ FAILED!"
    Write-Error "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Error "Error: $($_.Exception.Message)"
    
    if ($_.Exception.Response.StatusCode.value__ -eq 500) {
        Write-Info "`nPossible causes:"
        Write-Info "- Endpoint doesn't exist on the server"
        Write-Info "- Database query error"
        Write-Info "- Server configuration issue"
        Write-Info "`nSolution: Check BACKEND_API_FIX_REQUIRED.md for implementation guide"
    }
}

# Test 3: Verify Server is Running
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Test 3: Server Health Check" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Write-Info "Checking Node.js server at $nodeUrl`n"
try {
    $response = Invoke-WebRequest -Uri $nodeUrl -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Success "✅ Node.js server is running (Port 7001)"
} catch {
    Write-Error "❌ Node.js server is not responding"
    Write-Info "Make sure the server is running on port 7001"
}

Write-Info "`nChecking PHP server at $phpUrl`n"
try {
    $response = Invoke-WebRequest -Uri $phpUrl -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Success "✅ PHP server is running"
} catch {
    Write-Error "❌ PHP server is not responding"
}

# Summary
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Test Summary" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Info "Class: $classId"
Write-Info "Section: $sectionId"
Write-Info "Node.js URL: $nodeUrl"
Write-Info "PHP URL: $phpUrl"
Write-Host "`nTests complete!`n" -ForegroundColor Green
