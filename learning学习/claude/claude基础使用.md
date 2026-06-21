---
tags:
  - claude
---

# **流程：**
收到任务->去caht当顾问聊清楚需求，出计划->造产品上code->批量杂货丢给cowork->你只在关键结点点头摇头
大项目先进 Plan mode，能明显减少”它建了个完全不对的东西”这种返工。
**Chat 聊需求 → Plan mode 出计划 → 回答反问 → 批准 → 预览验收 → /init 存档**

| **先定范围**  | 这次只做 MVP，先做本地可用版本，收藏、标签、搜索、日报卡片先跑通，定时任务和上线以后再加。 |
| --------- | ----------------------------------------------- |
| **再定数据**  | 收藏内容先存本地文件，不上云数据库资讯源让它推荐 4-6 个稳定免费的 RSS，你挑完再执行  |
| **最后定外观** | 有喜欢的产品风格就给截图或参考链接；没有就说：保持简单、干净、像一份排版讲究的电子报纸。    |

---
# 常用
- ==/context== 查看上下文
- ==/compact== 压缩上下文
- ==/clear== — 清空会话
-  ==Shift+Tab== 切换模式
- - /rewind — 打开回滚菜单，可恢复对话/代码/两者
- ==/effort== — 设置推理深度（low / medium / high / max）
- - /hooks — 查看已配置的 hooks
- - /mcp — 管理 MCP 服务器连接
- - /model — 切换当前使用的模型
- - /schedule — 云端定时任务（电脑关机照样按时跑）
- ==/export== — 导出当前会话为纯文本
- ==**ultrathink**==+问题，会让模型这一轮想得更深，啃硬骨头那一问再加。
- ==/init== 保存记忆文件，生成 CLAUDE.md，每个项目开工时一次
- ==update CLAUDE.md== ，把进度写进记忆，每完成一个功能使用
- ==/btw +问题==，不打断主任务，并且本次提问不会存入主对话上下文，不会干扰钩子代码执行逻辑
- ==/resume== — 恢复会话
-

---
# 基础知识[[基础知识]]

1. 到底该用哪个？四行判断标准
- 让 Claude 稳定完成某个流程：写 Skill
- 让 Claude 能用某个外部服务 / 工具：装 MCP / 连接器
- 让 Claude 自动响应某种事件：配 Hook钩子
- 一站式安装某个能力组合：找 Plugin
大礼包 · Plugins：整个职位打包安装
安装Superpowers**——开发最佳实践包：先头脑风暴钉死需求 → 写计划 → 分批执行 → 审查。大项目开工前说一句 先用 Superpowers 头脑风暴，只梳理需求，不写代码，它会一个问题一个问题把你的模糊需求钉死。

## 1.权限模式

不同模式下运行时获得的权限不同，这影响了人的介入范围和安全性
### 1.1 Default（默认模式）

启动后即处于此模式。所有操作都会弹出确认框，需逐条审批。

![](https://imgheybox.max-c.com/web/bbs/2026/05/12/7151ce81ff6a886da6d5cecb78bb8016/thumb.png?imageMogr2/format/webp/quality/75/ignore-error/1/auto-orient)

**适用场景**：生产环境操作、敏感配置修改、新项目的初次探索。不确定 Claude 会做什么时，Default 最安全。
### 1.2 Plan（规划模式）
此模式下Claude 可以读文件、分析代码、提出方案，但**不能修改任何文件，不能执行任何命令**。

![](https://imgheybox.max-c.com/web/bbs/2026/05/12/4220100daf4b9c5c41e04e1e2892922a/thumb.png?imageMogr2/format/webp/quality/75/ignore-error/1/auto-orient)

使用cc最浪费 token 的用法是：**边做边改，反复返工**。cc写了个方案，你发现不对，让它重写，它改了一半，你又发现新问题，再调整……几个来回下来，tokens烧了不少，项目还没成型。

Plan 模式就是为了打破这个循环，它的核心理念很简单：**把「讨论方案」和「执行方案」彻底分开**。在 Plan 模式下，Claude 只能读文件、提方案，不能修改任何代码。你们来回讨论、细化、确认，直到方案双方都认可，**再切换回执行模式一次性完成**。用低成本的文本讨论替代高成本的实际试错，把不确定性消灭在执行之前。
### 1.3 Accept Edits（自动编辑）

文件编辑自动放行，命令执行仍需确认。日常开发最常用的模式。

![](https://imgheybox.max-c.com/web/bbs/2026/05/12/e5d0d6164bb2d72583c94642b2df8dd1/thumb.png?imageMogr2/format/webp/quality/75/ignore-error/1/auto-orient)

**适用场景**：大量文件的日常修改、样式调整等。省去反复审批，但命令执行仍由你把关
## 2.记忆系统

### 2.1 CLAUDE.md
CLAUDE.md 不只是一个文件，而是一套层级系统。Claude Code 启动时会自动按层级顺序读取多个位置的 CLAUDE.md：

![](https://imgheybox.max-c.com/web/bbs/2026/05/12/0397f762899bf94ea6ef47d85329dad0/thumb.png?imageMogr2/format/webp/quality/75/ignore-error/1/auto-orient)

==CLAUDE.md应该保持精简，不要过长==
### 2.2 Auto Memory
除了CLAUDE.md ，Claude 还有一个自动记忆系统，会往独立的文件里记录偏好和习惯，跟手写的 CLAUDE.md 互不干扰。默认开启。每次新会话，自动记忆文件也不像CLAUDE.md全部加载进上下文，只是按需加载

- **CLAUDE.md**：适合团队共享，检入 git，你主动维护，结构化、有组织
- **Auto Memory**：适合个人偏好，存在本地，Claude 自动维护，零散、按时间累积
---

# [[注意事项]]

---

# [[技能]]


---

==**pandas**==
## 坑

- **不建 CLAUDE.md 就开工** → 第二天它失忆。解药：/init
- **提示词太模糊**。“做好看一点”等于没说。要说：“标题字体太重，换细的，行距加大”
- **复杂任务跳过 Plan mode** → 写到一半返工，工作量翻倍。3 个文件以上的活先进计划模式
- **从不 /compact** → AI 容易反复绕圈。上下文过半就先 update CLAUDE.md 再压缩
- **同一个错误连修 3 次还在原会话磨** → 上下文在帮倒忙。开新会话干净重述，只贴相关代码