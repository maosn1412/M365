// Program.cs — Microsoft Graph 设备码流（Device Code Flow）完整示例
//
// 对应 docs/01-Microsoft-Graph.md 第 5.2 节时序图：
//   阶段 1：POST /devicecode → 拿到 user_code / device_code
//   阶段 2：轮询 /token → 拿到 access_token + refresh_token
//   阶段 3：Bearer <token> 调 Graph
//
// Azure.Identity 的 DeviceCodeCredential 把阶段 1+2 全部封装，
// 你只需要提供一个 DeviceCodeCallback 打印提示语，剩下的轮询、缓存、自动刷新都由库处理。

using System.Net.Http.Headers;
using System.Text.Json;
using Azure.Core;
using Azure.Identity;
using Microsoft.Graph;

// ============================================================
// 1. 读取配置（环境变量优先，回退到 appsettings.json）
// ============================================================
var config = LoadConfig();

// ============================================================
// 2. 构造 DeviceCodeCredential（委托流 = 以用户身份调用）
// ============================================================
// 对应时序图阶段 1+2：DeviceCodeCredential 内部会
//   - 调用 /devicecode 拿到 user_code
//   - 调用你注册的 DeviceCodeCallback 把提示语打到控制台
//   - 每 5 秒轮询 /token，直到用户在浏览器完成同意
//   - 拿到 access_token 后缓存，过期前自动用 refresh_token 换新
var credential = new DeviceCodeCredential(new DeviceCodeCredentialOptions
{
    TenantId = config.TenantId,
    ClientId = config.ClientId,
    // 这个回调是阶段 1 的出口：拿到 user_code 时触发
    DeviceCodeCallback = (info, cancellationToken) =>
    {
        Console.WriteLine();
        Console.WriteLine("╔══════════════════════════════════════════════════════╗");
        Console.WriteLine("║   设备码流（Device Code Flow）                      ║");
        Console.WriteLine("╠══════════════════════════════════════════════════════╣");
        Console.WriteLine($"║ 1. 打开浏览器：{info.VerificationUri}");
        Console.WriteLine($"║ 2. 输入设备码：{info.UserCode}");
        Console.WriteLine($"║ 3. 在 {info.ExpiresOn.LocalDateTime:HH:mm:ss} 前完成登录与同意");
        Console.WriteLine("╚══════════════════════════════════════════════════════╝");
        Console.WriteLine();
        return Task.CompletedTask;
    }
});

// ============================================================
// 3. 方式 A：用 Microsoft.Graph SDK 调用（推荐）
// ============================================================
// 对应时序图阶段 3：SDK 内部自动调用 credential.GetTokenAsync() 拿 token，
// 然后加到 Authorization 头里发出去。
Console.WriteLine("[方式 A] Microsoft.Graph SDK 调用 GET /me");
Console.WriteLine(new string('-', 60));

// TODO 如需读邮件，把 scopes 改成 new[] { "User.Read", "Mail.Read" }
// 并在 Entra 应用注册的 API 权限里添加对应的 Delegated 权限
var graphClient = new GraphServiceClient(credential, new[] { "User.Read" });

try
{
    var me = await graphClient.Me.GetAsync();
    Console.WriteLine($"  displayName        : {me?.DisplayName}");
    Console.WriteLine($"  mail               : {me?.Mail ?? "<未设置>"}");
    Console.WriteLine($"  id                 : {me?.Id}");
    Console.WriteLine($"  userPrincipalName  : {me?.UserPrincipalName}");
}
catch (AuthenticationFailedException ex)
{
    Console.WriteLine($"  ❌ 认证失败：{ex.Message}");
    PrintAadStsHint(ex.Message);
}
catch (Exception ex)
{
    Console.WriteLine($"  ❌ 调用失败：{ex.GetType().Name} - {ex.Message}");
}

// ============================================================
// 4. 方式 B：用 HttpClient 手动带 Bearer 头调用（对照看清 token 怎么用）
// ============================================================
// 这里显式调用 credential.GetTokenAsync() 拿 token，
// 然后自己构造 HttpRequestMessage 加 Authorization 头 ——
// 这就是 SDK 内部在做的事，拆开看一遍就明白了。
Console.WriteLine();
Console.WriteLine("[方式 B] HttpClient 手动带 Bearer 头调用 GET /me");
Console.WriteLine(new string('-', 60));

try
{
    // 阶段 3 的第一步：显式拿 token
    // scope 用完整资源形式 https://graph.microsoft.com/User.Read
    // （委托流不能用 .default，要写具体权限）
    var tokenContext = new TokenRequestContext(new[] { "https://graph.microsoft.com/User.Read" });
    var accessToken = await credential.GetTokenAsync(tokenContext, CancellationToken.None);

    // 安全打印：只输出长度和前 12 位，不要把完整 token 打到日志
    var masked = accessToken.Token.Length <= 12
        ? accessToken.Token
        : accessToken.Token[..12] + "...";
    Console.WriteLine($"  token 长度   : {accessToken.Token.Length}");
    Console.WriteLine($"  token 前缀   : {masked}");
    Console.WriteLine($"  过期时间     : {accessToken.ExpiresOn.ToLocalTime():yyyy-MM-dd HH:mm:ss}");
    Console.WriteLine($"  （缓存与刷新由 Azure.Identity 自动处理，无需手写轮询）");
    Console.WriteLine();

    // 阶段 3 的第二步：用 token 调 Graph
    using var http = new HttpClient();
    using var request = new HttpRequestMessage(HttpMethod.Get, "https://graph.microsoft.com/v1.0/me");
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken.Token);
    request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

    using var response = await http.SendAsync(request);
    var body = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        Console.WriteLine($"  ❌ HTTP {(int)response.StatusCode} {response.ReasonPhrase}");
        Console.WriteLine($"  响应体：{body}");
        return;
    }

    using var doc = JsonDocument.Parse(body);
    var root = doc.RootElement;
    Console.WriteLine($"  displayName        : {root.GetProperty("displayName").GetString()}");
    Console.WriteLine($"  mail               : {(root.TryGetProperty("mail", out var m) && m.ValueKind == JsonValueKind.String ? m.GetString() : "<未设置>")}");
    Console.WriteLine($"  id                 : {root.GetProperty("id").GetString()}");
    Console.WriteLine($"  userPrincipalName  : {root.GetProperty("userPrincipalName").GetString()}");
}
catch (AuthenticationFailedException ex)
{
    Console.WriteLine($"  ❌ 认证失败：{ex.Message}");
    PrintAadStsHint(ex.Message);
}
catch (Exception ex)
{
    Console.WriteLine($"  ❌ 调用失败：{ex.GetType().Name} - {ex.Message}");
}

// ============================================================
// 辅助：配置加载
// ============================================================
static AppConfig LoadConfig()
{
    // 优先级：环境变量 > appsettings.json
    var tenantId = Environment.GetEnvironmentVariable("GRAPH_TENANT_ID");
    var clientId = Environment.GetEnvironmentVariable("GRAPH_CLIENT_ID");

    if (string.IsNullOrEmpty(tenantId) || string.IsNullOrEmpty(clientId))
    {
        var settingsPath = Path.Combine(AppContext.BaseDirectory, "appsettings.json");
        if (!File.Exists(settingsPath))
        {
            // 开发时 AppContext.BaseDirectory 可能是 bin/Debug/net10.0，回退到项目根
            settingsPath = Path.Combine(Directory.GetCurrentDirectory(), "appsettings.json");
        }

        if (File.Exists(settingsPath))
        {
            using var fs = File.OpenRead(settingsPath);
            using var doc = JsonDocument.Parse(fs);
            if (doc.RootElement.TryGetProperty("Graph", out var graph))
            {
                tenantId ??= graph.TryGetProperty("TenantId", out var t) ? t.GetString() : null;
                clientId ??= graph.TryGetProperty("ClientId", out var c) ? c.GetString() : null;
            }
        }
    }

    if (string.IsNullOrEmpty(tenantId) || string.IsNullOrEmpty(clientId)
        || tenantId.StartsWith("<") || clientId.StartsWith("<"))
    {
        Console.Error.WriteLine();
        Console.Error.WriteLine("❌ 未配置 TenantId / ClientId");
        Console.Error.WriteLine();
        Console.Error.WriteLine("   二选一：");
        Console.Error.WriteLine("   1) 设置环境变量：");
        Console.Error.WriteLine("        $env:GRAPH_TENANT_ID = '<tenant-id>'");
        Console.Error.WriteLine("        $env:GRAPH_CLIENT_ID = '<client-id>'");
        Console.Error.WriteLine("   2) 编辑 appsettings.json：");
        Console.Error.WriteLine("        { \"Graph\": { \"TenantId\": \"...\", \"ClientId\": \"...\" } }");
        Console.Error.WriteLine();
        Console.Error.WriteLine("   完整步骤见 graph-demo-csharp/README.md");
        Environment.Exit(1);
    }

    return new AppConfig(tenantId!, clientId!);
}

// 辅助：把常见 AADSTS 错误码翻译成排查方向
static void PrintAadStsHint(string message)
{
    var hints = new (string code, string hint)[]
    {
        ("AADSTS7000218", "client_secret 错误或已过期。设备码流是公共客户端流，不需要 secret；若应用注册里强制要求 secret，请关闭该设置。"),
        ("AADSTS65001", "用户或管理员未同意权限。重新走一次登录同意流程，或让管理员在 Entra 里点 admin consent。"),
        ("AADSTS65004", "用户拒绝同意。重新走流程时点「接受」。"),
        ("AADSTS700016", "应用注册不在指定租户。检查 TenantId 是否与应用所在租户一致。"),
        ("AADSTS501461", "动态资源绑定未配置，检查应用注册的 API 权限。"),
        ("AADSTS650056", "应用未配置所需权限，到 Entra → 应用注册 → API 权限里添加 User.Read。"),
        ("AADSTS50105", "管理员未同意应用。需要管理员在 Entra 里点 Grant admin consent。"),
    };

    foreach (var (code, hint) in hints)
    {
        if (message.Contains(code))
        {
            Console.Error.WriteLine($"   💡 {code}：{hint}");
        }
        else if (message.Contains("DeviceCodeCredential") && message.Contains("failed"))
        {
            Console.Error.WriteLine("   💡 常见原因：用户未在浏览器完成同意 / 设备码已过期（15 分钟）/ 网络不通。");
        }
    }
}

record AppConfig(string TenantId, string ClientId);
