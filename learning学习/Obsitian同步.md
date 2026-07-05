 1. 使用<font color="#c00000">~/fast-note/fast-note-sync-service.exe run</font>打开插件所需服务
 fns run          # 启动服务
  fns version      # 查看版本
  fns --help       # 查看帮助
 2. 进入<font color="#c00000">http://localhost:9000/</font>开启服务器
 <mark style="background:#d3f8b6">平板手机连接需要网络配置防火墙入站规则</mark>


## ngrok内网穿透
  1. 配置 ngrok auth token
  去 https://ngrok.com 注册免费账号，然后在 dashboard 复制你的 authtoken，执行：
  ngrok config add-authtoken <你的token>
  2. 启动穿透
  终端 A — 先启动 Fast Note：
  source ~/.bashrc
  fns run
  终端 B — 启动 ngrok 穿透：
  source ~/.bashrc
  ngrok http 9000
  ngrok 会给你一个类似 https://xxxx.ngrok-free.app 的公网地址，就可以从外网访问你的 Fast Note 服务了。