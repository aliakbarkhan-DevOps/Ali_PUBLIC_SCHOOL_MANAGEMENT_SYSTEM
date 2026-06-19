module.exports = {
    port: process.env.PORT || 5005,
    jwtSecret: process.env.JWT_SECRET || 'asst-jwt-secret-key-987654321',
    databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/auth_db',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    awsS3Bucket: process.env.AWS_S3_BUCKET
};
