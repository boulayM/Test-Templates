$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.e2e"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { continue }
    $parts = $line.Split("=", 2)
    if ($parts.Length -eq 2) {
      [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim())
    }
  }
}

$apiUrl = $env:E2E_API_URL
if (-not $apiUrl) { $apiUrl = "http://localhost:3001/api" }

$defaultApiPath = Join-Path (Split-Path -Parent $projectRoot) "Api-Test"
$apiPath = $env:E2E_API_PATH
if (-not $apiPath) { $apiPath = $defaultApiPath }

Write-Host ("Using API URL: " + $apiUrl)
Write-Host ("Using API path: " + $apiPath)

function Test-TcpPortOpen {
  param(
    [string]$HostName,
    [int]$PortNumber,
    [int]$TimeoutMs = 1200
  )

  $tcpClient = New-Object System.Net.Sockets.TcpClient
  try {
    $asyncConnect = $tcpClient.BeginConnect($HostName, $PortNumber, $null, $null)
    $isConnected = $asyncConnect.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
    if (-not $isConnected) { return $false }
    $tcpClient.EndConnect($asyncConnect)
    return $true
  } catch {
    return $false
  } finally {
    $tcpClient.Close()
  }
}

function Get-HttpStatusCodeSafe {
  param([string]$Url, [int]$TimeoutSec = 5)

  try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $TimeoutSec -UseBasicParsing
    return [int]$response.StatusCode
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      return [int]$_.Exception.Response.StatusCode
    }
    return $null
  }
}

if (-not (Test-Path $apiPath)) {
  Write-Host "Warning: API path not found (seed skipped)"
} else {
  $apiUri = [Uri]$apiUrl
  $retryCount = 6
  $retryDelayMs = 1500
  $isApiReachable = $false

  for ($attemptIndex = 1; $attemptIndex -le $retryCount; $attemptIndex++) {
    $isPortOpen = Test-TcpPortOpen -HostName $apiUri.Host -PortNumber $apiUri.Port
    if ($isPortOpen) {
      $isApiReachable = $true
      break
    }
    Start-Sleep -Milliseconds $retryDelayMs
  }

  if ($isApiReachable) {
    Write-Host ("API reachable (TCP " + $apiUri.Host + ":" + $apiUri.Port + ")")
    $csrfStatusCode = Get-HttpStatusCodeSafe -Url ($apiUrl + "/csrf")
    if ($csrfStatusCode -eq 200) {
      Write-Host "API probe /csrf: 200 OK"
    } elseif ($csrfStatusCode) {
      Write-Host ("API probe /csrf returned status: " + $csrfStatusCode)
    } else {
      Write-Host "API probe /csrf: no HTTP response"
    }
  } else {
    throw ("API not reachable at " + $apiUri.Host + ":" + $apiUri.Port + ". Start API in dev:e2e before running e2e.")
  }

  $seedMode = ([string]$env:E2E_RUN_SEED).Trim().ToLower()
  if (-not $seedMode) { $seedMode = "true" }

  if ($seedMode -eq "true") {
    try {
      Push-Location $apiPath
      Write-Host "Running prisma db seed with .env.e2e..."
      npx dotenv -e .env.e2e -- prisma db seed
    } catch {
      Write-Host "Error: seed failed"
    } finally {
      Pop-Location
    }
  } else {
    Write-Host ("Seed skipped (E2E_RUN_SEED=" + $seedMode + ")")
  }
}
