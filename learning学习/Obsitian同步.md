## Fast Note sysnc同步
### 未配置路径，在cmd或PowerShell中使用
 1. 使用<font color="#c00000">~/fast-note/fast-note-sync-service.exe run</font>打开插件所需服务
 2. 进入<font color="#c00000">http://localhost:9000/</font>查看服务器
### 在git bash中使用
  fns run          # 启动服务
  fns version      # 查看版本
  fns --help       # 查看帮助

## 服务地址
http://localhost:9000
https://plexiglas-confound-crust.ngrok-free.dev
## ngrok内网穿透
  1. ~~配置 ngrok auth token~~
  ~~去 https://ngrok.com 注册免费账号，然后在 dashboard 复制你的 authtoken，执行：~~
  ~~ngrok config add-authtoken <你的token>~~
  2. 启动穿透（<mark style="background:#d3f8b6">两个终端</mark>）
  终端 A — 先启动 Fast Note：
  fns run
  终端 B — 启动 ngrok 穿透：
 ~/ngrok/ngrok.exe http --url=plexiglas-confound-crust.ngrok-free.dev 9000
 
  ngrok 会给你一个类似 https://xxxx.ngrok-free.app 的公网地址，就可以从外网访问你的 Fast Note 服务了。