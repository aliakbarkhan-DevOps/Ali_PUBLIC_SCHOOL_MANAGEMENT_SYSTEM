# AWS EKS Fargate Deployment Guide

AWS Elastic Kubernetes Service (EKS) enables standard Kubernetes orchestration. When deploying on EKS, you can leverage the **AWS Load Balancer Controller** to deploy an Application Load Balancer (ALB) via an Ingress resource, achieving path-based microservice routing directly at the Kubernetes ingress controller level.

---

## 1. AWS Load Balancer Controller Setup

To allow Kubernetes Ingress resources to provision an AWS ALB, install the AWS Load Balancer Controller in your EKS cluster:
1.  **Configure IAM OIDC Provider** for the EKS Cluster.
2.  Create an IAM Policy for the controller and create an IAM Role for Service Accounts (IRSA).
3.  Install the controller using Helm:
    ```bash
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
      -n kube-system \
      --set clusterName=asst-eks-cluster \
      --set serviceAccount.create=false \
      --set serviceAccount.name=aws-load-balancer-controller
    ```

---

## 2. Kubernetes Ingress (ALB Routing)

Create an `ingress.yaml` file to expose the services publicly. The AWS Load Balancer Controller reads these annotations to automatically provision and configure an ALB with path-based routing rules.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: asst-ingress
  namespace: default
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    # Configure path redirects and prefixes
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    # Optional SSL Certificate ARN
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/abc-123-xyz
spec:
  rules:
    - http:
        paths:
          # Gateway & Users / Auth
          - path: /api/auth
            pathType: Prefix
            backend:
              service:
                name: gateway-service
                port:
                  number: 5005
          - path: /api/users
            pathType: Prefix
            backend:
              service:
                name: gateway-service
                port:
                  number: 5005
          - path: /api/notifications
            pathType: Prefix
            backend:
              service:
                name: gateway-service
                port:
                  number: 5005

          # Go Microservices
          - path: /api/academics
            pathType: Prefix
            backend:
              service:
                name: academic-service
                port:
                  number: 8081
          - path: /api/schedule
            pathType: Prefix
            backend:
              service:
                name: scheduling-service
                port:
                  number: 8082
          - path: /api/library
            pathType: Prefix
            backend:
              service:
                name: library-service
                port:
                  number: 8083
          - path: /api/finance
            pathType: Prefix
            backend:
              service:
                name: finance-service
                port:
                  number: 8084
          - path: /api/inventory
            pathType: Prefix
            backend:
              service:
                name: inventory-service
                port:
                  number: 8085
          - path: /api/cafe
            pathType: Prefix
            backend:
              service:
                name: cafe-service
                port:
                  number: 8086

          # Python FastAPI Microservices
          - path: /api/assignments
            pathType: Prefix
            backend:
              service:
                name: assignment-quiz-service
                port:
                  number: 8001
          - path: /api/quizzes
            pathType: Prefix
            backend:
              service:
                name: assignment-quiz-service
                port:
                  number: 8001
          - path: /api/research
            pathType: Prefix
            backend:
              service:
                name: research-lab-service
                port:
                  number: 8002
          - path: /api/labs
            pathType: Prefix
            backend:
              service:
                name: research-lab-service
                port:
                  number: 8002
          - path: /api/parking
            pathType: Prefix
            backend:
              service:
                name: parking-alumni-service
                port:
                  number: 8003
          - path: /api/alumni
            pathType: Prefix
            backend:
              service:
                name: parking-alumni-service
                port:
                  number: 8003
          
          # Python PDF Report Service
          - path: /api/reports
            pathType: Prefix
            backend:
              service:
                name: report-service
                port:
                  number: 8004

          # DevOps Diagnostics UI telemetry endpoint
          - path: /api/devops
            pathType: Prefix
            backend:
              service:
                name: gateway-service
                port:
                  number: 5005
```

---

## 3. Kubernetes Deployment & Service Manifests

Deploy individual pods using standard Kubernetes configuration files. Configure environment secrets referencing Kubernetes secrets.

### 3.1 Sample Deployment Template (e.g. academic-service)
Save this template as `deployment-academic.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: academic-service
  labels:
    app: academic-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: academic-service
  template:
    metadata:
      labels:
        app: academic-service
    spec:
      containers:
        - name: academic-service
          image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/asst-academic-service:latest
          ports:
            - containerPort: 8081
          env:
            - name: PORT
              value: "8081"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: asst-secrets
                  key: database-url-academic
          readinessProbe:
            httpGet:
              path: /health
              port: 8081
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8081
            initialDelaySeconds: 15
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: academic-service
spec:
  type: ClusterIP
  ports:
    - port: 8081
      targetPort: 8081
  selector:
    app: academic-service
```

### 3.2 Injecting Kubernetes Secrets
Deploy database URLs and secrets securely as a Kubernetes Secret resource before starting deployments:
```bash
kubectl create secret generic asst-secrets \
  --from-literal=database-url-academic="postgresql://postgres:pass@rds-endpoint:5432/academic_db" \
  --from-literal=database-url-auth="postgresql://postgres:pass@rds-endpoint:5432/auth_db" \
  --from-literal=jwt-secret="asst-jwt-secret-key-987654321" \
  --from-literal=aws-s3-bucket="asst-user-avatars-production"
```
*(Tip: You can use External Secrets Operator to sync Secrets Manager secrets directly into Kubernetes secrets automatically).*
