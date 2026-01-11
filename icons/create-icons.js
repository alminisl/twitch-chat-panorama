// Run this with Node.js to create icon files
// Usage: node create-icons.js

const fs = require('fs');
const path = require('path');

// Simple 1x1 purple pixel PNG as base64 (will be stretched)
// This creates a valid PNG that browsers will accept

function createSimplePNG(size) {
  // PNG header and IHDR chunk for a simple solid color image
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // Create IHDR chunk (image header)
  const width = size;
  const height = size;
  const bitDepth = 8;
  const colorType = 2; // RGB
  const compression = 0;
  const filter = 0;
  const interlace = 0;

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(bitDepth, 8);
  ihdrData.writeUInt8(colorType, 9);
  ihdrData.writeUInt8(compression, 10);
  ihdrData.writeUInt8(filter, 11);
  ihdrData.writeUInt8(interlace, 12);

  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // length
    Buffer.from('IHDR'),
    ihdrData,
    ihdrCrc
  ]);

  // Create IDAT chunk (image data) - solid purple color
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      // Purple color: #9146FF
      rawData.push(0x91); // R
      rawData.push(0x46); // G
      rawData.push(0xFF); // B
    }
  }

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));

  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), compressed]));
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressed.length, 0);
  const idatChunk = Buffer.concat([
    idatLength,
    Buffer.from('IDAT'),
    compressed,
    idatCrc
  ]);

  // Create IEND chunk
  const iendCrc = crc32(Buffer.from('IEND'));
  const iendChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('IEND'),
    iendCrc
  ]);

  return Buffer.concat([PNG_SIGNATURE, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation for PNG
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = makeCrcTable();

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }

  crc = crc ^ 0xFFFFFFFF;

  const result = Buffer.alloc(4);
  result.writeUInt32BE(crc >>> 0, 0);
  return result;
}

function makeCrcTable() {
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
}

// Create icons
const sizes = [16, 48, 128];
const iconsDir = __dirname;

sizes.forEach(size => {
  const png = createSimplePNG(size);
  const filename = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Created ${filename}`);
});

console.log('Done! Icons created.');
