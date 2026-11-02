from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt


path = Path(r"C:\Users\sweta\OneDrive\Desktop\RideShare\RideShare_BTech_Mini_Project_Report_With_Screenshots.docx")
doc = Document(path)
toc_heading = next(p for p in doc.paragraphs if p.text.strip() == "TABLE OF CONTENTS")
toc_para = next(p for p in doc.paragraphs if p._p is not toc_heading._p and p._p.getprevious() is not None and p._p.getprevious().getparent() is not None and p._p.getprevious().tag.endswith("}p") and p._p.getprevious().getparent() is toc_heading._p.getparent() and not p.text.strip())

# Clear the existing empty TOC placeholder and make room for a deeper static TOC.
for child in list(toc_para._p):
    toc_para._p.remove(child)
toc_para.alignment = WD_ALIGN_PARAGRAPH.LEFT
toc_para.paragraph_format.space_after = Pt(0)

entries = []
for paragraph in doc.paragraphs:
    if paragraph._p is toc_para._p or paragraph._p is toc_heading._p:
        continue
    text = paragraph.text.strip()
    style = paragraph.style.name
    if not text:
        continue
    if style == "Heading 1" or style == "Heading 2":
        # Avoid treating front-matter lists and chapter headings as subsection entries.
        level = 0 if style == "Heading 1" else 1
        entries.append((text, level))

# Add section headings plus all numbered subsection headings, including appendices.
for text, level in entries:
    run = toc_para.add_run(("    " if level else "") + text + "\n")
    run.font.name = "Times New Roman"
    run.font.size = Pt(10 if level else 11)
    if level == 0:
        run.bold = True

doc.save(path)
print(f"Updated {len(entries)} TOC entries in {path}")
