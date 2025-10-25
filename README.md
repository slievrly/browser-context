# Browser Context Plugin

一个跨浏览器的网页内容抓取和解析插件，支持多种memory存储后端。

## 支持的浏览器
- Chrome
- Edge  
- Safari
- Firefox

## 功能特性
- 网页内容抓取和解析
- 时间调度抓取
- 黑名单地址过滤
- 敏感信息过滤
- 多种memory存储后端支持
- 向量数据库集成

## Memory存储后端
- Mem0AI (mem0ai/mem0)
- Zep (getzep/zep)
- Letta (letta-ai/letta)
- 主流开源向量数据库

## 项目结构
```
browser-context/
├── chrome/                 # Chrome扩展
├── edge/                   # Edge扩展
├── safari/                 # Safari扩展
├── firefox/                # Firefox扩展
├── shared/                 # 共享代码
│   ├── content-script/     # 内容脚本
│   ├── background/         # 后台脚本
│   ├── popup/              # 弹出页面
│   ├── memory-adapters/    # Memory存储适配器
│   └── utils/              # 工具函数
├── docs/                   # 文档
└── tests/                  # 测试
```

## 开发计划
每个功能点将作为独立的commit进行开发，确保代码及时推送到GitHub。
