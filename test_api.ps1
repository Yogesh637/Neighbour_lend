$baseUrl = "http://localhost:8152"
$registerUrl = "$baseUrl/users/register"
$loginUrl = "$baseUrl/auth/login"
$itemsUrl = "$baseUrl/items"

# 1. Register a user (ignore error if already exists)
Write-Host "Registering User..."
$registerBody = @{
    email    = "test_user_repro@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri $registerUrl -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "Registration response: $regResponse"
}
catch {
    Write-Host "Registration Failed: $_"
    # Proceeding anyway to test login, but this is likely the cause
}

# 2. Login to get token
Write-Host "Logging in..."
$loginBody = @{
    email    = "test_user_repro@example.com"
    password = "password123"
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

# 3. Access Protected Resource (Items)
Write-Host "Accessing Items..."
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $items = Invoke-RestMethod -Uri $itemsUrl -Method Get -Headers $headers -ContentType "application/json"
    Write-Host "Success! Items count: $($items.Count)"
}
catch {
    Write-Error "Access Failed: $_"
}
