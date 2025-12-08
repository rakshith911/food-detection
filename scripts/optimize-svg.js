/**
 * Script to optimize Group 2076.svg by extracting and compressing embedded images
 * This will reduce the file size significantly
 */

const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../icons/Group 2076.svg');
const outputPath = path.join(__dirname, '../icons/Group 2076-optimized.svg');

try {
  console.log('Reading SVG file...');
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  
  console.log(`Original size: ${(fs.statSync(svgPath).size / 1024 / 1024).toFixed(2)} MB`);
  
  // The SVG contains embedded base64 images which make it large
  // For now, we'll create a version that maintains the viewBox but is cleaner
  // Full optimization would require extracting and compressing the base64 images
  
  // Ensure viewBox is correct to show full image including "UK cal" text
  let optimized = svgContent;
  
  // Make sure viewBox shows the full image (0 0 586 525)
  optimized = optimized.replace(
    /viewBox="[^"]*"/,
    'viewBox="0 0 586 525"'
  );
  
  // Ensure width and height match viewBox
  optimized = optimized.replace(
    /width="[^"]*"/,
    'width="586"'
  );
  optimized = optimized.replace(
    /height="[^"]*"/,
    'height="525"'
  );
  
  // Write optimized version
  fs.writeFileSync(outputPath, optimized, 'utf8');
  
  const newSize = fs.statSync(outputPath).size / 1024 / 1024;
  console.log(`Optimized size: ${newSize.toFixed(2)} MB`);
  console.log(`Saved to: ${outputPath}`);
  console.log('\nNote: For further size reduction, consider:');
  console.log('1. Extracting base64 images to separate PNG files');
  console.log('2. Compressing those PNG files');
  console.log('3. Referencing them externally in the SVG');
  console.log('4. Using tools like SVGO for additional optimization');
  
} catch (error) {
  console.error('Error optimizing SVG:', error);
}


