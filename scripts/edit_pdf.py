import sys
import os
import json
import base64
import io
import fitz  # PyMuPDF
from PIL import Image

def get_pdf_info(pdf_path, scratch_dir):
    """
    Open PDF, extract page count, dimensions, text blocks, and render high-res page previews.
    """
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    pages_data = []

    for i in range(total_pages):
        page = doc[i]
        rect = page.rect
        width = rect.width
        height = rect.height

        # Render high-resolution page image for editor canvas (zoom 2.0 = 144 DPI)
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes("png")
        img_b64 = f"data:image/png;base64,{base64.b64encode(img_bytes).decode('utf-8')}"

        # Render smaller thumbnail (zoom 0.5)
        thumb_mat = fitz.Matrix(0.5, 0.5)
        thumb_pix = page.get_pixmap(matrix=thumb_mat, alpha=False)
        thumb_b64 = f"data:image/png;base64,{base64.b64encode(thumb_pix.tobytes('png')).decode('utf-8')}"

        # Extract text blocks with bbox and font size for editable text detection
        text_blocks = []
        try:
            blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
            for block in blocks:
                if block.get("type") == 0:  # Text block
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            text = span.get("text", "").strip()
                            if text:
                                bbox = span.get("bbox", (0, 0, 0, 0))
                                text_blocks.append({
                                    "text": text,
                                    "bbox": [round(bbox[0], 2), round(bbox[1], 2), round(bbox[2], 2), round(bbox[3], 2)],
                                    "fontSize": round(span.get("size", 12), 1),
                                    "color": span.get("color", 0)
                                })
        except Exception as e:
            print(f"Warning extracting text spans for page {i+1}: {e}", file=sys.stderr)

        pages_data.append({
            "pageNumber": i + 1,
            "width": round(width, 2),
            "height": round(height, 2),
            "bgImage": img_b64,
            "thumbnail": thumb_b64,
            "textBlocks": text_blocks[:100]  # Cap at 100 blocks per page
        })

    doc.close()
    return {
        "totalPages": total_pages,
        "pages": pages_data
    }


def parse_hex_color(hex_str, default=(0, 0, 0)):
    """Convert hex color '#e52521' or 'rgb(r,g,b)' to PyMuPDF RGB float tuple (0.0-1.0)."""
    if not hex_str:
        return default
    try:
        hex_str = str(hex_str).strip()
        if hex_str.startswith("#"):
            hex_str = hex_str[1:]
            if len(hex_str) == 3:
                hex_str = "".join([c * 2 for c in hex_str])
            r = int(hex_str[0:2], 16) / 255.0
            g = int(hex_str[2:4], 16) / 255.0
            b = int(hex_str[4:6], 16) / 255.0
            return (r, g, b)
        elif hex_str.startswith("rgb"):
            nums = [int(n.strip()) for n in hex_str.replace("rgb(", "").replace(")", "").split(",") if n.strip().isdigit()]
            if len(nums) == 3:
                return (nums[0] / 255.0, nums[1] / 255.0, nums[2] / 255.0)
    except Exception:
        pass
    return default


def apply_edits_and_save(pdf_path, edits_data, output_pdf_path):
    """
    Apply text overlays, freehand drawings, shapes, image overlays onto PDF pages and save edited PDF.
    
    edits_data is a dict or list of page edits:
    [
      {
        "pageNumber": 1,
        "texts": [
          { "x": 100, "y": 150, "width": 200, "height": 40, "text": "Sample Text", "fontSize": 14, "fontColor": "#e52521", "isBold": True, "align": "left", "coverOriginal": False, "coverRect": [x0,y0,x1,y1] }
        ],
        "drawings": [
          { "points": [ [x1,y1], [x2,y2], ... ], "color": "#000000", "width": 2 }
        ],
        "shapes": [
          { "type": "rect"|"circle", "x": 50, "y": 50, "width": 100, "height": 80, "strokeColor": "#000", "fillColor": "#ff0000", "strokeWidth": 2 }
        ],
        "images": [
          { "x": 100, "y": 200, "width": 150, "height": 150, "base64": "data:image/png;base64,..." }
        ]
      }
    ]
    """
    doc = fitz.open(pdf_path)
    total_pages = len(doc)

    # Convert edits_data to map by pageNumber
    edits_by_page = {}
    if isinstance(edits_data, list):
        for item in edits_data:
            p_num = int(item.get("pageNumber", 1))
            edits_by_page[p_num] = item

    for p_idx in range(total_pages):
        p_num = p_idx + 1
        page = doc[p_idx]
        p_edit = edits_by_page.get(p_num, {})

        # 1. Apply cover rects (if user edited/erased existing original text)
        for cover in p_edit.get("covers", []):
            try:
                rect = fitz.Rect(cover["x0"], cover["y0"], cover["x1"], cover["y1"])
                bg_color = parse_hex_color(cover.get("color", "#ffffff"), (1, 1, 1))
                page.draw_rect(rect, color=bg_color, fill=bg_color)
            except Exception as e:
                print(f"Error drawing cover rect on page {p_num}: {e}", file=sys.stderr)

        # 2. Apply Shapes (Rectangles & Circles)
        for shape in p_edit.get("shapes", []):
            try:
                s_type = shape.get("type", "rect")
                x = float(shape.get("x", 0))
                y = float(shape.get("y", 0))
                w = float(shape.get("width", 50))
                h = float(shape.get("height", 50))
                stroke_color = parse_hex_color(shape.get("strokeColor", "#000000"))
                fill_color = parse_hex_color(shape.get("fillColor", "")) if shape.get("fillColor") else None
                sw = float(shape.get("strokeWidth", 1.5))

                rect = fitz.Rect(x, y, x + w, y + h)

                if s_type == "circle":
                    # PyMuPDF draw_circle takes center and radius
                    center = fitz.Point(x + w / 2.0, y + h / 2.0)
                    radius = min(w, h) / 2.0
                    page.draw_circle(center, radius, color=stroke_color, fill=fill_color, width=sw)
                else:
                    page.draw_rect(rect, color=stroke_color, fill=fill_color, width=sw)
            except Exception as e:
                print(f"Error drawing shape on page {p_num}: {e}", file=sys.stderr)

        # 3. Apply Freehand Drawings
        for dwg in p_edit.get("drawings", []):
            try:
                pts = dwg.get("points", [])
                color = parse_hex_color(dwg.get("color", "#000000"))
                lw = float(dwg.get("width", 2))
                if len(pts) >= 2:
                    fitz_pts = [fitz.Point(float(p[0]), float(p[1])) for p in pts]
                    for k in range(len(fitz_pts) - 1):
                        page.draw_line(fitz_pts[k], fitz_pts[k+1], color=color, width=lw)
            except Exception as e:
                print(f"Error drawing line on page {p_num}: {e}", file=sys.stderr)

        # 4. Apply Images
        for img_obj in p_edit.get("images", []):
            try:
                b64_str = img_obj.get("base64", "")
                if "," in b64_str:
                    b64_str = b64_str.split(",")[1]
                img_data = base64.b64decode(b64_str)
                x = float(img_obj.get("x", 0))
                y = float(img_obj.get("y", 0))
                w = float(img_obj.get("width", 100))
                h = float(img_obj.get("height", 100))
                rect = fitz.Rect(x, y, x + w, y + h)
                page.insert_image(rect, stream=img_data)
            except Exception as e:
                print(f"Error inserting image on page {p_num}: {e}", file=sys.stderr)

        # 5. Apply Text Overlays
        for txt in p_edit.get("texts", []):
            try:
                text_str = str(txt.get("text", "")).strip()
                if not text_str:
                    continue

                x = float(txt.get("x", 0))
                y = float(txt.get("y", 0))
                w = max(float(txt.get("width", 200)), 50)
                h = max(float(txt.get("height", 50)), 20)
                font_size = float(txt.get("fontSize", 14))
                font_color = parse_hex_color(txt.get("fontColor", "#000000"))
                is_bold = bool(txt.get("isBold", False))
                is_italic = bool(txt.get("isItalic", False))
                align_str = str(txt.get("align", "left")).lower()

                # Determine font name in PyMuPDF
                fontname = "helv"  # Helvetica default
                if is_bold and is_italic:
                    fontname = "hebi"
                elif is_bold:
                    fontname = "hebo"
                elif is_italic:
                    fontname = "heit"

                align_code = 0  # left
                if align_str == "center":
                    align_code = 1
                elif align_str == "right":
                    align_code = 2

                rect = fitz.Rect(x, y, x + w, y + h)

                # Optional cover rect to erase original background under new text
                if txt.get("coverBackground", False):
                    page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))

                # Insert text box into PyMuPDF page
                rc = page.insert_textbox(
                    rect,
                    text_str,
                    fontsize=font_size,
                    fontname=fontname,
                    color=font_color,
                    align=align_code
                )
                if rc < 0:
                    # Text overflowed textbox, insert single line text fallback
                    page.insert_text(
                        fitz.Point(x, y + font_size),
                        text_str,
                        fontsize=font_size,
                        fontname=fontname,
                        color=font_color
                    )
            except Exception as e:
                print(f"Error inserting text on page {p_num}: {e}", file=sys.stderr)

    doc.save(output_pdf_path, garbage=4, deflate=True)
    doc.close()
    return output_pdf_path


def main():
    if len(sys.argv) < 3:
        print("Usage: python edit_pdf.py <operation> <args_json>")
        sys.exit(1)

    operation = sys.argv[1]
    args = json.loads(sys.argv[2])

    if operation == "info":
        pdf_path = args["pdf_path"]
        scratch_dir = args.get("scratch_dir", os.path.dirname(pdf_path))
        info = get_pdf_info(pdf_path, scratch_dir)
        print(json.dumps(info))

    elif operation == "edit":
        pdf_path = args["pdf_path"]
        edits_data = args["edits"]
        output_pdf_path = args["output_pdf_path"]
        res_path = apply_edits_and_save(pdf_path, edits_data, output_pdf_path)
        print(json.dumps({"output_pdf_path": res_path}))
    else:
        print(f"Unknown operation: {operation}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
