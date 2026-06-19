const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config');
const fs = require('fs');
const path = require('path');

let s3Client = null;

if (config.awsAccessKeyId && config.awsSecretAccessKey) {
    s3Client = new S3Client({
        region: config.awsRegion,
        credentials: {
            accessKeyId: config.awsAccessKeyId,
            secretAccessKey: config.awsSecretAccessKey
        }
    });
}

/**
 * Uploads a base64 encoded image to AWS S3, or falls back to local storage if AWS is not configured.
 * @param {string} base64Str Base64 image string with mime type header
 * @param {number|string} userId User ID for file naming
 * @returns {Promise<string>} The public URL or path of the uploaded image
 */
async function uploadUserAvatar(base64Str, userId) {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image data');
    }

    const mimeType = matches[1];
    const ext = mimeType.split('/')[1] || 'png';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `user_${userId}_${Date.now()}.${ext}`;

    if (s3Client && config.awsS3Bucket) {
        const key = `avatars/${filename}`;
        try {
            console.log(`Uploading avatar for user ${userId} to S3 bucket ${config.awsS3Bucket}...`);
            await s3Client.send(new PutObjectCommand({
                Bucket: config.awsS3Bucket,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
                ACL: 'public-read' // Assumes public read is allowed or bucket policy permits it
            }));
            const s3Url = `https://${config.awsS3Bucket}.s3.${config.awsRegion}.amazonaws.com/${key}`;
            console.log(`Avatar successfully uploaded to S3: ${s3Url}`);
            return s3Url;
        } catch (err) {
            console.error('Failed to upload image to AWS S3, falling back to local storage:', err.message);
            // Fall through to local storage if S3 upload fails
        }
    }

    // Local Storage Fallback
    console.log(`Saving avatar for user ${userId} to local storage...`);
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    return `/uploads/${filename}`;
}

module.exports = {
    uploadUserAvatar
};
