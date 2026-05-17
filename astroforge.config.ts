import type { AstroForgePluginOptions } from "@astralsight/astroforge-rsbuild-plugin";

// AstroForge 项目配置。
//
// - manifest：完整保留到 Vela `manifest.json`。IR 未显式建模的字段（如
//   `subpackages`、`widgets`、`router.params`）也会按源序透传。
// - plugin.target：当前仅支持 `"vela"`。
export default {
  manifest: {
    package: "top.zaona.gobang.better",
    name: "五子棋",
    versionName: "1.6.4",
    versionCode: 9,
    minPlatformVersion: 1000,
    icon: "/common/logo.png",
    deviceTypeList: ["watch"],
    features: [
      { name: "system.router" },
      { name: "system.prompt" },
      { name: "system.app" },
      { name: "system.device" },
    ],
    display: {
      backgroundColor: "#000000",
    },
    config: {
      logLevel: "log",
      designWidth: "device-width",
    },
  },
  plugin: {
    target: "vela",
  } satisfies AstroForgePluginOptions,
};
