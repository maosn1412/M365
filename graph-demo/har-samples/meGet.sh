# 来源：graph.microsoft.com_today_2026-11-03.har
# 请求：GET https://graph.microsoft.com/v1.0/me
# 说明：HAR 里没有 Authorization（Graph Explorer 不会导出令牌），令牌由代码自行注入。
# 运行前先导出令牌：export ACCESS_TOKEN="eyJ0eX..."

curl -X GET 'https://graph.microsoft.com/v1.0/me' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'Accept: application/json'
