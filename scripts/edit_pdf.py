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

        pages_data.append({
            "pageNumber": i + 1,
            "width": round(width, 2),
            "height": round(height, 2),
            "bgImage": img_b64,
            "thumbnail": thumb_b64
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
            nums = [int(n.strip()) for n in hex_str.replace("rgb(", "").replace("rgba(", "").replace(")", "").split(",") if n.strip().isdigit()]
            if len(nums) >= 3:
                return (nums[0] / 255.0, nums[1] / 255.0, nums[2] / 255.0)
    except Exception:
        pass
    return default


def get_pymupdf_font(family, is_bold, is_italic):
    """Map font family, bold, italic to standard PyMuPDF font names."""
    fam = str(family).lower()
    if "times" in fam or "georgia" in fam:
        if is_bold and is_italic: return "tibi"
        if is_bold: return "tibo"
        if is_italic: return "tiit"
        return "tiro"
    elif "courier" in fam or "mono" in fam:
        if is_bold and is_italic: return "cobi"
        if is_bold: return "cobo"
        if is_italic: return "coit"
        return "cour"
    else:
        # Helvetica / Arial / Default
        if is_bold and is_italic: return "hebi"
        if is_bold: return "hebo"
        if is_italic: return "heit"
        return "helv"


def apply_edits_and_save(pdf_path, edits_data, output_pdf_path):
    """
    Apply text overlays, freehand drawings, shapes, image overlays onto PDF pages and save edited PDF.
    """
    doc = fitz.open(pdf_path)
    total_pages = len(doc)

    edits_by_page = {}
    if isinstance(edits_data, list):
        for item in edits_data:
            p_num = int(item.get("pageNumber", 1))
            edits_by_page[p_num] = item

    for p_idx in range(total_pages):
        p_num = p_idx + 1
        page = doc[p_idx]
        p_edit = edits_by_page.get(p_num, {})

        # 1. Apply Cover / Whiteout Rectangles
        for cover in p_edit.get("covers", []):
            try:
                rect = fitz.Rect(cover["x0"], cover["y0"], cover["x1"], cover["y1"])
                bg_color = parse_hex_color(cover.get("color", "#ffffff"), (1, 1, 1))
                page.draw_rect(rect, color=bg_color, fill=bg_color)
            except Exception as e:
                print(f"Error drawing cover rect on page {p_num}: {e}", file=sys.stderr)

        # 2. Apply Shapes (Rectangles, Circles, Lines, Arrows)
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
                    center = fitz.Point(x + w / 2.0, y + h / 2.0)
                    radius = min(w, h) / 2.0
                    page.draw_circle(center, radius, color=stroke_color, fill=fill_color, width=sw)
                elif s_type == "line":
                    p1 = fitz.Point(x, y)
                    p2 = fitz.Point(x + w, y + h)
                    page.draw_line(p1, p2, color=stroke_color, width=sw)
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
                w = max(float(txt.get("width", 200)), 40)
                h = max(float(txt.get("height", 40)), 15)
                font_size = float(txt.get("fontSize", 14))
                font_color = parse_hex_color(txt.get("fontColor", "#000000"))
                is_bold = bool(txt.get("isBold", False))
                is_italic = bool(txt.get("isItalic", False))
                font_family = str(txt.get("fontFamily", "Helvetica"))
                align_str = str(txt.get("align", "left")).lower()
                bg_color_hex = txt.get("bgColor", "")

                fontname = get_pymupdf_font(font_family, is_bold, is_italic)

                align_code = 0  # left
                if align_str == "center":
                    align_code = 1
                elif align_str == "right":
                    align_code = 2

                rect = fitz.Rect(x, y, x + w, y + h)

                # Optional fill background for text box
                if bg_color_hex:
                    bg_col = parse_hex_color(bg_color_hex)
                    page.draw_rect(rect, color=bg_col, fill=bg_col)

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
