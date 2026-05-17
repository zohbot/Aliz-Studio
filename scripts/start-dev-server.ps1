$ProjectRoot = Split-Path -Parent $PSScriptRoot
$NodePath = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$NextCli = Join-Path $ProjectRoot "node_modules\next\dist\bin\next"

Set-Location $ProjectRoot
& $NodePath $NextCli dev -p 3000
