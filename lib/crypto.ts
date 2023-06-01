import CryptoJS from 'crypto-js';

if (!process.env.API_SECRETKEY) {
  throw new Error('API_SECRETKEY is not set');
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.API_SECRETKEY || '');
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
}

export function auth (value: string = '', content: string = '') {
  if (value === '' || content === '') {
    return false;
  }
  return decrypt(value) === content;
}