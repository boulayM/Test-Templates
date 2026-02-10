param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("dev", "test", "e2e")]
  [string]$Target
)

$scriptRootPath = Split-Path -Parent $PSScriptRoot

$envFile = switch ($Target) {
  "dev" {
    if (Test-Path (Join-Path $scriptRootPath ".env.dev")) { ".env.dev" } else { ".env" }
  }
  "test" { ".env.test" }
  "e2e" { ".env.e2e" }
}

$envPath = Join-Path $scriptRootPath $envFile
if (-not (Test-Path $envPath)) {
  throw "[preflight] Missing env file: $envPath"
}

$content = Get-Content -Path $envPath -Raw
$match = [regex]::Match($content, "(?m)^DATABASE_URL\s*=\s*(.+)$")
if (-not $match.Success) {
  throw "[preflight] DATABASE_URL not found in $envFile"
}

$dbUrl = $match.Groups[1].Value.Trim().Trim('"')
$dbUrlLower = $dbUrl.ToLowerInvariant()

Write-Host ("[preflight] target=" + $Target + " env=" + $envFile)
Write-Host ("[preflight] DATABASE_URL=" + $dbUrl)

$looksLikeDev =
  $dbUrlLower.Contains("mirror-api") -or
  $dbUrlLower.Contains("dev-api") -or
  $dbUrlLower.Contains("localhost:5432/postgres")

$looksLikeTest =
  $dbUrlLower.Contains("test") -or
  $dbUrlLower.Contains("_test") -or
  $dbUrlLower.Contains("test-api")

if ($Target -eq "test" -or $Target -eq "e2e") {
  if ($looksLikeDev -and -not $looksLikeTest) {
    throw "[preflight] Refusing: " + $Target + " target points to dev-like DB"
  }
}

if ($Target -eq "dev") {
  Write-Host "[preflight] Warning: dev target selected. Destructive commands must be intentional."
}

Write-Host "[preflight] OK"