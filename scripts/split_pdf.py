import sys
import os
import json
import zipfile
import fitz  # PyMuPDF

def split_pdf(pdf_path, output_dir, mode, ranges=None, fixed_interval=None, merge_ranges=False):
    """
    Split a PDF file based on mode.
    
    Modes:
    - "range": Split by custom page ranges (list of [from, to] 1-indexed)
    - "fixed": Split into fixed-size chunks of N pages each
    - "pages": Extract each page as individual PDF
    
    Returns a single output path:
    - If 1 file created -> that PDF path
    - If multiple files created -> a .zip path containing all PDFs
    """
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    print(f"Total pages in PDF: {total_pages}", file=sys.stderr)
    
    output_files = []
    os.makedirs(output_dir, exist_ok=True)
    
    if mode == "range":
        if not ranges or len(ranges) == 0:
            raise ValueError("No page ranges provided for range mode.")
        
        if merge_ranges:
            # Merge all ranges into a single PDF
            out_doc = fitz.open()
            for rng in ranges:
                from_page = max(1, int(rng["from"])) - 1
                to_page = min(total_pages, int(rng["to"])) - 1
                out_doc.insert_pdf(doc, from_page=from_page, to_page=to_page)
            out_path = os.path.join(output_dir, "split_merged.pdf")
            out_doc.save(out_path)
            out_doc.close()
            output_files.append(out_path)
        else:
            for i, rng in enumerate(ranges):
                from_page = max(1, int(rng["from"])) - 1
                to_page = min(total_pages, int(rng["to"])) - 1
                out_doc = fitz.open()
                out_doc.insert_pdf(doc, from_page=from_page, to_page=to_page)
                out_path = os.path.join(output_dir, f"split_range_{i+1}_pages_{from_page+1}-{to_page+1}.pdf")
                out_doc.save(out_path)
                out_doc.close()
                output_files.append(out_path)
                
    elif mode == "fixed":
        interval = int(fixed_interval) if fixed_interval else 1
        chunk_num = 1
        for start in range(0, total_pages, interval):
            end = min(start + interval - 1, total_pages - 1)
            out_doc = fitz.open()
            out_doc.insert_pdf(doc, from_page=start, to_page=end)
            out_path = os.path.join(output_dir, f"split_part_{chunk_num}_pages_{start+1}-{end+1}.pdf")
            out_doc.save(out_path)
            out_doc.close()
            output_files.append(out_path)
            chunk_num += 1
            
    elif mode == "pages":
        for page_num in range(total_pages):
            out_doc = fitz.open()
            out_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
            out_path = os.path.join(output_dir, f"split_page_{page_num+1}.pdf")
            out_doc.save(out_path)
            out_doc.close()
            output_files.append(out_path)
    else:
        raise ValueError(f"Unknown split mode: {mode}")
    
    doc.close()
    print(f"Created {len(output_files)} output file(s).", file=sys.stderr)

    if len(output_files) == 0:
        raise RuntimeError("No output files were generated.")
    
    # If only one file, return it directly
    if len(output_files) == 1:
        return output_files[0]
    
    # Multiple files: zip them using Python's built-in zipfile module
    zip_path = os.path.join(output_dir, "split_result.zip")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for fp in output_files:
            zf.write(fp, arcname=os.path.basename(fp))
    
    # Clean up individual PDFs after zipping
    for fp in output_files:
        try:
            os.remove(fp)
        except Exception:
            pass
    
    return zip_path


def get_pdf_page_count(pdf_path):
    """Return total number of pages in the PDF."""
    doc = fitz.open(pdf_path)
    count = len(doc)
    doc.close()
    return count


def render_page_thumbnail(pdf_path, page_number, thumb_path, width=200):
    """Render a single page as a PNG thumbnail. page_number is 1-indexed."""
    doc = fitz.open(pdf_path)
    page = doc[page_number - 1]
    zoom = width / page.rect.width
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)
    pix.save(thumb_path)
    doc.close()
    return thumb_path


def main():
    if len(sys.argv) < 3:
        print("Usage: python split_pdf.py <operation> <args_json>")
        sys.exit(1)

    operation = sys.argv[1]
    args = json.loads(sys.argv[2])

    if operation == "count":
        pdf_path = args["pdf_path"]
        count = get_pdf_page_count(pdf_path)
        print(json.dumps({"total_pages": count}))

    elif operation == "thumbnail":
        pdf_path = args["pdf_path"]
        page_number = int(args["page_number"])
        thumb_path = args["thumb_path"]
        render_page_thumbnail(pdf_path, page_number, thumb_path)
        print(json.dumps({"thumb_path": thumb_path}))

    elif operation == "split":
        pdf_path = args["pdf_path"]
        output_dir = args["output_dir"]
        mode = args["mode"]
        ranges = args.get("ranges", None)
        fixed_interval = args.get("fixed_interval", None)
        merge_ranges = bool(args.get("merge_ranges", False))

        result_path = split_pdf(pdf_path, output_dir, mode, ranges, fixed_interval, merge_ranges)
        is_zip = result_path.endswith(".zip")
        print(json.dumps({"result_path": result_path, "is_zip": is_zip}))
    else:
        print(f"Unknown operation: {operation}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
