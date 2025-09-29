import { randomInt } from "crypto";

export function generateTimestampId(): string {
    const timestamp = Date.now().toString();
    const random = randomInt(0, 1000).toString().padStart(3, '0');
    return `CIN${timestamp.slice(-6)}${random}`;
}