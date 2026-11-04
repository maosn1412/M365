// 离线冒烟测试：验证 Graph SDK 请求构造链路，无需租户
// 原理：自定义中间件注入假 Bearer token、拦截请求、记录最终 URL 并返回预置 JSON，
// 验证 SDK 的认证注入、URL 构造、查询参数序列化、响应解析全链路。
import { Client } from "@microsoft/microsoft-graph-client";

let capturedUrl = null;
let capturedAuthHeader = null;

const offlineMiddleware = {
  execute: async (context) => {
    capturedUrl = context.request;
    context.options.headers = {
      ...context.options.headers,
      Authorization: "Bearer fake-token-for-offline-test",
    };
    capturedAuthHeader = context.options.headers.Authorization;
    context.response = new Response(
      JSON.stringify({ value: [{ id: "1", displayName: "示例用户", mail: "demo@example.com" }] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  },
};

const client = Client.initWithMiddleware({ middleware: offlineMiddleware });

const result = await client
  .api("/me/messages")
  .select(["subject", "from"])
  .top(5)
  .orderby("receivedDateTime desc")
  .get();

console.log("请求 URL:", capturedUrl);
console.log("Authorization 头:", capturedAuthHeader);
console.log("解析结果:", JSON.stringify(result.value, null, 2));

const checks = [
  [capturedUrl?.startsWith("https://graph.microsoft.com/v1.0/me/messages"), "URL 基地址与资源路径正确"],
  [capturedUrl?.match(/(%24|\$)select=subject/), "$select 查询参数正确"],
  [capturedUrl?.match(/(%24|\$)top=5/), "$top 查询参数正确"],
  [capturedUrl?.match(/(%24|\$)orderby=receivedDateTime/), "$orderby 查询参数正确"],
  [capturedAuthHeader === "Bearer fake-token-for-offline-test", "Bearer token 注入正确"],
  [result.value?.[0]?.displayName === "示例用户", "响应 JSON 解析正确"],
];

let failed = false;
for (const [ok, name] of checks) {
  console.log(ok ? `PASS  ${name}` : `FAIL  ${name}`);
  if (!ok) failed = true;
}
process.exit(failed ? 1 : 0);
