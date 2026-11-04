# Makefile — 港股热力图统一任务入口
#
# 用法：make [target]
#   make dev      启动开发服务器
#   make test     运行测试
#   make lint     代码风格检查
#   make check    完整验证
#   make build    生产构建
#   make status   查看项目状态
#   make clean    清理临时文件

.PHONY: dev test lint check build status clean help

# 默认目标
.DEFAULT_GOAL := help

# 开发服务器
dev:
	@echo "→ 启动开发服务器..."
	yarn dev

# 运行测试
test:
	@echo "→ 运行测试..."
	yarn test

# 代码风格检查
lint:
	@echo "→ 运行 lint..."
	yarn lint

# 完整验证：lint + test
check: lint test
	@echo "✓ 完整验证通过"

# 生产构建
build:
	@echo "→ 构建生产版本..."
	yarn build

# 查看项目状态
status:
	@echo "=== Git 状态 ==="
	@if git rev-parse --git-dir > /dev/null 2>&1; then \
		echo "  分支: $$(git branch --show-current 2>/dev/null || echo 'detached')"; \
		echo "  最新 commit: $$(git log --oneline -1 2>/dev/null || echo '无')"; \
		echo "  未跟踪文件: $$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')"; \
		echo "  已修改文件: $$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')"; \
	else \
		echo "  不在 git 仓库中"; \
	fi
	@echo ""
	@echo "=== 功能完成情况 ==="
	@if [ -f feature_list.json ]; then \
		python3 -c "import json; \
		d=json.load(open('feature_list.json')); \
		total=sum(len(p['tasks']) for p in d['phases']); \
		completed=sum(1 for p in d['phases'] for t in p['tasks'] if t['status']=='completed'); \
		pending=sum(1 for p in d['phases'] for t in p['tasks'] if t['status']=='pending'); \
		print(f'  总计: {total}'); \
		print(f'  ✓ 完成: {completed}'); \
		print(f'  ○ 待开始: {pending}')"; \
	else \
		echo "  feature_list.json 不存在"; \
	fi

# 清理临时文件
clean:
	@echo "→ 清理临时文件..."
	@find . -name "*.tmp" -o -name "*.log" -o -name "*.bak" | xargs rm -f 2>/dev/null || true
	@echo "✓ 清理完成"

# 帮助信息
help:
	@echo "港股热力图 — 可用命令："
	@echo ""
	@echo "  make dev      启动开发服务器 (port 3000)"
	@echo "  make test     运行测试"
	@echo "  make lint     代码风格检查"
	@echo "  make check    完整验证 (lint + test)"
	@echo "  make build    生产构建"
	@echo "  make status   查看项目状态"
	@echo "  make clean    清理临时文件"
	@echo "  make help     显示此帮助"
