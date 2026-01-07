$ErrorActionPreference = "Stop"

if (-not $env:LEADERBOARD_URL) {
	Write-Host "ERROR: LEADERBOARD_URL env var missing."
	Write-Host "Example: `$env:LEADERBOARD_URL='https://neonevo.onrender.com'"
	exit 1
}

$base = $env:LEADERBOARD_URL.TrimEnd("/")
$url = "$base/ping"

try {
	$response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 15
	if ($null -ne $response -and $response.ok -eq $true) {
		Write-Host "OK: $url"
		exit 0
	}
	Write-Host "ERROR: Unexpected response from $url"
	$response | ConvertTo-Json -Depth 5 | Write-Host
	exit 2
} catch {
	Write-Host "ERROR: Request failed"
	Write-Host $_.Exception.Message
	exit 3
}
