# 来源：graph.microsoft.com_today_2026-11-03.har
# 请求：GET https://graph.microsoft.com/v1.0/me
# 说明：HAR 里没有 Authorization（Graph Explorer 不会导出令牌），令牌由代码自行注入。
# 运行前先设置：$env:GRAPH_ACCESS_TOKEN = '<access token>'

$accessToken = $env:GRAPH_ACCESS_TOKEN
$headers = @{
    Authorization = "Bearer $accessToken"
    Accept        = 'application/json'
}

$uri = 'https://graph.microsoft.com/v1.0/me'
$response = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers

# HTTP 4xx/5xx 时把 $ErrorActionPreference 设为 Stop 才能抛出异常
$response | ConvertTo-Json -Depth 10
