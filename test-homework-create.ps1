# Homework Create API - PowerShell Test Script
# Replace YOUR_USERNAME and YOUR_PASSWORD with actual credentials

Write-Host "🔐 Step 1: Getting authentication token..." -ForegroundColor Cyan

# Login and get token
$loginBody = @{
    username = "YOUR_USERNAME"
    password = "YOUR_PASSWORD"
}

try {
    $loginResponse = Invoke-RestMethod -Uri "https://tigerservers.in/aips/api/login" -Method POST -Form $loginBody
    $token = $loginResponse.token
    
    if (-not $token) {
        Write-Host "❌ Failed to get token. Please check your credentials." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Token received: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Step 2: Creating homework..." -ForegroundColor Cyan
    
    # Create homework
    $homeworkBody = @{
        title                   = "Test Homework - $(Get-Date -Format 'yyyy-MM-dd')"
        class_id                = "10"
        section_id              = "A"
        submission_date         = "2026-02-25"
        status                  = "1"
        homework_date           = Get-Date -Format "yyyy-MM-dd"
        teacher_id              = "1"
        "submission_methods[0]" = "whatsapp"
        "submission_methods[1]" = "mobile_app"
        "subject_ids[0]"        = "MATHS"
        "subject_ids[1]"        = "ENGLISH"
        "descriptions[MATHS]"   = "Complete exercises 5.1 to 5.5 from the textbook"
        "descriptions[ENGLISH]" = "Read Chapter 3 and write a summary"
    }
    
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $homeworkResponse = Invoke-RestMethod -Uri "https://tigerservers.in/aips/api/homework/create" `
        -Method POST `
        -Headers $headers `
        -Form $homeworkBody
    
    Write-Host "Homework Response:" -ForegroundColor Yellow
    $homeworkResponse | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($homeworkResponse.success -eq $true) {
        Write-Host ""
        Write-Host "✅ Homework created successfully!" -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "❌ Failed to create homework. Check the response above." -ForegroundColor Red
    }
    
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response
}
