const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');
const QUALITY = 82;
const EFFORT = 5;

async function collectJpegs(dir) {
    const results = [];
    async function walk(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
            } else if (/\.jpe?g$/i.test(entry.name)) {
                results.push(fullPath);
            }
        }
    }

    await walk(dir);
    return results;
}

async function convertFile(filePath) {
    const targetPath = filePath.replace(/\.jpe?g$/i, '.webp');
    await sharp(filePath)
        .webp({
            quality: QUALITY,
            effort: EFFORT,
            smartSubsample: true,
        })
        .toFile(targetPath);
    await fs.unlink(filePath);
    return { source: filePath, target: targetPath };
}

async function main() {
    try {
        const jpegFiles = await collectJpegs(IMAGES_DIR);
        if (!jpegFiles.length) {
            console.log('No JPEG files found under', path.relative(ROOT, IMAGES_DIR));
            return;
        }

        for (const file of jpegFiles) {
            const { source, target } = await convertFile(file);
            console.log('Converted', path.relative(ROOT, source), '→', path.relative(ROOT, target));
        }
    } catch (error) {
        console.error('Image conversion failed:', error);
        process.exitCode = 1;
    }
}

main();
