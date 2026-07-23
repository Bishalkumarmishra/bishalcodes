import sys
from pdf2docx import Converter

def main():
    if len(sys.argv) < 3:
        print("Usage: python convert_pdf.py <pdf_path> <docx_path>")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]
    
    print(f"Converting PDF: {pdf_path} to DOCX: {docx_path}")
    try:
        cv = Converter(pdf_path)
        # Convert all pages with optimized thresholds to merge vector drawings/charts into single complete graphics
        cv.convert(docx_path, start=0, end=None, min_svg_gap_dx=150.0, min_svg_gap_dy=150.0)
        cv.close()
        print("Conversion completed successfully!")
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
