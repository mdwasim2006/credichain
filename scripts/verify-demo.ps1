$ErrorActionPreference = 'Stop'

$baseUrl = $env:API_BASE_URL
if (-not $baseUrl) {
  $baseUrl = 'http://localhost:5000'
}

$valid = Invoke-RestMethod -Method Post -Uri "$baseUrl/verify-certificate" -ContentType 'application/json' -Body (@{
  certificateId = 'CRD-DEMO-001'
} | ConvertTo-Json)

$tampered = Invoke-RestMethod -Method Post -Uri "$baseUrl/verify-certificate" -ContentType 'application/json' -Body (@{
  certificateId = 'CRD-DEMO-001'
  certificateData = @{
    certificateId = 'CRD-DEMO-001'
    name = 'Ava Johnson'
    course = 'Advanced Blockchain Development - Tampered'
    issueDate = '2026-04-14'
  }
} | ConvertTo-Json -Depth 10)

[pscustomobject]@{
  valid = $valid
  tampered = $tampered
} | ConvertTo-Json -Depth 10