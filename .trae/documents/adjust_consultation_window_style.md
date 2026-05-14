# 调整医助端和患者端视频诊疗窗口样式

## 目标
调整患者端 (`assistant/src/views/patient/consultation.vue`) 和医助端 (`assistant/src/views/aide/consultation.vue`) 视频问诊页面的布局、聊天字体和元素间距。

## 涉及文件

| 文件 | 说明 |
|------|------|
| `assistant/src/views/patient/consultation.vue` | 患者端视频问诊页面 |
| `assistant/src/views/aide/consultation.vue` | 医助端视频问诊页面 |
| `assistant/src/views/patient/consultation/components/ConsultSubtitleTimeline.vue` | 聊天列表/字幕时间线组件（两端共用） |

两个 consultation 页面共享同一个 `ConsultSubtitleTimeline.vue` 组件，修改一次即可同时影响两端。

## 当前状态分析

### 1. 布局比例
当前 `.consultation-layout` 使用 CSS Grid，固定左列 470px：
```scss
grid-template-columns: 470px minmax(0, 1fr);
```
左列固定宽度不响应屏幕大小，无法达到 2:3 比例。

### 2. 聊天字体
消息文字 `.message-text` 当前为 `color: #26395f; font-size: 14px;`，翻译文字 `.translated-text` 为 `color: #414a72;`。均非纯黑且字号偏小。
说话人名称 `.speaker-name` 为 `color: #29426f; font-size: 12px;`，时间戳 `.message-time` 继承 `.message-meta` 的 `color: #6f82a1; font-size: 12px;`。

### 3. 元素间距
多处间距超过 10px，如：
- `.panel-header` gap: 12px
- `.title-group` gap: 8px (ok)
- `.timeline-list` padding: 12px 10px 12px 14px
- `.timeline-row` margin-bottom: 12px
- `.message-bubble` padding: 10px 14px
- `.message-divider` margin: 8px 0 (ok)
- `.composer-panel` gap: 10px, padding: 12px 14px 14px
- 页面级 `.consultation-layout` gap: 10px
- `.featured-stage` padding: 12px
- `.consultation-footer` gap: 12px, padding: 10px 14px
- `.doctor-panel` gap: 10px
- `.doctor-avatar` 42px × 42px

## 具体修改方案

### 修改 1：ConsultSubtitleTimeline.vue — 布局比例

**文件**: `assistant/src/views/patient/consultation/components/ConsultSubtitleTimeline.vue`

无需修改此文件的布局，因为布局由父页面控制。

### 修改 2：consultation.vue（患者端）— 布局比例 + 间距

**文件**: `assistant/src/views/patient/consultation.vue`

1. `.consultation-layout` 的 `grid-template-columns` 从 `470px minmax(0, 1fr)` 改为 `2fr 3fr`（左 2/5，右 3/5）
2. `.consultation-layout` 的 `gap` 从 `10px` 改为 `8px`
3. `.patient-consultation-page` 的 `padding` 从 `12px` 改为 `8px`
4. `.video-column` 的 `gap` 从 `10px` 改为 `8px`
5. `.featured-stage` 的 `padding` 从 `12px` 改为 `8px`
6. `.consultation-footer` 的 `gap` 从 `12px` 改为 `8px`，`padding` 从 `10px 14px` 改为 `8px 10px`
7. `.doctor-panel` 的 `gap` 从 `10px` 改为 `8px`
8. `.doctor-avatar` 从 `42px × 42px` 改为 `38px × 38px`，字体从 `20px` 改为 `18px`
9. `.doctor-heading` 的 `gap` 从 `8px` 改为 `6px`
10. `.doctor-copy` 的 `gap` 从 `3px` 改为 `2px`
11. `.preview-row` 的 `gap` 从 `8px` 改为 `6px`
12. 响应式 `@media (max-width: 1180px)` 中的 gap 从 `10px` 改为 `8px`
13. 响应式 `@media (max-width: 900px)` 中 `.patient-consultation-page` padding 从 `8px` 改为 `6px`，gap 从 `8px` 改为 `6px`

### 修改 3：aide/consultation.vue（医助端）— 布局比例 + 间距

**文件**: `assistant/src/views/aide/consultation.vue`

与患者端相同：
1. `.consultation-layout` 的 `grid-template-columns` 从 `470px minmax(0, 1fr)` 改为 `2fr 3fr`
2. `.consultation-layout` 的 `gap` 从 `10px` 改为 `8px`
3. `.patient-consultation-page` 的 `padding` 从 `12px` 改为 `8px`
4. `.video-column` 的 `gap` 从 `10px` 改为 `8px`
5. `.featured-stage` 的 `padding` 从 `12px` 改为 `8px`
6. `.consultation-footer` 的 `gap` 从 `12px` 改为 `8px`，`padding` 从 `10px 14px` 改为 `8px 10px`
7. `.doctor-panel` 的 `gap` 从 `10px` 改为 `8px`
8. `.doctor-avatar` 从 `40px × 40px` 改为 `36px × 36px`，字体从 `18px` 改为 `16px`
9. `.doctor-heading` 的 `gap` 从 `6px` 改为 `5px`
10. `.doctor-good-at` 的 `margin` 从 `3px 0 0` 改为 `2px 0 0`
11. `.stage-pill` 的 `gap` 从 `6px` 改为 `5px`
12. `.preview-row` 的 `gap` 从 `8px` 改为 `6px`
13. 响应式 `@media (max-width: 1100px)` 中的 gap 调整
14. 响应式 `@media (max-width: 720px)` 中 `.patient-consultation-page` padding 从 `8px` 改为 `6px`

### 修改 4：ConsultSubtitleTimeline.vue — 聊天字体 + 间距

**文件**: `assistant/src/views/patient/consultation/components/ConsultSubtitleTimeline.vue`

#### 字体字号调大 + 颜色改为纯黑 #000
1. `.message-text`：`font-size` 从 `14px` → `16px`，`color` 从 `#26395f` → `#000`
2. `.translated-text`：`color` 从 `#414a72` → `#000`
3. `.message-text--pending`：`color` 从 `#7b8cad` → `#666`（pending 状态用深灰区分）
4. `.speaker-name`：`font-size` 从 `12px` → `14px`，`color` 从 `#29426f` → `#000`
5. `.message-meta`：`font-size` 从 `12px` → `14px`，`color` 从 `#6f82a1` → `#666`（时间戳用深灰）
6. `.section-title`：`font-size` 从 `13px` → `14px`（标签文字微调）

#### 间距缩小（不超过 8px）
1. `.panel-header`：`gap` 从 `12px` → `6px`，`padding` 从 `12px 14px 10px` → `8px 10px 6px`
2. `.title-group`：`gap` 从 `8px` → `6px`
3. `.eyebrow`：`margin` 从 `0 0 3px` → `0 0 2px`
4. `.status-group`：`gap` 从 `6px` → `4px`
5. `.status-tag`：`padding` 从 `4px 10px` → `3px 8px`
6. `.language-toggle`：`gap` 从 `8px` → `6px`
7. `.retry-button`：`gap` 从 `4px` → `3px`，`padding` 从 `6px 10px` → `4px 8px`
8. `.panel-notice`：`margin` 从 `10px 14px 0` → `6px 8px 0`，`padding` 从 `8px 12px` → `6px 8px`
9. `.timeline-list`：`padding` 从 `12px 10px 12px 14px` → `8px 6px 8px 8px`
10. `.timeline-row`：`margin-bottom` 从 `12px` → `8px`
11. `.message-card`：`max-width` 从 `88%` → `90%`
12. `.message-meta`：`gap` 从 `8px` → `6px`，`margin-bottom` 从 `4px` → `3px`，`padding` 从 `0 4px` → `0 2px`
13. `.message-bubble`：`padding` 从 `10px 14px` → `8px 10px`
14. `.message-bubble--translated-only`：`padding` 从 `10px 14px` → `8px 10px`
15. `.message-section`：`gap` 从 `4px` → `3px`
16. `.message-section--translated-only`：`gap` 从 `3px` → `2px`
17. `.message-divider`：`margin` 从 `8px 0` → `6px 0`
18. `.draft-tag`：`margin-top` 从 `6px` → `4px`，`padding` 从 `2px 8px` → `2px 6px`
19. `.empty-state`：`margin` 从 `12px` → `8px`，`gap` 从 `6px` → `4px`
20. `.composer-panel`：`gap` 从 `10px` → `6px`，`padding` 从 `12px 14px 14px` → `8px 10px 10px`
21. `.composer-input`：`min-height` 从 `72px` → `60px`，`padding` 从 `10px 12px` → `8px 10px`，`font-size` 从 `14px` → `16px`
22. `.composer-footer`：`gap` 从 `10px` → `6px`
23. `.composer-status`：`font-size` 从 `12px` → `13px`
24. `.send-button`：`gap` 从 `5px` → `4px`，`padding` 从 `8px 14px` → `6px 12px`
25. `.icon-box`：`margin-top` 从 `2px` → `1px`
26. `.language-toggle-label`：`font-size` 从 `11px` → `12px`

## 假设与决策

1. **间距统一标准**：所有元素间距上限设为 8px（保守取值，确保不超过 10px 要求）
2. **颜色区分**：消息正文和说话人名称用纯黑 #000，时间戳用 #666 深灰以保持可读区分
3. **响应式兼容**：在小屏断点下的间距同步缩小，保持一致性
4. **不影响整体布局**：仅修改内部间距和字体，不修改 `PatientPageShell` 容器样式

## 验证步骤

1. 启动医助端开发服务：`cd assistant && npm run dev`
2. 访问患者端问诊页面，验证：
   - 左侧聊天窗口约占 2/5 宽度，右侧视频窗口约占 3/5
   - 聊天消息文字为纯黑色 #000，字号明显增大
   - 说话人名称和时间戳字号增大
   - 各元素间距紧凑（不超过 10px）
3. 访问医助端问诊页面，验证相同效果
4. 检查响应式布局（窄屏时变为上下排列）
