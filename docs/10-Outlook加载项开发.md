# 10 · Outlook 加载项（Office Add-ins）开发

> 最后更新：2026-11-09
> 面向读者：有 D365 / Web 开发经验，需要在 Outlook 内实现自定义按钮、任务窗格、邮件上下文读取与外部系统集成的开发者。
> 配套需求评估：[11-Outlook客户信息侧边栏方案评估.md](11-Outlook客户信息侧边栏方案评估.md)

## 1. Outlook 加载项是什么

Outlook 加载项是用 Web 技术（HTML/JS/CSS）编写、运行在 Outlook 内的扩展。它通过 **Office.js** 访问当前邮件、收件人、附件等上下文，通过清单（manifest）声明按钮、任务窗格和权限。

### 1.1 与相关技术对比

| 维度 | Outlook 加载项（Office Add-ins） | VSTO 加载项 | Teams 应用 | D365 App for Outlook |
|---|---|---|---|---|
| 技术 | Office.js + Web | .NET + COM | Teams manifest + bot/tab | 微软托管（内置） |
| 平台 | Web / 新版 / 经典 Windows / Mac | 仅 Windows 桌面 | Teams / Outlook / M365 | Outlook |
| 分发 | Integrated Apps / AppSource / 侧加载 | ClickOnce / MSI | Teams 管理中心 / 商店 | D365 一键部署 |
| 适用 | 自定义邮件工作流 | 深度桌面集成（旧方案） | 协作与对话场景 | 标准 CRM 邮件同步 |

**选型提示**：如果只需要标准的"邮件关联到 CRM 记录 + 侧边栏看 CRM 信息"，优先用 D365 App for Outlook；需要自定义匹配、创建和第三方系统集成时，才开发自定义加载项。

### 1.2 本方向的范围

- 宿主：Outlook Web、新版 Outlook
- 形态：功能区按钮 + 右侧任务窗格（Task Pane）
- 能力：读取邮件上下文、调用后端 API、SSO 认证、集中部署

## 2. 扩展点与清单

### 2.1 常见扩展点

| 扩展点 | 作用 | 典型用法 |
|---|---|---|
| `MessageReadCommandSurface` | 阅读邮件时的功能区按钮 | 打开客户信息窗格 |
| `MessageComposeCommandSurface` | 撰写邮件时的功能区按钮 | 打开客户选择/新建窗格 |
| `ShowTaskpane` | 点击按钮打开任务窗格 | 主交互界面 |
| `SupportsPinning` | 允许任务窗格固定 | 阅读模式下切换邮件不关闭窗格 |
| `ExecuteFunction` | 按钮直接执行 JS 函数 | 轻量操作（如快速标记） |

### 2.2 最小清单示例（XML）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp
  xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
  xmlns:mailappor="http://schemas.microsoft.com/office/mailappversionoverrides/1.0"
  xsi:type="MailApp">
  <Id>00000000-0000-0000-0000-000000000000</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>Contoso</ProviderName>
  <DefaultLocale>zh-CN</DefaultLocale>
  <DisplayName DefaultValue="客户360"/>
  <Description DefaultValue="在右侧窗格查看和创建 ERP 客户"/>
  <IconUrl DefaultValue="https://localhost:3000/assets/icon-64.png"/>
  <HighResolutionIconUrl DefaultValue="https://localhost:3000/assets/icon-128.png"/>
  <SupportUrl DefaultValue="https://contoso.com/support"/>
  <Hosts>
    <Host Name="mailbox"/>
  </Hosts>
  <Requirements>
    <Sets>
      <Set Name="Mailbox" MinVersion="1.5"/>
    </Sets>
  </Requirements>
  <FormSettings>
    <Form xsi:type="ItemRead">
      <DesktopSettings>
        <SourceLocation DefaultValue="https://localhost:3000/taskpane.html"/>
        <RequestedHeight>250</RequestedHeight>
      </DesktopSettings>
    </Form>
    <Form xsi:type="ItemEdit">
      <DesktopSettings>
        <SourceLocation DefaultValue="https://localhost:3000/taskpane.html"/>
      </DesktopSettings>
    </Form>
  </FormSettings>
  <Permissions>ReadItem</Permissions>
  <Rule xsi:type="RuleCollection" Mode="Or">
    <Rule xsi:type="ItemIs" ItemType="Message" FormType="Read"/>
    <Rule xsi:type="ItemIs" ItemType="Message" FormType="Edit"/>
  </Rule>
  <VersionOverrides xmlns="http://schemas.microsoft.com/office/mailappversionoverrides"
                    xsi:type="VersionOverridesV1_0">
    <Requirements>
      <bt:Sets DefaultMinVersion="1.3">
        <bt:Set Name="Mailbox"/>
      </bt:Sets>
    </Requirements>
    <Hosts>
      <Host xsi:type="MailHost">
        <DesktopFormFactor>
          <FunctionFile resid="Commands.Url"/>
          <ExtensionPoint xsi:type="MessageReadCommandSurface">
            <OfficeTab id="TabDefault">
              <Group id="msgReadGroup">
                <Label resid="groupLabel"/>
                <Control xsi:type="Button" id="msgReadOpenPaneButton">
                  <Label resid="paneButtonLabel"/>
                  <Supertip>
                    <Title resid="paneButtonLabel"/>
                    <Description resid="paneButtonTooltip"/>
                  </Supertip>
                  <Icon>
                    <bt:Image size="16" resid="icon16"/>
                    <bt:Image size="32" resid="icon32"/>
                    <bt:Image size="80" resid="icon80"/>
                  </Icon>
                  <Action xsi:type="ShowTaskpane">
                    <TaskpaneId>CustomerPane</TaskpaneId>
                    <SourceLocation resid="taskpaneUrl"/>
                    <SupportsPinning>true</SupportsPinning>
                  </Action>
                </Control>
              </Group>
            </OfficeTab>
          </ExtensionPoint>
          <!-- 撰写模式：复制一份 ExtensionPoint，
               xsi:type 改为 MessageComposeCommandSurface -->
        </DesktopFormFactor>
      </Host>
    </Hosts>
    <Resources>
      <bt:Images>
        <bt:Image id="icon16" DefaultValue="https://localhost:3000/assets/icon-16.png"/>
        <bt:Image id="icon32" DefaultValue="https://localhost:3000/assets/icon-32.png"/>
        <bt:Image id="icon80" DefaultValue="https://localhost:3000/assets/icon-80.png"/>
      </bt:Images>
      <bt:Urls>
        <bt:Url id="Commands.Url" DefaultValue="https://localhost:3000/commands.html"/>
        <bt:Url id="taskpaneUrl" DefaultValue="https://localhost:3000/taskpane.html"/>
      </bt:Urls>
      <bt:ShortStrings>
        <bt:String id="groupLabel" DefaultValue="客户工具"/>
        <bt:String id="paneButtonLabel" DefaultValue="客户360"/>
      </bt:ShortStrings>
      <bt:LongStrings>
        <bt:String id="paneButtonTooltip" DefaultValue="查看邮件相关客户"/>
      </bt:LongStrings>
    </Resources>
  </VersionOverrides>
</OfficeApp>
```

要点：

- 所有 URL 必须是 HTTPS，任务窗格图标 16/32/80 三种尺寸必填
- 阅读与撰写按钮分别用 `MessageReadCommandSurface` / `MessageComposeCommandSurface`
- `SupportsPinning` 主要支持阅读模式（Web/新版），用于切换邮件时保持窗格
- 需要 `RecipientsChanged`（1.7）或 `AttachmentsChanged`（1.8）时，把 `Mailbox` 的 `MinVersion` 提高，或在运行时用 `Office.context.requirements.isSetSupported` 检测
- 学习阶段先用 XML 清单（兼容性最好）；统一清单（JSON）随新版 Outlook 能力演进，可作为后续迁移项

## 3. Office.js 邮件对象模型

### 3.1 初始化与读取上下文

```js
Office.onReady((info) => {
  if (info.host !== Office.HostType.Outlook) return;

  const item = Office.context.mailbox.item;
  // 撰写模式下 from 为 null，可据此区分读信/写信
  const isCompose = !item.from;

  if (isCompose) {
    item.to.getAsync((result) => {
      const recipients = result.value.map((r) => r.emailAddress);
      analyzeEmail({ subject: item.subject, recipients });
    });
  } else {
    item.body.getAsync(Office.CoercionType.Text, (result) => {
      if (result.status !== Office.AsyncResultStatus.Succeeded) return;
      analyzeEmail({
        subject: item.subject,
        from: item.from.emailAddress,
        body: result.value.slice(0, 5000),
      });
    });
  }
});
```

### 3.2 常用属性

| 属性/方法 | 阅读模式 | 撰写模式 | 说明 |
|---|---|---|---|
| `item.subject` | 可用 | 可用 | 邮件主题 |
| `item.from` | 可用 | `null` | 发件人 |
| `item.to` / `cc` / `bcc` | 数组 | `Recipients` 对象 | 撰写模式需 `getAsync` |
| `item.body.getAsync` | 可用 | 可用（当前草稿） | 可指定 Text / Html |
| `item.attachments` | 可用 | 可用 | 附件元数据；读取内容用 `getAsFileAsync` |
| `item.itemId` | 可用 | 不稳定 | 阅读模式可定位邮件 |
| `item.conversationId` | 可用 | 可用 | 会话线程 |
| `item.dateTimeCreated` | 可用 | 不可用 | 收信时间 |

### 3.3 事件与"同步"机制

| 事件 | 模式 | 最低要求集 | 用途 |
|---|---|---|---|
| `Office.EventType.ItemChanged` | 阅读 | Mailbox 1.5 | 用户切换邮件时重新匹配 |
| `Office.EventType.RecipientsChanged` | 撰写 | Mailbox 1.7 | 收件人变化时重新匹配 |
| `Office.EventType.AttachmentsChanged` | 撰写 | Mailbox 1.8 | 附件增删时重新解析 |
| 正文变化 | 撰写 | 无事件 | 防抖轮询 `body.getAsync` 或手动刷新 |

```js
// 阅读模式：切换邮件
Office.context.mailbox.addHandlerAsync(
  Office.EventType.ItemChanged,
  () => refreshFromCurrentItem()
);

// 撰写模式：收件人/附件变化
const item = Office.context.mailbox.item;
item.addHandlerAsync(Office.EventType.RecipientsChanged, () => refreshMatch());
item.addHandlerAsync(Office.EventType.AttachmentsChanged, () => refreshAttachments());

// 撰写正文没有变化事件，只能防抖轮询
let lastBody = "";
setInterval(async () => {
  const body = await getCurrentBodyText();
  if (body !== lastBody) {
    lastBody = body;
    scheduleMatch(body);
  }
}, 5000);
```

**注意**：轮询间隔不要过短；解析放在 BFF 做，前端只负责采集和展示。

## 4. 权限模型

| 级别 | 清单值 | 能力 | 使用场景 |
|---|---|---|---|
| 受限读 | `ReadItem` | 读取当前邮件的属性和正文、附件 | **默认选择**，只读窗格足够 |
| 读写当前项 | `ReadWriteItem` | 在上述基础上修改当前邮件（改主题、追加正文、加附件） | 需要把客户信息回填邮件时 |
| 读写邮箱 | `ReadWriteMailbox` | 跨邮件操作、EWS/REST 等完整邮箱能力 | 仅确需时，安全评审最严格 |

原则：

- 从 `ReadItem` 开始，按功能逐级申请，避免"先要最大权限"
- `ReadWriteMailbox` 会显著提高管理员和安全团队审批成本
- 通过 SSO 获取 Graph 令牌本身不等于需要 `ReadWriteMailbox`；权限按清单与 Entra 授权分别控制

## 5. 认证：Office SSO / NAA

### 5.1 两条路线

| 路线 | 适用 | 说明 |
|---|---|---|
| Office SSO（`Office.auth.getAccessToken`） | 经典客户端/部分 Web 场景 | 由 Office 宿主返回令牌；需要清单 `WebApplicationInfo` 和 Entra 预授权 |
| NAA（嵌套应用认证 + MSAL.js） | Web / 新版 Outlook（推荐） | 任务窗格内用 MSAL.js 静默取令牌，支持多账号与增量授权 |

### 5.2 NAA 取令牌示例

```js
import {
  createNestablePublicClientApplication,
  InteractionRequiredAuthError,
} from "@azure/msal-browser";

const msalInstance = await createNestablePublicClientApplication({
  auth: {
    clientId: "<加载项应用 Client ID>",
    // 多租户/个人账户用 common；单租户可改为 <tenant-id>
    authority: "https://login.microsoftonline.com/common",
  },
  cache: { cacheLocation: "localStorage" },
});

const scopes = ["api://<加载项应用 Client ID>/access_as_user"];

try {
  const result = await msalInstance.acquireTokenSilent({ scopes });
  await callBackend(result.accessToken);
} catch (error) {
  if (error instanceof InteractionRequiredAuthError) {
    const result = await msalInstance.acquireTokenPopup({ scopes });
    await callBackend(result.accessToken);
  } else {
    throw error;
  }
}
```

要点：

- 先静默取令牌，只有抛出 `InteractionRequiredAuthError` 时才弹交互窗口
- NAA 支持 `acquireTokenSilent` / `acquireTokenPopup` / `ssoSilent`；不支持 `acquireTokenRedirect`、`logoutRedirect` 等重定向方法
- 运行时用 `Office.context.requirements.isSetSupported("NestedAppAuth", "1.1")` 判断宿主是否支持；不支持时回退到 Office SSO 或对话框登录
- NAA 不支持 Azure AD B2C 身份

### 5.3 Entra 应用注册要点（NAA）

1. 注册应用；支持的账户类型按组织策略选择（官方 NAA 示例使用"任何组织目录中的账户 + 个人 Microsoft 账户"）
2. **Authentication** → 添加平台 **单页应用程序（SPA）**，重定向 URI 设为 `brk-multihub://<加载项域名>`；只写源，不含子路径，例如 `brk-multihub://localhost:3000`、`brk-multihub://www.contoso.com`
3. **Expose an API**：Application ID URI 设为 `api://<client-id>`，添加范围 `access_as_user`
4. API 权限按需添加（如 `User.Read`）
5. 管理员同意：相关权限通常需要租户管理员一次性授权
6. 遗留 SSO（`Office.auth.getAccessToken`）路线还需要在 Expose an API 中预授权 Office 客户端；NAA 走 SPA 重定向 + MSAL，不需要这一步

### 5.4 推荐的令牌流

```
任务窗格（NAA/MSAL）
  → Entra ID：获取 api://addin/access_as_user 令牌
  → BFF：校验 JWT（iss / aud / scp / exp，JWKS 验签）
  → BFF：使用服务端凭据（或代表用户 OBO）调用 ERP API
```

前端只持有用户令牌；ERP 密钥/客户端凭据只存在于 BFF（Key Vault）。

## 6. 与外部系统集成

### 6.1 BFF 模式

任务窗格不直接调 ERP：

- 避免在浏览器暴露 ERP 凭据
- 统一处理 CORS、限流、重试、字段抽取、幂等
- 便于日志、审计和合规脱敏

BFF 最少需要四个接口：

| 接口 | 作用 |
|---|---|
| `POST /customers/match` | 根据邮件上下文匹配客户 |
| `GET /customers/{id}` | 获取客户详情 |
| `POST /customers` | 创建客户（带幂等键） |
| `POST /activity`（可选） | 回写邮件活动/附件 |

### 6.2 iframe 嵌入第三方页面

只有在以下条件全部满足时才可行：

- ERP 响应头允许被嵌入：CSP `frame-ancestors` 包含 Outlook 域名，或没有 `X-Frame-Options: DENY/SAMEORIGIN`
- 嵌入页面能免登或接受短期令牌（第三方 Cookie 受限时，传统 Cookie SSO 会失效）
- 窄窗格（约 320px 起）布局可接受

常见阻碍：

- `X-Frame-Options: ALLOW-FROM` 已被 Chrome/Edge 忽略，必须改用 CSP `frame-ancestors`
- 登录页通常禁止被嵌入，重定向链会失败
- 多数 SaaS 默认拒绝第三方嵌入

结论：优先 BFF + 自建窗格 UI；嵌入仅作为厂商明确支持时的增强。

## 7. 调试与侧加载

### 7.1 创建项目

```bash
# 方式 A：Yeoman 生成器
npm install -g yo generator-office
yo office
# 选择：Office Add-in Task Pane project → JavaScript/TypeScript → Outlook

# 方式 B：Microsoft 365 Agents Toolkit（VS Code 扩展或 atk CLI）
```

本地 HTTPS 证书：

```bash
npx office-addin-dev-certs install
```

### 7.2 侧加载到 Outlook Web / 新版 Outlook

1. 启动本地服务（`npm start`，确保 HTTPS 可访问）
2. 打开 Outlook Web / 新版 Outlook
3. 进入"获取加载项 / 管理应用" → "我的加载项" → "自定义加载项"
4. 选择"从文件添加"，上传 `manifest.xml`
5. 打开一封邮件，在功能区找到"客户360"按钮

> 不同版本入口名称略有差异；若按钮不出现，先检查清单校验和 HTTPS。

### 7.3 清单校验

```bash
npx office-addin-manifest validate manifest.xml
```

必须通过后再侧加载，否则宿主会静默忽略。

### 7.4 调试

- Outlook Web：浏览器 DevTools 直接调试任务窗格
- 新版 Outlook：对任务窗格使用 WebView2 DevTools
- 常见问题优先看：清单版本、图标路径、`SourceLocation` 是否 HTTPS、权限与要求集是否满足
- Web/新版每次更新清单后建议移除旧加载项再重新添加，避免缓存

## 8. 部署

### 8.1 集中部署（推荐）

M365 管理中心 → 设置 → **Integrated Apps** → 上传自定义应用 → 选择 Office 加载项 → 上传 manifest → 分配用户/组 → 接受权限。分发生效可能需要一段时间（官方说明最长约 24 小时）。

### 8.2 上线检查清单

- [ ] 清单版本号递增，图标与 URL 使用生产域名
- [ ] Entra 应用完成管理员同意（SSO/Graph 权限）
- [ ] BFF 生产环境凭据存入 Key Vault，开启日志与告警
- [ ] 限流、超时、重试、幂等验证通过
- [ ] 用户说明：按钮位置、匹配/新建流程、失败处理
- [ ] 回滚方案：从 Integrated Apps 取消分配或下架加载项

## 9. 实战案例：邮件客户信息侧边栏

完整需求、架构、信息清单与验收标准见 [11-Outlook客户信息侧边栏方案评估.md](11-Outlook客户信息侧边栏方案评估.md)。核心映射：

| 案例环节 | 本专题知识点 |
|---|---|
| 按钮打开右侧窗格 | 第 2 章：`MessageReadCommandSurface` + `ShowTaskpane` |
| 读信识别客户 | 第 3 章：`from` / `subject` / `body.getAsync` |
| 写信同步匹配 | 第 3 章：`RecipientsChanged` + 正文防抖轮询 |
| 调 ERP 查询/创建 | 第 6 章：BFF 模式与幂等 |
| 用户身份 | 第 5 章：NAA + Entra 应用注册 |
| 上线分发 | 第 8 章：Integrated Apps |

## 10. 常见坑

| 问题 | 原因 | 处理 |
|---|---|---|
| 按钮不显示 | 清单校验失败/缓存/要求集不满足 | 先跑 `office-addin-manifest validate`，移除后重新添加 |
| 撰写模式读不到 `from` | 撰写时 `from` 为 `null` | 改用 `to` / `RecipientsChanged` |
| 正文变化不同步 | 没有 BodyChanged 事件 | 防抖轮询或手动刷新 |
| 附件读不到 | 未到 Mailbox 1.8 / 超过大小限制 | 检查要求集与官方大小限制 |
| 嵌入页面白屏/登录失败 | X-Frame-Options / CSP / 第三方 Cookie | 放弃嵌入，改 API + 自建 UI |
| SSO 弹同意/失败 | NAA 的 SPA 重定向未配置；遗留 SSO 未预授权；管理员未同意 | 检查 `brk-multihub://` 重定向、`WebApplicationInfo` 与管理员同意 |
| 窗格在经典客户端行为异常 | 客户端能力差异 | 本期范围限定 Web/新版；必要时做降级 |
| 权限评审被拒 | 申请了 `ReadWriteMailbox` | 回退到 `ReadItem` / `ReadWriteItem` |

## 11. 官方资源

- [Outlook 加载项概述](https://learn.microsoft.com/zh-cn/office/dev/add-ins/outlook/outlook-add-ins-overview)
- [Office.js API 参考（Outlook）](https://learn.microsoft.com/zh-cn/javascript/api/outlook)
- [Outlook 加载项清单](https://learn.microsoft.com/zh-cn/office/dev/add-ins/outlook/manifests)
- [Office 加载项中的 SSO](https://learn.microsoft.com/zh-cn/office/dev/add-ins/develop/sso-in-office-add-ins)
- [嵌套应用认证（NAA）](https://learn.microsoft.com/zh-cn/office/dev/add-ins/develop/enable-nested-app-authentication-in-your-add-in)
- [侧加载 Outlook 加载项用于测试](https://learn.microsoft.com/zh-cn/office/dev/add-ins/outlook/sideload-outlook-add-ins-for-testing)
- [Office 加载项代码示例库](https://github.com/OfficeDev/Office-Add-in-samples)
- [office-addin-manifest 校验工具](https://www.npmjs.com/package/office-addin-manifest)
