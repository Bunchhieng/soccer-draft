const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDirectory = path.join(__dirname, 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconDirectory)) {
    fs.mkdirSync(iconDirectory);
}

// Base SVG icon - a simple soccer ball design
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="240" fill="#4CAF50"/>
    <path d="M256 96L358.4 166.4L332.8 281.6H179.2L153.6 166.4L256 96Z" fill="white"/>
    <path d="M153.6 166.4L76.8 256L128 371.2L179.2 281.6L153.6 166.4Z" fill="white"/>
    <path d="M358.4 166.4L435.2 256L384 371.2L332.8 281.6L358.4 166.4Z" fill="white"/>
    <path d="M179.2 281.6L128 371.2H384L332.8 281.6H179.2Z" fill="white"/>
</svg>
`;

// Save the SVG file
fs.writeFileSync(path.join(iconDirectory, 'icon.svg'), svgIcon);

// Generate PNG icons for all sizes
Promise.all(
    sizes.map(size => {
        return sharp(path.join(iconDirectory, 'icon.svg'))
            .resize(size, size)
            .png()
            .toFile(path.join(iconDirectory, `icon-${size}x${size}.png`));
    })
)
.then(() => {
    console.log('Icons generated successfully!');
})
.catch(err => {
    console.error('Error generating icons:', err);
}); 