# AstroForge 应用

由 `astroforge init` 生成的 Vela 智能手表快应用模板。

## 目录结构

```
src/
├─ app.tsx                # 应用级生命周期
├─ common/                # 资源（图标、字体等），相对路径以 / 开头时被打入包内
└─ pages/<name>/<name>.tsx  # 页面，按文件路径自动发现并注册到 router
astroforge.config.ts       # manifest 与 plugin 配置
rsbuild.config.ts          # Rsbuild 入口；自动加载 @astralsight/astroforge-rsbuild-plugin
tsconfig.json              # 启用 JSX automatic runtime + @astralsight/astroforge-core
```

## 常用命令

```bash
pnpm install                                  # 安装依赖
pnpm run build                                # 产出 debug rpk → dist/top.zaona.gobang.better.debug.rpk
pnpm exec astroforge inspect rpk <path>       # 查看 rpk 文件结构与签名状态
```

## 官方命令与 Windows 临时映射

AstroForge 0.0.10 在 Windows 上直接执行 `astroforge build` / `dev` / `release`
时，可能因为 Rust 子进程无法解析 `pnpm.CMD` 而报 `program not found`。
在上游修复前，按下表使用 Windows 可用命令。

| 官方原始命令 | Windows 临时可用命令 | 说明 |
|---|---|---|
| `pnpm install` | `pnpm install` | 安装依赖，不受影响。 |
| `pnpm exec astroforge build --target vela` | `pnpm run build` | 已验证可用，产出 `dist\top.zaona.gobang.better.debug.rpk`。 |
| `pnpm exec astroforge inspect rpk <path>` | `pnpm exec astroforge inspect rpk <path>` | 检查 rpk，不受影响。 |
| `pnpm exec astroforge inspect rpk dist/*.debug.rpk` | `pnpm exec astroforge inspect rpk dist\top.zaona.gobang.better.debug.rpk` | Windows PowerShell 不按 bash glob 方式展开 `*.debug.rpk`，建议写明确路径。 |
| `pnpm exec astroforge dev` | 暂无等价替代 | `dev` 内部会启动 `pnpm exec rsbuild dev`，仍会触发 `pnpm.CMD` 解析问题。 |
| `pnpm exec astroforge release --target vela` | 暂无等价替代 | `release` 没有 `--skip-rsbuild` 参数，仍会触发同一个问题；需要 release 包时先用 macOS / Linux。 |

`pnpm run build` 等价于：

```powershell
pnpm exec rsbuild build
pnpm exec astroforge build --target vela --skip-rsbuild
```

## 签名

debug 模式按以下顺序查找签名材料：

1. 环境变量 `ASTROFORGE_VELA_PRIVATE_KEY` / `..._CERTIFICATE`；
2. `sign/debug/{private,certificate}.pem`；
3. `sign/{private,certificate}.pem`；
4. AstroForge 内置 debug 证书（仅 debug，不可签 release）。

release 模式只查找环境变量、`sign/release/`、`sign/`；都没有则直接报错。
