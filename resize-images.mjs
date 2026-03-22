import sharp from 'sharp';
import fs from 'fs';

const images = [
    {
        path: 'public/Bilder/SG_Brain-Compressed.webp',
        width: 840
    },
    {
        path: 'public/Bilder/SG_Background_Dark_Mobile.webp',
        width: 1200
    }
];

async function resize() {
    for (const img of images) {
        console.log(`Processing ${img.path}...`);
        try {
            const inputBuffer = fs.readFileSync(img.path);
            const outputPath = img.path.replace('.webp', '-temp.webp');

            await sharp(inputBuffer)
                .resize({ width: img.width })
                .webp({ quality: 90 })
                .toFile(outputPath);

            fs.renameSync(outputPath, img.path);
            console.log(`Resized ${img.path} to width ${img.width}`);
        } catch (error) {
            console.error(`Error resizing ${img.path}:`, error);
        }
    }
}

resize();
