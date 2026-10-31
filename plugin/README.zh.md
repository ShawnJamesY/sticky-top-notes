# DSH 顶部便签页签插件

[DSH](https://github.com/deepseek-ai/DeepSeek-Harness) 插件，在主对话框上方添加一条 **固定 20px 的便签条** —— 只服务于人的轻量待办区，数据绝不进入模型上下文。

![icon](icon.svg)

[English](README.md) | 简体中文

## 功能

- 固定 20px，位于会话头部上方，不扩展、不遮挡内置 UI
- 经典便利贴配色：亮黄药丸 + 深棕字；已完成置灰加删除线
- 勾选完成并记录完成时间，取消勾选恢复
- 右端回车快速录入（兼容中文输入法）
- 查看全部面板：时间戳、行内编辑（双击 / 回车保存 / Esc 取消）、删除、清空已完成、**复制全部为 txt**、**顶部显示条数设置**（1–10，即时生效、持久化）
- 数据仅存浏览器 `localStorage`

## 安装

```
install_bundle  target=/absolute/path/to/this/package    # 本地目录
install_bundle  target=<git地址>#plugin # git 源
```

安装后重启 DSH 并刷新 Web GUI。

## 使用

| 操作 | 方法 |
|---|---|
| 新增便签 | 右端输入框打字，回车 |
| 完成 / 取消完成 | 点击便签复选框 |
| 编辑便签 | 查看全部 → 双击文字（或悬停点"编辑"） |
| 复制全部 | 查看全部 → "复制全部 (txt)" |
| 调整顶部条数 | 查看全部 → "顶部显示"，输入 1–10 |

## 数据

| 数据 | 位置 | 键名 |
|---|---|---|
| 便签 | `localStorage` | `dsh-sticky-top-notes.v1` |
| 设置 | `localStorage` | `dsh-sticky-top-notes.settings.v1` |

重启不丢；不跨浏览器同步；清除站点数据即删除。

## 说明

- 纯 Client 插件（`index.js` 为空 `apply()`）。
- 挂载 `conversation.header.leading`，经 `:has()` 限定提升为整行；宿主类名变更时降级为内联，功能不受影响。
- 样式为组件内 `<style>` 元素；除便利贴黄外均用 DSW 主题令牌（有意偏差）。
- locale 服务接入，zh 回退。

## 文件

```
plugin/
├── package.json  cordis.patch.yml  index.js  client.js  icon.svg
├── locale/{en,zh}.json
├── README.md  README.zh.md  LICENSE
```

## 卸载

```
remove_bundle  target=@shawnjamesy/dsh-sticky-top-notes
```

## License

MIT
