import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const sourceDir = path.resolve('ของตกแต่ง');
const outputBase = path.resolve('public/decorations/split-user-assets');
const sourceIds = ['03', '05', '06', '07', '13', '15'];

function extractComponents(png) {
  const { width, height, data } = png;
  const visited = new Uint8Array(width * height);
  const components = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const start = y * width + x;
      if (visited[start] || data[(start << 2) + 3] <= 15) continue;

      const queue = [start];
      visited[start] = 1;
      let minX = x, maxX = x, minY = y, maxY = y;
      let pixelCount = 0;

      for (let head = 0; head < queue.length; head++) {
        const pixel = queue[head];
        const px = pixel % width;
        const py = (pixel - px) / width;
        pixelCount++;
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);

        // Eight-neighbor connectivity keeps diagonally touching brush strokes together.
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = px + dx, ny = py + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            const next = ny * width + nx;
            if (!visited[next] && data[(next << 2) + 3] > 15) {
              visited[next] = 1;
              queue.push(next);
            }
          }
        }
      }

      const boxWidth = maxX - minX + 1;
      const boxHeight = maxY - minY + 1;
      if (boxWidth >= 18 && boxHeight >= 18 && pixelCount >= 100) {
        components.push({ minX, maxX, minY, maxY, boxWidth, boxHeight, pixelCount });
      }
    }
  }

  return components.sort((a, b) => a.minY - b.minY || a.minX - b.minX);
}

function cropComponent(source, item, padding = 6) {
  const x0 = Math.max(0, item.minX - padding);
  const y0 = Math.max(0, item.minY - padding);
  const x1 = Math.min(source.width - 1, item.maxX + padding);
  const y1 = Math.min(source.height - 1, item.maxY + padding);
  const width = x1 - x0 + 1;
  const height = y1 - y0 + 1;
  const output = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    const srcStart = ((y0 + y) * source.width + x0) << 2;
    const dstStart = (y * width) << 2;
    source.data.copy(output.data, dstStart, srcStart, srcStart + (width << 2));
  }

  return output;
}

async function run() {
  fs.rmSync(outputBase, { recursive: true, force: true });
  fs.mkdirSync(outputBase, { recursive: true });
  const manifest = [];

  for (const sourceId of sourceIds) {
    const sourceFolder = path.join(sourceDir, sourceId);
    const sourceName = fs.readdirSync(sourceFolder).find((name) => name.toLowerCase().endsWith('.png'));
    if (!sourceName) continue;

    const source = PNG.sync.read(fs.readFileSync(path.join(sourceFolder, sourceName)));
    const pieces = extractComponents(source);
    const targetDir = path.join(outputBase, sourceId);
    fs.mkdirSync(targetDir, { recursive: true });

    pieces.forEach((piece, index) => {
      const filename = `${sourceId}-${String(index + 1).padStart(2, '0')}.png`;
      const cropped = cropComponent(source, piece);
      fs.writeFileSync(path.join(targetDir, filename), PNG.sync.write(cropped));
      manifest.push({
        sourceId,
        sourceFile: path.join(sourceId, sourceName).replaceAll(path.sep, '/'),
        piece: index + 1,
        filename,
        path: `/decorations/split-user-assets/${sourceId}/${filename}`,
        width: cropped.width,
        height: cropped.height,
        pixelCount: piece.pixelCount,
      });
    });
    console.log(`Source ${sourceId}: ${pieces.length} separate pieces`);
  }

  fs.writeFileSync(path.join(outputBase, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Saved ${manifest.length} separate pieces to ${path.relative(process.cwd(), outputBase)}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
