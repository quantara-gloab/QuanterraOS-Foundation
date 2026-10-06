import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width: number, height: number, pixelFn: (x: number, y: number) => [number, number, number, number]): Buffer {
  const rowBytes = width * 4 + 1;
  const rawBuffer = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawBuffer[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawBuffer[pixelOffset] = r;
      rawBuffer[pixelOffset + 1] = g;
      rawBuffer[pixelOffset + 2] = b;
      rawBuffer[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawBuffer);

  const crcTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
  }
  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = (crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)) >>> 0;
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type: string, data: Buffer): Buffer {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcBuf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    buf.writeUInt32BE(crc32(crcBuf), 8 + len);
    return buf;
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderQuanterraIcon(size: number): Buffer {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.38;
  const rInner = size * 0.28;
  const cornerR = size * 0.22;

  return createPng(size, size, (x, y) => {
    // Rounded squircle background test
    const dx = Math.abs(x - cx);
    const dy = Math.abs(y - cy);
    const half = size / 2;
    const rx = Math.max(0, dx - (half - cornerR));
    const ry = Math.max(0, dy - (half - cornerR));
    const distCorner = Math.sqrt(rx * rx + ry * ry);
    
    // Background color (#06070A) with subtle diagonal gold gradient
    if (distCorner > cornerR) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }

    // Border stroke
    const isBorder = (distCorner >= cornerR - 2) || 
      (dx >= half - 2 && dy <= half - cornerR) || 
      (dy >= half - 2 && dx <= half - cornerR);
    if (isBorder) {
      return [212, 175, 55, 180]; // Gold border #D4AF37
    }

    // Distance to center
    const distCenter = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));

    // Outer gold ring
    if (distCenter >= rOuter - (size * 0.02) && distCenter <= rOuter + (size * 0.02)) {
      return [223, 184, 67, 255]; // #DFB843
    }

    // Inner gold ring / "Q" loop
    const qCy = cy - size * 0.03;
    const distQ = Math.sqrt((x - cx) * (x - cx) + (y - qCy) * (y - qCy));
    if (distQ >= rInner - (size * 0.04) && distQ <= rInner + (size * 0.04)) {
      return [247, 231, 180, 255]; // Gold Light #F7E7B4
    }

    // "Q" tail (diagonal tick)
    if (x >= cx + size * 0.05 && x <= cx + size * 0.25 &&
        y >= qCy + size * 0.05 && y <= qCy + size * 0.25) {
      const diagDist = Math.abs((x - (cx + size * 0.05)) - (y - (qCy + size * 0.05)));
      if (diagDist <= size * 0.04) {
        return [16, 185, 129, 255]; // Emerald #10B981
      }
    }

    // Background fill (gradient from #0A0D15 to #040508)
    const gradFactor = (x + y) / (size * 2);
    const bgR = Math.round(10 - gradFactor * 6);
    const bgG = Math.round(13 - gradFactor * 8);
    const bgB = Math.round(21 - gradFactor * 13);
    return [bgR, bgG, bgB, 255];
  });
}

// Generate all icons
const iconDir = path.resolve('public/assets');
if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });

console.log('Generating PNG icons for PWA and Apple Touch...');
fs.writeFileSync(path.join(iconDir, 'icon-512.png'), renderQuanterraIcon(512));
fs.writeFileSync(path.join(iconDir, 'icon-192.png'), renderQuanterraIcon(192));
fs.writeFileSync(path.join(iconDir, 'apple-touch-icon.png'), renderQuanterraIcon(180));
fs.writeFileSync(path.resolve('public/apple-touch-icon.png'), renderQuanterraIcon(180));
console.log('Generated: icon-512.png, icon-192.png, apple-touch-icon.png successfully!');
