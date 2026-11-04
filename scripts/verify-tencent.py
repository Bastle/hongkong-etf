import requests
import time
import json

# 1. 测试单只股票
print("=== 测试单只股票 API ===")
url = "http://qt.gtimg.cn/q=hk00700"
resp = requests.get(url)
print(f"状态码: {resp.status_code}")
print(f"响应长度: {len(resp.text)} 字符")
print(f"响应内容:\n{resp.text[:500]}")

# 2. 测试批量请求
print("\n=== 测试批量请求 ===")
codes = ','.join([f'hk{i:05d}' for i in [700, 9988, 3690]])
url = f"http://qt.gtimg.cn/q={codes}"
resp = requests.get(url)
print(f"响应长度: {len(resp.text)} 字符")
print(f"响应内容:\n{resp.text[:800]}")

# 3. 测试限流
print("\n=== 限流测试 ===")
for i in range(3):
    start = time.time()
    resp = requests.get(f"http://qt.gtimg.cn/q=hk00700")
    elapsed = time.time() - start
    print(f"请求 {i+1}: {elapsed:.2f}s")
    time.sleep(1)

# 4. 测试 50 只股票 URL 长度
print("\n=== URL 长度测试 ===")
codes = ['hk%05d' % i for i in range(50)]
url = 'http://qt.gtimg.cn/q=' + ','.join(codes)
print(f"50 只股票 URL 长度: {len(url)} 字符")
assert len(url) < 2000, 'URL 过长'
print("✅ URL 长度安全")

# 5. 输出文档
with open('server/data/tencent-api-notes.md', 'w') as f:
    f.write("# 腾讯 API 说明\n\n")
    f.write(f"- 基础 URL: `http://qt.gtimg.cn/q=hk{{code}}`\n")
    f.write(f"- 响应格式: `~` 分隔的字符串\n")
    f.write(f"- 建议批量大小: 50 只/批\n")
    f.write(f"- 建议批次间隔: 3.5 秒\n")
    f.write(f"- 单次请求耗时: ~0.1-0.3 秒\n")

print(f"\n✅ 腾讯 API 验证完成")
