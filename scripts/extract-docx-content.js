/**
 * Script to extract text content from .docx files
 * This will help populate the Terms and Privacy Policy screens
 */

const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const termsPath = path.join(__dirname, '../forms/TnC_UKcal.docx');
const privacyPath = path.join(__dirname, '../forms/Privacy Policy.docx');

async function extractContent(filePath, fileName) {
  try {
    console.log(`\n📄 Extracting content from ${fileName}...`);
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    
    console.log(`\n✅ Successfully extracted content from ${fileName}`);
    console.log(`\n📝 Content preview (first 500 characters):`);
    console.log('─'.repeat(60));
    console.log(text.substring(0, 500));
    console.log('─'.repeat(60));
    console.log(`\n📊 Total length: ${text.length} characters`);
    
    // Save to a text file for easy reference
    const outputPath = path.join(__dirname, `../forms/${fileName.replace('.docx', '.txt')}`);
    fs.writeFileSync(outputPath, text, 'utf8');
    console.log(`\n💾 Saved extracted text to: ${outputPath}`);
    
    return text;
  } catch (error) {
    console.error(`\n❌ Error extracting content from ${fileName}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting .docx content extraction...\n');
  
  const termsContent = await extractContent(termsPath, 'TnC_UKcal.docx');
  const privacyContent = await extractContent(privacyPath, 'Privacy Policy.docx');
  
  console.log('\n✨ Extraction complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the extracted .txt files in the forms/ directory');
  console.log('2. Update TermsAndConditionsScreen.tsx with the terms content');
  console.log('3. Update PrivacyPolicyScreen.tsx with the privacy policy content');
}

main();


