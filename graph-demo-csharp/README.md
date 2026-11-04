# graph-demo-csharp

Microsoft Graph 设备码流（Device Code Flow）完整示例 —— 用「用户身份」拿 token，再调 `/me`。

对应文档：[docs/01-Microsoft-Graph.md](../docs/01-Microsoft-Graph.md) 第 5 章「认证与令牌获取」，特别是 5.2 节的时序图。

## 这个项目演示什么

把「拿 token → 用 token 调接口」这条链路完整跑通，并且**两种写法对照**：

| 方式 | 代码位置 | 适合场景 |
|---|---|---|
| **A. Microsoft.Graph SDK** | `graphClient.Me.GetAsync()` | 正式开发（强类型、自动分页、自动重试） |
| **B. HttpClient + Bearer** | `credential.GetTokenAsync()` + `HttpClient` | 调试、看 token 长啥样、调 SDK 没封装的接口 |

两种都走同一条 OAuth 2.0 设备码流，区别只是谁帮你拼 HTTP 请求。

## 前置条件

- **.NET 10 SDK**（已确认本机 `dotnet --version` = `10.0.402`）
- **一个 Entra 应用注册**（见下方步骤）
- **一个 M365 租户**（[注册开发者沙盒](https://learn.microsoft.com/zh-cn/office/developer-program/microsoft-365-developer-program)）

> 还没注册沙盒？代码仍然能编译（`dotnet build` 通过），只是运行时拿不到 token。可以先看 README 末尾的「跑不起来时的检查清单」。

## 1. 注册 Entra 应用

1. 登录 [Azure Portal → 应用注册](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. 点「新注册」：
   - 名称：`graph-demo-csharp`（随便起）
   - 受支持的帐户类型：**仅组织目录中的帐户**（单租户）
   - 重定向 URI：留空（设备码流不需要）
3. 注册后记下：
   - **应用程序(客户端) ID** → `CLIENT_ID`
   - **目录(租户) ID** → `TENANT_ID`
4. 左侧「身份验证」→ 最下方「高级设置」→ **允许公共客户端流** 设为 **是** → 保存
   > 设备码流属于公共客户端流，不开这个会报 `AADSTS7000218`
5. 左侧「API 权限」→ 添加权限 → Microsoft Graph → **委托的权限** → 勾 `User.Read` → 添加
   > 如需读邮件，再加 `Mail.Read`；加完要点「代表 <租户> 授予管理员同意」

## 2. 配置 ClientId / TenantId

二选一（推荐环境变量，避免把配置提交进 git）：

**方式 A：环境变量**

```powershell
$env:GRAPH_TENANT_ID = '<tenant-id>'
$env:GRAPH_CLIENT_ID = '<client-id>'
```

**方式 B：编辑 appsettings.json**

```json
{
  "Graph": {
    "TenantId": "<tenant-id>",
    "ClientId": "<client-id>"
  }
}
```

> `appsettings.json` 已在 `.gitignore` 的配套规则里被忽略，**不要把真实值提交**。

## 3. 运行

```powershell
cd graph-demo-csharp
dotnet run
```

首次运行会触发设备码流，控制台打印：

```
╔══════════════════════════════════════════════════════╗
║   设备码流（Device Code Flow）                      ║
╠══════════════════════════════════════════════════════╣
║ 1. 打开浏览器：https://microsoft.com/devicelogin
║ 2. 输入设备码：ABCD-1234
║ 3. 在 14:23:45 前完成登录与同意
╚══════════════════════════════════════════════════════╝
```

在浏览器完成登录后，程序自动拿到 token 并输出：

```
[方式 A] Microsoft.Graph SDK 调用 GET /me
------------------------------------------------------------
  displayName        : Alex Wilber
  mail               : AlexW@M365x640258.onmicrosoft.com
  id                 : 480dcc2b-c19e-4536-9a95-7211b11ebfc6
  userPrincipalName  : AlexW@M365x640258.onmicrosoft.com

[方式 B] HttpClient 手动带 Bearer 头调用 GET /me
------------------------------------------------------------
  token 长度   : 1847
  token 前缀   : eyJ0eXAiOiJK...
  过期时间     : 2026-11-03 15:30:12
  （缓存与刷新由 Azure.Identity 自动处理，无需手写轮询）

  displayName        : Alex Wilber
  mail               : AlexW@M365x640258.onmicrosoft.com
  id                 : 480dcc2b-c19e-4536-9a95-7211b11ebfc6
  userPrincipalName  : AlexW@M365x640258.onmicrosoft.com
```

## 代码结构 vs 时序图对应关系

| 时序图阶段 | 代码位置 | 说明 |
|---|---|---|
| 阶段 1：`POST /devicecode` | `new DeviceCodeCredential(...)` 构造时 | 触发 `DeviceCodeCallback` 打印 user_code |
| 阶段 2：轮询 `/token` | `DeviceCodeCredential` 内部自动做 | 每 5 秒一次，直到用户在浏览器同意 |
| 阶段 3-A：SDK 调 Graph | `await graphClient.Me.GetAsync()` | SDK 内部调 `credential.GetTokenAsync()` 拿 token 后自动加 Bearer 头 |
| 阶段 3-B：手动调 Graph | `await credential.GetTokenAsync(...)` + `HttpClient` | 显式拿 token，自己拼 Authorization 头 |

**关键点**：token 缓存、过期前刷新、refresh_token 续命 —— 这些**全部由 `Azure.Identity` 自动处理**，你不需要写轮询 HTTP 代码。

## 常见错误排查

| 错误码 | 含义 | 处理 |
|---|---|---|
| `AADSTS7000218` | 需要 client_secret | 应用注册 → 身份验证 → 允许公共客户端流 = 是 |
| `AADSTS65001` | 未同意权限 | 重新登录同意，或管理员点「Grant admin consent」 |
| `AADSTS65004` | 用户拒绝同意 | 重新走流程时点「接受」 |
| `AADSTS700016` | 应用不在该租户 | 检查 `TenantId` 是否与应用所在租户一致 |
| `AADSTS50105` | 管理员未同意 | 让租户管理员在 Entra 里点 admin consent |
| HTTP 401 | token 过期或 `aud` 不对 | 重新取 token；scope 必须是 `https://graph.microsoft.com/...` |
| HTTP 403 | 缺权限 | 检查 API 权限里是否添加了 `User.Read`（Delegated） |

## 跑不起来时的检查清单

还没注册 M365 开发者沙盒？代码仍然能编译：

```powershell
dotnet build    # 应该看到 Build succeeded
```

运行时会报「未配置 TenantId / ClientId」，按提示补配置即可。

完整待办：

- [ ] 注册 [M365 开发者 E5 沙盒](https://learn.microsoft.com/zh-cn/office/developer-program/microsoft-365-developer-program)
- [ ] 在沙盒的 Entra ID 里注册应用（按上方步骤 1）
- [ ] 把 `TenantId` / `ClientId` 填进环境变量或 `appsettings.json`
- [ ] `dotnet run` 跑通，浏览器完成登录同意

## 相关文档

- [docs/01-Microsoft-Graph.md](../docs/01-Microsoft-Graph.md) 第 5 章：认证与令牌获取（含时序图）
- [docs/04-开发环境搭建手册.md](../docs/04-开发环境搭建手册.md)：本机 dotnet / Node 环境
- [Azure.Identity DeviceCodeCredential 文档](https://learn.microsoft.com/dotnet/api/azure.identity.devicecodecredential)
- [Microsoft Graph SDK 文档](https://learn.microsoft.com/graph/sdks/sdks-overview)
