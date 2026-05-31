$content = Get-Content -Path 'public\index.html' -Raw -Encoding UTF8
$lines = $content -split "`r?`n"
$startLine = 2407
$endLine = 2500
for ($i = $startLine - 1; $i -lt $endLine; $i++) {
    $lineNum = $i + 1
    Write-Host ("{0}: {1}" -f $lineNum, $lines[$i])
}
