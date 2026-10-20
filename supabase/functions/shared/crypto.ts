import { Buffer } from 'node:buffer';

const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY') || 'default_fallback_key';

async function getCryptoKey(usage: "encrypt" | "decrypt") {
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(ENCRYPTION_KEY);
    
    const hash = await crypto.subtle.digest('SHA-256', keyMaterial);
    
    return await crypto.subtle.importKey(
        "raw",
        hash,
        { name: "AES-GCM" },
        false,
        [usage]
    );
}

export async function encryptApiKey(text: string): Promise<string> {
    const cryptoKey = await getCryptoKey("encrypt");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        encoder.encode(text)
    );

    const encryptedArray = new Uint8Array(encryptedBuffer);
    const ciphertext = encryptedArray.slice(0, -16);
    const authTag = encryptedArray.slice(-16);

    return `${Buffer.from(iv).toString('hex')}:${Buffer.from(authTag).toString('hex')}:${Buffer.from(ciphertext).toString('hex')}`;
}

export async function decryptApiKey(encryptedData: string): Promise<string> {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) throw new Error('Invalid encryption format');
    
    const [ivHex, authTagHex, encryptedTextHex] = parts;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedText = Buffer.from(encryptedTextHex, 'hex');
    
    const dataToDecrypt = new Uint8Array(encryptedText.length + authTag.length);
    dataToDecrypt.set(encryptedText, 0);
    dataToDecrypt.set(authTag, encryptedText.length);

    const cryptoKey = await getCryptoKey("decrypt");

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        dataToDecrypt
    );

    return new TextDecoder().decode(decryptedBuffer);
}
