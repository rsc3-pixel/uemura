# Encerra os servidores de desenvolvimento presos nas portas 3001 (backend) e 5173 (front).
# Chamado por "make kill". Fica em script separado para nao sofrer com o escape de
# variaveis do Makefile no Windows.

$ids = (Get-NetTCPConnection -LocalPort 3001, 5173 -State Listen -ErrorAction SilentlyContinue).OwningProcess |
    Select-Object -Unique

if (-not $ids) {
    Write-Host "Nenhum servidor rodando nas portas 3001 / 5173."
    return
}

foreach ($processId in $ids) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}

Write-Host "Portas 3001 e 5173 liberadas."
