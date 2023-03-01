export function convertBytesToString(bytes: number, numOfFractionalDigits: number): string {
  if (bytes < 0.0) {
    return '';
  }
  let suffix = 'B';
  if (bytes >= 1024.0) {
    bytes /= 1024.0;
    suffix = 'KB';
  }
  if (bytes >= 1024.0) {
    bytes /= 1024.0;
    suffix = 'MB';
  }
  if (bytes >= 1024.0) {
    bytes /= 1024.0;
    suffix = 'GB';
  }
  if (bytes >= 1024.0) {
    bytes /= 1024.0;
    suffix = 'TB';
  }

  if (suffix === 'B'){
    return`${bytes} ${suffix}`;
  }
  return `${bytes.toFixed(numOfFractionalDigits)} ${suffix}`;
}
