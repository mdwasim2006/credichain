$ErrorActionPreference = 'Stop'

$baseUrl = $env:API_BASE_URL
if (-not $baseUrl) {
  $baseUrl = 'http://localhost:5000'
}

Invoke-RestMethod -Method Post -Uri "$baseUrl/seed-demo-data" | ConvertTo-Json -Depth 10