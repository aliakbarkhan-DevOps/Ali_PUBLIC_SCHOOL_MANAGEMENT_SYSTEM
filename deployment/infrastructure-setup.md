# AWS Infrastructure Setup & Core Services

Before deploying the container applications, you must provision the underlying AWS infrastructure. This guide covers database migrations, S3 bucket storage for user images, environment secrets management, and IAM policies.

---

## 1. Amazon S3 Bucket (User Profile Images)

The Admin has the choice of uploading profile photos during user creation. When configured with AWS S3 credentials, the Gateway service uploads images directly to S3.

### 1.1 Provisioning S3
1.  Open the AWS S3 Console and click **Create Bucket**.
2.  **Bucket Name**: `asst-user-avatars-<environment>` (must be globally unique).
3.  **Region**: e.g., `us-east-1`.
4.  **Object Ownership**: Enable **ACLs enabled** (required for `public-read` upload support) or disable it and use a custom Bucket Policy to allow public read access to objects.
5.  **Block Public Access**: 
    *   *Option A (Public Read)*: Uncheck **Block all public access** if you want direct S3 public access for avatars.
    *   *Option B (Secure/Recommended)*: Block public access and front the S3 bucket with an **Amazon CloudFront Distribution** using Origin Access Control (OAC).

### 1.2 Bucket CORS Configuration
Since portals query the S3 assets, CORS must be configured. Add the following CORS policy to the S3 bucket properties:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 1.3 IAM policy for S3 Access
Provide this policy to the IAM User or ECS Task execution role:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::asst-user-avatars-<environment>/*"
        }
    ]
}
```

---

## 2. Amazon RDS / Aurora (PostgreSQL Database)

The application uses multiple PostgreSQL databases (`auth_db`, `academic_db`, `schedule_db`, `library_db`, `finance_db`, `inventory_db`, `cafe_db`, `quiz_db`, `research_db`, `parking_db`).

### 2.1 Provisioning the Cluster
1.  Go to the **Amazon RDS Console** and click **Create Database**.
2.  Choose **Standard create** -> **Amazon Aurora** (PostgreSQL-Compatible Edition) or **PostgreSQL**.
3.  **Templates**: Choose **Production** (Multi-AZ cluster for high availability).
4.  **Settings**: DB cluster identifier `asst-prod-db`. Set master username to `postgres` and a secure master password.
5.  **Connectivity**:
    *   Deploy inside your secure Private VPC subnets.
    *   **Public Access**: Set to **No**.
    *   Create a Security Group `asst-rds-sg` allowing inbound PostgreSQL access (port `5432`) strictly from the ALB / EKS / ECS VPC security groups.

### 2.2 Schema Migrations
Upon startup, the Go and Python microservices automatically execute migrations (schema initialization and mock data seeds). Ensure that when a task starts, the `DATABASE_URL` matches the target RDS database endpoints. E.g.:
*   `postgresql://postgres:<password>@asst-prod-db.xxxx.us-east-1.rds.amazonaws.com:5432/academic_db`

---

## 3. AWS Secrets Manager (Environment Secrets)

To avoid exposing passwords, database URLs, and AWS access credentials in plaintext, manage configurations using **AWS Secrets Manager**.

### 3.1 Creating Secrets
Create a secret `asst/production/env` containing key-value pairs:
*   `JWT_SECRET`: A secure randomly generated secret string.
*   `DATABASE_URL_AUTH`: `postgresql://postgres:pass@rds-endpoint:5432/auth_db`
*   `DATABASE_URL_ACADEMIC`: `postgresql://postgres:pass@rds-endpoint:5432/academic_db`
*   `DATABASE_URL_SCHEDULE`: `postgresql://postgres:pass@rds-endpoint:5432/schedule_db`
*   `DATABASE_URL_LIBRARY`: `postgresql://postgres:pass@rds-endpoint:5432/library_db`
*   `DATABASE_URL_FINANCE`: `postgresql://postgres:pass@rds-endpoint:5432/finance_db`
*   `DATABASE_URL_INVENTORY`: `postgresql://postgres:pass@rds-endpoint:5432/inventory_db`
*   `DATABASE_URL_CAFE`: `postgresql://postgres:pass@rds-endpoint:5432/cafe_db`
*   `DATABASE_URL_QUIZ`: `postgresql://postgres:pass@rds-endpoint:5432/quiz_db`
*   `DATABASE_URL_RESEARCH`: `postgresql://postgres:pass@rds-endpoint:5432/research_db`
*   `DATABASE_URL_PARKING`: `postgresql://postgres:pass@rds-endpoint:5432/parking_db`
*   `AWS_S3_BUCKET`: `asst-user-avatars-production`
*   `AWS_ACCESS_KEY_ID`: (Omitting if using IAM Roles for Tasks/Pods)
*   `AWS_SECRET_ACCESS_KEY`: (Omitting if using IAM Roles for Tasks/Pods)
*   `AWS_REGION`: `us-east-1`
