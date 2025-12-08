#!/usr/bin/env python3
"""
Script to extract text from the consent form .docx file
"""
import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def extract_text_from_docx(docx_path):
    """Extract text content from a .docx file"""
    try:
        with zipfile.ZipFile(docx_path, 'r') as docx:
            # Read the main document XML
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Define namespace
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            # Extract all text elements
            texts = []
            for t in root.findall('.//w:t', ns):
                if t.text:
                    texts.append(t.text)
            
            return '\n'.join(texts)
    except Exception as e:
        print(f"Error extracting text: {e}")
        return None

if __name__ == "__main__":
    docx_path = os.path.join(os.path.dirname(__file__), '..', 'forms', 'Consent form_IRBFinal.docx')
    text = extract_text_from_docx(docx_path)
    
    if text:
        # Save to a text file
        output_path = os.path.join(os.path.dirname(__file__), '..', 'forms', 'consent_form_text.txt')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Text extracted and saved to: {output_path}")
        print("\nFirst 500 characters:")
        print(text[:500])
    else:
        print("Failed to extract text from document")

