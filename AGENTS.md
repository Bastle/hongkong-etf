# AGENTS.md

## 项目概览
港股热力图 — Nuxt 3 + D3.js + Canvas 的全屏热力图可视化项目

## 关键文件
| 文件 | 用途 |
|------|------|
| `CLAUDE.md` | Claude Code 项目上下文 |
| `AGENTS.md` | AI 助手通用规则 |
| `PROGRESS.md` | 项目进度追踪 |
| `feature_list.json` | 功能清单（结构化任务追踪）|
| `Makefile` | 统一任务入口 |

## 硬约束（不可违反）
1. 所有 API 响应必须通过 `normalizeTencentData()` / `normalizeSinaData()` 规范化
2. Market cap = 0 或 NaN 必须降级为 1e8，保持区块可见
3. 不要修改 `server/utils/cache.ts` 的 TTL 配置（当前 8s）
4. Canvas 渲染必须保持双层架构（Main + Hover）
5. 敏感信息（API key、密码）绝不提交到 git

## 工作规则
- 每次只做一个功能点或修复一个问题
- 完成后必须通过验证才能开始下一个
- 不要在做功能 A 时"顺便"重构功能 B
- 修改 `server/` 代码后必须运行 `make test`
- 修改 `app/composables/` 后必须运行 `npx nuxi typecheck`

## 会话流程
### 开始时
1. 读 `PROGRESS.md` 了解当前状态
2. 读 `feature_list.json` 了解任务列表
3. 找到可以继续的工作
4. 开始前说清楚你要做什么

### 结束时
1. 运行 `make check` 确保一切正常
2. 更新 `PROGRESS.md`
3. 提交代码并写清楚 commit message
4. 确保无临时文件残留

## 数据源说明
| 数据源 | 用途 | 状态 |
|--------|------|------|
| 腾讯 API | 实时行情（主） | ✅ 可用 |
| 新浪 API | 实时行情（备） | ✅ 可用 |
| akshare | 股票列表 | ⚠️ 东方财富 API 不可用 |
| HSCI | 行业分类 | ✅ 静态数据 |
