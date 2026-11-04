# M365 开发学习项目

> 从 D365 CRM 开发转型学习 Microsoft 365 开发的完整实践项目——涵盖 Microsoft Graph、SPFx、Teams 应用、Copilot 扩展四大方向，每个方向配有学习文档 + 可运行的 Demo 代码。

## 项目目标

- 把 D365 开发经验（Dataverse、Entra ID、Power Platform）迁移到 M365 开发体系
- 每个学习方向都有**可动手运行的示例代码**，不只是文档
- 最终目标：能独立完成 Teams 应用 / Copilot 扩展的开发、调试、部署全流程

## 技术栈

| 类别 | 技术 |
|------|------|
| 语言 | TypeScript、C#、PowerShell、JavaScript |
| 前端框架 | React 19、Fluent UI |
| 构建工具 | Vite 6、tsup、Heft（SPFx） |
| 服务端 | Node.js 22 + Express、.NET 10 |
| SDK | Microsoft Graph SDK v5、@microsoft/teams-js v2、Azure.Identity |
| 工具链 | Agents Toolkit CLI（atk）1.1.18、CLI for M365（m365）11.11.0 |
| 包管理 | npm 10.x、NuGet |

## 目录结构

```
M365/
├── docs/                           # 📚 学习文档（9 篇，从入门到集成）
│   ├── 00-学习路线图.md             #    总览：D365→M365 知识映射 + 5 方向学习路径
│   ├── 01-Microsoft-Graph.md        #    Graph API 专题（认证、SDK、HAR 转代码）
│   ├── 02-Teams应用与Copilot扩展.md #    Teams/Copilot 专题（含两个 Demo 详解）
│   ├── 03-SPFx-SharePoint开发.md    #    SPFx 专题（Web 部件、扩展、Fluent UI）
│   ├── 04-开发环境搭建手册.md       #    本机环境搭建实录（版本号 + 踩坑记录）
│   ├── 05-资源链接清单.md           #    官方/社区学习资源汇总
│   ├── 06-M365与D365集成概述.md     #    集成全景架构
│   ├── 07-数据集成与同步.md         #    邮件/文档/日历/Teams 数据同步方案
│   ├── 08-统一身份与认证.md         #    Entra ID 单点登录与跨系统认证
│   └── 09-Power-Platform集成方案.md #    Power Automate/Apps/BI 做集成桥梁
│
├── graph-demo/                     # 🟢 Microsoft Graph SDK 学习 Demo（Node.js）
│   ├── offline-smoke-test.js       #    离线冒烟测试（6 项验证）
│   ├── list-users.js               #    真实调用脚本（需配置租户）
│   ├── har-output/                 #    Graph Explorer 导出的 HAR 文件
│   └── har-samples/                #    HAR 转出的多语言代码样本
│
├── graph-demo-csharp/              # 🟢 Microsoft Graph SDK 学习 Demo（C#）
│   ├── Program.cs                  #    设备码流完整示例（SDK + HTTP 两种方式对照）
│   ├── appsettings.json            #    配置文件（TenantId/ClientId）
│   └── README.md                   #    运行步骤 + 错误排查指南
│
├── my-first-agent/                 # 🔵 声明式代理 Demo（Copilot 扩展）
│   ├── appPackage/
│   │   ├── manifest.json           #    Teams 应用清单（v1.30）
│   │   ├── declarativeAgent.json   #    代理行为定义
│   │   └── instruction.txt         #    代理指令（"M365 开发学习助手"）
│   ├── m365agents.yml              #    部署流水线（provision + publish）
│   └── evals/prompts.json          #    代理质量评估测试用例
│
├── teams-tab-app/                  # 🟣 Teams 选项卡应用 Demo（传统 Teams 应用）
│   ├── src/
│   │   ├── index.ts                #    服务端入口（Express + Teams SDK）
│   │   └── Tab/                    #    前端 React SPA
│   │       ├── client.tsx          #        React 入口
│   │       └── App.tsx             #        主组件（调用 teams-js 获取上下文）
│   ├── appPackage/manifest.json    #    Teams 应用清单（含 staticTabs 定义）
│   ├── infra/azure.bicep           #    Azure 资源模板（App Service）
│   ├── m365agents.yml              #    部署流水线（provision + deploy + publish）
│   └── vite.config.js              #    前端构建配置
│
├── spfx-hello/spfx-hello/          # 🟠 SPFx Web 部件 Demo（SharePoint）
│   ├── src/webparts/helloWorld/    #    HelloWorld Web 部件源码
│   ├── config/                     #    SPFx 配置（serve/deploy/package）
│   └── sharepoint/solution/        #    打包产物（.sppkg）
│
├── tools/                          # 🔧 辅助工具
│   └── har-to-code.js              #    HAR 转多语言代码（零依赖）
│
├── .gitignore
├── PROJECT_LOG.md                  # 📝 项目日志（每次对话的关键记录）
└── README.md                       # 📖 本文件
```

## Demo 项目速览

| 项目 | 类型 | 技术栈 | 需要租户 | 当前状态 |
|------|------|--------|---------|---------|
| `graph-demo` | Graph API 调用 | Node.js + Graph SDK | 部分（离线测试不需要） | ✅ 离线冒烟测试 6/6 PASS |
| `graph-demo-csharp` | Graph API 调用 | C# + Azure.Identity + Graph SDK | 是（需 Entra 应用注册） | ✅ 构建通过，待租户实测 |
| `my-first-agent` | Copilot 声明式代理 | 无代码（JSON + TXT 配置） | 是（需 Copilot 许可证） | ✅ 清单校验 All passed |
| `teams-tab-app` | Teams Personal Tab | React 19 + Express + Vite | 是（需 M365 租户） | ✅ 构建通过 + 清单校验 All passed |
| `spfx-hello` | SharePoint Web 部件 | SPFx 1.23.2（Heft + Minimal） | 是（需 SharePoint 租户） | ✅ 生产打包产出 .sppkg |

## 快速开始

### 环境要求

- **Node.js** >= 22.14 < 23（推荐用 nvm-windows 管理多版本）
- **npm** >= 10.x
- **.NET** 10.0+（仅 `graph-demo-csharp` 需要）
- **VS Code** + 扩展：Microsoft 365 Agents Toolkit、SPFx Toolkit
- **CLI 工具**：`atk`（Agents Toolkit CLI）、`m365`（CLI for M365）

详细搭建步骤见 [docs/04-开发环境搭建手册.md](docs/04-开发环境搭建手册.md)。

### 运行 Demo

```bash
# 1. Graph Demo（离线测试，不需要租户）
cd graph-demo
npm install
node offline-smoke-test.js

# 2. Graph Demo C#（需要 Entra 应用注册）
cd graph-demo-csharp
dotnet run

# 3. SPFx Hello（需要 SharePoint 租户才能可视化调试）
cd spfx-hello/spfx-hello
npm install
npm run build        # 生产打包

# 4. Teams Tab App（需要 M365 租户 + Copilot 许可证）
cd teams-tab-app
npm install
npm run build        # 构建验证
# F5 一键调试需要 VS Code + Agents Toolkit 扩展

# 5. My First Agent（需要 M365 租户 + Copilot 许可证）
cd my-first-agent
atk validate --env dev   # 清单校验（需先设置 TAB_ENDPOINT/TAB_DOMAIN）
```

## 文档导航

### M365 基础
- [01-Microsoft-Graph.md](docs/01-Microsoft-Graph.md) — Graph API 专题
- [02-Teams应用与Copilot扩展.md](docs/02-Teams应用与Copilot扩展.md) — Teams/Copilot 专题（含 Demo 详解）
- [03-SPFx-SharePoint开发.md](docs/03-SPFx-SharePoint开发.md) — SPFx 专题

### D365 ↔ M365 集成
- [06-M365与D365集成概述.md](docs/06-M365与D365集成概述.md) — 集成全景
- [07-数据集成与同步.md](docs/07-数据集成与同步.md) — 数据同步方案
- [08-统一身份与认证.md](docs/08-统一身份与认证.md) — Entra ID 认证详解
- [09-Power-Platform集成方案.md](docs/09-Power-Platform集成方案.md) — Power Platform 集成

### 工具与环境
- [00-学习路线图.md](docs/00-学习路线图.md) — D365→M365 知识映射 + 学习路径
- [04-开发环境搭建手册.md](docs/04-开发环境搭建手册.md) — 本机环境实录
- [05-资源链接清单.md](docs/05-资源链接清单.md) — 学习资源汇总

## 待办事项

### 需要 M365 租户后才能完成

- [ ] 注册 [M365 开发者 E5 沙盒](https://learn.microsoft.com/zh-cn/office/developer-program/microsoft-365-developer-program)
- [ ] Entra 应用注册 + 管理员同意
- [ ] `graph-demo` 真实调用测试（`list-users.js`）
- [ ] `graph-demo-csharp` 设备码流实测
- [ ] `spfx-hello` 托管工作台可视化调试（⚠️ 2026-12-01 退役，届时改用 Debug Toolbar）
- [ ] `my-first-agent` 在 Copilot 中实际对话测试
- [ ] `teams-tab-app` F5 本地调试 + Teams 中侧载测试
- [ ] `teams-tab-app` Azure 远程 provision + deploy

## 许可证

本项目仅供学习参考使用。
