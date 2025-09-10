# NodeFlow PRD Editor

基于 React Flow 和 Chakra UI 开发的 NodeFlowPRD 编辑器，用于创建和管理产品需求文档的流程图。

## 功能特性

### 🎨 界面布局
- **左侧功能栏**：添加节点功能，支持页面和弹窗类型
- **中间画布区域**：基于 React Flow 的可视化编辑器
- **右侧设置面板**：节点属性编辑和内容管理

### 📝 节点功能
- 支持两种节点类型：页面（📄）和弹窗（🪟）
- 自定义节点命名和描述
- Markdown 格式内容编辑和实时预览
- 节点拖拽、连接和删除

### 🎯 交互体验
- 无限缩放、拖拽和平移
- 节点选中高亮效果
- 实时保存和更新
- 响应式设计

### 🌙 主题支持
- 黑夜模式和白天模式切换
- 基于 Chakra UI 的主题系统
- 与 React Flow 风格统一的设计

## 技术栈

- **React 18** - 前端框架
- **TypeScript** - 类型安全
- **React Flow** - 流程图编辑器
- **Chakra UI** - UI 组件库
- **React Markdown** - Markdown 渲染
- **Vite** - 构建工具

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 使用指南

### 1. 添加节点
1. 点击左侧功能栏的「添加节点」按钮
2. 选择节点类型（页面或弹窗）
3. 节点将自动添加到画布中

### 2. 编辑节点
1. 点击画布中的任意节点
2. 右侧设置面板将自动打开
3. 编辑节点名称、描述和内容
4. 支持 Markdown 格式，可切换预览模式
5. 点击「保存更改」按钮保存修改

### 3. 连接节点
1. 将鼠标悬停在节点的连接点上
2. 拖拽到目标节点的连接点
3. 释放鼠标完成连接

### 4. 画布操作
- **缩放**：使用鼠标滚轮或控制面板
- **平移**：拖拽空白区域
- **选择**：点击节点进行选择
- **取消选择**：点击空白区域

### 5. 主题切换
点击右上角的主题切换按钮（🌙/☀️）在黑夜模式和白天模式之间切换。

## 项目结构

```
src/
├── components/          # 组件目录
│   ├── CustomNode.tsx   # 自定义节点组件
│   ├── FlowCanvas.tsx   # 画布组件
│   ├── NodeSettingsPanel.tsx  # 设置面板组件
│   └── Sidebar.tsx      # 侧边栏组件
├── theme/               # 主题配置
│   └── index.ts         # Chakra UI 主题
├── types/               # 类型定义
│   └── index.ts         # TypeScript 类型
├── App.tsx              # 主应用组件
├── main.tsx             # 应用入口
└── index.css            # 全局样式
```

## 开发说明

### 添加新功能
1. 在 `src/components/` 目录下创建新组件
2. 在 `src/types/index.ts` 中添加相关类型定义
3. 在主应用中集成新功能

### 自定义主题
编辑 `src/theme/index.ts` 文件来自定义 Chakra UI 主题。

### 扩展节点类型
1. 在 `NodeData` 接口中添加新的节点类型
2. 更新 `CustomNode` 组件以支持新类型
3. 在 `Sidebar` 组件中添加创建新类型节点的按钮

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！