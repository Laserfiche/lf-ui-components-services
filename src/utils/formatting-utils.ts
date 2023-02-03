export function convertBytesToString(bytes: number, numOfFractionalDigits: number): string {
  if (bytes < 0.0) {
    return '';
  }
  let text = 'b';
  if (bytes >= 1024.0) {
    bytes /= 1024.0;
    text = 'KB';
  }
  if (bytes >= 1024.0) {
    bytes /= 1024.0;
    text = 'MB';
  }
  if (bytes >= 1024.0) {
    bytes /= 1024.0;
    text = 'GB';
  }
  if (bytes >= 1024.0) {
    bytes /= 1024.0;
    text = 'TB';
  }
  return `${bytes.toFixed(numOfFractionalDigits)} ${text}`;
}
