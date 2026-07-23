import sys
import os
import fitz
from pdf2docx import Converter

def pre_process_pdf(input_path, output_path):
    print("Pre-processing PDF vector drawings...", input_path)
    doc = fitz.open(input_path)
    
    # Create temp directory if needed in workspace
    os.makedirs("scratch", exist_ok=True)
    
    for page_idx, page in enumerate(doc):
        drawings = page.get_drawings()
        if not drawings:
            continue
            
        # Find union bounding box of content drawings
        content_rect = fitz.Rect()
        has_content = False
        
        # Bounding box limits for header/footer decoration filter
        top_margin = 60
        bottom_margin = page.rect.height - 60
        
        for d in drawings:
            r = fitz.Rect(d['rect'])
            
            # 1. Filter out background shapes (nearly full page width and height)
            if r.width > page.rect.width * 0.85 and r.height > page.rect.height * 0.85:
                continue
                
            # 2. Filter out header/footer lines and decoration shapes (at the top/bottom edges)
            if r.y0 < top_margin and r.y1 < top_margin:
                continue
            if r.y0 > bottom_margin and r.y1 > bottom_margin:
                continue
                
            # 3. Filter out very small artifacts
            if r.width < 5 or r.height < 5:
                continue
                
            content_rect.include_rect(r)
            has_content = True
            
        if has_content and not content_rect.is_empty:
            # Add a small padding of 10 points
            content_rect.x0 = max(0, content_rect.x0 - 10)
            content_rect.y0 = max(0, content_rect.y0 - 10)
            content_rect.x1 = min(page.rect.width, content_rect.x1 + 10)
            content_rect.y1 = min(page.rect.height, content_rect.y1 + 10)
            
            # Ensure the bounding box does not cover the entire page height/width to prevent full page rasterization
            if content_rect.width > page.rect.width * 0.9 and content_rect.height > page.rect.height * 0.9:
                continue
                
            # Render this area as a high-res image
            pix = page.get_pixmap(clip=content_rect, dpi=200)
            temp_img_path = f"scratch/temp_chart_{page_idx}.png"
            pix.save(temp_img_path)
            
            # Draw white rectangle to cover vector drawings
            page.draw_rect(content_rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=True)
            
            # Insert the image back
            page.insert_image(content_rect, filename=temp_img_path)
            
            # Clean up temp image file
            try:
                os.remove(temp_img_path)
            except:
                pass
                
    doc.save(output_path)
    doc.close()
    print("Pre-processing completed.")

def main():
    if len(sys.argv) < 3:
        print("Usage: python convert_pdf.py <pdf_path> <docx_path>")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]
    
    # Path for pre-processed PDF
    scratch_dir = os.path.join(os.getcwd(), 'scratch')
    os.makedirs(scratch_dir, exist_ok=True)
    temp_pdf_path = os.path.join(scratch_dir, f"rasterized_{os.path.basename(pdf_path)}")
    
    try:
        # Pre-process PDF to convert complex vector drawings/charts into embedded images
        pre_process_pdf(pdf_path, temp_pdf_path)
        
        print(f"Converting PDF: {temp_pdf_path} to DOCX: {docx_path}")
        cv = Converter(temp_pdf_path)
        cv.convert(docx_path, start=0, end=None)
        cv.close()
        print("Conversion completed successfully!")
        
        # Clean up temp PDF
        try:
            os.remove(temp_pdf_path)
        except:
            pass
            
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        # Make sure to clean up temp PDF in case of error
        try:
            if os.path.exists(temp_pdf_path):
                os.remove(temp_pdf_path)
        except:
            pass
        sys.exit(1)

if __name__ == '__main__':
    main()
