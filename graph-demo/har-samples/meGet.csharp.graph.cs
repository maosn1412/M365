// 来源：graph.microsoft.com_today_2026-11-03.har
// 请求：GET https://graph.microsoft.com/v1.0/me
// 说明：HAR 里没有 Authorization（Graph Explorer 不会导出令牌），令牌由代码自行注入。
// 依赖：dotnet add package Microsoft.Graph
//       dotnet add package Azure.Identity
using System;
using Azure.Identity;
using Microsoft.Graph;

// 本项目 graph-demo 已接入 Microsoft.Graph，可直接复用同样的 credential 写法
var credential = new DeviceCodeCredential();          // 有租户后也可换 ClientSecretCredential
var scopes = new[] { "User.Read" };                   // TODO 按 Graph Explorer 的 Permissions 面板调整
var graphClient = new GraphServiceClient(credential, scopes);

// 等价的 SDK 便捷写法（返回值类型：Microsoft.Graph.Models.User）
var me = await graphClient.Me.GetAsync();

// 想看完整 JSON 时：Console.WriteLine(JsonSerializer.Serialize(result));
Console.WriteLine($"调用成功：{me?.DisplayName}");
