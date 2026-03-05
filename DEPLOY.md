# 阿里云 ECS 部署指南

本指南将帮助你将项目部署到阿里云 ECS 服务器（CentOS 7/8 或 Ubuntu）。

## 1. 准备工作

### 1.1 安装 Node.js (推荐 v18 或 v20)
```bash
# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 1.2 安装 MySQL 数据库
确保已安装 MySQL 5.7 或 8.0，并创建一个数据库（例如 `ai_chat_app`）。
```sql
CREATE DATABASE ai_chat_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 1.3 安装 PM2 进程管理工具
```bash
sudo npm install -g pm2
```

### 1.4 安装 Nginx (反向代理)
```bash
# Ubuntu
sudo apt update
sudo apt install nginx

# CentOS
sudo yum install epel-release
sudo yum install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 2. 代码部署

### 2.1 获取代码
将代码上传到服务器，可以通过 git clone 或直接上传压缩包。
```bash
git clone <你的git仓库地址>
cd shouyangji-new
```

### 2.2 安装依赖
```bash
npm install
```

### 2.3 配置环境变量
复制 `.env.example` 为 `.env.local` 并修改配置：
```bash
cp .env.example .env.local
nano .env.local
```
**重点配置项：**
- `DATABASE_URL`: 数据库连接字符串
- `AI_API_KEY`: AI 接口密钥
- `NEXTAUTH_SECRET`: 生成一个随机字符串 (可运行 `openssl rand -base64 32`)
- `NEXTAUTH_URL`: 你的域名或 IP (例如 `http://your-ip:3000`)

### 2.4 数据库迁移
运行数据库迁移脚本初始化表结构：
```bash
npm run migrate
```

### 2.5 构建项目
```bash
npm run build
```

## 3. 启动服务

使用 PM2 启动服务，确保后台运行且自动重启。
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 4. 配置 Nginx 反向代理

编辑 Nginx 配置文件（通常在 `/etc/nginx/conf.d/` 或 `/etc/nginx/sites-available/`）：

```nginx
server {
    listen 80;
    server_name your_domain.com; # 替换为你的域名或公网IP

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # 增加超时时间，防止 AI 生成时间过长导致 504 错误
        proxy_read_timeout 3600;
        proxy_connect_timeout 3600;
        proxy_send_timeout 3600;
    }
}
```

重启 Nginx：
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 6. 更新部署（非首次部署）

如果已经在服务器上部署过，只需执行以下步骤来更新代码：

### 6.1 拉取最新代码
进入项目目录并拉取 git 仓库的最新更改：
```bash
cd shouyangji-new
git pull origin main
```

### 6.2 更新依赖与数据库
安装可能新增的依赖包，并运行数据库迁移脚本（非常重要，本次更新包含新的数据库表结构）：
```bash
npm install
npm run migrate
```

### 6.3 重新构建
重新编译 Next.js 应用：
```bash
npm run build
```

### 6.4 重启服务
使用 PM2 重载应用以应用更改：
```bash
pm2 reload ai-chat-app
```
或者：
```bash
pm2 restart ecosystem.config.js
```

### 6.5 (可选) 检查 Nginx 配置
如果之前遇到过 AI 请求超时的问题，请确保 Nginx 配置中已增加了超时设置（参考第 4 节），修改后需重启 Nginx：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

