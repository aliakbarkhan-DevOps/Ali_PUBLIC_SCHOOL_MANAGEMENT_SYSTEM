# AWS Deployment Documentation Hub

This directory contains comprehensive production-grade deployment guides for deploying the **Ali School of Science and Technology (ASST) Management System** on AWS. 

Since the system is a highly scalable, high-traffic, multi-port platform consisting of 11 microservices (Go, Python, Express) and 3 React frontends, we provide three distinct deployment paradigms depending on your target infrastructure:

---

## 📂 Deployment Directories & Guides

1.  **[Infrastructure Setup & AWS Core Services](file:///Users/Ali.Akbar/Documents/Management_System/deployment/infrastructure-setup.md)**
    *   Setup AWS S3 bucket for optional/choice user profile images.
    *   Migrate database to highly available PostgreSQL RDS / Aurora.
    *   Configure AWS Secrets Manager and IAM policies.
2.  **[AWS ECS (Elastic Container Service) Fargate](file:///Users/Ali.Akbar/Documents/Management_System/deployment/ecs-deployment.md)**
    *   Deploy serverless container tasks using AWS Fargate.
    *   Leverage **Application Load Balancer (ALB) Path-Based Routing** to replace codebase API routing.
3.  **[AWS EKS (Elastic Kubernetes Service)](file:///Users/Ali.Akbar/Documents/Management_System/deployment/eks-deployment.md)**
    *   Orchestrate containers using Kubernetes.
    *   Implement AWS Load Balancer Controller and Kubernetes Ingress routing.
4.  **[AWS EC2 (Elastic Compute Cloud) Virtual Machines](file:///Users/Ali.Akbar/Documents/Management_System/deployment/ec2-deployment.md)**
    *   Deploy services directly or using Docker Compose on EC2 instances.
    *   Configure **Nginx** as a reverse proxy router.

---

## 🗺️ Path-Based Routing Specifications
When deploying to ECS or EKS, the codebase API Gateway proxy is bypassed, and requests are routed directly to the specific microservice target groups at the **Application Load Balancer (ALB)** level. 

The ALB listener processes path-based rules to redirect traffic matching these exact patterns:

| Request Path Prefix | Target Microservice | Port | Tech Stack |
| :--- | :--- | :--- | :--- |
| `/api/auth/*` | `gateway-service` | `5005` | Express.js |
| `/api/users/*` | `gateway-service` | `5005` | Express.js |
| `/api/notifications/*` | `gateway-service` | `5005` | Express.js |
| `/api/academics/*` | `academic-service` | `8081` | Go |
| `/api/schedule/*` | `scheduling-service` | `8082` | Go |
| `/api/library/*` | `library-service` | `8083` | Go |
| `/api/finance/*` | `finance-service` | `8084` | Go |
| `/api/inventory/*` | `inventory-service` | `8085` | Go |
| `/api/cafe/*` | `cafe-service` | `8086` | Go |
| `/api/assignments/*` | `assignment-quiz-service` | `8001` | Python (FastAPI) |
| `/api/quizzes/*` | `assignment-quiz-service` | `8001` | Python (FastAPI) |
| `/api/research/*` | `research-lab-service` | `8002` | Python (FastAPI) |
| `/api/labs/*` | `research-lab-service` | `8002` | Python (FastAPI) |
| `/api/parking/*` | `parking-alumni-service` | `8003` | Python (FastAPI) |
| `/api/alumni/*` | `parking-alumni-service` | `8003` | Python (FastAPI) |
| `/api/reports/*` | `report-service` | `8004` | Python (FastAPI) |
| `/api/devops/*` | `gateway-service` (telemetry endpoints) | `5005` | Express.js |
