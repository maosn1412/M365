// 来源：graph.microsoft.com_today_2026-11-03.har
// 请求：GET https://graph.microsoft.com/v1.0/me
// 说明：HAR 里没有 Authorization（Graph Explorer 不会导出令牌），令牌由代码自行注入。
const ACCESS_TOKEN = process.env.GRAPH_ACCESS_TOKEN;

const response = await fetch("https://graph.microsoft.com/v1.0/me", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    Accept: "application/json",
  },
});

if (!response.ok) {
  throw new Error(`Graph ${response.status}: ${await response.text()}`);
}

console.log(JSON.stringify(await response.json(), null, 2));
