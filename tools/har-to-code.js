#!/usr/bin/env node
'use strict';

/**
 * har-to-code.js —— 把 HAR（HTTP Archive）里的请求还原成可执行代码
 *
 * 背景：Graph Explorer 的 "Export" 只能导出 HAR / Postman Collection，
 *      真正的代码片段在运行请求后的 "Code snippets" 标签里。
 *      本脚本用来把 HAR 记录补转成 C# / PowerShell / Python / curl / Node.js。
 *
 * 用法：
 *   node tools/har-to-code.js <file.har> [-o 输出目录] [--all]
 *
 * 参数：
 *   -o, --out <dir>   输出目录，默认 ./har-output
 *   --all             处理 HAR 中所有请求（默认只处理 graph.microsoft.com 的接口）
 *
 * 依赖：无（只用 Node 内置模块）
 */

const fs = require('fs');
const path = require('path');

const GRAPH_HOST = 'graph.microsoft.com';

// HAR 里这些头不需要还原：要么由 HTTP 栈自动生成，要么是隐私/凭证信息
const DROP_HEADERS = new Set([
  'host', 'connection', 'content-length', 'accept-encoding',
  'cookie', 'cookie2', 'authorization', 'user-agent',
  'referer', 'origin', 'accept-language',
  'sec-fetch-mode', 'sec-fetch-site', 'sec-fetch-dest'
]);

function parseArgs(argv) {
  const args = { har: null, out: 'har-output', all: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-o' || a === '--out') args.out = argv[++i];
    else if (a === '--all') args.all = true;
    else if (a === '-h' || a === '--help') args.help = true;
    else if (!args.har) args.har = a;
  }
  return args;
}

function usage() {
  console.log('用法: node tools/har-to-code.js <file.har> [-o 输出目录] [--all]');
}

function loadRequests(harPath, includeAll) {
  const raw = fs.readFileSync(harPath, 'utf8').replace(/^\uFEFF/, '');
  const har = JSON.parse(raw);
  const entries = (har.log && har.log.entries) || [];
  const creator = (har.log && har.log.creator && har.log.creator.name) || '未知工具';

  return {
    creator,
    requests: entries.map(normalizeEntry).filter(req => req && (includeAll || req.host === GRAPH_HOST))
  };
}

function normalizeEntry(entry) {
  const req = entry && entry.request;
  if (!req || !req.url) return null;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return null;
  }

  const headers = (req.headers || [])
    .filter(h => h && h.name && !DROP_HEADERS.has(h.name.toLowerCase()))
    .map(h => ({ name: h.name, value: String(h.value ?? '') }));

  let body = null;
  if (req.postData && typeof req.postData.text === 'string' && req.postData.text.length > 0) {
    body = req.postData.text;
  }

  return {
    method: (req.method || 'GET').toUpperCase(),
    url: req.url,
    host: url.hostname,
    pathname: url.pathname,
    search: url.search,
    headers,
    body
  };
}

// ---------- 命名 ----------

function namingOf(req) {
  const segs = req.pathname
    .split('/')
    .filter(Boolean)
    .filter(s => !/^(v1\.0|beta)$/i.test(s));

  const words = segs
    .map(s => s.replace(/[{}]/g, '').replace(/[^A-Za-z0-9]+/g, ' '))
    .join(' ')
    .trim() || 'request';

  const pascal = words.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
  const method = req.method.charAt(0) + req.method.slice(1).toLowerCase();

  return { pascal, camel, base: camel + method };
}

// ---------- 字面量转义 ----------

const sh = s => String(s).replace(/'/g, `'\\''`);
const ps = s => String(s).replace(/'/g, "''");
const cs = s => String(s).replace(/"/g, '""');
const py = s => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const js = s => JSON.stringify(String(s));

function effectiveHeaders(req) {
  const headers = req.headers.filter(h => !/^(accept|content-type)$/i.test(h.name));
  const accept = req.headers.find(h => h.name.toLowerCase() === 'accept');
  const contentType = req.headers.find(h => h.name.toLowerCase() === 'content-type');

  return {
    accept: accept ? accept.value : 'application/json',
    contentType: contentType ? contentType.value : (req.body ? 'application/json' : null),
    normal: headers
  };
}

function sourceBanner(req, harName) {
  return [
    `来源：${harName}`,
    `请求：${req.method} ${req.url}`,
    '说明：HAR 里没有 Authorization（Graph Explorer 不会导出令牌），令牌由代码自行注入。'
  ];
}

// ---------- curl ----------

function genCurl(req, harName) {
  const h = effectiveHeaders(req);
  const parts = [`curl -X ${req.method} '${sh(req.url)}'`];
  parts.push(`-H 'Authorization: Bearer $ACCESS_TOKEN'`);
  if (h.accept) parts.push(`-H 'Accept: ${sh(h.accept)}'`);
  for (const item of h.normal) parts.push(`-H '${sh(item.name)}: ${sh(item.value)}'`);
  if (req.body) {
    if (h.contentType) parts.push(`-H 'Content-Type: ${sh(h.contentType)}'`);
    parts.push(`--data-raw '${sh(req.body)}'`);
  }

  const lines = [
    ...sourceBanner(req, harName).map(l => `# ${l}`),
    '# 运行前先导出令牌：export ACCESS_TOKEN="eyJ0eX..."',
    ''
  ];
  // 除最后一段外都补续行符
  parts.forEach((part, i) => {
    if (i === 0) lines.push(parts.length === 1 ? part : `${part} \\`);
    else lines.push(i === parts.length - 1 ? `  ${part}` : `  ${part} \\`);
  });
  return lines.join('\n') + '\n';
}

// ---------- PowerShell ----------

function genPowerShell(req, harName) {
  const h = effectiveHeaders(req);
  const lines = [
    ...sourceBanner(req, harName).map(l => `# ${l}`),
    '# 运行前先设置：$env:GRAPH_ACCESS_TOKEN = \'<access token>\'',
    '',
    '$accessToken = $env:GRAPH_ACCESS_TOKEN',
    '$headers = @{',
    '    Authorization = "Bearer $accessToken"'
  ];
  if (h.accept) lines.push(`    Accept        = '${ps(h.accept)}'`);
  lines.push('}');
  for (const item of h.normal) {
    lines.push(`$headers['${ps(item.name)}'] = '${ps(item.value)}'`);
  }

  lines.push('');
  lines.push(`$uri = '${ps(req.url)}'`);
  if (req.body) {
    lines.push(`$body = @'`);
    lines.push(req.body);
    lines.push(`'@`);
  }

  const params = [`-Method ${req.method.charAt(0) + req.method.slice(1).toLowerCase()}`];
  params.push('-Uri $uri');
  params.push('-Headers $headers');
  if (req.body) {
    params.push('-Body $body');
    if (h.contentType) params.push(`-ContentType '${ps(h.contentType)}'`);
  }

  lines.push(`$response = Invoke-RestMethod ${params.join(' ')}`);
  lines.push('');
  lines.push('# HTTP 4xx/5xx 时把 $ErrorActionPreference 设为 Stop 才能抛出异常');
  lines.push('$response | ConvertTo-Json -Depth 10');
  return lines.join('\n') + '\n';
}

// ---------- Python ----------

function genPython(req, harName) {
  const h = effectiveHeaders(req);
  const lines = [
    ...sourceBanner(req, harName).map(l => `# ${l}`),
    '# 依赖：pip install requests',
    'import json',
    'import os',
    '',
    'import requests',
    '',
    'ACCESS_TOKEN = os.environ["GRAPH_ACCESS_TOKEN"]',
    '',
    'headers = {',
    `    "Authorization": f"Bearer {ACCESS_TOKEN}",`,
    `    "Accept": "${py(h.accept)}",`
  ];
  for (const item of h.normal) lines.push(`    "${py(item.name)}": "${py(item.value)}",`);
  lines.push('}');
  lines.push('');

  if (req.body) {
    lines.push('payload = """');
    lines.push(req.body);
    lines.push('"""');
    lines.push('');
  }

  const fn = req.method.toLowerCase();
  const args = [`    "${py(req.url)}"`, '    headers=headers'];
  if (req.body) {
    args.push('    data=payload.encode("utf-8")');
    if (h.contentType) lines.push(`headers["Content-Type"] = "${py(h.contentType)}"`);
    if (h.contentType) lines.push('');
  }
  args.push('    timeout=30');

  lines.push(`response = requests.${fn}(`);
  lines.push(args.join(',\n'));
  lines.push(')');
  lines.push('response.raise_for_status()');
  lines.push('');
  lines.push('# Graph 接口一定返回 JSON（$value 等二进制接口除外）');
  lines.push('print(json.dumps(response.json(), ensure_ascii=False, indent=2))');
  return lines.join('\n') + '\n';
}

// ---------- Node.js ----------

function genNode(req, harName) {
  const h = effectiveHeaders(req);
  const headers = { Authorization: '`Bearer ${ACCESS_TOKEN}`', Accept: h.accept };
  for (const item of h.normal) headers[item.name] = item.value;

  const headerLines = Object.entries(headers)
    .map(([k, v]) => `    ${/^[A-Za-z0-9_-]+$/.test(k) ? k : `"${k}"`}: ${v.startsWith('`') ? v : js(v)},`)
    .join('\n');

  const lines = [
    ...sourceBanner(req, harName).map(l => `// ${l}`),
    "const ACCESS_TOKEN = process.env.GRAPH_ACCESS_TOKEN;",
    '',
    `const response = await fetch(${js(req.url)}, {`,
    `  method: ${js(req.method)},`,
    '  headers: {',
    headerLines,
    '  },'
  ];
  if (req.body) {
    lines[lines.length - 1] = '  },';
    lines.push(`  body: ${JSON.stringify(req.body)},`);
  }
  lines.push('});');
  lines.push('');
  lines.push('if (!response.ok) {');
  lines.push('  throw new Error(`Graph ${response.status}: ${await response.text()}`);');
  lines.push('}');
  lines.push('');
  lines.push('console.log(JSON.stringify(await response.json(), null, 2));');
  return lines.join('\n') + '\n';
}

// ---------- C#（HttpClient 原味版） ----------

function genCSharpHttp(req, harName, names) {
  const h = effectiveHeaders(req);
  const bodyPart = req.body
    ? `        request.Content = new StringContent(@"${cs(req.body)}", System.Text.Encoding.UTF8, "${cs(h.contentType || 'application/json')}");\n`
    : '';

  const extraHeaders = h.normal
    .map(item => {
      const isContentHeader = /^content-/i.test(item.name);
      return isContentHeader
        ? `        // 内容头 ${item.name}: ${item.value}（如需自定义，请设置到 HttpContent.Headers）`
        : `        request.Headers.TryAddWithoutValidation("${cs(item.name)}", "${cs(item.value)}");`;
    })
    .join('\n');

  return `// ${sourceBanner(req, harName).join('\n// ')}
// 生成时间：${new Date().toISOString()}
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

public static class ${names.pascal}Request
{
    private static readonly HttpClient Http = new();

    /// <summary>
    /// 调用 Microsoft Graph：${req.method} ${req.url}
    /// </summary>
    /// <param name="accessToken">由 MSAL / Azure.Identity 获取的 Graph 访问令牌</param>
    public static async Task<string> SendAsync(string accessToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.${csMethod(req.method)}, "${cs(req.url)}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("${cs(h.accept)}"));
${extraHeaders ? extraHeaders + '\n' : ''}${bodyPart}
        using var response = await Http.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Graph 调用失败：{(int)response.StatusCode} {response.ReasonPhrase}\\n{content}");
        }

        return content;
    }
}
`;
}

function csMethod(m) {
  const map = { GET: 'Get', POST: 'Post', PUT: 'Put', PATCH: 'Patch', DELETE: 'Delete', HEAD: 'Head', OPTIONS: 'Options' };
  return map[m] || 'Get';
}

// ---------- C#（Microsoft.Graph SDK 版） ----------

const SDK_MAP = [
  { re: /^\/(?:v1\.0|beta)\/me$/i, build: () => ({ expr: 'graphClient.Me.GetAsync()', type: 'Microsoft.Graph.Models.User', hint: 'var me = ' }) },
  { re: /^\/(?:v1\.0|beta)\/me\/messages$/i, build: () => ({ expr: 'graphClient.Me.Messages.GetAsync()', type: 'MessageCollectionResponse', hint: 'var messages = ' }) },
  { re: /^\/(?:v1\.0|beta)\/me\/events$/i, build: () => ({ expr: 'graphClient.Me.Events.GetAsync()', type: 'EventCollectionResponse', hint: 'var events = ' }) },
  { re: /^\/(?:v1\.0|beta)\/me\/manager$/i, build: () => ({ expr: 'graphClient.Me.Manager.GetAsync()', type: 'DirectoryObject', hint: 'var manager = ' }) },
  { re: /^\/(?:v1\.0|beta)\/me\/drive\/root\/children$/i, build: () => ({ expr: 'graphClient.Me.Drive.Root.Children.GetAsync()', type: 'DriveItemCollectionResponse', hint: 'var children = ' }) },
  { re: /^\/(?:v1\.0|beta)\/users$/i, build: () => ({ expr: 'graphClient.Users.GetAsync()', type: 'UserCollectionResponse', hint: 'var users = ' }) },
  { re: /^\/(?:v1\.0|beta)\/users\/([^/]+)$/i, build: m => ({ expr: `graphClient.Users["${m[1]}"].GetAsync()`, type: 'Microsoft.Graph.Models.User', hint: 'var user = ' }) },
  { re: /^\/(?:v1\.0|beta)\/groups$/i, build: () => ({ expr: 'graphClient.Groups.GetAsync()', type: 'GroupCollectionResponse', hint: 'var groups = ' }) },
  { re: /^\/(?:v1\.0|beta)\/organization$/i, build: () => ({ expr: 'graphClient.Organization.GetAsync()', type: 'OrganizationCollectionResponse', hint: 'var org = ' }) },
  { re: /^\/(?:v1\.0|beta)\/applications$/i, build: () => ({ expr: 'graphClient.Applications.GetAsync()', type: 'ApplicationCollectionResponse', hint: 'var apps = ' }) },
  { re: /^\/(?:v1\.0|beta)\/servicePrincipals$/i, build: () => ({ expr: 'graphClient.ServicePrincipals.GetAsync()', type: 'ServicePrincipalCollectionResponse', hint: 'var sps = ' }) }
];

// 把 HAR 里的查询字符串（$select/$top/$filter...）映射成 SDK 的 RequestConfiguration lambda
const QUERY_MAP = {
  '$select': (v) => `c.QueryParameters.Select = new[] { ${v.split(',').map(s => `"${cs(s.trim())}"`).join(', ')} };`,
  '$expand': (v) => `c.QueryParameters.Expand = new[] { ${v.split(',').map(s => `"${cs(s.trim())}"`).join(', ')} };`,
  '$filter': (v) => `c.QueryParameters.Filter = "${cs(v)}";`,
  '$search': (v) => `c.QueryParameters.Search = "${cs(v)}";`,
  '$orderby': (v) => `c.QueryParameters.Orderby = new[] { ${v.split(',').map(s => `"${cs(s.trim())}"`).join(', ')} };`,
  '$top': (v) => `c.QueryParameters.Top = ${Number(v)};`,
  '$skip': (v) => `c.QueryParameters.Skip = ${Number(v)};`,
  '$count': (v) => `c.QueryParameters.Count = ${v === 'true'};`
};

function toQueryLambda(search) {
  if (!search) return null;
  const parts = [];
  for (const [key, value] of new URLSearchParams(search)) {
    if (QUERY_MAP[key]) parts.push(QUERY_MAP[key](value));
    else parts.push(`// 未映射的查询参数：${key}=${value}（请查 SDK 的 QueryParameters 属性）`);
  }
  return parts.length > 0 ? parts : null;
}

function genCSharpSdk(req, harName, names) {
  const banner = sourceBanner(req, harName).map(l => `// ${l}`).join('\n');
  const head = `${banner}
// 依赖：dotnet add package Microsoft.Graph
//       dotnet add package Azure.Identity
using System;
using Azure.Identity;
using Microsoft.Graph;

// 本项目 graph-demo 已接入 Microsoft.Graph，可直接复用同样的 credential 写法
var credential = new DeviceCodeCredential();          // 有租户后也可换 ClientSecretCredential
var scopes = new[] { "User.Read" };                   // TODO 按 Graph Explorer 的 Permissions 面板调整
var graphClient = new GraphServiceClient(credential, scopes);
`;

  if (req.method !== 'GET') {
    return `${head}
// ${req.method} 请求在 SDK 中同样有对应方法，但本脚本只自动映射 GET。
// 参考 URL 结构手写，例如：await graphClient.Me.Messages.PostAsync(new Message { ... });
throw new NotImplementedException("请按 SDK 文档手写 ${req.method} 调用");
`;
  }

  const hit = SDK_MAP.map(m => ({ m, r: req.pathname.match(m.re) })).find(x => x.r);
  if (!hit) {
    return `${head}
// 该 URL 没有内置的便捷方法映射，两种写法任选：
// 1) 直接用同目录下的 ${names.base}.csharp.http.cs（HttpClient 版本，URL 已经填好）
// 2) 用 SDK 的 RequestInformation 走底层适配器：
//    var info = graphClient.Me.ToGetRequestInformation(...);
//    var raw = await graphClient.RequestAdapter.SendPrimitiveAsync<string>(info, "application/json", default);
throw new NotImplementedException("该接口未做 SDK 映射");
`;
  }

  const spec = hit.m.build(hit.r);
  const varName = spec.hint.replace(/^var\s+/, '').replace(/\s*=\s*$/, '').trim();
  const printExpr = varName === 'me' || varName === 'user'
    ? `${varName}?.DisplayName`
    : `${varName}?.Value?.Count`;

  // 有查询参数时，把 GetAsync() 换成 GetAsync(c => { ... }) 带配置的写法
  const lambda = toQueryLambda(req.search);
  let expr = spec.expr;
  let queryNote = '';
  if (lambda) {
    expr = expr.replace('GetAsync()', `GetAsync(c =>\n{\n${lambda.map(l => `    ${l}`).join('\n')}\n})`);
    queryNote = '（含查询参数配置）';
  }

  return `${head}
// 等价的 SDK 便捷写法${queryNote}（返回值类型：${spec.type}）
${spec.hint}await ${expr};

// 想看完整 JSON 时：Console.WriteLine(JsonSerializer.Serialize(result));
Console.WriteLine($"调用成功：{${printExpr}}");
`;
}

// ---------- 主流程 ----------

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.har) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const harPath = path.resolve(args.har);
  if (!fs.existsSync(harPath)) {
    console.error(`找不到 HAR 文件：${harPath}`);
    process.exit(1);
  }

  const harName = path.basename(harPath);
  const { creator, requests } = loadRequests(harPath, args.all);

  if (requests.length === 0) {
    console.error(`HAR 中没有可处理的请求（来源：${creator}）。若需要非 Graph 请求，请加 --all`);
    process.exit(1);
  }

  const outDir = path.resolve(args.out);
  fs.mkdirSync(outDir, { recursive: true });

  const summary = [];
  for (const req of requests) {
    const names = namingOf(req);
    const files = [
      [`${names.base}.csharp.http.cs`, genCSharpHttp(req, harName, names)],
      [`${names.base}.csharp.graph.cs`, genCSharpSdk(req, harName, names)],
      [`${names.base}.ps1`, genPowerShell(req, harName)],
      [`${names.base}.py`, genPython(req, harName)],
      [`${names.base}.js`, genNode(req, harName)],
      [`${names.base}.sh`, genCurl(req, harName)]
    ];

    for (const [name, content] of files) {
      fs.writeFileSync(path.join(outDir, name), content, 'utf8');
    }
    summary.push({ req, dir: outDir, files: files.map(f => f[0]) });
  }

  console.log(`HAR 来源：${creator}`);
  console.log(`输出目录：${outDir}\n`);
  for (const item of summary) {
    console.log(`${item.req.method} ${item.req.url}`);
    for (const f of item.files) console.log(`  - ${f}`);
    console.log('');
  }
  console.log(`共处理 ${summary.length} 条请求。`);
}

main();
