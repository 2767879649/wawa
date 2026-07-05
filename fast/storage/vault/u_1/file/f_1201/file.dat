# Knowledge Base

个人 AI 知识库 — Markdown 文件 + ChromaDB RAG 检索

## 目录结构

```
knowledge/
├── inbox/              # 未分类的临时笔记
├── notes/
│   ├── tech/           # 编程技术笔记
│   └── life/           # 生活/其他笔记
├── projects/           # 项目文档
├── learning/           # 学习笔记
├── daily/              # 每日记录
├── assets/             # 图片、附件
├── templates/          # 笔记模板
├── .scripts/           # RAG 索引和查询脚本
└── README.md
```

## 使用方法

### 新增笔记
在对应目录创建 `.md` 文件，使用 `templates/` 中的模板。

### 索引知识库
```bash
python .scripts/index.py
```

### 查询知识库
```bash
python .scripts/query.py "你的问题"
```

## 笔记命名规范

- 格式：`YYYY-MM-DD-标题.md` 或 `主题-关键词.md`
- 用英文命名文件便于命令行操作
- 中文标题写在 frontmatter 的 title 字段
