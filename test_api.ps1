$baseUrl = "http://localhost:8152"
$registerUrl = "$baseUrl/users/register"
$verifyUrl = "$baseUrl/auth/verify-otp"
$loginUrl = "$baseUrl/auth/login"
$itemsUrl = "$baseUrl/items"

# Generate a unique email for this run
$randomId = Get-Random -Minimum 1000 -Maximum 99999
$email = "test_user_$randomId@example.com"
$password = "password123"

Write-Host "Running API Integration test with email: $email"

# 1. Register a user
Write-Host "Registering User..."
$registerBody = @{
    email    = $email
    password = $password
    address  = "123 Main St, Bangalore"
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri $registerUrl -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "Registration successful! Waiting 2 seconds for OTP to log..."
    Start-Sleep -Seconds 2
    $tasksDir = "C:\Users\dreamz\.gemini\antigravity-ide\brain\976cf7ea-b129-4a6c-b8aa-d6e6cd68f2ab\.system_generated\tasks"
    $latestLog = Get-ChildItem -Path $tasksDir -Filter "task-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $latestLog) {
        Write-Error "No task log files found in $tasksDir"
        exit
    }
    $logPath = $latestLog.FullName
    Write-Host "Reading OTP from log file: $logPath"
    $logLine = Get-Content -Path $logPath | Select-String -Pattern "OTP Code for $email" | Select-Object -Last 1
    if ($logLine -match "OTP Code for ${email}:\s*(\d+)") {
        $otp = $Matches[1]
        Write-Host "Extracted OTP from logs: $otp"
    } else {
        Write-Error "Failed to extract OTP from logs!"
        exit
    }
}
catch {
    Write-Error "Registration Failed: $_"
    exit
}

# 2. Verify OTP
Write-Host "Verifying OTP..."
$verifyBody = @{
    email = $email
    otp   = $otp.ToString()
} | ConvertTo-Json

try {
    $verifyResponse = Invoke-RestMethod -Uri $verifyUrl -Method Post -Body $verifyBody -ContentType "application/json"
    Write-Host "OTP Verification successful!"
}
catch {
    Write-Error "OTP Verification Failed: $_"
    exit
}

# 3. Login to get token
Write-Host "Logging in..."
$loginBody = @{
    email    = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Got Token: $token"
}
catch {
    Write-Error "Login Failed: $_"
    exit
}

# 4. Access Protected Resource (Items)
Write-Host "Accessing Items..."
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $response = Invoke-RestMethod -Uri $itemsUrl -Method Get -Headers $headers -ContentType "application/json"
    Write-Host "Success! Total elements in page: $($response.content.Count), Total elements overall: $($response.totalElements)"
}
catch {
    Write-Error "Access Failed: $_"
}

