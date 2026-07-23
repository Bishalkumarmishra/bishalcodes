import sys
import os
import subprocess

def convert_docx_to_pdf(docx_path, pdf_path):
    # Try docx2pdf (requires MS Word on Windows/macOS)
    try:
        from docx2pdf import convert
        print("Using docx2pdf for conversion...")
        convert(docx_path, pdf_path)
        return True
    except Exception as e:
        print(f"docx2pdf failed or not supported: {e}")
        
    # Try libreoffice / soffice (on Linux/Vercel if installed)
    try:
        print("Trying LibreOffice headless conversion...")
        output_dir = os.path.dirname(pdf_path) or "."
        cmd = ["soffice", "--headless", "--convert-to", "pdf", "--outdir", output_dir, docx_path]
        subprocess.run(cmd, check=True)
        
        # LibreOffice outputs to docx_name.pdf in output_dir, so rename if needed
        filename = os.path.basename(docx_path)
        default_output = os.path.join(output_dir, filename.replace(".docx", ".pdf"))
        
        if os.path.exists(default_output) and os.path.abspath(default_output) != os.path.abspath(pdf_path):
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
            os.rename(default_output, pdf_path)
        return True
    except Exception as e:
        print(f"LibreOffice conversion failed: {e}")
        
    raise Exception("No PDF conversion engine (MS Word or LibreOffice) could be loaded on the server.")

def main():
    if len(sys.argv) < 3:
        print("Usage: python convert_word_to_pdf.py <docx_path> <pdf_path>")
        sys.exit(1)
        
    docx_path = sys.argv[1]
    pdf_path = sys.argv[2]
    
    print(f"Converting DOCX: {docx_path} to PDF: {pdf_path}")
    try:
        convert_docx_to_pdf(docx_path, pdf_path)
        print("Conversion completed successfully!")
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
