# AWS EC2 Virtual Machine Deployment Guide

For virtual machine hosting on AWS EC2, you can choose to deploy using **Docker Compose** or run raw binaries utilizing **PM2 / systemd**. In both cases, **Nginx** is set up as the edge proxy router to direct client browser traffic to the corresponding service ports.

---

## 1. Nginx Reverse Proxy Configuration

Install Nginx on your EC2 instance (e.g., Ubuntu):
```bash
sudo apt update
sudo apt install nginx -y
```

Create a virtual host configuration file `/etc/nginx/sites-available/asst-school` to route incoming traffic based on URL path prefixes, replicating the API gateway routing logic on the local loopback adapter:

```nginx
server {
    listen 80;
    server_name asst.edu www.asst.edu;

    # SSL configuration (Optional, fronted by Let's Encrypt / Certbot)
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/asst.edu/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/asst.edu/privkey.pem;

    # Frontends
    # Admin Portal
    location /admin {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Campus Portal
    location /campus {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # DevOps Portal
    location /devops {
        proxy_pass http://localhost:3002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Gateway Auth & User Management Endpoints
    location /api/auth {
        proxy_pass http://localhost:5005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/users {
        proxy_pass http://localhost:5005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/notifications {
        proxy_pass http://localhost:5005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Go Microservices
    location /api/academics/ {
        proxy_pass http://localhost:8081/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/schedule/ {
        proxy_pass http://localhost:8082/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/library/ {
        proxy_pass http://localhost:8083/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/finance/ {
        proxy_pass http://localhost:8084/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/inventory/ {
        proxy_pass http://localhost:8085/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/cafe/ {
        proxy_pass http://localhost:8086/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Python FastAPI Microservices
    location /api/assignments/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/quizzes/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/research/ {
        proxy_pass http://localhost:8002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/labs/ {
        proxy_pass http://localhost:8002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/parking/ {
        proxy_pass http://localhost:8003/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/alumni/ {
        proxy_pass http://localhost:8003/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Python FastAPI PDF Report Service
    location /api/reports/ {
        proxy_pass http://localhost:8004/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # DevOps Status diagnostics
    location /api/devops/ {
        proxy_pass http://localhost:5005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/asst-school /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 2. Docker Compose Deployment on EC2

To run the stack on an EC2 instance using Docker Compose:
1.  Install Docker and Docker Compose on the EC2 instance.
2.  Clone the repository and create an `.env` file containing RDS endpoints, secrets, and S3 credentials.
3.  Configure S3 variables in `.env` to leverage S3 user avatars:
    ```bash
    AWS_ACCESS_KEY_ID="your_aws_access_key"
    AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
    AWS_REGION="us-east-1"
    AWS_S3_BUCKET="asst-user-avatars-production"
    ```
4.  Run compose in detached mode:
    ```bash
    docker compose -f docker-compose.yml up -d
    ```

---

## 3. Direct Native Host Deployment (systemd & PM2)

If you prefer to run services natively on the host (not inside Docker containers):

### 3.1 Go microservices
For each Go service:
1. Build the binary:
   ```bash
   cd services/academic-service
   go build -o main cmd/server/main.go
   ```
2. Create a systemd service file `/etc/systemd/system/asst-academic.service`:
   ```ini
   [Unit]
   Description=ASST Academic Microservice
   After=network.target

   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/home/ubuntu/Management_System/services/academic-service
   Environment=PORT=8081
   Environment=DATABASE_URL=postgresql://postgres:pass@rds-endpoint:5432/academic_db
   ExecStart=/home/ubuntu/Management_System/services/academic-service/main
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```
3. Start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable asst-academic
   sudo systemctl start asst-academic
   ```

### 3.2 Python microservices (FastAPI)
Deploy Python microservices using **PM2** or systemd with `uvicorn`:
1. Install virtualenv and download dependencies:
   ```bash
   cd services/report-service
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Create systemd configuration file:
   ```ini
   [Service]
   ExecStart=/home/ubuntu/Management_System/services/report-service/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8004
   ```

### 3.3 Node / Express Gateway
Deploy the gateway and telemetry proxy using **PM2**:
```bash
cd services/gateway-service
npm install
pm2 start src/index.js --name "asst-gateway"
pm2 save
pm2 startup
```
Ensure all environment variables are mapped in the PM2 process ecosystem file or `.env` configuration.
