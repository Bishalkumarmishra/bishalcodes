import sys
import os
import subprocess

def convert_excel_to_pdf(excel_path, pdf_path):
    # Try using win32com (Excel COM API) on Windows
    try:
        import win32com.client
        print("Using Excel COM API for conversion...")
        
        # Initialize Excel application
        excel = win32com.client.Dispatch("Excel.Application")
        excel.Visible = False
        excel.DisplayAlerts = False
        
        # Absolute paths are required for Excel COM
        abs_excel_path = os.path.abspath(excel_path)
        abs_pdf_path = os.path.abspath(pdf_path)
        
        # Open workbook
        wb = excel.Workbooks.Open(abs_excel_path)
        
        # Export as PDF (type 0 = PDF format)
        wb.ExportAsFixedFormat(0, abs_pdf_path)
        
        wb.Close(False)
        excel.Quit()
        return True
    except Exception as e:
        print(f"Excel COM API conversion failed or not supported: {e}")
        
    # Try using LibreOffice headless conversion
    try:
        print("Trying LibreOffice headless conversion...")
        output_dir = os.path.dirname(pdf_path) or "."
        cmd = ["soffice", "--headless", "--convert-to", "pdf", "--outdir", output_dir, excel_path]
        subprocess.run(cmd, check=True)
        
        # LibreOffice outputs to excel_name.pdf in output_dir, so rename if needed
        filename = os.path.basename(excel_path)
        base_name, _ = os.path.splitext(filename)
        default_output = os.path.join(output_dir, f"{base_name}.pdf")
        
        if os.path.exists(default_output) and os.path.abspath(default_output) != os.path.abspath(pdf_path):
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
            os.rename(default_output, pdf_path)
        return True
    except Exception as e:
        print(f"LibreOffice conversion failed: {e}")
        
    raise Exception("No PDF conversion engine (Microsoft Excel or LibreOffice) could be loaded on the server.")

def main():
    if len(sys.argv) < 3:
        print("Usage: python convert_excel_to_pdf.py <excel_path> <pdf_path>")
        sys.exit(1)
        
    excel_path = sys.argv[1]
    pdf_path = sys.argv[2]
    
    print(f"Converting Excel: {excel_path} to PDF: {pdf_path}")
    try:
        convert_excel_to_pdf(excel_path, pdf_path)
        print("Conversion completed successfully!")
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
