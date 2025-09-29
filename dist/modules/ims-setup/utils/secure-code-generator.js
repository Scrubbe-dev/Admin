"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureCodeGenerator = void 0;
const crypto_1 = require("crypto");
/**
 * Class providing advanced methods for generating secure random codes
 * for authentication and verification purposes
 */
class SecureCodeGenerator {
    /**
     * Generates a cryptographically secure numeric code of specified length
     * @param length Length of the code to generate (default: 6)
     * @returns A numeric code as a string of the specified length
     */
    static generateNumericCode(length = 6) {
        if (length <= 0) {
            throw new Error('Code length must be positive');
        }
        // Calculate the minimum and maximum values for the given length
        const min = 10 ** (length - 1);
        const max = 10 ** length - 1;
        const range = max - min + 1;
        // Calculate how many bytes we need for the required randomness
        // Each byte provides 8 bits of entropy
        const neededBytes = Math.ceil(Math.log2(range) / 8) + 1;
        // Generate secure random bytes
        const buffer = (0, crypto_1.randomBytes)(neededBytes);
        // Convert bytes to a number and ensure it's within our range
        let num = 0;
        for (let i = 0; i < buffer.length; i++) {
            num = (num << 8) | buffer[i];
        }
        // Ensure the number is within the desired range
        num = (num % range) + min;
        return num.toString();
    }
    /**
     * Generates an alphanumeric code with high entropy
     * @param length Length of the code to generate (default: 8)
     * @returns An alphanumeric string of the specified length
     */
    static generateAlphanumericCode(length = 8) {
        // Characters to use (excluding ambiguous characters like 0, O, 1, l, I)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        // Calculate number of bits needed per character (log2 of the number of possible characters)
        const bitsPerChar = Math.log2(chars.length);
        // Calculate bytes needed for the required length
        const bytesNeeded = Math.ceil((length * bitsPerChar) / 8);
        // Generate secure random bytes
        const randomBytesBuffer = (0, crypto_1.randomBytes)(bytesNeeded);
        let result = '';
        for (let i = 0; i < length; i++) {
            // Use modulo to get a random index within the chars array
            const randomIndex = randomBytesBuffer[i % randomBytesBuffer.length] % chars.length;
            result += chars.charAt(randomIndex);
        }
        return result;
    }
    /**
     * Generates a token with higher security than UUID, suitable for reset links or API keys
     * @returns A 64-character hexadecimal string
     */
    static generateSecureToken() {
        // Generate 32 bytes (256 bits) of randomness
        const buffer = (0, crypto_1.randomBytes)(32);
        // Convert to a hex string
        return buffer.toString('hex');
    }
    /**
     * Hashes a token with an optional salt for secure storage
     * @param token The token to hash
     * @param salt Optional salt to include in the hash
     * @returns The hashed token
     */
    static hashToken(token, salt) {
        const valueToHash = salt ? `${salt}:${token}` : token;
        return (0, crypto_1.createHash)('sha256').update(valueToHash).digest('hex');
    }
    /**
     * Generates a time-limited HOTP (HMAC-based One-Time Password)
     * This provides stronger security for time-limited codes
     * @param secret The secret key (should be unique per user)
     * @param digits Number of digits in the OTP
     * @returns A time-based one-time password
     */
    static generateHOTP(secret, digits = 6) {
        // Get current time in seconds and divide by 30 for a 30-second window
        let timeWindow = Math.floor(Date.now() / 1000 / 30);
        // Create a buffer from the time window (as a 64-bit big-endian integer)
        const buffer = Buffer.alloc(8);
        for (let i = 0; i < 8; i++) {
            buffer[7 - i] = timeWindow & 0xff;
            timeWindow >>= 8;
        }
        // Create an HMAC using the secret and time buffer
        const hmac = (0, crypto_1.createHash)('sha1')
            .update(secret)
            .update(buffer)
            .digest();
        // Extract a 4-byte dynamic binary code based on the last byte of the HMAC
        const offset = hmac[hmac.length - 1] & 0xf;
        const binCode = ((hmac[offset] & 0x7f) << 24) |
            ((hmac[offset + 1] & 0xff) << 16) |
            ((hmac[offset + 2] & 0xff) << 8) |
            (hmac[offset + 3] & 0xff);
        // Generate the specified number of digits
        const otp = binCode % (10 ** digits);
        // Pad with leading zeros if necessary
        return otp.toString().padStart(digits, '0');
    }
}
exports.SecureCodeGenerator = SecureCodeGenerator;
