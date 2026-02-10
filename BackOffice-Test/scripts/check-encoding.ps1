$script:hadError = $false

$roots = @(
  (Join-Path $PSScriptRoot "..\src")
)

$extensions = @("*.ts", "*.html", "*.scss", "*.css", "*.js", "*.json")

function Test-Utf8Bom {
  param([byte[]]$bytes)
  if ($bytes.Length -lt 3) { return $false }
  return ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
}

function Is-ValidUtf8 {
  param([byte[]]$bytes)
  try {
    $utf8Strict = [System.Text.UTF8Encoding]::new($false, $true)
    [void]$utf8Strict.GetString($bytes)
    return $true
  }
  catch {
    return $false
  }
}

function Test-Mojibake {
  param([string]$text)
  if ([string]::IsNullOrEmpty($text)) { return $false }

  $replacementChar = [char]0xFFFD
  $c3 = [char]0x00C3
  $c2 = [char]0x00C2

  if ($text.IndexOf($replacementChar) -ge 0) { return $true }

  # Typical UTF-8/Latin1 mojibake signatures, while avoiding many false positives.
  if ($text -match ("{0}[A-Za-z0-9]" -f [Regex]::Escape([string]$c3))) { return $true }
  if ($text -match ("{0}[A-Za-z0-9]" -f [Regex]::Escape([string]$c2))) { return $true }

  return $false
}

foreach ($root in $roots) {
  $rootPath = Resolve-Path $root -ErrorAction SilentlyContinue
  if (-not $rootPath) { continue }

  foreach ($ext in $extensions) {
    Get-ChildItem -Path $rootPath -Recurse -Filter $ext -File | ForEach-Object {
      $bytes = [System.IO.File]::ReadAllBytes($_.FullName)

      if (Test-Utf8Bom -bytes $bytes) {
        Write-Host "Verification failed: BOM found in $($_.FullName)"
        $script:hadError = $true
      }

      if (-not (Is-ValidUtf8 -bytes $bytes)) {
        Write-Host "Verification failed: invalid UTF-8 in $($_.FullName)"
        $script:hadError = $true
        return
      }

      $text = [System.Text.Encoding]::UTF8.GetString($bytes)
      if (Test-Mojibake -text $text) {
        Write-Host "Verification failed: mojibake signature found in $($_.FullName)"
        $script:hadError = $true
      }
    }
  }
}

if ($script:hadError) {
  Write-Host "Verification failed: one or more errors (see above)"
  throw "Encoding check failed"
}
else {
  Write-Host "Verification OK: none"
}