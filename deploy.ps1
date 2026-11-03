# Compila la app y publica dist/ en la rama gh-pages (GitHub Pages).
# Uso: .\deploy.ps1
# Requiere: Node, git y haber hecho `gh auth login` (o credenciales de git guardadas).
# 'Continue': PowerShell 5.1 convierte en error cualquier salida de git por stderr (avisos
# de CRLF, progreso). Se controla el exito con $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
$env:Path = "C:\Program Files\nodejs;" + $env:Path
Set-Location $PSScriptRoot

npm run build
if ($LASTEXITCODE -ne 0) { throw 'Fallo el build' }

$remote = (git remote get-url origin).Trim()
$tmp = Join-Path $env:TEMP ("pages-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  Copy-Item -Path (Join-Path $PSScriptRoot 'dist\*') -Destination $tmp -Recurse
  New-Item -ItemType File -Path (Join-Path $tmp '.nojekyll') | Out-Null
  Push-Location $tmp
  git init -q -b gh-pages
  git add -A 2>$null
  git commit -q -m ("Deploy " + (Get-Date -Format 'yyyy-MM-dd HH:mm'))
  if ($LASTEXITCODE -ne 0) { throw 'Fallo el commit' }
  # schannel: usa los certificados de Windows (esta PC tiene HTTPS interceptado).
  # credential.helper de gh: la credencial guardada de Visual Studio esta vencida.
  git -c http.sslBackend=schannel -c credential.helper= `
      -c "credential.helper=!'C:/Program Files/GitHub CLI/gh.exe' auth git-credential" `
      push -f $remote gh-pages
  if ($LASTEXITCODE -ne 0) { throw 'Fallo el push a gh-pages' }
  Pop-Location
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
Write-Host "Publicado. Puede tardar ~1 minuto en reflejarse."
