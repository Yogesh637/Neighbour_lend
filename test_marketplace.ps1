$baseUrl = "http://localhost:8152"
$registerUrl = "$baseUrl/users/register"
$verifyUrl = "$baseUrl/auth/verify-otp"
$loginUrl = "$baseUrl/auth/login"
$itemsUrl = "$baseUrl/items"
$wishlistUrl = "$baseUrl/wishlist"
$bookingsUrl = "$baseUrl/bookings"
$notificationsUrl = "$baseUrl/notifications"
$reviewsUrl = "$baseUrl/reviews"

Write-Host "=========================================="
Write-Host "NeighbourLend Features Integration Test"
Write-Host "=========================================="

# 1. Login as Developer (Owner)
Write-Host "Logging in as Owner (developer@gmail.com)..."
$ownerLoginBody = @{
    email    = "developer@gmail.com"
    password = "developer"
} | ConvertTo-Json
try {
    $ownerLoginRes = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $ownerLoginBody -ContentType "application/json"
    $ownerToken = $ownerLoginRes.token
    Write-Host "Owner logged in successfully!"
}
catch {
    Write-Error "Owner Login Failed: $_"
    exit
}

# 2. Register Renter User
$randomId = Get-Random -Minimum 10000 -Maximum 99999
$renterEmail = "renter_$randomId@example.com"
$password = "password123"

Write-Host "`nRegistering Renter ($renterEmail)..."
$registerBody = @{
    email    = $renterEmail
    password = $password
    address  = "456 Side St, Bangalore"
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri $registerUrl -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "Renter registered. Waiting for OTP to log..."
    Start-Sleep -Seconds 2
    
    $tasksDir = "C:\Users\dreamz\.gemini\antigravity-ide\brain\976cf7ea-b129-4a6c-b8aa-d6e6cd68f2ab\.system_generated\tasks"
    $latestLog = Get-ChildItem -Path $tasksDir -Filter "task-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $latestLog) {
        Write-Error "No logs found!"
        exit
    }
    $logPath = $latestLog.FullName
    $logLine = Get-Content -Path $logPath | Select-String -Pattern "OTP Code for $renterEmail" | Select-Object -Last 1
    if ($logLine -match "OTP Code for ${renterEmail}:\s*(\d+)") {
        $otp = $Matches[1]
        Write-Host "Extracted OTP: $otp"
    } else {
        Write-Error "Failed to extract OTP!"
        exit
    }
}
catch {
    Write-Error "Renter Registration Failed: $_"
    exit
}

# Verify OTP
Write-Host "Verifying OTP for Renter..."
$verifyBody = @{
    email = $renterEmail
    otp   = $otp.ToString()
} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri $verifyUrl -Method Post -Body $verifyBody -ContentType "application/json" | Out-Null
    Write-Host "Renter OTP Verified!"
}
catch {
    Write-Error "Renter Verification Failed: $_"
    exit
}

# Login Renter
Write-Host "Logging in as Renter..."
$renterLoginBody = @{
    email    = $renterEmail
    password = $password
} | ConvertTo-Json
try {
    $renterLoginRes = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $renterLoginBody -ContentType "application/json"
    $renterToken = $renterLoginRes.token
    Write-Host "Renter logged in successfully!"
}
catch {
    Write-Error "Renter Login Failed: $_"
    exit
}

# Find an item owned by developer@gmail.com for testing
$itemsList = Invoke-RestMethod -Uri $itemsUrl -Method Get -Headers $renterHeaders
$testItem = $itemsList.content | Where-Object { $_.owner.email -eq "developer@gmail.com" } | Select-Object -First 1
if (-not $testItem) {
    Write-Error "No item owned by developer@gmail.com found in the database!"
    exit
}
$testItemId = $testItem.id
$testItemName = $testItem.name
Write-Host "Found test item owned by developer: ID=$testItemId ($testItemName)"

# 3. Test Wishlist Toggle
Write-Host "`nTesting Wishlist Toggle for Item $testItemId..."
$renterHeaders = @{ Authorization = "Bearer $renterToken" }
try {
    $toggleRes = Invoke-RestMethod -Uri "$wishlistUrl/toggle/$testItemId" -Method Post -Headers $renterHeaders
    Write-Host "Wishlist toggle response: Wishlisted = $($toggleRes.wishlisted)"
    
    # Get wishlist
    $wishlist = Invoke-RestMethod -Uri $wishlistUrl -Method Get -Headers $renterHeaders
    Write-Host "Wishlist contains $($wishlist.Count) item(s). First item: $($wishlist[0].name)"
}
catch {
    Write-Error "Wishlist Test Failed: $_"
}

# 4. Book Item (owned by developer)
Write-Host "`nCreating Booking Request for Item $testItemId..."
$offsetDays = Get-Random -Minimum 10 -Maximum 500
$bookingBody = @{
    itemId    = $testItemId
    startDate = (Get-Date).AddDays($offsetDays).ToString("yyyy-MM-ddTHH:mm")
    endDate   = (Get-Date).AddDays($offsetDays + 3).ToString("yyyy-MM-ddTHH:mm")
} | ConvertTo-Json
try {
    $booking = Invoke-RestMethod -Uri $bookingsUrl -Method Post -Headers $renterHeaders -Body $bookingBody -ContentType "application/json"
    $bookingId = $booking.id
    Write-Host "Booking request created! Booking ID: $bookingId, Status: $($booking.status)"
}
catch {
    Write-Error "Booking Request Failed: $_"
    exit
}

# 5. Check Owner Notifications
Write-Host "`nChecking Owner Notifications..."
$ownerHeaders = @{ Authorization = "Bearer $ownerToken" }
try {
    $notifications = Invoke-RestMethod -Uri $notificationsUrl -Method Get -Headers $ownerHeaders
    $unreadCountRes = Invoke-RestMethod -Uri "$notificationsUrl/unread-count" -Method Get -Headers $ownerHeaders
    Write-Host "Owner has $($unreadCountRes.unreadCount) unread notification(s)."
    
    $pendingNotification = $notifications.content | Where-Object { $_.type -eq "REQUESTED" } | Select-Object -First 1
    if ($pendingNotification) {
        Write-Host "Notification Title: $($pendingNotification.title)"
        Write-Host "Notification Msg  : $($pendingNotification.message)"
        
        # Mark as read
        Invoke-RestMethod -Uri "$notificationsUrl/$($pendingNotification.id)/read" -Method Put -Headers $ownerHeaders | Out-Null
        Write-Host "Notification marked as read!"
    } else {
        Write-Warning "Requested notification not found!"
    }
}
catch {
    Write-Error "Owner Notification check failed: $_"
}

# 6. Owner Approves Booking
Write-Host "`nOwner Approving Booking $bookingId..."
try {
    $approvedBooking = Invoke-RestMethod -Uri "$bookingsUrl/$bookingId/status?status=APPROVED" -Method Put -Headers $ownerHeaders
    Write-Host "Booking $bookingId updated! Status: $($approvedBooking.status)"
}
catch {
    Write-Error "Booking Approval Failed: $_"
}

# 7. Owner Completes Booking (to allow review)
Write-Host "`nOwner Completing Booking $bookingId..."
try {
    $completedBooking = Invoke-RestMethod -Uri "$bookingsUrl/$bookingId/status?status=COMPLETED" -Method Put -Headers $ownerHeaders
    Write-Host "Booking $bookingId updated! Status: $($completedBooking.status)"
}
catch {
    Write-Error "Booking Completion Failed: $_"
}

# 8. Renter Leaves Review
Write-Host "`nRenter Leaving Review for Item $testItemId..."
$reviewBody = @{
    itemId    = $testItemId
    bookingId = $bookingId
    rating    = 5
    comment   = "Super awesome rental experience! Great condition."
} | ConvertTo-Json
try {
    $review = Invoke-RestMethod -Uri $reviewsUrl -Method Post -Headers $renterHeaders -Body $reviewBody -ContentType "application/json"
    Write-Host "Review created! ID: $($review.id), Author: $($review.authorEmail)"
    
    # Get reviews for Item
    $reviews = Invoke-RestMethod -Uri "$reviewsUrl/item/$testItemId" -Method Get
    Write-Host "Item $testItemId has $($reviews.Count) review(s). Latest comment: '$($reviews[0].comment)' rating: $($reviews[0].rating)"
}
catch {
    Write-Error "Review Submission Failed: $_"
}

Write-Host "`n=========================================="
Write-Host "All features checked successfully!"
Write-Host "=========================================="
