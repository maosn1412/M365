# spfx-hello

SPFx 1.23.2 学习项目 —— HelloWorld Web 部件（Minimal/无框架模板）。

## 用途

本仓库用于 M365 开发学习，演示 SPFx 基础构建流程（Heft 编译、本地 dev server、生产打包 `.sppkg`）。

当前模板为 **Minimal（无框架）**，部件用 `domElement.innerHTML` 渲染。若要练习 Fluent UI React 组件，需用 React 模板重新生成。

## 快速开始

```bash
cd spfx-hello/spfx-hello   # 从仓库根进入项目目录（生成器多套了一层同名目录）
npm install
npm run start              # heft start —— 启动本地 dev server（https://localhost:4321）
npm run build              # heft test + package-solution —— 生产打包，产出 sharepoint/solution/spfx-hello.sppkg
```

## 环境要求

- Node.js >=22.14 <23（SPFx 1.23.2 强制）
- 可视化调试需 M365 租户（托管工作台 2026-12-01 退役，之后改用 SPFx Debug Toolbar）

## 版本历史

| 版本 | 日期 | 说明 |
|---|---|---|
| 0.0.1 | 2026-10-23 | 初始生成（SPFx 1.23.2 Minimal 模板） |

## 目录说明

- `src/webparts/helloWorld/` — 部件源码（Minimal 模板，`domElement.innerHTML` 渲染）
- `teams/` — 以部件 ID 命名的两个图标（`adf29d47-…_color.png` / `adf29d47-…_outline.png`）。**打包时会被原样复制进 `.sppkg` 的 `ClientSideAssets/`**（实测包内同名文件 10248 / 249 字节，与 `teams/` 下一致），所以替换图标要改这里，并遵守尺寸要求：color 192×192、outline 32×32。
- `config/serve.json` — `initialPage` 含 `{tenantDomain}` 占位，部署时替换为实际租户域名

## 参考

- [SPFx 文档](https://learn.microsoft.com/zh-cn/sharepoint/dev/spfx/sharepoint-framework-overview)
- [PnP 社区](https://pnp.github.io/)
