# 09 · Power Platform 集成方案

> Power Platform（Power Automate、Power Apps、Power BI、Copilot Studio）是 D365 和 M365 之间最自然的集成桥梁——它们共享同一个 Dataverse 数据层、同一个 Entra ID 身份体系。本章讲解如何用 Power Platform 实现各种集成场景。

## 1. Power Platform 在集成中的定位

```
┌─────────────────────────────────────────────────────────┐
│                    集成架构层次                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  用户体验层                                       │    │
│  │  Power Apps（Canvas / Model-driven / Pages）     │    │
│  │  Teams 选项卡 / SharePoint Web 部件              │    │
│  │  Copilot（M365 Copilot / Copilot Studio）       │    │
│  └─────────────────────┬───────────────────────────┘    │
│                        │                                │
│  ┌─────────────────────┴───────────────────────────┐    │
│  │  业务逻辑层                                       │    │
│  │  Power Automate（云流 / 桌面流）                   │    │
│  │  Dataverse 插件 / 自定义 API                      │    │
│  │  Azure Functions（复杂逻辑）                       │    │
│  └─────────────────────┬───────────────────────────┘    │
│                        │                                │
│  ┌─────────────────────┴───────────────────────────┐    │
│  │  数据层                                           │    │
│  │  Dataverse（D365 CRM 数据）                       │    │
│  │  SharePoint / OneDrive（文档）                    │    │
│  │  Exchange（邮件 / 日历）                          │    │
│  │  Teams（消息 / 频道）                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  分析层                                           │    │
│  │  Power BI（报表 / 仪表板）                        │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**核心优势**：Power Platform 的各组件天然互通，不需要额外配置认证、连接——你在 D365 CRM 里积累的 Power Platform 经验直接可用。

## 2. Power Automate 集成方案

### 2.1 连接器概览

Power Automate 通过"连接器"（Connector）访问各种服务：

| 连接器 | 访问目标 | 集成用途 |
|---|---|---|
| **Dataverse** | Dataverse 表、行 | CRM 数据的 CRUD 触发和动作 |
| **Office 365 Outlook** | Exchange 邮件 | 邮件收发、日历管理 |
| **SharePoint** | SharePoint 站点、列表、文档库 | 文档管理、列表数据操作 |
| **Microsoft Teams** | Teams 消息、频道、团队 | 通知、消息发送、团队管理 |
| **OneDrive for Business** | 用户的 OneDrive | 个人文件存储 |
| **Planner** | 任务和计划 | 项目管理集成 |
| **HTTP** | 任意 REST API | 调用 Graph API、Dataverse Web API 或外部 API |

### 2.2 常见集成流模式

#### 模式 1：Dataverse 触发 → M365 动作

```
场景：新客户创建时，自动在 SharePoint 创建项目文件夹并通知团队

触发器：Dataverse — When a row is added (表 = account)
   ↓
动作 1：SharePoint — Create new folder（在"客户项目"文档库）
   ↓
动作 2：Teams — Post message in a chat or channel（通知销售团队）
   ↓
动作 3：Outlook — Send an email（给客户发欢迎邮件）
```

#### 模式 2：M365 触发 → Dataverse 动作

```
场景：收到客户邮件时，自动在 CRM 创建跟进记录

触发器：Outlook — When a new email arrives (V2)
   ↓
条件：发件人域名在 CRM 客户列表里？
   ↓
是 → Dataverse — List rows（查找匹配的客户）
   ↓
Dataverse — Add a new row（表 = phonecall，创建跟进任务）
   ↓
Teams — Post message（通知负责销售）
```

#### 模式 3：定时轮询 → 双向同步

```
场景：每天凌晨同步 SharePoint 客户文档清单到 CRM

触发器：Recurrence — 每天 00:00
   ↓
SharePoint — Get items（获取文档库所有项目）
   ↓
Dataverse — List rows（获取 CRM 里已有的文档记录）
   ↓
循环比较：
  - 新增的 → Dataverse — Add a new row
  - 更新的 → Dataverse — Update a row
  - 删除的 → Dataverse — Delete a row
```

### 2.3 调用 Graph API（HTTP 连接器）

当内置连接器不够用时，用 HTTP 连接器直接调 Graph API：

```
动作：HTTP — HTTP
   方法：GET
   URI：https://graph.microsoft.com/v1.0/me/messages?$top=10
   标头：
     Authorization: Bearer @{body('获取Graph令牌')?['access_token']}
   身份验证：Active Directory OAuth
     受众：https://graph.microsoft.com
     客户端 ID：your-app-client-id
     凭据：your-app-client-secret
     租户 ID：your-tenant-id
```

**注意**：Power Automate 里调 Graph API 需要先在 Entra 里注册一个应用并授予相应权限。

### 2.4 桌面流（Power Automate Desktop）

用于集成传统桌面应用或本地系统：

| 场景 | 实现 |
|---|---|
| 从本地 ERP 系统导数据到 Dataverse | 桌面流读取 ERP 数据库 → 写入 Dataverse |
| 自动操作 CRM 客户端（旧版） | 桌面流模拟用户在 CRM 客户端里的操作 |
| 处理本地文件后上传到 SharePoint | 桌面流监控本地文件夹 → 处理文件 → 上传 SharePoint |

## 3. Power Apps 集成方案

### 3.1 Canvas App 跨系统体验

Canvas App 可以同时连接 Dataverse 和 M365 数据源，在一个应用里提供统一体验：

```
┌─────────────────────────────────────┐
│         Canvas App 界面              │
│                                     │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ 客户信息  │  │ 最近邮件          │ │
│  │(Dataverse)│  │ (Outlook 连接器)  │ │
│  └──────────┘  └──────────────────┘ │
│                                     │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ 相关文档  │  │ 团队聊天          │ │
│  │(SharePoint│  │ (Teams 连接器)    │ │
│  │ 连接器)   │  │                  │ │
│  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────┘
```

**数据源配置**：
1. 在 Canvas App 里添加数据源
2. 选择 Dataverse（CRM 数据）
3. 选择 Office 365 Outlook（邮件数据）
4. 选择 SharePoint（文档数据）
5. 所有连接器自动使用当前登录用户的身份——不需要额外配置认证

### 3.2 Model-driven App 嵌入 M365 数据

Model-driven App 里可以通过 Virtual Table 或嵌入控件展示 M365 数据：

| 方式 | 说明 |
|---|---|
| Virtual Table | 把 SharePoint/Graph 数据映射为 Dataverse 表，在视图和表单里直接显示 |
| IFRAME 嵌入 | 在表单里嵌入 SharePoint 页面、Power BI 报表或 Teams 频道 |
| PCF 控件 | 自定义控件调 Graph API，展示 M365 数据（如 Teams 消息列表） |
| 子网格 + 关联 | 通过 Dataverse 关系把 M365 数据（Virtual Table）关联到 CRM 记录 |

### 3.3 Power Apps 作为 Teams 选项卡

把 Canvas App 直接嵌入 Teams，作为团队的工作台：

```
Teams 团队
   ↓
添加选项卡 → 选择 Power Apps
   ↓
选择你做的 Canvas App（数据源是 Dataverse + M365）
   ↓
团队成员在 Teams 里直接使用——不需要切换到 D365 应用
```

**适用场景**：
- 销售团队在 Teams 里查看客户信息、跟进记录
- 项目团队在 Teams 里管理任务（Dataverse）和文档（SharePoint）
- 客服团队在 Teams 里处理工单（D365 Customer Service）

## 4. Power BI 集成分析

### 4.1 连接 Dataverse + M365 数据

Power BI 可以同时连接多个数据源，做跨系统分析：

| 数据源 | 连接器 | 典型用途 |
|---|---|---|
| Dataverse | Dataverse 连接器 | CRM 销售数据、客户数据、工单数据 |
| SharePoint | SharePoint 连接器 | 文档使用统计、项目进度 |
| Excel Online | Excel Online (Business) 连接器 | 手工维护的报表数据 |
| Teams | 通过 Graph API | 团队活跃度、消息统计 |
| Outlook | Office 365 Outlook 连接器 | 邮件处理效率 |

### 4.2 跨系统报表示例

```
┌─────────────────────────────────────────────────────┐
│              客户 360 度仪表板                         │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │ 销售漏斗      │  │ 客户满意度    │  │ 邮件互动    ││
│  │ (Dataverse   │  │ (Dataverse   │  │ (Outlook   ││
│  │  Opportunity)│  │   Survey)    │  │  邮件统计)  ││
│  └──────────────┘  └──────────────┘  └────────────┘│
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │ 文档协作      │  │ 团队参与度    │  │ 任务完成率  ││
│  │ (SharePoint  │  │ (Teams       │  │ (Planner   ││
│  │  文档数)     │  │  消息数)     │  │  任务)     ││
│  └──────────────┘  └──────────────┘  └────────────┘│
└─────────────────────────────────────────────────────┘
```

### 4.3 嵌入式分析

Power BI 报表可以嵌入到 D365 CRM 和 M365 应用里：

| 嵌入位置 | 方式 |
|---|---|
| Model-driven App 表单 | 添加 Power BI 组件到表单 |
| SharePoint 页面 | 嵌入 Power BI Web 部件 |
| Teams 选项卡 | 添加 Power BI 选项卡 |
| Power Apps Canvas | 嵌入 Power BI 磁贴 |

## 5. Copilot Studio 集成

### 5.1 声明式代理（Declarative Agent）

Copilot Studio 可以创建接入 D365 和 M365 数据的 AI 助手：

```
┌─────────────────────────────────────────┐
│           Copilot / Copilot Studio      │
│                                         │
│  用户提问："客户 A 最近的工单处理情况"      │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  API 插件 / 知识源               │    │
│  │                                 │    │
│  │  · Dataverse（工单数据）         │    │
│  │  · SharePoint（相关文档）        │    │
│  │  · Outlook（客户邮件）           │    │
│  │  · Teams（相关讨论）             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  回答：综合多个数据源生成回答              │
└─────────────────────────────────────────┘
```

### 5.2 在 Teams 里使用 Copilot

- 用户可以在 Teams 里 @ 自定义 Copilot，提问关于 CRM 数据的问题
- Copilot 通过 API 插件调 Dataverse Web API 获取数据
- 回答直接在 Teams 聊天里展示——不需要切换到 D365 应用

## 6. 集成方案选择决策树

```
需要集成什么？
│
├─ 数据同步（自动）
│   │
│   ├─ 简单规则 → Power Automate 云流
│   ├─ 复杂逻辑 → Azure Functions + Graph/Dataverse API
│   └─ 实时双向 → Server-Side Sync（邮件/日历）或 Virtual Table
│
├─ 用户体验（统一入口）
│   │
│   ├─ 移动端优先 → Power Apps Canvas App
│   ├─ Teams 内使用 → Power Apps 嵌入 Teams 选项卡
│   ├─ SharePoint 内使用 → SPFx Web 部件
│   └─ AI 助手 → Copilot Studio 声明式代理
│
├─ 数据分析
│   │
│   ├─ 自助报表 → Power BI Desktop
│   ├─ 嵌入式分析 → Power BI 嵌入到 CRM/Teams/SharePoint
│   └─ 实时监控 → Power BI 流数据集 + 仪表板
│
└─ 文档管理
    │
    ├─ 基于记录管理 → SharePoint 集成（开箱即用）
    ├─ 在 CRM 里查询文档 → Virtual Table
    └─ 个人文档 → OneDrive 集成
```

## 7. 最佳实践

| 实践 | 说明 |
|---|---|
| 优先用内置连接器 | Power Automate 的 Dataverse/SharePoint/Teams 连接器已经处理了认证和错误——不要自己用 HTTP 连接器重复造轮子 |
| 流要幂等 | 网络重试可能导致流重复执行——用唯一键判断是否已处理 |
| 错误处理要完善 | Power Automate 有内置的"配置运行后操作"——失败时发通知、记录日志 |
| 环境变量管理连接 | 用 Power Platform 的环境变量管理 API 地址、客户端 ID——不要硬编码在流里 |
| 解决方案管理 | 把流、应用、连接引用都放在同一个解决方案里——方便跨环境部署 |
| 监控和审计 | 开启 Power Platform 的审计日志，定期查看流的运行历史 |

## 8. 本章小结

- Power Platform 是 D365 和 M365 集成的天然桥梁——共享 Dataverse、Entra ID、连接器
- Power Automate 处理自动化流程（数据同步、通知、触发）
- Power Apps 提供统一用户体验（跨 CRM 和 M365 数据）
- Power BI 做跨系统分析（360 度视图）
- Copilot Studio 做 AI 助手（自然语言查询多系统数据）
- 选择方案时按需求分类：数据同步 / 用户体验 / 数据分析 / 文档管理
