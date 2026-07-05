---
title: "Python asyncio 使用指南"
tags: ["python", "async", "asyncio"]
created: 2026-06-20
---

# Python asyncio 使用指南

## 问题

Python 处理大量 IO 密集型任务（网络请求、文件读写）时，多线程开销大且容易出错。需要一种高效的并发方案。

## 方案

使用 Python 的 asyncio 库实现异步 IO，通过事件循环（event loop）单线程处理并发任务。

## 核心概念

- **coroutine**: 用 `async def` 定义的函数，可以被等待
- **event loop**: 事件循环，调度和执行协程
- **task**: 将协程包装成 Task 提交给事件循环
- **await**: 等待一个协程完成，交出控制权给事件循环

## 代码

```python
import asyncio

async def fetch_data(url: str) -> str:
    await asyncio.sleep(1)  # 模拟网络请求
    return f"Data from {url}"

async def main():
    urls = [f"https://api.example.com/{i}" for i in range(10)]
    tasks = [fetch_data(url) for url in urls]
    results = await asyncio.gather(*tasks)
    for r in results:
        print(r)

asyncio.run(main())
```

## 注意事项

- 不要在协程中使用阻塞调用（如 `time.sleep`），用 `await asyncio.sleep` 代替
- CPU 密集型任务不适合 asyncio，应该用 multiprocessing
- Python 3.11+ 的 asyncio 性能有显著提升

## 参考

- [Python asyncio 官方文档](https://docs.python.org/3/library/asyncio.html)
