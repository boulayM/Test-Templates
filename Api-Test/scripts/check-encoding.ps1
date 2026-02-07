$hadError = $false

$roots = @(
  (Join-Path $PSScriptRoot "..\src")
)

$extensions = @("*.ts","*.html","*.scss","*.css","*.js","*.json")

function Has-Utf8Bom {
  param([byte[]]$bytes)
  if ($bytes.Length -lt 3) { return $false }
  return ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
}

function Has-Mojibake {
  param([string]$text)
  # Detect common UTF-8-as-Latin1 artifacts using Unicode escapes (ASCII-safe).
  if ($text -match "\u00C3[\u0080-\u00BF]") { return $true }
  if ($text -match "\uFFFD") { return $true }
  return $false
}

foreach ($root in $roots) {
  $rootPath = Resolve-Path $root -ErrorAction SilentlyContinue
  if (-not $rootPath) { continue }

  foreach ($ext in $extensions) {
    Get-ChildItem -Path $rootPath -Recurse -Filter $ext -File | ForEach-Object {
      $bytes = [System.IO.File]::ReadAllBytes($_.FullName)

      if (Has-Utf8Bom -bytes $bytes) {
        Write-Host ("Verification failed: BOM found in " + $_.FullName)
        $hadError = $true
      }

      $text = [System.Text.Encoding]::UTF8.GetString($bytes)
      if (Has-Mojibake -text $text) {
        Write-Host ("Verification failed: mojibake pattern found in " + $_.FullName)
        $hadError = $true
      }
    }
  }
}

if ($hadError) {
  Write-Host "Verification failed: one or more errors (see above)"
  throw "Encoding check failed"
} else {
  Write-Host "Verification failed: none"
}