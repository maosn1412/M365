# 来源：graph.microsoft.com_today_2026-11-03.har
# 请求：GET https://graph.microsoft.com/v1.0/me
# 说明：HAR 里没有 Authorization（Graph Explorer 不会导出令牌），令牌由代码自行注入。
# 依赖：pip install requests
import json
import os

import requests

ACCESS_TOKEN = os.environ["GRAPH_ACCESS_TOKEN"]

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Accept": "application/json",
}

response = requests.get(
    "https://graph.microsoft.com/v1.0/me",
    headers=headers,
    timeout=30
)
response.raise_for_status()

# Graph 接口一定返回 JSON（$value 等二进制接口除外）
print(json.dumps(response.json(), ensure_ascii=False, indent=2))
