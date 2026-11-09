# 02 · Teams 应用与 Copilot 扩展专题

> **微软官方核心文档**  
> - [Teams 开发者文档首页](https://learn.microsoft.com/microsoftteams/platform/)  
> - [Microsoft 365 Agents Toolkit 文档](https://learn.microsoft.com/microsoftteams/platform/toolkit/overview-agents-toolkit)  
> - [Copilot 扩展性文档](https://learn.microsoft.com/microsoft-365/copilot/extensibility/)  
> - [Microsoft 365 Agents SDK 文档](https://learn.microsoft.com/microsoft-365/agents-sdk/)

> Teams 应用 = M365 里"自定义 UI + 对话交互"的载体；Copilot 扩展（代理）是 2025 年后最热门的方向。两者共用同一套工具链：Microsoft 365 Agents Toolkit（原 Teams Toolkit）。

## 1. 一张图看懂扩展点

```
Microsoft Teams / Outlook / M365 Copilot
├── Teams 应用（teamsapp）
│   ├── 选项卡 Tab        —— 嵌入网页（个人/频道/会议选项卡）
│   ├── 机器人 Bot        —— 对话机器人（1:1、群聊、频道 @提及）
│   ├── 消息扩展 ME       —— 从消息框搜索/执行操作，插入卡片
│   ├── 自适应卡片        —— 跨 Teams/Outlook 的 JSON 卡片 UI
│   └── Webhook/连接器    —— ⚠️ 已宣布退役，官方建议迁移到 Power Automate Workflows
└── Copilot 扩展（agents）
    ├── 声明式代理 Declarative Agent —— 用指令+知识+动作包装 Copilot
    │   └── API 插件 API Plugin      —— 让代理调用你的 REST API
    └── 自定义引擎代理 Custom Engine —— 用自己的 LLM/编排（Agents SDK）
```

> 注：Office 365 连接器（含 Teams 传入 Webhook）已进入退役流程，新场景请直接用 Power Automate 的 Teams 工作流；具体退役时间表以官方页 https://learn.microsoft.com/microsoftteams/m365-custom-connectors 为准。

## 2. 核心概念

### 2.1 应用清单（manifest）

- Teams 应用的"身份证"：`manifest.json` + 两个图标，打包成 zip 上传
- 类比 D365：相当于解决方案包，描述应用能力、权限、发布范围
- 新版**统一清单（Unified Manifest）**：一个清单同时描述 Teams 应用、Office 加载项、Copilot 代理

### 2.2 Microsoft 365 Agents Toolkit（ATK）

原 Teams Toolkit，改名后覆盖 Copilot + Teams + Office 三条产品线。三种形态：

| 形态 | 适合谁 | 安装 |
|---|---|---|
| VS Code 扩展 | JS/TS 开发者 | 扩展市场搜 "Microsoft 365 Agents Toolkit"（ID：`TeamsDevApp.ms-teams-vscode-extension`） |
| CLI（`atk`） | CI/CD、脚本化 | `npm i -g @microsoft/m365agentstoolkit-cli` |
| Visual Studio 工作负载 | C#/.NET 开发者 | VS2022 17.14+ 安装器勾选 |

本机已安装：VS Code 扩展 + atk CLI（见 [04-开发环境搭建手册.md](04-开发环境搭建手册.md)）。

### 2.3 运行与调试模型

- Teams 应用的代码跑在**你自己的服务器**（或本地 + 隧道），Teams 只是"宿主外壳"
- 本地调试机器人/选项卡 → ATK 自动处理隧道（tunnel）、清单注册、侧载（sideload）
- **必须有 M365 租户**，且租户允许侧载自定义应用（开发者沙盒默认允许）

## 3. Copilot 扩展（重点新方向）

### 3.1 声明式代理（Declarative Agent，DA）

不写代码也能做：一份 `declarativeAgent.json` 声明指令（instructions）、知识源（SharePoint 站点、Graph 连接器）、动作（API 插件）。Copilot 本体负责 LLM 和编排。

适用场景：把企业知识/业务 API 包装成一个"专科 Copilot"，例如"客服知识库助手"。

### 3.2 API 插件（API Plugin）

给声明式代理配"手脚"：用 OpenAPI 规范描述你的 REST API，代理就能按对话意图调用它。
——如果你有 D365 Web API 包装经验，这一步就是把现有 API 暴露给 Copilot。

### 3.3 自定义引擎代理（Custom Engine Agent）

用 **Microsoft 365 Agents SDK**（前身 Bot Framework SDK）自己掌控 LLM 调用和编排（可接 Azure OpenAI、Semantic Kernel、LangChain），一次构建发布到 Teams、Copilot、Web、邮件等多渠道。

适用场景：复杂多轮对话、自有模型、深度业务集成。

### 3.4 选择建议

| 需求 | 选 |
|---|---|
| 包装知识库/简单问答 | 声明式代理（无动作） |
| 让 Copilot 操作业务系统 | 声明式代理 + API 插件 |
| 复杂编排/自有模型/多渠道 | 自定义引擎代理 |

## 4. 上手步骤（有租户后）

### 声明式代理（最快，30 分钟）

1. VS Code → Agents Toolkit 面板 → **Create a New Agent/App** → **Declarative Agent** → **No Action**
2. 生命周期面板点 **Provision**（自动注册+上传）
3. 打开 [m365.cloud.microsoft/chat](https://m365.cloud.microsoft/chat)，在代理列表里找到你的代理对话测试
4. 教程：[用 Agents Toolkit 创建声明式代理](https://learn.microsoft.com/zh-cn/microsoft-365/copilot/extensibility/build-declarative-agents)

### Teams 选项卡应用

1. ATK → Create New App → Tab → React/TS
2. F5 一键调试（ATK 自动起本地服务、配隧道、打开 Teams 网页版）
3. 选项卡里可以用 Teams JS SDK 拿上下文（当前用户、团队、主题）

### 机器人

1. ATK → Create New App → Bot
2. 本地调试走隧道；生产部署到 Azure（Bot Service / App Service）

## 5. D365 开发者视角的提示

- Teams 选项卡 = 一个网页，用 React/TS 写——和 PCF 控件、D365 自定义页面的技术栈一致
- 自适应卡片 ≈ 声明式 UI JSON，和 Power Apps 卡片（Cards）同源
- 机器人开发如果你有 Bot Framework 经验直接迁移；没有的话从 Agents SDK 学起即可
- 应用权限/SSO：Teams 应用支持 Entra SSO，免登体验——配置模式和 D365 嵌入 Canvas App 的 SSO 类似

## 6. 本仓库 Demo 项目索引

本仓库有两个 Agents Toolkit 项目，分别对应上面介绍的两条路线：

| Demo 项目 | 类型 | 对应章节 |
|---|---|---|
| `my-first-agent/` | 声明式代理（Declarative Agent） | §3.1 |
| `teams-tab-app/` | Teams 选项卡应用（Personal Tab） | §4「Teams 选项卡应用」 |

下面逐个讲解目录结构与关键文件，方便对照学习。

---

## 7. Demo 详解：my-first-agent（声明式代理）

> 对应 §3.1 声明式代理。这是「无代码」路线——不需要写任何服务端代码，只需配置指令和清单。

### 7.1 目录结构

```
my-first-agent/
├── appPackage/
│   ├── manifest.json            # Teams 应用清单（v1.30）
│   ├── declarativeAgent.json    # 🌟 声明式代理行为定义
│   ├── instruction.txt          # 🌟 代理的“人设指令”（核心灵魂文件）
│   ├── color.png                # 彩色图标 192×192
│   └── outline.png              # 轮廓图标 32×32
├── env/
│   ├── .env.dev                 # dev 环境变量（共享到租户级）
│   └── .env.local               # local 环境变量（本地调试，已 gitignore）
├── evals/
│   └── prompts.json             # 代理质量评估测试用例
├── .vscode/
│   ├── launch.json              # F5 调试配置（打开浏览器 Copilot 预览）
│   └── tasks.json               # 调试前自动任务（检查→provision）
├── m365agents.yml               # 🌟 主部署流水线（provision + publish）
├── m365agents.local.yml         # 本地调试流水线（简化版）
└── README.md
```

### 7.2 关键文件解读

#### declarativeAgent.json — 代理是什么

```json
{
    "$schema": "...copilot/declarative-agent/v1.8/schema.json",
    "version": "v1.8",
    "name": "my-first-agent${{APP_NAME_SUFFIX}}",
    "instructions": "$[file('instruction.txt')]"
}
```

- `$schema` 指向 Copilot 声明式代理 v1.8 规范
- `instructions` 通过 `$[file(...)]` 语法引用外部 `instruction.txt`
- 没有 API、没有 Bot、没有代码——纯声明式配置

#### instruction.txt — 代理的灵魂

```
You are a helpful assistant for M365 development learning.
Answer questions about Microsoft Graph, SPFx, Teams app development,
and Copilot extensions concisely and accurately.
When unsure, say so rather than guessing.
```

这就是代理的全部“智能”——一段自然语言指令，告诉 Copilot：
- 你是谁（M365 开发学习助手）
- 擅长什么（Graph、SPFx、Teams、Copilot）
- 不确定时怎么做（承认而非猜测）

> 类比：如果 Copilot 是一个全能员工，`instruction.txt` 就是给它的岗位说明书。

#### manifest.json — 与 Tab 应用清单的区别

```json
{
    "copilotAgents": {
        "declarativeAgents": [{
            "id": "declarativeAgent",
            "file": "declarativeAgent.json"
        }]
    }
}
```

关键：清单里声明的是 `copilotAgents.declarativeAgents`，而不是 `staticTabs` 或 `bots`。这告诉 M365 平台：“我是一个 Copilot 代理，不是一个传统 Teams 应用”。

#### m365agents.yml — 部署流水线

| 阶段 | 动作 | 说明 |
|------|------|------|
| provision | `teamsApp/create` → `zipAppPackage` → `validateAppPackage` → `teamsApp/update` → `copilotAgent/publish` | 创建应用 → 打包清单 → 校验 → 更新到 Developer Portal → 发布到租户 |
| publish | 同上但 `scope: tenant` | 发布到租户应用目录（需管理员审批） |

注意：**没有 deploy 阶段**——因为声明式代理没有代码需要部署到服务器。

### 7.3 运行方式

1. VS Code → Agents Toolkit 面板 → 登录 M365 账号
2. 选择 `Preview Local in Copilot (Edge/Chrome)` → F5
3. 自动 provision 到本地环境 → 打开 [m365.cloud.microsoft/chat](https://m365.cloud.microsoft/chat)
4. 在 Copilot 代理列表中找到 `my-first-agent` 开始对话

---

## 8. Demo 详解：teams-tab-app（Teams 选项卡应用）

> 对应 §4「Teams 选项卡应用」。这是「全代码」路线——需要自己写 React 前端 + Express 服务端。

### 8.1 目录结构

```
teams-tab-app/
├── appPackage/
│   ├── manifest.json            # Teams 应用清单（v1.30）
│   ├── color.png / outline.png  # 图标
├── env/
│   ├── .env.dev                 # dev 环境（含 Azure 资源 ID）
│   └── .env.local               # local 环境（本地调试）
├── infra/                       # 🌟 Azure 基础设施即代码
│   ├── azure.bicep              # Bicep 模板（App Service + Plan）
│   └── azure.parameters.json    # Bicep 参数
├── src/                         # 🌟 源代码
│   ├── index.ts                 # 服务端入口（Express + Teams SDK）
│   └── Tab/                     # 前端 Tab 页面
│       ├── client.tsx           # React 入口（挂载 App 组件）
│       ├── App.tsx              # 主组件（调用 teams-js SDK）
│       ├── App.css              # 样式
│       └── vite-env.d.ts        # Vite 类型声明
├── index.html                   # 前端 HTML 模板（Vite 入口）
├── .vscode/
│   ├── launch.json              # F5 调试（6 个配置 + 3 个复合任务）
│   └── tasks.json               # 调试前自动任务链
├── m365agents.yml               # 主部署流水线（provision→deploy→publish）
├── m365agents.local.yml         # 本地调试流水线
├── package.json                 # 依赖 + 脚本
├── vite.config.js               # Vite 配置（前端构建）
├── tsup.config.js               # tsup 配置（服务端构建）
├── tsconfig.json                # TS 根配置（引用 app + node）
├── tsconfig.app.json            # 前端 TS 配置（React JSX）
├── tsconfig.node.json           # 服务端 TS 配置（NodeNext）
├── nodemon.json                 # 开发热重载
├── web.config                   # Azure IIS 路由规则
├── .webappignore                # Azure zip deploy 忽略
└── .gitignore
```

### 8.2 关键文件解读

#### manifest.json — 与声明式代理的区别

```json
{
    "staticTabs": [{
        "entityId": "index0",
        "name": "Home",
        "contentUrl": "${{TAB_ENDPOINT}}/tabs/home",
        "websiteUrl": "${{TAB_ENDPOINT}}/tabs/home",
        "scopes": ["personal", "groupChat", "team"]
    }],
    "validDomains": ["${{TAB_DOMAIN}}"]
}
```

关键区别：
- 声明的是 `staticTabs`（个人选项卡），不是 `copilotAgents`
- `contentUrl` 指向**你自己的服务器**（`${{TAB_ENDPOINT}}/tabs/home`）
- `validDomains` 声明允许加载的域名（本地=localhost，远程=Azure 域名）

> 这就是 Teams Tab 的本质：Teams 只是一个“浏览器外壳”，你的网页通过 iframe 嵌入。

#### src/index.ts — 服务端入口（与 my-first-agent 的最大差异）

```typescript
import { App, ExpressAdapter } from "@microsoft/teams.apps";

// 创建 HTTPS 服务器（Teams 要求 HTTPS）
const adapter = new ExpressAdapter();
const httpsServer = https.createServer(sslOptions, adapter.express);

// 创建 Teams 应用实例
const app = new App({
  httpServerAdapter: adapter,
  skipAuth: true,
});

// 将 /tabs/home 路由映射到前端 SPA
app.tab("home", path.join(__dirname, "./client"));

// 启动服务（默认端口 3978）
await app.start(process.env.PORT || 3978);
```

解读：
- `@microsoft/teams.apps` 是 Teams AI Library v2 的核心包
- `ExpressAdapter` 把 Express 适配成 Teams SDK 的 HTTP 服务器
- `app.tab("home", ...)` 注册一个 Tab 路由，指向 Vite 构建的前端 SPA
- 本地调试时自动处理 SSL 证书（Teams 强制 HTTPS）

#### src/Tab/App.tsx — 前端如何与 Teams 通信

```typescript
import * as teamsJs from "@microsoft/teams-js";

export default function App() {
  React.useEffect(() => {
    teamsJs.app.initialize()              // 阶段1：初始化 SDK
      .then(() => teamsJs.app.getContext()) // 阶段2：获取宿主上下文
      .then((context) => {
        // context.app.host.name = "Teams" | "Outlook" | "M365" 等
        setContent(`Your app is running in ${context.app.host.name}`);
      });
  }, []);
  // ...渲染 UI
}
```

`@microsoft/teams-js` 是 Teams 客户端 JS SDK，提供：
- `app.initialize()` — 建立与 Teams 宿主的通信通道
- `app.getContext()` — 获取当前用户、团队、主题、宿主等上下文
- `pages.config.setConfig()` — 配置 Tab 行为（如共享 URL）

#### infra/azure.bicep — Azure 资源定义

```bicep
resource serverfarm 'Microsoft.Web/serverfarms@2021-02-01' = {
  sku: { name: webAppSku }   // B1 基本层
}
resource webApp 'Microsoft.Web/sites@2021-02-01' = {
  properties: {
    httpsOnly: true           // Teams 强制 HTTPS
    siteConfig: {
      alwaysOn: true
      appSettings: [
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~22' }
      ]
    }
  }
}
output TAB_DOMAIN string = webApp.properties.defaultHostName
output TAB_ENDPOINT string = 'https://${webApp.properties.defaultHostName}'
```

provision 时自动创建 Azure App Service，并把域名回写到 `.env.dev`。

#### 双构建链

| 构建工具 | 编译目标 | 输出 |
|---------|---------|------|
| **tsup**（基于 esbuild） | 服务端 `src/index.ts` | `dist/index.js`（CJS）+ `dist/index.mjs`（ESM） |
| **Vite**（基于 Rollup） | 前端 `src/Tab/client.tsx` | `dist/client/`（HTML + CSS + JS bundle） |

`npm run build` 会先跑 tsup 再跑 Vite，最终 `dist/` 目录结构：
```
dist/
├── index.js          # 服务端 CJS
├── index.mjs         # 服务端 ESM
├── index.d.ts        # 类型声明
└── client/           # 前端 SPA
    ├── index.html
    └── assets/
        ├── index-xxx.css
        └── index-xxx.js
```

#### m365agents.yml vs m365agents.local.yml

| 维度 | m365agents.yml（远程） | m365agents.local.yml（本地） |
|------|----------------------|---------------------------|
| provision | 创建应用 + **部署 Azure 资源** + 打包 + 更新 | 创建应用 + **设置 localhost** + 打包 + 更新 |
| deploy | npm install + build + **zip deploy 到 Azure** | 安装 SSL 证书 + npm install + 生成 .localConfigs |
| publish | 打包 + 发布到 Teams 管理后台 | 无 |
| TAB_DOMAIN | Azure App Service 域名 | `localhost` |
| TAB_ENDPOINT | `https://xxx.azurewebsites.net` | `https://localhost:3978` |

### 8.3 运行方式

#### 本地调试（需 M365 租户 + Copilot 许可证）

1. VS Code 打开 `teams-tab-app/` 文件夹
2. 按 F5 → 选择 `Debug in Teams (Edge)` 或 `(Chrome)`
3. 自动执行任务链：
   - 检查先决条件（Node.js、M365 账号、端口 3978/9239 未被占用）
   - `provision --env local`（创建应用 + 设置 localhost 域名 + 打包清单）
   - `deploy --env local`（安装 SSL 证书 + npm install + 生成 `.localConfigs`）
   - 启动本地 HTTPS 服务（`npm run dev:teamsfx`，端口 3978）
   - 打开 Teams 网页版并自动安装应用
4. 在 Teams 中找到应用，点击 Personal Tab 查看效果

#### 远程部署（需 Azure 订阅）

1. 在 `.env.dev` 填入 `AZURE_SUBSCRIPTION_ID` 和 `AZURE_RESOURCE_GROUP_NAME`
2. ATK 面板点 **Provision** → 创建 Azure App Service（B1 基本层）
3. 点 **Deploy** → 构建 + zip deploy 到 Azure
4. 点 **Publish** → 提交到 Teams 管理后台审批
5. 审批通过后，租户内用户可在 Teams 应用目录搜索安装

---

## 9. 两个 Demo 的架构对比

| 维度 | my-first-agent | teams-tab-app |
|------|---------------|---------------|
| **应用类型** | 声明式代理（Declarative Agent） | Teams Tab 应用（Personal Tab） |
| **有无代码** | 无（纯 JSON 配置 + 文本指令） | 有（React + Express 服务端） |
| **需要服务端** | ❌ 不需要 | ✅ 需要（Express + HTTPS） |
| **构建工具** | 无构建（atk 直接打包） | tsup（服务端）+ Vite（前端） |
| **清单核心字段** | `copilotAgents.declarativeAgents` | `staticTabs` + `validDomains` |
| **部署目标** | Copilot 租户应用目录 | Azure App Service + Teams 应用目录 |
| **infra/** | 无 | 有（Azure Bicep） |
| **宿主范围** | M365 Copilot | Teams / Outlook / M365 应用 |
| **SDK 依赖** | 无 | `@microsoft/teams-js` + `@microsoft/teams.apps` |
| **学习曲线** | 低（30 分钟上手） | 中（需 React + Node.js + Azure 基础） |

> 建议学习顺序：先 `my-first-agent` 理解清单/代理/工具链的基本概念，再 `teams-tab-app` 学习完整的 Teams 应用开发流程。

## 10. 官方资源

- [Teams 开发者文档](https://learn.microsoft.com/zh-cn/microsoftteams/platform/)
- [Agents Toolkit 概述](https://learn.microsoft.com/zh-cn/microsoftteams/platform/toolkit/overview-agents-toolkit)
- [Copilot 扩展性文档](https://learn.microsoft.com/zh-cn/microsoft-365-copilot/extensibility/)
- [Microsoft 365 Agents SDK](https://learn.microsoft.com/zh-cn/microsoft-365/agents-sdk/)
- [声明式代理教程](https://learn.microsoft.com/zh-cn/microsoft-365/copilot/extensibility/build-declarative-agents)
- [Teams AI Library v2](https://aka.ms/teams-ai-library-v2)
- [Teams 示例库（learn.microsoft.com/samples）](https://learn.microsoft.com/zh-cn/samples/browse/?products=m365)
