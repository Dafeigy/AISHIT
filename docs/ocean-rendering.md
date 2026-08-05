# 海浪渲染实现说明

## 1. 概述

当前默认路由 `#` 与智能监盘路由 `#smart-monitoring` 使用 Three.js 渲染动态海面。海面在视觉层级上是固定的全窗口背景，不参与 Sidebar 的宽度计算，因此 Sidebar 展开或收起不会改变 Canvas 尺寸、相机画面或海浪位置。

当前 Three.js 版本：`three@0.185.1`。

## 2. 组件命名与文件位置

| 名称 | 文件 | 职责 |
| --- | --- | --- |
| `OceanCanvas` | `src/pages/ocean-canvas.tsx` | 创建 Three.js 场景、海面网格、灯光、相机、动画循环和视角交互 |
| `OceanBackground` | `src/pages/ocean-home.tsx` | 将 `OceanCanvas` 固定在视口背景层，并叠加环境渐变 |
| `OceanHome` | `src/pages/ocean-home.tsx` | 智能监盘的前景内容容器，目前主要承载 `MessageComposer` |
| `App` | `src/App.tsx` | 根据路由决定是否挂载海洋背景，并组织 Sidebar、顶部栏和前景内容 |

## 3. 页面分层

智能监盘页面分为三个视觉层级：

1. `OceanBackground`：`position: fixed`，覆盖整个视口，层级为 `z-0`。
2. Sidebar 与顶部栏：位于 `z-10` 的应用导航层。
3. `MessageComposer`：位于 Canvas 内容区上方，使用 `z-[100]` 和 `z-[101]`。

`OceanBackground` 是否存在仍由智能监盘路由控制，因此它在信息架构上属于智能监盘页面，但在布局上不受 Sidebar 尺寸变化影响。

前景空白区域通过 `pointer-events-none` 允许事件穿透到 Canvas；Sidebar、顶部栏和输入组件通过 `pointer-events-auto` 保持可操作。

## 4. Three.js 场景初始化

`OceanCanvas` 在 `useEffect` 中初始化以下对象：

- `THREE.Scene`
- `THREE.PerspectiveCamera`
- `THREE.WebGLRenderer`
- `THREE.PlaneGeometry`
- `THREE.MeshStandardMaterial`
- `THREE.Mesh`
- 环境光、半球光和固定点光源

组件卸载时会取消动画帧、移除事件监听器，并释放 Geometry、Material 和 Renderer，避免 GPU 与事件资源泄漏。

## 5. 海面几何体

海面使用横向平面网格：

```ts
new THREE.PlaneGeometry(78, 58, 128, 84)
```

主要参数：

| 参数 | 当前值 | 说明 |
| --- | ---: | --- |
| 宽度 | `78` | 世界坐标中的海面宽度 |
| 深度 | `58` | 世界坐标中的海面前后长度 |
| 横向分段 | `128` | X 方向网格分段 |
| 纵向分段 | `84` | Z 方向网格分段 |
| 顶点数量 | 约 `10,965` | `(128 + 1) × (84 + 1)` |
| 海面 Y 坐标 | `-1.25` | 海面整体垂直位置 |

平面创建后通过 `rotateX(-Math.PI / 2)` 转为水平海面。

网格尺寸大于相机可移动范围，避免视角平移时看到平面边界。

## 6. 柏林噪声实现

海浪高度由文件内的二维柏林噪声函数生成。相关函数包括：

- `fade`：使用五次平滑曲线降低网格边界突变。
- `lerp`：在四个梯度结果之间插值。
- `gradient`：根据哈希值选择二维梯度方向。
- `perlinNoise`：计算指定二维坐标的噪声值。

`PERMUTATION` 是固定的 256 项置换表，复制后形成 `GRADIENTS`，用于生成可重复的噪声结果。

动画更新时，每个顶点的 Y 值按以下形式计算：

```ts
const wave = perlinNoise(
  x * 0.2 + elapsed * 0.02,
  z * 0.2 - elapsed * 0.78,
)

height = baseHeight + wave * 1.25
```

其中：

- `0.2` 控制空间噪声尺度。
- `elapsed` 的两个系数控制 X、Z 方向的时间推进速度。
- `1.25` 控制海浪高度振幅。

顶点更新后调用 `computeVertexNormals()`，让光照能够跟随波峰和波谷变化。

## 7. 材质与颜色

海面使用 `THREE.MeshStandardMaterial`：

| 属性 | 当前值 | 作用 |
| --- | --- | --- |
| `color` | `#0b344d` | 深墨蓝海水基础色 |
| `emissive` | `#020a10` | 极弱的深色自发光，避免完全黑死 |
| `emissiveIntensity` | `0.02` | 自发光强度 |
| `roughness` | `0.24` | 控制高光扩散范围 |
| `metalness` | `0.04` | 保持低金属度的水面观感 |
| `flatShading` | `false` | 使用平滑顶点法线 |

Renderer 使用：

- `THREE.SRGBColorSpace`
- `THREE.ACESFilmicToneMapping`
- `toneMappingExposure = 1.05`

背景与雾颜色均为 `#dceff1`，形成明亮天空与深色海面的对比。

## 8. 固定物理点光源

基础照明由半球光与环境光提供：

```ts
new THREE.HemisphereLight("#f5fbfa", "#0b3a43", 2)
new THREE.AmbientLight("#d7f2f2", 0.35)
```

主要高光由固定世界坐标的点光源产生：

```ts
const keyLight = new THREE.PointLight("#fff2cf", 420, 46, 2)
keyLight.position.set(0, 9, -3.5)
```

该坐标位于初始相机目标点 `(0, -1.15, -3.5)` 的正上方，因此初始光斑接近屏幕中心。

点光源不会跟随相机移动。当用户平移视角时，光斑会停留在相同的海面物理位置，从而表现出真实的空间关系。

未启用实时阴影，以控制 GPU 开销。

## 9. 相机设置与有限视角移动

相机使用固定缩放比例和固定俯视角：

```ts
new THREE.PerspectiveCamera(48, 1, 0.1, 100)
```

初始位置与观察目标：

```ts
baseCameraPosition = (0, 7.1, 13.5)
baseCameraTarget = (0, -1.15, -3.5)
```

支持以下视角操作：

- 鼠标或触控拖拽。
- `W`、`A`、`S`、`D`。
- 键盘方向键。

相机位置和目标点会同步平移，因此缩放比例、俯视角和透视关系保持不变。

移动范围：

| 方向 | 范围 |
| --- | ---: |
| 左右 | `-5.5` 到 `5.5` |
| 前后 | `-3.2` 到 `3.2` |

`cameraOffset.lerp(targetCameraOffset, 0.09)` 用于平滑相机移动。

输入框或文本输入获得焦点时，键盘事件不会控制相机。

## 10. 性能策略

当前实现采取以下性能限制：

- `renderer.setPixelRatio(1)`，避免高 DPI 屏幕成倍增加像素渲染量。
- 海浪网格约 10,965 个顶点。
- 海浪顶点与法线约每 33ms 更新一次，即约 30 FPS。
- 不启用实时阴影。
- 只使用一次柏林噪声采样计算单个顶点高度。
- Canvas 尺寸只随窗口尺寸变化，不随 Sidebar 展开或收起变化。

需要继续优化时，可考虑将噪声和法线计算迁移到 Vertex Shader，从 CPU 顶点循环切换为 GPU 计算。

## 11. 生命周期与资源释放

组件卸载时执行：

- `cancelAnimationFrame`
- 移除 `resize`、`keydown`、`keyup` 监听器
- 移除 Pointer 事件监听器
- `geometry.dispose()`
- `material.dispose()`
- `renderer.dispose()`
- 移除 Renderer Canvas 元素

增加新纹理、RenderTarget 或后处理对象时，也需要在清理函数中调用对应的 `dispose()`。

## 12. 路由集成

`App` 通过以下逻辑识别海洋页面：

```ts
const isOceanPage = !currentPage || currentPage.slug === "smart-monitoring"
```

当 `isOceanPage` 为 `true` 时：

- 挂载 `OceanBackground`。
- Sidebar 与顶部栏以透明前景层显示。
- 内容区渲染 `OceanHome`。

因此 `#` 和 `#smart-monitoring` 都会显示同一海洋场景。

## 13. 后续扩展建议

- 将柏林噪声迁移至 GLSL Vertex Shader。
- 增加多层噪声以分别模拟大浪与细小波纹。
- 使用环境贴图或程序化天空提升水面反射。
- 增加质量档位，按设备性能选择网格分段和更新频率。
- 通过配置对象集中管理颜色、流速、振幅、光源位置和相机限制。

