import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text_from_docx(docx_path: str) -> str:
    # Open the .docx file as a zip archive
    with zipfile.ZipFile(docx_path) as docx_zip:
        # The main document XML is located at word/document.xml
        with docx_zip.open('word/document.xml') as doc_xml:
            tree = ET.parse(doc_xml)
            root = tree.getroot()
            # Namespaces handling
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            # Extract all text nodes
            texts = []
            for node in root.iterfind('.//w:t', ns):
                texts.append(node.text)
            return '\n'.join(filter(None, texts))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python extract_docx_text.py <path-to-docx> [output-file]')
        sys.exit(1)
    docx_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'blueprint_output.txt'
    extracted = extract_text_from_docx(docx_path)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(extracted)
    print(f'Extracted text written to {output_path}')
