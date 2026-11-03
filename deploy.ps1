# Compila la app y publica dist/ en la rama gh-pages (GitHub Pages).
# Uso: .\deploy.ps1
# Requiere: Node, git y haber hecho `gh auth login` (o credenciales de git guardadas).
$ErrorActionPreference = 'Stop'
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
  git add -A
  git commit -q -m ("Deploy " + (Get-Date -Format 'yyyy-MM-dd HH:mm'))
  git push -f $remote gh-pages
  if ($LASTEXITCODE -ne 0) { throw 'Fallo el push a gh-pages' }
  Pop-Location
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
Write-Host "Publicado. Puede tardar ~1 minuto en reflejarse."
