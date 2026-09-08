param()
$deadline = (Get-Date).AddSeconds(150)
$ok = $false
while ((Get-Date) -lt $deadline) {
  try {
    $null = Invoke-WebRequest -Uri 'http://127.0.0.1:3100/login' -UseBasicParsing -TimeoutSec 10
    $ok = $true; break
  } catch {
    $code = $null
    try { $code = [int]$_.Exception.Response.StatusCode } catch {}
    if ($code -eq 401 -or $code -eq 200 -or $code -eq 307) { $ok = $true; break }
    Start-Sleep -Seconds 3
  }
}
Write-Output ("SERVER_UP=" + $ok)
