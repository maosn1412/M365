# PROJECT_LOG · M365 学习项目

## 项目概述

- **目标**：从 D365 CRM 开发转型学习 M365 开发（Microsoft Graph、SPFx/SharePoint、Teams 应用/Copilot 扩展、Outlook 加载项）
- **工作区结构**：
  - `docs/` — 学习文档（00 路线图、01 Graph、02 Teams/Copilot、03 SPFx、04 环境搭建实录、05 资源清单、06–09 集成、10–11 Outlook 加载项）
  - `spfx-hello/spfx-hello/` — SPFx 1.23.2 Minimal（无框架）示例项目（HelloWorld Web 部件）
  - `graph-demo/` — Microsoft Graph SDK 学习 demo（离线冒烟测试 + 真实调用脚本）
  - `my-first-agent/` — Agents Toolkit 声明式代理学习项目
  - `teams-tab-app/` — Agents Toolkit Teams 选项卡（Tab）应用学习项目（React + TS + Vite）
- **本地环境**：nvm-windows 1.2.2 管理 Node（22.23.4 主用 / 20.18.1 / 26.7.0）；VS Code 1.142.0；m365 CLI 11.11.0；atk CLI 1.1.18

## 对话记录

### 2026-10-23 · M365 学习资料整理 + 环境搭建

**完成**：
1. 产出 6 份中文学习文档至 `docs/`（路线图含 D365→M365 知识映射表）
2. 安装 nvm-windows（winget），装 Node 22.23.4 并切换，保留 v26
3. 安装 SPFx 工具链（generator 1.23.2），生成 spfx-hello 示例（Minimal 模板），Heft 编译 + dev server + 证书信任全部验证通过
4. 安装 CLI for Microsoft 365 v11.11.0、Agents Toolkit CLI（atk）1.1.18
5. VS Code 扩展安装完成：Microsoft 365 Agents Toolkit 6.19.x（新 ID `TeamsDevApp.ms-teams-vscode-extension`，Marketplace CDN 慢，改为下载 VSIX 离线安装）+ SPFx Toolkit 4.22.0

**关键发现**：
- SPFx 1.22 引入 Heft 构建链，1.23 起新项目只支持 Heft；本地工作台取消，改为租户托管工作台（无租户只能验证到本地编译）
- SPFx 1.23.2 要求 Node >=22.14 <23
- Agents Toolkit 扩展 ID 变更
- 生成器 `--which-framework react` 参数在 1.23.2 实际无效，模板选择必须交互完成；本项目实际选的是 Minimal

### 2026-10-23（追加）· 无租户本地测试

三方向本地验证全部通过：SPFx 生产打包产出 `spfx-hello.sppkg`；`atk new` 生成 my-first-agent 声明式代理项目且 `atk validate` 清单校验 All passed；graph-demo 离线冒烟测试 6/6 PASS（SDK 认证注入/URL 构造/响应解析），真实调用脚本 list-users.js 就绪。

### 2026-10-27 · 文档与代码审查修正

审查发现并修复以下问题：

**A 类（文档与实物不符）**：
- 修正"React 示例项目"描述 → 实际为 Minimal（无框架）模板（`src/webparts/helloWorld/HelloWorldWebPart.ts` 用 `domElement.innerHTML`，无 React 依赖）
- 修正 Heft 引入版本：1.22 引入，1.23 起强制（非"1.23 起切换"）；SPFx 1.23.0 发布于 2026-05-13（非"2025 年底"）
- 补充托管工作台退役信息：2026-12-01 退役，官方推荐改用 SPFx Debug Toolbar
- 修正 `m365 graph user list` → `m365 entra user list`（前者命令不存在）
- 修正 Git Bash 下 URL 引号：双引号 → 单引号（避免 `$top` 被 shell 展开）
- 标注 Teams Webhook/连接器已退役，官方要求迁移到 Power Automate Workflows

**B 类（生成器占位符未替换）**：
- 填充 spfx-hello README、package-solution.json developer 字段、metadata 描述
- 填充 my-first-agent manifest.json developer/name/description、instruction.txt、evals/prompts.json
- 清理 .npmignore 中不存在的 `/bin`、`/EULA` 引用

**C 类（结构与清洁度）**：
- 删除外层空壳 `spfx-hello/package-lock.json`（89 字节，`"packages": {}`）
- 添加根目录 `.gitignore`（覆盖 node_modules、构建产物、IDE 文件等）
- 添加 `graph-demo/.gitignore`
- 修正 `graph-demo/package.json`：补 description、scripts、author；移除无效的 `"main": "index.js"` 和默认 test 脚本
- 移除 spfx-hello 未使用的 `@fluentui/react` devDependency
- 在 spfx-hello README 补充目录说明（teams/ 图标用途、config/serve.json 占位符）

**待办（需 M365 租户，正式立项）**：
- [ ] 注册 [M365 开发者 E5 沙盒](https://learn.microsoft.com/zh-cn/office/developer-program/microsoft-365-developer-program)
- [ ] Entra 应用注册 + 管理员同意
- [ ] SPFx 托管工作台可视化调试（或改用 Debug Toolbar）
- [ ] Graph 真实调用（`graph-demo/list-users.js`）
- [ ] 声明式代理 Copilot 实测
- [ ] 若需练习 Fluent UI React / PnPjs React 示例，用 React 模板重新生成 SPFx 项目

### 2026-10-30 · VS Code 中 .md 默认以预览打开

**结论**：Markdown All in One 没有「默认以预览模式打开」的开关，它只能通过 `markdown.extension.preview.autoShowPreviewToSide` 在打开 md 时自动弹出**侧边**预览（编辑器仍然是源码视图）。真正的默认预览必须用 VS Code 原生设置。

**已落地**：新建工作区级 `.vscode/settings.json`
- `workbench.editorAssociations`：`"*.md": "vscode.markdown.preview.editor"`
- `workbench.diffEditorAssociations`：`"*.md": "default"`（保证 Git diff 仍用文本编辑器）

**注意点**：
- 预览编辑器只读，编辑需右键标签页 → Reopen Editor With... → Text Editor
- 已打开的 md 标签需关闭重开才生效；若子项目已有 `.vscode/settings.json` 会覆盖工作区根设置
- 想全局生效就把它写进「用户设置 JSON」（Preferences: Open User Settings (JSON)）
- 若装了 vscode-office / Office Viewer 之类会接管 .md 的扩展，需把 `*.md` 指回 `default` 才能恢复原生编辑器

### 2026-10-30（追加）· 用户级设置同步 + 子项目覆盖检查

**已写入两份用户级 settings.json**（均只新增两个键，写前备份到 `%TEMP%`）：
- `C:\Users\mason\AppData\Roaming\Code\User\settings.json`（VS Code）
- `C:\Users\mason\AppData\Roaming\QoderCN\User\settings.json`（Qoder，原本只开了 `markdown.extension.preview.autoShowPreviewToSide`）

两份都加了：`workbench.editorAssociations` → `"*.md": "vscode.markdown.preview.editor"`；`workbench.diffEditorAssociations` → `"*.md": "default"`。

**子项目检查结论（无需修改）**：
- 以 M365 根目录打开时，VS Code **只读取根目录的 `.vscode/settings.json`**，嵌套的 `my-first-agent/.vscode/`、`spfx-hello/spfx-hello/.vscode/` 根本不会被加载 → 不存在覆盖问题
- 单独打开子目录时，子项目 settings 成为工作区设置，但两者都**未定义** `workbench.editorAssociations`，不会阻断用户级配置生效
- 优先级：打开的那个文件夹的 `.vscode` > 用户设置；子项目里的 `typescript.tsdk` / `files.exclude` 也只在其自身作为根目录时生效
- 遗留提醒：若后续想“仓库自带”而非“依赖个人设置”，可在子项目 settings 里手工加同一段（未做，避免三处重复维护）

### 2026-11-03 · Graph Explorer 导出的 HAR 转代码

**问题**：用户在 Graph Explorer 用 Export 导出 `graph.microsoft.com_today_2026-11-03.har`，想知道怎么转成 C# 等语言代码。

**结论**：HAR 只是 HTTP 抓包记录（method/url/headers/postData），不含 Authorization；Graph Explorer 真正的代码生成器是运行请求后的 **Code snippets** 面板，Export 只支持 HAR / Postman。

**已落地**：
- 新增 `tools/har-to-code.js`（零依赖）：读取 HAR → 每条请求生成 6 份代码（C# HttpClient / C# Microsoft.Graph SDK / PowerShell / Python / curl / Node fetch）
- SDK 版会自动把 `$select/$top/$filter/$search/$orderby/$skip/$count` 映射成 `GetAsync(c => c.QueryParameters.Xxx = ...)`；未映射接口给出 RequestInformation 回退提示
- 安全：丢弃 HAR 中的 `Authorization`/`Cookie`，令牌统一从 `GRAPH_ACCESS_TOKEN` 环境变量注入
- `graph-demo/package.json` 增加 `har2code` 脚本（`npm run har2code -- "<har路径>"`，输出固定到 `graph-demo/har-samples/`）
- 用户 HAR（仅 1 条 `GET /v1.0/me`）已转出 6 个样本到 `graph-demo/har-samples/`；另用临时 HAR 验证了带 `$select/$top` 的 GET 和带 JSON body 的 `POST /me/sendMail`（转义/续行符 bug 已修）
- `docs/01-Microsoft-Graph.md` 新增 4.4 节记录三条转换路线与产物说明，并修正 4.1 中“支持导出代码片段”的不准确描述

**坑点**：
- npm run 传参时 `-o/--out` 会被 npm 当配置项解析而报 EUNKNOWNCONFIG，改为把 `--out har-samples` 写进 script 定义、命令行只传位置参数
- GitHub 上 HAR 常带 BOM，脚本先 `replace(/^\uFEFF/,'')` 再 JSON.parse
- C# 拼 JSON body 用 `@"..."` 逐字字符串（引号写 `""`），不能用 `$@"..."`（会要求把 `{` `}` 双写）

### 2026-11-03（追加）· 令牌获取流程 + 示例图

**问题**：用户问“获取用户的 token 是怎么获取的，给一个示例图”。

**结论**：Graph 不签发 token，只校验 `Authorization: Bearer`；token 由 Entra ID（login.microsoftonline.com）按 OAuth 2.0 签发。关键看 JWT 三个字段：`aud`（必须 graph.microsoft.com）、`scp`/`roles`（委托/应用权限）、`exp`。

**已落地**：`docs/01-Microsoft-Graph.md` 新增第 5 章「认证与令牌获取（含示例图）」，原第 5~8 章顺延为 6~9：
- 四种授权流选型表（设备码 / 授权码+PKCE / 客户端凭据 / 交互式浏览器）
- 示例图 A：设备码流 Mermaid 时序图（含 refresh_token 静默续期）
- 示例图 B：客户端凭据流 Mermaid 时序图（对应 graph-demo/list-users.js）
- 无租户时拿 token 的三种办法（Graph Explorer 抓包 token / m365 CLI / 注册应用后代码获取）
- Azure.Identity 两行代码示例 + 原始 HTTP（devicecode/token）PowerShell 示例
- 报错速查表（401/403/AADSTS65001/7000215/700016/authorization_pending）

**坑点**：3 个令牌易错点已写入文档 —— 委托流必须带 `offline_access` 否则无 refresh_token；`authorization_pending` 是正常态不是错误；应用流 token 里是 `roles` 不是 `scp`。

### 2026-11-03（追加）· C# 设备码流完整示例

**问题**：用户要求把「获取用户 token」流程做成可直接运行的 C# Demo（不是代码片段）。

**已落地**：
- 新增 `graph-demo-csharp/` 项目（.NET 10.0 / Azure.Identity 1.14.0 / Microsoft.Graph 5.70.0）
- `Program.cs` 包含两种调用方式对照：
  - 方式 A：Microsoft.Graph SDK（`graphClient.Me.GetAsync()`）
  - 方式 B：HttpClient + 手动 Bearer 头（`credential.GetTokenAsync()` + `HttpClient`）
- 配置从环境变量（`GRAPH_TENANT_ID` / `GRAPH_CLIENT_ID`）或 `appsettings.json` 读取，代码里不硬编码
- 控制台打印设备码提示（verification_uri + user_code + 过期时间），token 只打印长度和前 12 位
- 捕获 `AuthenticationFailedException`，内置 AADSTS 错误码翻译（7000218/65001/65004/700016/501461/650056/50105）
- HTTP 非 2xx 时打印状态码和响应体
- `README.md` 包含完整运行步骤、Entra 应用注册指南、常见错误排查表、「跑不起来时的检查清单」
- `dotnet build` 验证通过（0 警告 / 0 错误）
- `docs/01-Microsoft-Graph.md` 新增 5.7 节「C# 版完整示例」，把时序图阶段与代码调用点对应起来
- `graph-demo-csharp/.gitignore` 排除 bin/obj/*.user/.vs/

**关键设计**：
- `DeviceCodeCredential` 封装了 OAuth 2.0 设备码流的阶段 1+2（申请 device_code / 轮询换 token），用户只需提供 `DeviceCodeCallback` 打印提示语
- token 缓存、过期前刷新、refresh_token 续命全部由 `Azure.Identity` 自动处理，无需手写轮询 HTTP 代码
- 方式 B 显式调用 `credential.GetTokenAsync()` 是为了对照看清 SDK 在背后做了什么

### 2026-11-04 · 创建 Teams Tab 应用示例

**问题**：用户希望有一个传统 Teams 应用（Tab）的开发示例，区别于已有的声明式代理（my-first-agent）。

**已落地**：
- 用 `atk new -c tab -n teams-tab-app -l typescript -i false` 生成 `teams-tab-app/` 项目
- 技术栈：React 19 + TypeScript + Vite 6 + @microsoft/teams-js v2（Teams AI Library v2）
- 服务端入口 `src/index.ts`：用 `@microsoft/teams.apps` 的 `App` + `ExpressAdapter` 启动 HTTPS 服务，托管前端 Tab 页
- 前端入口 `src/Tab/client.tsx` → `App.tsx`：调用 `teamsJs.app.initialize()` + `getContext()` 获取宿主信息
- 双构建链：tsup 编译服务端（`dist/index.js`）+ Vite 编译前端（`dist/client/`）
- 清单校验 `atk validate --env dev` All passed；`npm run build` 构建成功（服务端 1.38KB + 前端 268KB）
- 填充 manifest.json developer/description 占位符（与 my-first-agent 一致）
- infra/ 下有 Azure Bicep 模板，provision 时自动创建 Azure App Service（B1 SKU）

**与现有项目对比**：
| 维度 | my-first-agent | teams-tab-app | spfx-hello |
|------|---------------|---------------|------------|
| 类型 | 声明式代理（无代码） | Teams Tab 应用（全代码） | SPFx Web 部件 |
| 框架 | 无（纯 JSON+TXT | React 19 + Express | 无框架（Minimal） |
| 宿主 | Copilot | Teams/Outlook/M365 | SharePoint |
| 构建 | atk provision 直接打包 | tsup + Vite 双构建 | Heft 单构建 |
| 部署 | 无服务端 | Azure App Service | SharePoint App Catalog |

**待办（需 M365 租户）**：
- [ ] F5 本地调试（自动 provision + 打开 Teams 网页版）
- [ ] Azure 远程 provision + deploy
- [ ] 在 Teams 中侧载测试 Personal Tab

### 2026-11-04（追加）· 文档更新：将 demo 解释写入 docs

**变更内容**：
- `docs/02-Teams应用与Copilot扩展.md`：新增第 6~10 章，包含两个 demo 项目索引、my-first-agent 结构详解（§7）、teams-tab-app 结构详解（§8）、两者架构对比（§9）、官方资源（§10）
- `docs/04-开发环境搭建手册.md`：新增第 5a 节「Teams Tab 应用本地测试记录」，含生成/构建/校验全流程表格、技术栈说明、与 my-first-agent 对比表；待办新增 2 条（F5 调试 + Azure 远程部署）

### 2026-11-09 · 为三篇专题文档添加官方核心文档链接

**变更内容**：
- `docs/01-Microsoft-Graph.md`：一级标题下方添加 Microsoft Graph 文档首页、Graph REST API v1.0 参考、MS Learn 学习路径 3 条官方链接
- `docs/02-Teams应用与Copilot扩展.md`：添加 Teams 开发者文档、Agents Toolkit 文档、Copilot 扩展性文档、Agents SDK 文档 4 条官方链接
- `docs/03-SPFx-SharePoint开发.md`：添加 SPFx 文档首页、SPFx 入门环境搭建、版本兼容性矩阵、PnP 样例库 4 条官方链接
- 所有链接均来自 `learn.microsoft.com` 或 `adoption.microsoft.com`，与文档末尾「官方资源」章节中的链接一致，真实有效

---

### 2026-11-05 · SPFx 文档补充 demo 项目文件结构详解

**变更内容**：
- `docs/03-SPFx-SharePoint开发.md`：新增第 8 章「Demo 项目文件结构详解（spfx-hello）」，原第 8~9 章顺延为 9~10
  - §8.1 项目根目录树（标注源码/构建产物/配置文件）
  - §8.2 config/ 目录 8 个配置文件的逐一说明（config.json、package-solution.json、serve.json 等）
  - §8.3 src/webparts/helloWorld/ 目录（HelloWorldWebPart.ts 关键方法解释、manifest.json 字段说明）
  - §8.4 teams/ 目录（图标命名规则、尺寸要求、打包行为）
  - §8.5 package.json 脚本命令对照表（npm run start/build/clean/eject-webpack）
  - §8.6 构建产物目录关系图（src → lib → dist → .sppkg 的流转过程）

### 2026-11-09（追加）· Outlook 客户信息侧边栏需求评估 + 新增方向六

**需求**：Outlook 邮件中点击按钮，右侧任务窗格展示第三方 SaaS/ERP 客户页面；邮件收到新客户信息或在窗格输入新客户信息后，同步显示匹配客户或新建后的客户。范围限定 Outlook Web + 新版 Outlook。

**结论**：可实现。按钮 + 任务窗格完全可行；读取邮件客户信息可行；窗格内嵌第三方页面有条件（X-Frame-Options / CSP frame-ancestors、第三方 Cookie 限制）。推荐 BFF + 自建窗格 UI，iframe 仅作厂商明确支持时的增强。

**已落地**：
- 新增 `docs/11-Outlook客户信息侧边栏方案评估.md`：可行性分项、方案对比、目标架构、交互与同步机制、风险、19 项信息清单、验收标准、实施阶段
- 新增 `docs/10-Outlook加载项开发.md`：Office.js 对象模型、XML 清单示例、权限模型、SSO/NAA、BFF 与 iframe 限制、侧加载与调试、Integrated Apps 部署、常见坑
- 更新 `docs/00-学习路线图.md`：新增方向六（4 个阶段）、节奏表第 7–8 周、文档导航
- 更新 `docs/05-资源链接清单.md`：新增 Outlook / Office 加载项资源 8 条
- 更新 `README.md`：五大方向、12 篇文档、规划中的 outlook-addin-demo、待办 3 条

**关键技术点**：
- 撰写模式没有正文变化事件，只能防抖轮询 `body.getAsync` 或手动刷新
- `ItemChanged` 依赖宿主支持固定窗格（Web / 新版）
- 撰写模式 `item.from` 为 null，应改用 `to` / `RecipientsChanged`
- `X-Frame-Options: ALLOW-FROM` 已被 Chrome/Edge 忽略，嵌入必须用 CSP `frame-ancestors`
- 默认 `ReadItem`；需要回写邮件才用 `ReadWriteItem`；避免 `ReadWriteMailbox`

**待办（需 M365 租户）**：
- [ ] `outlook-addin-demo` 创建 + 侧加载（Web / 新版 Outlook）
- [ ] Entra 应用注册（SPA `brk-multihub://` 重定向 + Expose an API）+ NAA 联调
- [ ] Integrated Apps 集中部署验证
