# Send Group Message Test Script
# Sends "Hello guys" to 3RD Section A

param(
    [Parameter(Mandatory = $false)]
    [string]$Token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NzEyMjcwMTcsImRhdGEiOnsidXNlcl9pZCI6IjMyMyIsIm1hcElkIjoiMTMiLCJ1c2VybmFtZSI6IkVNUDAwMSIsImFjZWRlbWljX3lyIjoiMjAyNC0yMDI1IiwiZW1haWwiOm51bGwsInVzZXJfdHlwZSI6IjEiLCJsb2dnZWRfaW4iOnRydWV9fQ.OkSjwCXwx5ICqrxa-TtbCRxBVDJGG_2pBVXlgS42pbA",
    
    [Parameter(Mandatory = $false)]
    [string]$Message = "Hello guys",
    
    [Parameter(Mandatory = $false)]
    [string]$ClassId = "3RD",
    
    [Parameter(Mandatory = $false)]
    [string]$SectionId = "Section A"
)

# Configuration
$nodeUrl = "http://tigerservers.in:7001"

# Colors
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Send Group Message Test" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# Check if token is provided
if ($Token -eq "YOUR_TOKEN_HERE") {
    Write-Error "ERROR: Please provide a valid token!"
    Write-Info "Usage: .\send_group_message.ps1 -Token 'YOUR_TOKEN' -Message 'Hello guys'"
    Write-Info "`nTo get a token, log into the app and check the console logs"
    exit 1
}

Write-Info "Token: $($Token.Substring(0, [Math]::Min(30, $Token.Length)))..."
Write-Info "Message: $Message"
Write-Info "Class: $ClassId"
Write-Info "Section: $SectionId`n"

# Prepare headers
$headers = @{
    "Authorization"   = "Bearer $Token"
    "X-Authorization" = "Bearer $Token"
    "auth"            = $Token
    "Accept"          = "application/json"
    "Content-Type"    = "application/json"
}

# Prepare message payload
$body = @{
    message    = $Message
    type       = "group"
    class_id   = $ClassId
    section_id = $SectionId
    token      = $Token
    auth       = $Token
} | ConvertTo-Json

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Sending Message to Group" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Info "Endpoint: $nodeUrl/api/communication/sendMessage"
Write-Info "Method: POST`n"

Write-Info "Payload:"
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $url = "$nodeUrl/api/communication/sendMessage"
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Post -Body $body -ErrorAction Stop
    
    Write-Success "✅ MESSAGE SENT SUCCESSFULLY!`n"
    
    Write-Info "Response:"
    $response | ConvertTo-Json -Depth 10
    
    Write-Host "`n" -NoNewline
    Write-Success "Message '$Message' has been sent to class $ClassId section $SectionId"
    
}
catch {
    Write-Error "❌ FAILED TO SEND MESSAGE!"
    Write-Error "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Error "Error: $($_.Exception.Message)"
    
    if ($_.ErrorDetails.Message) {
        Write-Error "Details: $($_.ErrorDetails.Message)"
    }
    
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 401) {
        Write-Info "`nPossible causes:"
        Write-Info "- Token is invalid or expired"
        Write-Info "- Token format is incorrect"
        Write-Info "`nSolution: Get a fresh token by logging in again"
    }
    elseif ($statusCode -eq 400) {
        Write-Info "`nPossible causes:"
        Write-Info "- Missing required fields (message, class_id, section_id)"
        Write-Info "- Invalid data format"
        Write-Info "`nSolution: Check the payload format"
    }
    elseif ($statusCode -eq 500) {
        Write-Info "`nPossible causes:"
        Write-Info "- Server error"
        Write-Info "- Database connection issue"
        Write-Info "`nSolution: Check server logs"
    }
}

# Verify message was sent by fetching group messages
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Verifying Message Delivery" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Info "Fetching recent messages...`n"

try {
    $url = "$nodeUrl/api/communication/getGroupMessages?classId=$ClassId&sectionId=$SectionId"
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -ErrorAction Stop
    
    if ($response.data) {
        $messages = $response.data
        $recentMessage = $messages | Where-Object { $_.message -eq $Message } | Select-Object -First 1
        
        if ($recentMessage) {
            Write-Success "✅ Message verified in group chat!`n"
            Write-Info "Message details:"
            $recentMessage | Format-List
        }
        else {
            Write-Info "Message sent but not found in recent messages (may take a moment to sync)"
        }
        
        Write-Info "Total messages in group: $($messages.Count)"
    }
}
catch {
    Write-Error "Could not verify message delivery"
    Write-Info "This doesn't mean the message failed - check the app to confirm"
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Test Complete" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow
