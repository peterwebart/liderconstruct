# ============================================================================
# LiderConstruct — local PostgreSQL connection doctor (PowerShell)
# Read-only diagnosis. Makes NO changes. Prints no passwords.
# Run from the project root:  .\scripts-db-doctor.ps1
# ============================================================================

Write-Host "`n=== 1. What the app is configured to use ===" -ForegroundColor Cyan
foreach ($f in @(".env.local", ".env", ".env.development", ".env.production")) {
  if (Test-Path $f) {
    $line = Select-String -Path $f -Pattern '^\s*DATABASE_URI=' | Select-Object -First 1
    if ($line) {
      # Parse WITHOUT printing the password.
      $uri = $line.Line -replace '^\s*DATABASE_URI=', '' -replace '^"|"$', ''
      if ($uri -match '^postgres(?:ql)?://([^:]+):[^@]*@([^:/]+):?(\d+)?/(.+)$') {
        Write-Host ("  {0,-22} user={1}  host={2}  port={3}  db={4}" -f $f, $matches[1], $matches[2], ($(if($matches[3]){$matches[3]}else{"5432"})), $matches[4])
      } else {
        Write-Host "  $f : DATABASE_URI present but not a standard URI" -ForegroundColor Yellow
      }
    } else { Write-Host "  $f : no DATABASE_URI" }
  } else { Write-Host "  $f : (absent)" -ForegroundColor DarkGray }
}

Write-Host "`n  Shell override (ALWAYS wins over files):" -ForegroundColor Cyan
if ($env:DATABASE_URI) {
  Write-Host "  !! DATABASE_URI is set in this shell session - it overrides every .env file" -ForegroundColor Red
  if ($env:DATABASE_URI -match '@([^:/]+):?(\d+)?/') { Write-Host ("     -> host={0} port={1}" -f $matches[1], $(if($matches[2]){$matches[2]}else{"5432"})) }
} else { Write-Host "  none (good - files are in effect)" -ForegroundColor Green }

Write-Host "`n=== 2. PostgreSQL containers actually running ===" -ForegroundColor Cyan
docker ps --filter "ancestor=postgres" --format "  {{.Names}}  status={{.Status}}  ports={{.Ports}}"
docker ps --format "{{.Names}}`t{{.Image}}" | Where-Object { $_ -match "postgres" } | ForEach-Object {
  $name = ($_ -split "`t")[0]
  Write-Host "`n  --- $name credentials (as initialised) ---"
  docker exec $name env 2>$null | Select-String "POSTGRES_USER|POSTGRES_DB" | ForEach-Object { Write-Host "    $_" }
  Write-Host "    POSTGRES_PASSWORD = (hidden)"
}

Write-Host "`n=== 3. Which container answers on which port ===" -ForegroundColor Cyan
foreach ($p in @(5432, 5433)) {
  $t = Test-NetConnection -ComputerName localhost -Port $p -WarningAction SilentlyContinue
  if ($t.TcpTestSucceeded) { Write-Host "  port $p : OPEN" -ForegroundColor Green } else { Write-Host "  port $p : closed" -ForegroundColor DarkGray }
}

Write-Host "`n=== 4. Does the app's user exist in the container on 5433? ===" -ForegroundColor Cyan
$c = "liderconstruct-postgres"
docker exec $c psql -U postgres -tAc "SELECT rolname FROM pg_roles WHERE rolname='lider';" 2>$null
if ($LASTEXITCODE -ne 0) {
  docker exec $c psql -U lider -d liderconstruct -tAc "SELECT 'auth-as-lider-OK';" 2>&1 | ForEach-Object { Write-Host "  $_" }
}

Write-Host "`n=== 5. Does that database contain real data? (decides if it is disposable) ===" -ForegroundColor Cyan
docker exec $c psql -U lider -d liderconstruct -tAc "SELECT 'products=' || (SELECT count(*) FROM products) || '  variations=' || (SELECT count(*) FROM variations) || '  users=' || (SELECT count(*) FROM users);" 2>&1 | ForEach-Object { Write-Host "  $_" }

Write-Host "`nDone. Compare section 1 (port the app uses) with sections 2-3 (port each container is on).`n" -ForegroundColor Cyan
