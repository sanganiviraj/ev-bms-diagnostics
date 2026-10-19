// Pure TypeScript Base64 encoding/decoding for BLE byte buffers

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

export function stringToBase64(input: string): string {
  let output = '';
  let chr1: number, chr2: number, chr3: number;
  let enc1: number, enc2: number, enc3: number, enc4: number;
  let i = 0;

  while (i < input.length) {
    chr1 = input.charCodeAt(i++);
    chr2 = input.charCodeAt(i++);
    chr3 = input.charCodeAt(i++);

    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = isNaN(chr2) || isNaN(chr3) ? 64 : chr3 & 63;

    output =
      output +
      CHARS.charAt(enc1) +
      CHARS.charAt(enc2) +
      CHARS.charAt(enc3) +
      CHARS.charAt(enc4);
  }

  return output;
}

export function base64ToString(input: string): string {
  let output = '';
  let chr1: number, chr2: number, chr3: number;
  let enc1: number, enc2: number, enc3: number, enc4: number;
  let i = 0;

  // Remove all non-base64 characters
  const cleanInput = input.replace(/[^A-Za-z0-9+/=]/g, '');

  while (i < cleanInput.length) {
    enc1 = CHARS.indexOf(cleanInput.charAt(i++));
    enc2 = CHARS.indexOf(cleanInput.charAt(i++));
    enc3 = CHARS.indexOf(cleanInput.charAt(i++));
    enc4 = CHARS.indexOf(cleanInput.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3);
    }
  }

  return output;
}
