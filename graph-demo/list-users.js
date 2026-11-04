// 真实租户调用版本（注册开发者沙盒后运行）
// 用法：设置环境变量 TENANT_ID / CLIENT_ID / CLIENT_SECRET 后执行 node list-users.js
import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";

const { TENANT_ID, CLIENT_ID, CLIENT_SECRET } = process.env;
if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("请先设置环境变量 TENANT_ID / CLIENT_ID / CLIENT_SECRET");
  process.exit(1);
}

const credential = new ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET);
const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ["https://graph.microsoft.com/.default"],
});

const client = Client.initWithMiddleware({ authProvider });

// 应用权限需要 Entra 应用注册里配置 User.Read.All（Application）并管理员同意
const users = await client.api("/users").select(["id", "displayName", "mail"]).top(5).get();
console.log(JSON.stringify(users.value, null, 2));
