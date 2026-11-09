# 03 · SPFx / SharePoint 开发专题

> **微软官方核心文档**  
> - [SharePoint Framework 文档首页](https://learn.microsoft.com/sharepoint/dev/spfx/sharepoint-framework-overview)  
> - [SPFx 入门环境搭建](https://learn.microsoft.com/sharepoint/dev/spfx/set-up-your-development-environment)  
> - [SPFx 版本兼容性矩阵](https://learn.microsoft.com/sharepoint/dev/spfx/compatibility)  
> - [PnP 样例库](https://adoption.microsoft.com/sample-solution-gallery/)

> SPFx（SharePoint Framework）是 SharePoint Online 的官方前端扩展模型。你的 PCF/React 经验直接可用。
> ⚠️ 重大变化：**SPFx 1.22 起引入 Heft 构建链，1.23（2026-05-13 发布）起新项目只支持 Heft**，网上旧教程里的 `gulp serve` 命令已过时，以本文为准。
> 最后更新：2026-10-27

## 1. 架构速览

- SPFx 组件**直接运行在 SharePoint 页面里**（无 iframe），能拿到页面上下文（当前用户、站点、列表）
- 技术栈：TypeScript + React + Fluent UI
- 生成器 1.23.2 提供三种模板：React（本机未用）/ Minimal（无框架，带 loc 本地化文件，本仓库所用）/ No framework（最精简）
- 产物打包为 `.sppkg`，上传到租户/站点的 **App Catalog** 分发
- 同类位置：在 SharePoint 里的角色 ≈ PCF 控件 + 自定义页面在 D365 里的角色

## 2. 组件类型

| 类型 | 说明 | 类比 D365 |
|---|---|---|
| Web 部件（Web Part） | 页面上的可视区块 | 表单上的 PCF 控件 |
| 扩展 - Application Customizer | 页面顶部/底部注入区域 | 全局页头页脚脚本 |
| 扩展 - Field Customizer | 列表字段的自定义渲染 | 字段级 PCF |
| 扩展 - Command Set | 列表工具栏加按钮 | 功能区（Ribbon）按钮 |
| ACE（Adaptive Card Extension） | Viva Connections 仪表板卡片 | — |

## 3. 工具链（SPFx 1.23，本机已验证）

| 工具 | 版本要求 | 用途 |
|---|---|---|
| Node.js | **22.14+ 且 < 23**（每个 SPFx 版本有严格 Node 矩阵，用 nvm 管理） | 运行时 |
| Yeoman + `@microsoft/generator-sharepoint` | 1.23.2 | 脚手架 |
| Heft（`@rushstack/heft`） | 随项目 | 构建/打包/本地服务（**替代 gulp**） |
| CLI for Microsoft 365（`m365`） | 11.x | 租户管理、SPFx 项目升级检查、脚本化 |

版本兼容矩阵务必查官方：[SPFx 版本与 Node 兼容性](https://learn.microsoft.com/zh-cn/sharepoint/dev/spfx/compatibility)

### 关键命令（1.23 Heft 体系）

```bash
# 生成项目（交互示例 —— --which-framework 参数在 1.23.2 实际无效，模板选择必须交互完成）
yo @microsoft/sharepoint
# 交互提示依次选：
#   What is your solution name? → spfx-hello
#   Which type of client-side component? → WebPart
#   What is your Web part name? → HelloWorld
#   Which template would you like to use? → Minimal（本仓库实际选择）/ No framework / React（若要练 Fluent UI）

npm install

# 信任本地调试证书（替代旧 gulp trust-dev-cert）
npx heft trust-dev-cert

# 启动本地调试服务（替代旧 gulp serve）
npm run start        # = heft start --clean

# 打包
npm run build        # = heft test --clean --production && heft package-solution --production
```

## 4. 本地开发流程（重要变化）

旧版（gulp 时代）：`gulp serve` 打开**本地工作台** `https://localhost:4321/temp/workbench.html`，无租户也能调 UI。

**SPFx 1.23（Heft）现状**：
- `npm run start` 启动 webpack-dev-server（`https://localhost:4321`），**只提供 bundle/manifest**
- 工作台改为**托管在租户上**：`https://{租户}.sharepoint.com/_layouts/workbench.aspx?debugManifestsFile=https%3A%2F%2Flocalhost%3A4321%2Ftemp%2Fbuild%2Fmanifests.js&debug=true&noredir=true`
- ⚠️ **托管工作台将于 2026-12-01 退役**（SPFx 1.23 是最后一个支持在线工作台的版本）。官方推荐改用 **SPFx Debug Toolbar**：用带调试参数的 URL 打开**租户内的 SharePoint 站点页面**时，SharePoint 会把该工具栏注入页面（Show info / Show developer dashboard / Stop 等），它取代的是 workbench 这个调试入口，**不改变"需要租户"这个前提**。
- 结论：**可视化调试仍然必须有 SharePoint 租户站点页面**（托管工作台和 Debug Toolbar 只是两种调试入口）；无租户时只能验证编译和 bundle 输出。

项目里的 `config/serve.json` 可改 `initialPage` 指向你的租户。

## 5. 在 SPFx 里调数据

| 数据源 | 方式 |
|---|---|
| SharePoint 列表/库 | `spHttpClient`（内置）或 **PnPjs**（推荐，链式 API） |
| Microsoft Graph | 内置 `MSGraphClientV3`（自动处理令牌，需在 `package-solution.json` 声明 `webApiPermissionRequests` 并由管理员批准） |
| 外部 API | `aadHttpClient`（Entra 保护）或直接 fetch |

```typescript
// PnPjs 示例：读当前站点列表
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";

const sp = spfi().using(SPFx(this.context));
const lists = await sp.web.lists();
```

## 6. PnP 生态（Patterns and Practices，必关注）

| 项目 | 是什么 |
|---|---|
| PnPjs | SPFx 里操作 SharePoint/Graph 的 TS 库 |
| PnP PowerShell | 租户/站点管理脚本 |
| CLI for Microsoft 365 | 跨平台 CLI（本机已装 v11.11.0） |
| SPFx Toolkit（VS Code 扩展） | SPFx 项目管理/升级辅助 |
| PnP 样例库 | 数百个可临摹的开源部件 |

社区站点：[pnp.github.io](https://pnp.github.io/)（样例、视频、月度社区会）

## 7. 打包与部署

1. `npm run build` → 产出 `sharepoint/solution/*.sppkg`
2. 上传到租户 App Catalog（`m365 spo app add --filePath xxx.spkg` 也可）
3. 管理员批准 API 权限申请 → 站点里"添加应用"即可用

## 8. Demo 项目文件结构详解（spfx-hello）

本仓库 `spfx-hello/spfx-hello/` 是一个 SPFx 1.23.2 Minimal（无框架）模板项目，下面逐文件解释其结构和用途。

### 8.1 项目根目录

```
spfx-hello/spfx-hello/
├── config/                  # Heft 构建配置（SPFx 特有）
├── src/                     # 源码目录
├── teams/                   # Teams 图标（打包时复制进 .sppkg）
├── lib/                     # [构建产物] TypeScript 编译输出（ES6 模块）
├── lib-commonjs/            # [构建产物] CommonJS 格式输出
├── dist/                    # [构建产物] 最终打包文件
├── temp/                    # [构建产物] 临时文件（manifest、测试缓存等）
├── release/                 # [构建产物] 发布包解压内容
├── sharepoint/solution/     # [构建产物] 最终 .sppkg 包
├── .vscode/                 # VS Code 工作区配置（launch.json、settings.json）
├── .gitignore               # Git 忽略规则
├── .npmignore               # npm 发布忽略规则
├── .yo-rc.json              # Yeoman 生成器配置（记录生成时的选项）
├── eslint.config.js         # ESLint 代码检查配置
├── package.json             # 项目依赖 + 脚本定义
├── package-lock.json        # 依赖锁定文件
├── tsconfig.json            # TypeScript 编译配置
└── README.md                # 项目说明
```

### 8.2 config/ 目录（Heft 构建配置）

| 文件 | 用途 |
|---|---|
| `config.json` | **核心构建配置**：定义 bundle 入口（`hello-world-web-part`）、组件清单（entrypoint + manifest 映射）、本地化资源路径 |
| `package-solution.json` | **打包配置**：解决方案名称/ID/版本、开发者信息、元数据（描述/截图）、Feature 定义；`skipFeatureDeployment: true` 表示全局可用（无需逐站点启用） |
| `serve.json` | **本地调试服务器配置**：端口 4321、HTTPS 开启、`initialPage` 指向租户工作台（`{tenantDomain}` 占位符需替换为实际租户域名） |
| `typescript.json` | TypeScript 编译选项（目标版本、模块系统等） |
| `sass.json` | SCSS 样式预处理配置 |
| `rig.json` | Rush.js rig 配置（多项目共享构建逻辑） |
| `deploy-azure-storage.json` | Azure Storage 部署配置（可选，用于 CDN 托管） |
| `write-manifests.json` | 清单文件写入配置（CDN 基础 URL） |

### 8.3 src/webparts/helloWorld/ 目录（部件源码）

```
src/webparts/helloWorld/
├── assets/
│   ├── welcome-dark.png     # 深色主题欢迎图
│   └── welcome-light.png    # 浅色主题欢迎图
├── loc/
│   ├── mystrings.d.ts       # 本地化字符串类型定义（声明接口）
│   └── en-us.js             # 英文字符串资源（构建时复制到 lib/）
├── HelloWorldWebPart.ts     # **主部件类**（继承 BaseClientSideWebPart）
├── HelloWorldWebPart.module.scss  # SCSS 模块化样式
└── HelloWorldWebPart.manifest.json  # **部件清单**（ID、版本、支持的宿主、属性面板预配置）
```

**关键文件说明**：

- **HelloWorldWebPart.ts**：部件核心逻辑
  - `render()`：用 `domElement.innerHTML` 渲染 HTML（Minimal 模板特征，无 React）
  - `onInit()`：初始化钩子，获取环境消息（判断运行在 SharePoint/Teams/Office/Outlook）
  - `onThemeChanged()`：主题切换响应（深色/浅色模式）
  - `getPropertyPaneConfiguration()`：属性面板配置（侧边栏编辑区）

- **HelloWorldWebPart.manifest.json**：
  - `id`：部件唯一标识（GUID），`teams/` 目录下的图标以此命名
  - `supportedHosts`：声明可在哪些宿主运行（SharePointWebPart、TeamsPersonalApp、TeamsTab 等）
  - `preconfiguredEntries`：拖入页面时的默认属性值

### 8.4 teams/ 目录

```
teams/
├── adf29d47-ca68-402c-84d1-3f1883893615_color.png    # 彩色图标（192×192）
└── adf29d47-ca68-402c-84d1-3f1883893615_outline.png  # 轮廓图标（32×32）
```

- 文件名 = 部件 manifest 中的 `id`
- **打包时原样复制进 `.sppkg` 的 `ClientSideAssets/`**，用于 Teams 宿主显示
- 替换图标需保持相同尺寸和命名

### 8.5 package.json 脚本命令

| 命令 | 等价于 | 用途 |
|---|---|---|
| `npm run start` | `heft start --clean` | 启动本地开发服务器（https://localhost:4321） |
| `npm run build` | `heft test --clean --production && heft package-solution --production` | 生产打包（测试 + 编译 + 生成 .sppkg） |
| `npm run clean` | `heft clean` | 清理构建产物 |
| `npm run eject-webpack` | `heft eject-webpack` | 导出 webpack 配置供自定义修改（高级用法） |

### 8.6 构建产物目录关系

```
源码 (src/)
  ↓ TypeScript 编译
lib/              ← ES6 模块格式
lib-commonjs/     ← CommonJS 格式（Node.js 兼容）
  ↓ Webpack 打包
dist/             ← 最终 bundle（.js + .css + assets）
  ↓ 打包为解决方案
sharepoint/solution/spfx-hello.sppkg  ← 可上传到 App Catalog 的安装包
```

> 💡 `temp/` 目录存放中间产物（如合并后的 manifest.js），`release/` 是 `.sppkg` 解压后的内容（用于调试包结构）。这两个目录通常不需要手动修改。

## 9. 上手实验清单

1. ✅ 已就绪：本仓库 `spfx-hello/spfx-hello` 项目（Minimal/无框架模板，SPFx 1.23.2）。注意：当前骨架用 `domElement.innerHTML` 渲染，**没有 React**。若要练 Fluent UI React 组件 / PnPjs React 示例，需重新用 React 模板生成项目（生成器交互选 React）。
2. 有租户后：改 `config/serve.json` 指向沙盒租户 → `npm run start` → 浏览器打开托管工作台 → 添加 HelloWorld 部件（⚠️ 托管工作台 2026-12-01 退役，届时改用 SPFx Debug Toolbar）
3. 给部件加属性面板字段（`getPropertyPaneConfiguration`）
4. 装 PnPjs 读站点列表标题渲染出来
5. 用 MSGraphClientV3 读 `/me` 显示当前用户
6. 打包 `.sppkg` 上传到 App Catalog 真机部署

## 10. 官方资源

- [SPFx 文档首页](https://learn.microsoft.com/zh-cn/sharepoint/dev/spfx/sharepoint-framework-overview)
- [SPFx 入门（官方教程）](https://learn.microsoft.com/zh-cn/sharepoint/dev/spfx/set-up-your-development-environment)
- [SPFx 版本兼容矩阵](https://learn.microsoft.com/zh-cn/sharepoint/dev/spfx/compatibility)
- [PnP 样例库](https://adoption.microsoft.com/en-us/sample-solution-gallery/)
- [M365 开发者博客（SPFx 路线图更新）](https://devblogs.microsoft.com/microsoft365dev/)
