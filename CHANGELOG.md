<!--
  Changelog format follows "Keep a Changelog" and Semantic Versioning.
  See: https://keepachangelog.com/ and https://semver.org/
-->

# 更新日志

本项目的所有显著变更将记录在此文件中。

## [Unreleased]

### Added

- 规划：错误边界、加载指示器、键盘快捷键、性能监控（FPS）
- 规划：FID 数据导出 CSV、用户自定义场景预设、场景分享

### Changed

- 规划：移动端适配与响应式优化

---

## [0.1.0-beta.2] - 2025-10-17

### Added

- 场景切换过程中暂停场景的更新
- 新增版本变更日志文件，用于记录后续版本历史

### Changed

- 重构视图菜单的布局结构
- 在 README 中补充安装步骤、使用方法与组件结构说明

### Fixed

- 修复切换场景时 FID 信号未正确清空的问题
- 修复恢复场景后 FID 渲染状态错误的问题

---

## [0.1.0-beta.1] - 2025-10-13

### Added

- 场景保存与恢复功能（切换后可一键恢复）
- 切换场景确认对话框，避免误操作丢失状态

### Changed

- 代码结构精简：移除未使用的窗口尺寸监听逻辑
- 替换直接 DOM 操作为更规范的 Vue 方式

### Performance

- 使用 `toRaw` 优化 `IsocArr` 响应式性能
- 优化 `saveState`：使用展开运算符进行高效状态克隆

### Known Issues

- FID 组件：使用恢复场景功能时曲线渲染可能异常
- 移动端适配尚未完成

---

## [0.1.0-alpha.2] - 2025-10-10

### Changed

- 多个性能关键模块优化，提升大规模场景渲染与物理计算效率
- 本地化与交互细节优化

### Performance

- 减少 `updateB1AndIsochromats` 冗余计算
- 提升 `PhysicalParam` 参数更新效率
- 降低 `BlochStep` 计算开销
- 加速 `relaxThermal` 热弛豫计算
- 提升 `updateFid` 性能（减少数组移位）
- 优化场景对象移除逻辑以提升切换响应速度

### Fixed

- 改善 `appState` 状态保存/恢复稳定性
- 改善 `appState` 定时器管理以避免重复触发与资源冲突

### Other

- 重新设计应用图标

---

## 参考

- 格式参考：Keep a Changelog
- 版本规范：Semantic Versioning
