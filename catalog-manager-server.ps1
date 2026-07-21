param(
  [switch]$NoBrowser,
  [int]$Port = 8765
)

$ErrorActionPreference = "Stop"
$storeRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$rootPrefix = $storeRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$listener = $null

function Get-ContentType([string]$path) {
  switch ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".css"  { "text/css; charset=utf-8" }
    ".js"   { "text/javascript; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    ".png"  { "image/png" }
    ".jpg"  { "image/jpeg" }
    ".jpeg" { "image/jpeg" }
    ".svg"  { "image/svg+xml" }
    ".ico"  { "image/x-icon" }
    ".mp3"  { "audio/mpeg" }
    ".gltf" { "model/gltf+json" }
    ".glb"  { "model/gltf-binary" }
    ".bin"  { "application/octet-stream" }
    default  { "application/octet-stream" }
  }
}

function Send-Response($stream, [int]$status, [string]$reason, [byte[]]$body, [string]$contentType, [bool]$headOnly) {
  $header = "HTTP/1.1 $status $reason`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store, max-age=0`r`nConnection: close`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  if (-not $headOnly -and $body.Length -gt 0) {
    $stream.Write($body, 0, $body.Length)
  }
  $stream.Flush()
}

try {
  $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
  $listener.Start()
  $managerUrl = "http://127.0.0.1:$Port/catalog-manager.html"

  Write-Host ""
  Write-Host "  DECANT DYNASTY CATALOG MANAGER" -ForegroundColor Yellow
  Write-Host "  Local owner session: $managerUrl" -ForegroundColor DarkGray
  Write-Host ""
  Write-Host "  Keep this window open while editing." -ForegroundColor White
  Write-Host "  Press Ctrl+C or close this window when finished." -ForegroundColor DarkGray
  Write-Host ""

  if (-not $NoBrowser) {
    Start-Process $managerUrl
  }

  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = 5000
      $stream = $client.GetStream()
      $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }

      do { $line = $reader.ReadLine() } while ($null -ne $line -and $line.Length -gt 0)
      $requestParts = $requestLine.Split(" ")
      if ($requestParts.Length -lt 2 -or $requestParts[0] -notin @("GET", "HEAD")) {
        Send-Response $stream 405 "Method Not Allowed" ([Text.Encoding]::UTF8.GetBytes("Method not allowed")) "text/plain; charset=utf-8" $false
        continue
      }

      $requestUri = [Uri]("http://127.0.0.1" + $requestParts[1])
      $relativePath = [Uri]::UnescapeDataString($requestUri.AbsolutePath).TrimStart("/").Replace("/", [IO.Path]::DirectorySeparatorChar)
      if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = "catalog-manager.html" }
      $targetPath = [IO.Path]::GetFullPath((Join-Path $storeRoot $relativePath))

      if (-not $targetPath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase) -or -not [IO.File]::Exists($targetPath)) {
        Send-Response $stream 404 "Not Found" ([Text.Encoding]::UTF8.GetBytes("Not found")) "text/plain; charset=utf-8" ($requestParts[0] -eq "HEAD")
        continue
      }

      $body = [IO.File]::ReadAllBytes($targetPath)
      Send-Response $stream 200 "OK" $body (Get-ContentType $targetPath) ($requestParts[0] -eq "HEAD")
    } catch {
      Write-Host "  Request error: $($_.Exception.Message)" -ForegroundColor DarkYellow
    } finally {
      if ($reader) { $reader.Dispose() }
      if ($stream) { $stream.Dispose() }
      $client.Dispose()
    }
  }
} catch {
  Write-Host ""
  Write-Host "  Could not start the local Catalog Manager." -ForegroundColor Red
  Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
  Write-Host ""
  exit 1
} finally {
  if ($listener) { $listener.Stop() }
}
