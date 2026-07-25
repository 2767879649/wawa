---
tags:
  - Git
---

![[image/Pasted image 20260620142943.png]]
**获取帮助**
1. git --help 获取命令帮助
2. git -h 获取命令简短帮助
---
**建立仓库**
1. 新建本地仓库 git init  *执行后文件夹会生成隐藏的.git文件夹，代表变成Git仓库*
  2.克隆远程仓库 git clone 仓库地址
---
**绑定仓库**
1. 如果已经存在origin，先删除执行 git remote remove origin
2. 绑定远程仓库 git remote add origin https://github.com/xxx/xxx.git
3. 查看远程地址 git remote -v 
---
**提交**
## 文件分为三种状态：未跟踪→暂存区→本地仓库
1. 添加文件到暂存区 ==git add .==             
2. 提交到本地 ==git commit -m "这里写本次修改内容"==
3. 推送到远程仓库 ==git push origin 分支名==
*出错执行拉取*
4. 查看修改状态 ==git status==
*git push -u origin master# 第一次推送需要加‑u绑定分支*
---
**拉取远程代码（提交记录）**====
1.  拉取历史 ==git pull origin master====
2. 本地和远程历史不一致时报错，合并无关历史 git pull origin master --allow-unrelated-histories
---
**分支**
1. 查看分支 git branch 
2.  创建分支 git branch 分支名    
3. 切换分支 git switch 分支名
4.  删除分支 git branch -D 分支名   
5. 在主干中合并分支 git merge 分支名
• master：主分支，存放稳定代码；
• dev：开发分支，平时写代码用。
---
**查看版本、回滚版本**
1. 查看提交记录 git log
2. 软回滚（修改的代码保留，撤销提交记录）git reset --soft 提交id
3. 硬回滚（直接删掉后面所有修改，谨慎使用）git reset --hard 提交id
---
**情况**
1. 远程代码比本地新，推送被拒绝
git pull origin master --allow-unrelated-histories
git push origin 分支名
2. 单人开发，直接强制覆盖远程（会清空远程原有代码）
git push -f origin master
3. 合并时进入vim编辑器：
• 保存退出：Esc → 输入:wq回车
• 放弃合并：Esc → 输入:q!回车，执行 git merge --abort
---
**完整工作流程（日常开发）**
1. 第一次：git clone 地址
2. 每次开发前先拉取最新代码：git pull
3. 修改代码
4. git add .
5. git commit -m "修改备注"
6. git push
