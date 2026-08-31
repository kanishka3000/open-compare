const NULL_BYTE = 0;
const CONTROL_BYTE_RATIO_THRESHOLD = 0.3;
const ALLOWED_CONTROL_BYTES = new Set([9, 10, 13, 12, 27]);

export class BinaryDetector {
  isBinary(sample: Uint8Array): boolean {
    if (sample.length === 0) {
      return false;
    }
    let controlByteCount = 0;
    for (const byte of sample) {
      if (byte === NULL_BYTE) {
        return true;
      }
      if (byte < 32 && !ALLOWED_CONTROL_BYTES.has(byte)) {
        controlByteCount += 1;
      }
    }
    return controlByteCount / sample.length > CONTROL_BYTE_RATIO_THRESHOLD;
  }
}
