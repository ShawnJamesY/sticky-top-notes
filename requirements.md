# 需求记录（已确认并交付）

核心约束：主对话框最上方、固定 20px、不向下扩展；所有便签挤在一行内。

布局（单行 20px）：便签 chips（未完成在前，按创建新→旧；已完成在后，按完成新→旧）→ 输入框（回车新增）→ 查看全部按钮。

数据模型：`{ id, text, createdAt, completedAt: number | null }`，存浏览器 localStorage，不进模型上下文。

交互：回车新增；勾选完成/取消（记录完成时间）；查看全部面板管理全部便签。

技术方案：挂载 `conversation.header.leading`，`:has()` 提升为头部上方整行；样式为组件内 `<style>`。
