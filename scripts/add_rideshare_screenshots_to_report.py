from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt


WORKSPACE = Path(r"C:\Users\sweta\OneDrive\Desktop\RideShare")
INPUT = WORKSPACE / "RideShare_BTech_Mini_Project_Report_Revised.docx"
OUTPUT = WORKSPACE / "RideShare_BTech_Mini_Project_Report_With_Screenshots.docx"

SCREENSHOTS = [
    (Path(r"C:\Users\sweta\AppData\Local\Temp\codex-clipboard-8e487083-ed47-443b-b48c-a305191cd502.png"), "Figure A.1 Public vehicle catalogue"),
    (Path(r"C:\Users\sweta\AppData\Local\Temp\codex-clipboard-5e6faf6b-6332-49c9-a7ba-d894e4c2389a.png"), "Figure A.2 Vehicle details and quote"),
    (Path(r"C:\Users\sweta\AppData\Local\Temp\codex-clipboard-953fba32-be6d-4c79-8739-5291b886bb33.png"), "Figure A.3 Owner vehicle management"),
    (Path(r"C:\Users\sweta\AppData\Local\Temp\codex-clipboard-b7e89a84-054d-4d99-ad53-32fa86f3b4be.png"), "Figure A.4 Booking dashboard"),
    (Path(r"C:\Users\sweta\AppData\Local\Temp\codex-clipboard-f1a9d491-1720-44c7-bf17-58f291203a3f.png"), "Figure A.5 Map and tracking view"),
    (Path(r"C:\Users\sweta\AppData\Local\Temp\codex-clipboard-0fe254d8-96fa-4220-b512-b51a4715b81a.png"), "Figure A.6 Administrator dashboard"),
    (Path(r"C:\Users\sweta\AppData\Local\Temp\codex-clipboard-53c39678-1352-4320-b641-bbea7407b267.png"), "Figure A.7 Invoice and review"),
]


def delete_paragraph(paragraph):
    element = paragraph._element
    element.getparent().remove(element)
    paragraph._p = paragraph._element = None


def insert_paragraph_after(paragraph, text="", style=None):
    new_paragraph = paragraph._parent.add_paragraph(text, style=style)
    paragraph._p.addnext(new_paragraph._p)
    return new_paragraph


def add_figure_after(anchor, image_path, caption, page_break_before=False):
    image_paragraph = insert_paragraph_after(anchor)
    image_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    image_paragraph.paragraph_format.space_before = Pt(6)
    image_paragraph.paragraph_format.space_after = Pt(2)
    image_paragraph.paragraph_format.keep_with_next = True
    image_paragraph.paragraph_format.page_break_before = page_break_before
    image_paragraph.add_run().add_picture(str(image_path), width=Inches(6.45))

    caption_paragraph = insert_paragraph_after(image_paragraph, caption, style="Caption")
    caption_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    caption_paragraph.paragraph_format.space_before = Pt(0)
    caption_paragraph.paragraph_format.space_after = Pt(10)
    return caption_paragraph


doc = Document(str(INPUT))

for image_path, _ in SCREENSHOTS:
    if not image_path.exists():
        raise FileNotFoundError(image_path)

paragraphs = list(doc.paragraphs)
intro = next(p for p in paragraphs if p.text.strip().startswith("The supplied project package contains technical diagrams"))
next_heading = next(p for p in paragraphs if p.text.strip() == "6.8 Performance and Security Testing")

intro.text = (
    "The following screenshots document the main RideShare workflows described in this report. "
    "They correspond to the evidence checklist in Appendix A and show the public catalogue, "
    "vehicle quote, owner management, booking, map, administrator, invoice, and review interfaces."
)
intro.style = doc.styles["Normal"]

# Remove the old placeholder bullet list between the screenshot introduction and section 6.8.
for paragraph in list(doc.paragraphs):
    if paragraph is next_heading:
        break
    if paragraph.style.name == "List Bullet":
        delete_paragraph(paragraph)

# Insert two wide screenshots per page for readable evidence while keeping the report compact.
anchor = intro
for index, (image_path, caption) in enumerate(SCREENSHOTS):
    page_break = index > 0 and index % 2 == 0
    anchor = add_figure_after(anchor, image_path, caption, page_break_before=page_break)

# The screenshot set is now supplied, so remove the stale limitation statement.
for paragraph in doc.paragraphs:
    if "No complete automated test suite or runtime screenshot set was supplied" in paragraph.text:
        paragraph.text = paragraph.text.replace(
            "No complete automated test suite or runtime screenshot set was supplied with the project package.",
            "No complete automated test suite was supplied with the project package."
        )

doc.save(str(OUTPUT))
print(OUTPUT)
