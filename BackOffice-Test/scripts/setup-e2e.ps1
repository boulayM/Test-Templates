$apiUrl = $env:E2E_API_URL
if (-not $apiUrl) { $apiUrl = "http://localhost:3000/api" }

$apiPath = $env:E2E_API_PATH
if (-not $apiPath) { $apiPath = "F:\Marc\Marc\DevWeb\Templates\TESTS\Api-Test" }

Write-Host ("Using API URL: " + $apiUrl)
Write-Host ("Using API path: " + $apiPath)

if (-not (Test-Path $apiPath)) {
  Write-Host "Error: API path not found"
} else {
  try {
    $csrfUrl = $apiUrl + "/csrf"
    $res = Invoke-WebRequest -Uri $csrfUrl -Method Get -TimeoutSec 5
    if ($res.StatusCode -ne 200) {
      Write-Host "Error: API not reachable"
    } else {
      Write-Host "API reachable"
    }
  } catch {
    Write-Host "Error: API not reachable"
  }

  try {
    Push-Location $apiPath
    Write-Host "Running prisma db seed..."
    npx prisma db seed
  } catch {
    Write-Host "Error: seed failed"
  } finally {
    Pop-Location
  }
}