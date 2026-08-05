# 输入组件实现说明

## 1. 概述

智能监盘页面底部提供一个可收纳的消息输入组件。组件默认显示为圆形按钮，单击后展开完整输入面板；长按收纳按钮会展开面板并进入语音输入占位状态。

当前版本只实现语音输入的视觉状态，不包含麦克风权限、音频采集或语音识别逻辑。

## 2. 组件命名与文件位置

| 名称 | 文件 | 职责 |
| --- | --- | --- |
| `MessageComposer` | `src/pages/message-composer.tsx` | 管理输入框的收纳、展开、语音占位状态和底部工具栏 |
| `OceanHome` | `src/pages/ocean-home.tsx` | 为 `MessageComposer` 提供智能监盘内容区的定位容器 |
| `App` | `src/App.tsx` | 提供 Sidebar、顶部栏和内容区高度环境 |
| `iconButtonClass` | `src/pages/message-composer.tsx` | 复用工具栏图标按钮的 Tailwind 样式 |

## 3. 依赖

组件使用：

- React `useState`、`useRef`、`useEffect`
- Tailwind CSS 4
- `tw-animate-css` 所在的项目样式环境
- `lucide-react` 图标

当前使用的图标：

- `SparklesIcon`
- `PlusIcon`
- `PaperclipIcon`
- `ChevronDownIcon`
- `MicIcon`
- `SendIcon`

## 4. 组件状态

| 状态 | 类型 | 说明 |
| --- | --- | --- |
| `expanded` | `boolean` | 控制输入面板是否展开 |
| `voiceActive` | `boolean` | 控制语音输入占位状态 |
| `pressTimer` | `number \| null` | 保存长按计时器 ID |
| `longPress` | `boolean` | 标记本次操作是否已经触发长按 |
| `textareaRef` | `HTMLTextAreaElement` | 展开后将焦点移动到输入区域 |

## 5. 收纳状态

收纳状态显示一个圆形按钮：

- 固定在内容区底部中央。
- 尺寸为 `size-14`。
- 层级为 `z-[101]`。
- 使用主题主色 `bg-primary`。
- 图标与文字颜色使用 `text-primary-foreground`。
- 带有边框、阴影、模糊和焦点环。

主要 Tailwind 样式包含：

```text
bottom-5 left-1/2 size-14 -translate-x-1/2
rounded-full bg-primary text-primary-foreground
shadow-[0_16px_44px_rgba(15,23,42,0.3)]
focus-visible:ring-2 focus-visible:ring-ring
```

桌面端底部距离通过 `sm:bottom-7` 增加。

## 6. 展开状态

展开面板使用绝对定位并稳定锚定在内容区底部：

```text
absolute inset-x-3 bottom-4 mx-auto max-w-4xl
sm:inset-x-6 sm:bottom-6
```

布局特点：

- 最大宽度为 Tailwind `max-w-4xl`，约 896px。
- 小屏幕使用左右 12px 边距。
- `sm` 及以上屏幕使用左右 24px 边距。
- 层级为 `z-[100]`。
- 使用 `bg-background/90` 与 `backdrop-blur-2xl`。
- 使用主题边框、前景色、主色和强调色。

输入区域为三行 `textarea`，最小高度为 `min-h-20`。

## 7. Tailwind 主题适配

组件不依赖固定的深色背景，而是使用项目主题令牌：

| Tailwind 类 | 用途 |
| --- | --- |
| `bg-background/90` | 输入面板半透明背景 |
| `text-foreground` | 主要文字和输入文字 |
| `text-muted-foreground` | 次要文字和占位符 |
| `border-border/80` | 输入面板边框 |
| `bg-primary` | 收纳按钮和发送按钮 |
| `text-primary-foreground` | 主色按钮上的图标 |
| `bg-accent` | 工具栏按钮 Hover 背景 |
| `text-accent-foreground` | 工具栏按钮 Hover 前景色 |
| `ring-ring` | 键盘焦点环 |

这些主题值在 `src/App.css` 中定义，可以随项目浅色或深色主题切换。

## 8. 展开与收纳动画

收纳按钮和输入面板始终保留在 DOM 中，通过状态切换 Tailwind 类完成双向动画。

收纳按钮隐藏时：

```text
translate-y-3 scale-75 opacity-0
```

收纳按钮显示时：

```text
translate-y-0 scale-100 opacity-100
```

输入面板隐藏时：

```text
translate-y-6 scale-[0.96] opacity-0
```

输入面板显示时：

```text
translate-y-0 scale-100 opacity-100
```

动画时长为 300ms，使用 `ease-out`。通过 `motion-reduce:transition-none` 尊重系统“减少动态效果”设置。

隐藏状态下设置 `pointer-events-none`，并禁用内部表单控件，避免不可见元素参与鼠标和键盘交互。

## 9. 单击与长按逻辑

### 单击

收纳按钮触发 `handleTriggerClick`：

- 将 `expanded` 设置为 `true`。
- 将 `voiceActive` 重置为 `false`。

### 长按

Pointer 按下后启动 520ms 计时器：

```ts
window.setTimeout(() => {
  longPress.current = true
  setExpanded(true)
  setVoiceActive(true)
}, 520)
```

Pointer 抬起或移出按钮时清理计时器。

如果长按已经触发，随后产生的 Click 不会重复执行普通展开逻辑。

## 10. 工具栏结构

展开后的工具栏从左到右包含：

1. 添加附件按钮。
2. 选择附件按钮。
3. 模型选择按钮，当前显示 `5.6 Luna`。
4. 语音输入按钮。
5. 发送按钮。
6. 收纳按钮。

当前附件、模型选择、语音和发送按钮主要提供 UI 与交互占位，尚未连接实际业务接口。

## 11. 焦点与可访问性

组件包含以下处理：

- 图标按钮均提供 `aria-label`。
- 装饰图标使用 `aria-hidden="true"`。
- 收纳按钮使用 `aria-expanded` 表示展开状态。
- 输入面板使用 `aria-hidden` 表示可见状态。
- 面板展开后，通过 `requestAnimationFrame` 将焦点移动到 `textarea`。
- 隐藏状态下禁用内部控件，防止 Tab 焦点进入不可见内容。
- 所有可交互控件使用 `focus-visible:ring` 显示键盘焦点。

## 12. 与 Canvas 的事件层级

`OceanHome` 本身使用 `pointer-events-none`，允许空白区域的拖拽事件到达背景 Canvas。

收纳按钮和展开面板在可见状态使用 `pointer-events-auto`，因此输入组件可以正常点击，不会触发海面相机拖拽。

输入组件使用高层级：

- 展开面板：`z-[100]`
- 收纳按钮：`z-[101]`

## 13. 生命周期清理

组件卸载时会清理长按计时器。展开面板时创建的焦点动画帧，也会在状态变化或组件卸载时取消。

## 14. 后续接入建议

- 使用隐藏的 `<input type="file">` 接入附件选择。
- 将模型选择按钮连接到 DropdownMenu 或 Select。
- 为发送按钮增加加载、禁用和错误反馈状态。
- 接入麦克风权限、MediaRecorder 和语音识别服务。
- 将输入文本提升到受控状态，并通过 Props 暴露 `onSubmit`。
- 将模型列表、发送状态和附件列表作为 Props 或 Store 数据注入。
- 根据需要增加 Enter 发送、Shift+Enter 换行等键盘交互。

