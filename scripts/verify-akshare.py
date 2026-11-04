import json
import time

print("=" * 50)
print("akshare 港股数据源验证")
print("=" * 50)

# 检测 akshare 是否可用
try:
    import akshare as ak
    print("✅ akshare 已安装")
except ImportError:
    print("❌ akshare 未安装，请运行: pip install akshare")
    exit(1)

# 尝试获取港股实时行情
print("\n正在测试 ak.stock_hk_spot_em()...")
start = time.time()
try:
    df = ak.stock_hk_spot_em()
    elapsed = time.time() - start

    # 2. 记录字段信息
    schema = {
        "status": "success",
        "columns": list(df.columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "row_count": len(df),
        "sample": df.head(3).to_dict(orient='records'),
        "response_time_seconds": round(elapsed, 2)
    }

    # 3. 确认关键字段
    required_fields = ['代码', '名称', '最新价', '涨跌幅', '总市值']
    for field in required_fields:
        schema[f"has_{field}"] = field in df.columns

    print(f"✅ akshare 验证完成")
    print(f"   耗时: {elapsed:.2f} 秒")
    print(f"   字段数: {len(df.columns)}")
    print(f"   股票数: {len(df)}")
    print(f"   关键字段: {[f for f in required_fields if f in df.columns]}")
    print(f"\n字段列表:")
    for col in df.columns:
        print(f"   - {col}: {df[col].dtype}")

except Exception as e:
    elapsed = time.time() - start
    schema = {
        "status": "failed",
        "error": str(e),
        "error_type": type(e).__name__,
        "response_time_seconds": round(elapsed, 2),
        "note": "东方财富 API (eastmoney.com) 在当前网络环境不可用，akshare 底层依赖此 API"
    }
    print(f"❌ akshare 验证失败")
    print(f"   错误类型: {type(e).__name__}")
    print(f"   错误信息: {str(e)[:200]}")
    print(f"\n   原因分析: 东方财富 API 在当前网络环境被限制")
    print(f"   替代方案: 使用腾讯 API 获取港股数据")

# 4. 输出
with open('server/data/akshare-schema.json', 'w', encoding='utf-8') as f:
    json.dump(schema, f, ensure_ascii=False, indent=2)

print(f"\n结果已保存到 server/data/akshare-schema.json")
