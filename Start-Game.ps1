$ErrorActionPreference = 'Stop'
$gameRoot = $PSScriptRoot
Set-Location -LiteralPath $gameRoot
New-Item -ItemType Directory -Path (Join-Path $gameRoot 'temp') -Force | Out-Null
$prefix = ($gameRoot -replace '\\','/') + '/'
$nginx = Join-Path $gameRoot 'runtime/nginx-1.30.6/nginx.exe'
$node = (Get-Command node.exe -ErrorAction Stop).Source
function Test-LocalPort([int]$port) {
    $client = [Net.Sockets.TcpClient]::new()
    try {
        $connection=$client.ConnectAsync('127.0.0.1',$port)
        if (-not $connection.Wait(500)) { return $false }
        return $client.Connected
    } catch { return $false } finally { $client.Dispose() }
}
$helperPort = Test-LocalPort 18767
if (-not $helperPort) {
    $helper = Start-Process -FilePath $node -ArgumentList ('"' + (Join-Path $gameRoot 'cache-game.cjs') + '"') -WorkingDirectory $gameRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $gameRoot 'logs/helper-out.log') -RedirectStandardError (Join-Path $gameRoot 'logs/helper-error.log') -PassThru
    $helper.Id | Set-Content -LiteralPath (Join-Path $gameRoot 'logs/helper.pid')
}
& $nginx -p $prefix -c nginx.conf -t
if ($LASTEXITCODE -ne 0) { throw 'nginx configuration failed' }
$gamePort = Test-LocalPort 18766
if (-not $gamePort) {
    Start-Process -FilePath $nginx -ArgumentList @('-p',('"'+$prefix+'"'),'-c','nginx.conf') -WorkingDirectory $gameRoot -WindowStyle Hidden
}
Write-Host 'Apple Worm: http://localhost:18766/'
if (-not $env:APPLE_NO_BROWSER) { Start-Process 'http://localhost:18766/' }
