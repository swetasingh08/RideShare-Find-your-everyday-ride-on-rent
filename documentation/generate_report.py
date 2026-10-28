"""Generate the RideShare B.Tech engineering project report.

Run with the bundled Python runtime documented in the repository task output.
The content is intentionally derived from the checked-in application source; it
does not connect to configured services or read environment secrets.
"""
from pathlib import Path
from math import ceil
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "RideShare_Engineering_Project_Report.docx"
ASSETS = ROOT / "documentation" / "report_assets"
ASSETS.mkdir(parents=True, exist_ok=True)

BLACK = "000000"
NAVY = "17365D"
LIGHT = "EAF1F8"
GRID = "D9D9D9"

def font(size=28, bold=False):
    path = "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"
    return ImageFont.truetype(path, size)

def box(draw, xy, title, body="", fill="#EAF1F8", outline="#17365D", title_size=27, body_size=20):
    x1,y1,x2,y2=xy; draw.rounded_rectangle(xy, radius=18, fill=fill, outline=outline, width=3)
    tf=font(title_size, True); bf=font(body_size)
    draw.multiline_text((x1+18,y1+14), title, font=tf, fill="#000000", spacing=5)
    if body: draw.multiline_text((x1+18,y1+58), body, font=bf, fill="#000000", spacing=5)

def arrow(draw, a, b, text=""):
    draw.line([a,b], fill="#17365D", width=4)
    x,y=b; px,py=a
    if abs(x-px)>=abs(y-py): pts=[(x,y),(x-15,y-8 if x>px else y+8),(x-15,y+8 if x>px else y-8)] if x>px else [(x,y),(x+15,y-8),(x+15,y+8)]
    else: pts=[(x,y),(x-8,y-15),(x+8,y-15)] if y>py else [(x,y),(x-8,y+15),(x+8,y+15)]
    draw.polygon(pts, fill="#17365D")
    if text: draw.text(((a[0]+b[0])//2+8,(a[1]+b[1])//2-18), text, font=font(18), fill="#17365D")

def diagram_architecture(path):
    im=Image.new("RGB",(2200,1300),"white"); d=ImageDraw.Draw(im)
    d.text((70,45),"RideShare System Architecture",font=font(42,True),fill="black")
    box(d,(80,220,510,430),"Web Client","React 19  •  Vite\nReact Router  •  Axios\nTailwind CSS  •  Leaflet", "#EAF1F8")
    box(d,(760,190,1420,490),"Application Server","Express 5 REST API\nControllers, services and middleware\nClerk token verification\nMulter upload handling", "#D9EAD3")
    box(d,(1650,210,2110,430),"MongoDB","Mongoose models\nUsers, cars, bookings\npayments and operational data", "#FFF2CC")
    box(d,(80,750,510,1010),"Browser Services","Geolocation API\nRazorpay Checkout\nServer-sent event stream", "#FCE5CD")
    box(d,(760,730,1420,1040),"External Services","Clerk organisations and JWT\nImageKit media storage\nRazorpay payment gateway\nGoogle Maps or Nominatim / OSRM", "#F4CCCC")
    box(d,(1650,760,2110,1000),"Generated Outputs","PDF invoice\nIn-app notification records\nPricing snapshots", "#D9EAD3")
    arrow(d,(510,325),(760,325),"HTTPS JSON") ; arrow(d,(1420,325),(1650,325),"Mongoose")
    arrow(d,(300,750),(300,430),"browser APIs") ; arrow(d,(1090,730),(1090,490),"SDK / HTTPS")
    arrow(d,(1420,900),(1650,900),"records / PDFs")
    im.save(path)

def diagram_usecase(path):
    im=Image.new("RGB",(2200,1450),"white"); d=ImageDraw.Draw(im)
    d.text((60,35),"RideShare Verified Use Cases",font=font(42,True),fill="black")
    d.rounded_rectangle((480,150,1720,1320),20,outline="#17365D",width=4); d.text((920,165),"RideShare application",font=font(28,True),fill="black")
    actors=[("Guest",(110,360)),("Member\nowner or renter",(85,760)),("Administrator",(1840,420)),("Payment provider",(1840,1010))]
    for name,(x,y) in actors:
        d.ellipse((x+55,y,x+105,y+50),outline="black",width=3); d.line((x+80,y+50,x+80,y+145),fill="black",width=3); d.line((x+35,y+85,x+125,y+85),fill="black",width=3); d.line((x+80,y+145,x+40,y+200),fill="black",width=3); d.line((x+80,y+145,x+120,y+200),fill="black",width=3); d.multiline_text((x,y+215),name,font=font(22,True),fill="black",align="center")
    uses=[("Browse vehicles and nearby search",(650,280)),("Request access and sign in",(650,455)),("List and manage vehicles",(650,650)),("Quote, create and manage booking",(650,830)),("Location route and tracking",(650,1010)),("Review and view notifications",(650,1180)),("Manage members, access and verification",(1250,450)),("Moderate reviews",(1250,630)),("Create / verify payment and refund",(1250,900))]
    for text,(x,y) in uses:
        d.ellipse((x,y,x+410,y+78),fill="#EAF1F8",outline="#17365D",width=3); d.multiline_text((x+18,y+18),text,font=font(18),fill="black")
    for p in [(480,360),(480,455)]: arrow(d,(210,470),p)
    for end in [(650,650),(650,830),(650,1010),(650,1180)]: arrow(d,(230,890),end)
    for end in [(1660,490),(1660,670)]: arrow(d,(1840,530),end)
    arrow(d,(1840,1110),(1660,940))
    im.save(path)

def diagram_er(path):
    im=Image.new("RGB",(2300,1550),"white"); d=ImageDraw.Draw(im)
    d.text((55,35),"Entity Relationships in the MongoDB Data Model",font=font(40,True),fill="black")
    entities=[("User","_id, clerkId, email, role",(80,230,500,420)),("Car","_id, owner, attributes, coordinates",(650,190,1120,410)),("Booking","_id, car, user, owner, dates, status",(1280,470,1770,710)),("Payment","booking, user, provider IDs, status",(1850,260,2260,460)),("Review","booking, reviewer, reviewee, car",(1850,790,2260,980)),("Invoice","booking, user, owner, totals",(1850,1120,2260,1310)),("TrackingSession","booking, route, location, status",(1240,1080,1740,1280)),("Notification","recipient, booking, read state",(570,1110,1080,1300)),("AIConversation","user, sessionId, messages",(60,790,520,980)),("PricingSnapshot","car, owner, dateKey, suggestion",(600,580,1120,780))]
    for n,b,xy in entities: box(d,xy,n,b,"#EAF1F8",title_size=24,body_size=17)
    connections=[((500,320),(650,300),"owns 1..*"),((1120,300),(1280,550),"booked in 1..*"),((500,330),(1280,590),"rents 1..*"),((500,335),(1280,650),"owns booking"),((1770,560),(1850,350),"has 0..1"),((1770,620),(1850,865),"has 0..1"),((1770,680),(1850,1190),"has 0..1"),((1770,680),(1240,1170),"has 0..1"),((500,870),(570,1180),"receives 0..*"),((500,875),(60,885),"stores 0..*"),((1120,680),(1280,600),"informs"),((1120,680),(650,720),"pricing for")]
    for a,b,t in connections: arrow(d,a,b,t)
    im.save(path)

def diagram_dfd1(path):
    im=Image.new("RGB",(2200,1300),"white"); d=ImageDraw.Draw(im)
    d.text((55,35),"Level 1 Data Flow Diagram",font=font(42,True),fill="black")
    box(d,(80,350,390,530),"Renter / Owner","Requests, listings, booking data","#FCE5CD")
    box(d,(820,210,1370,390),"1.0 Account and access","Clerk token, local user mirror","#EAF1F8")
    box(d,(820,510,1370,700),"2.0 Vehicle and availability","Cars, date conflicts, quotes","#EAF1F8")
    box(d,(820,820,1370,1010),"3.0 Booking lifecycle","Create, approve, cancel, settle","#EAF1F8")
    box(d,(1720,250,2120,430),"Administrator","Member and verification decisions","#FCE5CD")
    box(d,(1720,600,2120,790),"External services","Payments, maps, uploads, identity","#FCE5CD")
    box(d,(1480,950,1880,1120),"D1 MongoDB","Operational collections","#FFF2CC")
    for a,b,t in [((390,440),(820,300),"credentials"),((390,460),(820,600),"search/listing"),((390,500),(820,900),"booking actions"),((1720,340),(1370,300),"admin action"),((1720,680),(1370,600),"route / media"),((1720,710),(1370,900),"payment"),((1095,390),(1480,1000),"profiles"),((1095,700),(1480,1030),"cars / bookings"),((1095,1010),(1480,1060),"bookings / receipts")]: arrow(d,a,b,t)
    im.save(path)

def diagram_dfd2(path):
    im=Image.new("RGB",(2200,1300),"white"); d=ImageDraw.Draw(im)
    d.text((55,35),"Level 2 Data Flow Diagram for Booking Creation",font=font(42,True),fill="black")
    box(d,(70,440,350,620),"Renter","dates, locations, handover","#FCE5CD")
    steps=[("3.1 Validate request",(500,190,880,340)),("3.2 Lock vehicle",(980,190,1360,340)),("3.3 Quote and conflict check",(1460,190,1940,340)),("3.4 Create booking",(700,680,1120,840)),("3.5 Create notification",(1320,680,1740,840))]
    for t,xy in steps: box(d,xy,t,"","#EAF1F8",title_size=23)
    box(d,(800,1020,1240,1160),"D1 MongoDB","Car, Booking, Notification","#FFF2CC")
    box(d,(1810,680,2140,840),"Payment gateway","only when enabled","#F4CCCC")
    for a,b,t in [((350,520),(500,265),"request"),((880,265),(980,265),"valid data"),((1360,265),(1460,265),"temporary lock"),((1700,340),(910,680),"quote and availability"),((1120,760),(1320,760),"new booking"),((1120,820),(1020,1020),"write"),((1740,760),(1810,760),"payment order if enabled"),((1020,1020),(980,840),"state")]: arrow(d,a,b,t)
    im.save(path)

def diagram_sequence(path):
    im=Image.new("RGB",(2250,1450),"white"); d=ImageDraw.Draw(im)
    d.text((55,35),"Booking and Payment Sequence",font=font(42,True),fill="black")
    names=["Renter","React client","Express API","MongoDB","Razorpay\nwhen enabled","Owner"]
    xs=[160,500,850,1200,1580,1970]
    for x,n in zip(xs,names): d.rectangle((x-100,110,x+100,180),fill="#EAF1F8",outline="#17365D",width=3); d.multiline_text((x-70,127),n,font=font(18,True),fill="black",align="center"); d.line((x,180,x,1360),fill="#888888",width=2)
    events=[(260,0,1,"submit dates and locations"),(390,1,2,"POST quote / create"),(520,2,3,"validate, lock, conflict check"),(650,3,2,"quote and booking record"),(790,2,4,"create order if enabled"),(920,4,1,"checkout result"),(1050,1,2,"verify payment signature"),(1180,2,3,"update payment and booking"),(1310,2,5,"notification / booking request")]
    for y,a,b,t in events: arrow(d,(xs[a],y),(xs[b],y),t)
    d.text((760,1390),"Payment steps occur only when PAYMENTS_ENABLED is true.",font=font(20),fill="#444444")
    im.save(path)

def diagram_gantt(path):
    im=Image.new("RGB",(2250,1120),"white"); d=ImageDraw.Draw(im)
    d.text((55,35),"Proposed Iterative Project Schedule",font=font(42,True),fill="black")
    weeks=list(range(1,17)); x0=560; w=95
    for i,week in enumerate(weeks): d.rectangle((x0+i*w,150,x0+(i+1)*w,210),fill="#D9EAD3",outline="#999999"); d.text((x0+i*w+35,166),str(week),font=font(18,True),fill="black")
    rows=[("Requirements and architecture",1,2,"completed only if verified by project log"),("Frontend interface and routing",2,6,"implemented code"),("Backend models and REST API",3,8,"implemented code"),("Auth, uploads and external integrations",5,10,"implemented/configuration-gated"),("Booking, payment and tracking workflows",7,12,"implemented/configuration-gated"),("Testing, hardening and deployment",11,14,"proposed"),("Documentation and submission",13,16,"proposed")]
    colors=["#4F81BD","#4F81BD","#4F81BD","#9BBB59","#9BBB59","#F4B183","#F4B183"]
    for r,(name,start,end,status) in enumerate(rows):
        y=250+r*105; d.text((60,y+25),name,font=font(20,True),fill="black"); d.text((60,y+54),status,font=font(14),fill="#555555")
        for i in range(16): d.rectangle((x0+i*w,y,x0+(i+1)*w,y+72),outline="#D9D9D9")
        d.rounded_rectangle((x0+(start-1)*w+4,y+10,x0+end*w-4,y+62),12,fill=colors[r])
    d.text((65,1035),"This is a relative schedule, not a statement of historical completion dates.",font=font(19),fill="#444444")
    im.save(path)

DIAGRAMS={
    "architecture.png":diagram_architecture,"use_case.png":diagram_usecase,"er_diagram.png":diagram_er,
    "dfd_level_1.png":diagram_dfd1,"dfd_level_2.png":diagram_dfd2,"sequence.png":diagram_sequence,"gantt.png":diagram_gantt,
}

def shade(cell, color):
    tcPr=cell._tc.get_or_add_tcPr(); shd=OxmlElement('w:shd'); shd.set(qn('w:fill'),color); tcPr.append(shd)
def borders(table):
    tblPr=table._tbl.tblPr; e=OxmlElement('w:tblBorders')
    for name in ['top','left','bottom','right','insideH','insideV']:
        edge=OxmlElement(f'w:{name}'); edge.set(qn('w:val'),'single'); edge.set(qn('w:sz'),'6'); edge.set(qn('w:color'),GRID); e.append(edge)
    tblPr.append(e)
def set_cell_margins(cell, top=100, start=100, bottom=100, end=100):
    tc=cell._tc; tcPr=tc.get_or_add_tcPr(); mar=tcPr.first_child_found_in('w:tcMar')
    if mar is None: mar=OxmlElement('w:tcMar'); tcPr.append(mar)
    for m,v in [('top',top),('start',start),('bottom',bottom),('end',end)]:
        node=mar.find(qn(f'w:{m}'))
        if node is None: node=OxmlElement(f'w:{m}'); mar.append(node)
        node.set(qn('w:w'),str(v)); node.set(qn('w:type'),'dxa')
def set_repeat_table_header(row):
    trPr=row._tr.get_or_add_trPr(); element=OxmlElement('w:tblHeader'); element.set(qn('w:val'),'true'); trPr.append(element)
def field(paragraph, instruction, fallback=""):
    run=paragraph.add_run(); begin=OxmlElement('w:fldChar'); begin.set(qn('w:fldCharType'),'begin'); run._r.append(begin)
    instr=OxmlElement('w:instrText'); instr.set(qn('xml:space'),'preserve'); instr.text=instruction; run._r.append(instr)
    sep=OxmlElement('w:fldChar'); sep.set(qn('w:fldCharType'),'separate'); run._r.append(sep)
    if fallback: run2=paragraph.add_run(fallback); run2.italic=True
    end=OxmlElement('w:fldChar'); end.set(qn('w:fldCharType'),'end'); run._r.append(end)
def page_number(section, fmt, start=None):
    pg=section._sectPr.find(qn('w:pgNumType'))
    if pg is None: pg=OxmlElement('w:pgNumType'); section._sectPr.append(pg)
    pg.set(qn('w:fmt'),fmt)
    if start: pg.set(qn('w:start'),str(start))
    p=section.footer.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    field(p,' PAGE ')
def configure_section(section):
    section.page_width=Cm(21); section.page_height=Cm(29.7)
    section.left_margin=Cm(3.5); section.right_margin=Cm(2); section.top_margin=Cm(3.5); section.bottom_margin=Cm(2)

def set_run(run, size=12, bold=False, italic=False):
    run.font.name='Times New Roman'; run._element.rPr.rFonts.set(qn('w:ascii'),'Times New Roman'); run._element.rPr.rFonts.set(qn('w:hAnsi'),'Times New Roman'); run.font.size=Pt(size); run.bold=bold; run.italic=italic; run.font.color.rgb=RGBColor(0,0,0)

def add_caption(doc, label, text):
    p=doc.add_paragraph(style='Caption'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r=p.add_run(f"{label} {text}"); set_run(r,10,False); return p
def add_heading(doc, text, level=1):
    p=doc.add_paragraph(style=f'Heading {level}'); r=p.add_run(text); set_run(r,{1:18,2:14,3:12}[level],True); p.paragraph_format.space_before=Pt(12 if level==1 else 8); p.paragraph_format.space_after=Pt(6); p.paragraph_format.keep_with_next=True; return p
def add_p(doc, text="", indent=False, bold_lead=None):
    p=doc.add_paragraph(style='Normal'); p.paragraph_format.first_line_indent=Cm(0.75) if indent else Cm(0)
    if bold_lead and text.startswith(bold_lead):
        r=p.add_run(bold_lead); set_run(r,12,True); r=p.add_run(text[len(bold_lead):]); set_run(r)
    else: r=p.add_run(text); set_run(r)
    return p
def caption_above(doc, text):
    p=doc.add_paragraph(style='Caption'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run(text); set_run(r,10,True); return p
def add_table(doc, headers, rows, widths=None, font_size=9):
    table=doc.add_table(rows=1, cols=len(headers)); table.alignment=WD_TABLE_ALIGNMENT.CENTER; table.autofit=False; borders(table)
    hdr=table.rows[0]; set_repeat_table_header(hdr)
    for i,h in enumerate(headers):
        c=hdr.cells[i]; shade(c,NAVY); set_cell_margins(c)
        p=c.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run(h); set_run(r,font_size,True); r.font.color.rgb=RGBColor(255,255,255)
        if widths: c.width=widths[i]
    for n,row in enumerate(rows):
        cells=table.add_row().cells
        for i,value in enumerate(row):
            c=cells[i]; set_cell_margins(c); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if n%2==1: shade(c,"F7FAFC")
            p=c.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.LEFT if len(str(value))>16 else WD_ALIGN_PARAGRAPH.CENTER
            r=p.add_run(str(value)); set_run(r,font_size); 
            if widths: c.width=widths[i]
    doc.add_paragraph().paragraph_format.space_after=Pt(2)
    return table
def add_figure(doc, filename, label, title, width=Cm(14.7)):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run().add_picture(str(ASSETS/filename),width=width); add_caption(doc,label,title)
def add_bullets(doc, items):
    for item in items:
        p=doc.add_paragraph(style='List Bullet'); p.paragraph_format.left_indent=Cm(.7); r=p.add_run(item); set_run(r)

def setup_styles(doc):
    styles=doc.styles
    normal=styles['Normal']; normal.font.name='Times New Roman'; normal._element.rPr.rFonts.set(qn('w:ascii'),'Times New Roman'); normal._element.rPr.rFonts.set(qn('w:hAnsi'),'Times New Roman'); normal.font.size=Pt(12); normal.paragraph_format.line_spacing=1.5; normal.paragraph_format.space_after=Pt(6)
    for n,size in [('Title',20),('Heading 1',18),('Heading 2',14),('Heading 3',12),('Caption',10)]:
        s=styles[n]; s.font.name='Times New Roman'; s._element.rPr.rFonts.set(qn('w:ascii'),'Times New Roman'); s._element.rPr.rFonts.set(qn('w:hAnsi'),'Times New Roman'); s.font.size=Pt(size); s.font.color.rgb=RGBColor(0,0,0)
        s.font.bold=n.startswith('Heading'); s.paragraph_format.line_spacing=1.5
    styles['Caption'].font.italic=False

def page_break(doc): doc.add_page_break()
def title_page(doc, inner=False):
    for _ in range(4 if not inner else 2): doc.add_paragraph()
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run("MAHARANA INSTITUTE OF PROFESSIONAL STUDIES KANPUR"); set_run(r,16,True)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run("Affiliated to Dr. A.P.J. Abdul Kalam Technical University Uttar Pradesh"); set_run(r,12)
    for _ in range(4): doc.add_paragraph()
    p=doc.add_paragraph(style='Title'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run("RIDESHARE"); set_run(r,24,True)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run("Vehicle Rental and Sharing Management System"); set_run(r,16,True)
    for _ in range(4): doc.add_paragraph()
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run("A PROJECT REPORT SUBMITTED IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE DEGREE OF"); set_run(r,12,True)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run("BACHELOR OF TECHNOLOGY\nCOMPUTER SCIENCE AND ENGINEERING AI AND ML"); set_run(r,14,True)
    for _ in range(3): doc.add_paragraph()
    for label,value in [("Submitted by", "Sweta Singh\nRoll Number  [INSERT ROLL NUMBER]"),("Under the guidance of", "[INSERT GUIDE NAME AND DESIGNATION]"),("Academic Session", "2026 to 2027"),("Department", "[INSERT OFFICIAL DEPARTMENT NAME]")]:
        p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run(label+"\n"); set_run(r,12,True); r=p.add_run(value); set_run(r,12)
    if not inner: page_break(doc)

def build():
    for name,fun in DIAGRAMS.items(): fun(ASSETS/name)
    doc=Document(); configure_section(doc.sections[0]); setup_styles(doc)
    settings=doc.settings.element; update=OxmlElement('w:updateFields'); update.set(qn('w:val'),'true'); settings.append(update)
    props=doc.core_properties; props.title='RideShare Engineering Project Report'; props.author='Sweta Singh'; props.subject='B.Tech engineering project report'
    # cover and preliminary matter without display page number
    title_page(doc); title_page(doc,True); page_break(doc)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run('CERTIFICATE'); set_run(r,18,True)
    add_p(doc,'This is to certify that the project report entitled “RideShare Vehicle Rental and Sharing Management System” is a bona fide work submitted by Sweta Singh, Roll Number [INSERT ROLL NUMBER], in partial fulfilment of the requirements for the award of the degree of Bachelor of Technology in Computer Science and Engineering AI and ML during the academic session 2026 to 2027. The work has been carried out under the undersigned guidance.',indent=True)
    for _ in range(8): doc.add_paragraph()
    add_table(doc,['Project Guide','Head of Department','Principal'],[['[INSERT NAME AND DESIGNATION]','[INSERT NAME AND DESIGNATION]','[INSERT NAME AND DESIGNATION]']], [Cm(4.7)]*3,9)
    page_break(doc)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run('ACKNOWLEDGEMENT'); set_run(r,18,True)
    add_p(doc,'The author expresses sincere gratitude to the project guide, faculty members, and the Department for their academic guidance and support. Appreciation is extended to all individuals who provided constructive feedback during the analysis, design, and documentation of the RideShare application. The project also benefited from the documentation and tools maintained by the open-source and service-provider communities.',indent=True)
    page_break(doc)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run('ABSTRACT'); set_run(r,18,True)
    add_p(doc,'RideShare is a web-based vehicle rental and sharing management system implemented as a React single-page application with an Express REST API and a MongoDB data layer. The inspected codebase supports vehicle discovery, nearby-vehicle filtering, owner-managed vehicle listings, date-range availability checks, quotation calculation, booking lifecycle management, role-based access control, map-based location and route handling, notifications, reviews, PDF invoices, pricing suggestions, and a natural-language vehicle recommendation interface. The system uses Clerk for authenticated organization membership and roles, ImageKit for uploaded listing media, and supports Razorpay payment orders, verification, refunds, and additional charges when payment configuration is enabled. The location service uses Google Maps when configured and otherwise uses Nominatim and OSRM with a straight-line fallback.',indent=True)
    add_p(doc,'The report distinguishes code-implemented capabilities from configuration-dependent operation. In particular, payment processing depends on server environment settings and valid provider credentials; tracking begins with a route preview and uses real owner-device GPS only after browser permission and location updates. The document records the verified design, requirements, risks, data model, algorithms, and a future plan appropriate for academic evaluation.',indent=True)
    # roman preliminary section
    prelim=doc.add_section(WD_SECTION.NEW_PAGE); configure_section(prelim); page_number(prelim,'lowerRoman',1)
    add_heading(doc,'TABLE OF CONTENTS',1)
    p=doc.add_paragraph(); field(p,' TOC \\o "1-3" \\h \\z \\u ','Open the document in Microsoft Word and update fields if the entries are not displayed.')
    page_break(doc)
    add_heading(doc,'LIST OF TABLES',1)
    for txt in ['Table 1.1 Project Profile','Table 2.1 Proposed Project Schedule','Table 2.2 Risk Register','Table 2.3 Estimate Assumptions','Table 3.1 Software Requirements','Table 4.1 Functional Requirements','Table 4.2 Non-functional Requirements','Table 5.1 Core Data Dictionary','Table 5.2 Supporting Collections','Table 5.3 Module Algorithms','Table A.1 Representative Test Cases']:
        add_p(doc,txt)
    page_break(doc)
    add_heading(doc,'LIST OF FIGURES',1)
    for txt in ['Fig. 2.1 Proposed Iterative Schedule','Fig. 5.1 System Architecture','Fig. 5.2 Use Case Diagram','Fig. 5.3 Entity Relationship Diagram','Fig. 5.4 Level 1 Data Flow Diagram','Fig. 5.5 Level 2 Data Flow Diagram','Fig. 5.6 Booking and Payment Sequence Diagram']:
        add_p(doc,txt)
    page_break(doc)
    add_heading(doc,'ABBREVIATIONS AND NOMENCLATURE',1)
    add_table(doc,['Term','Meaning'],[['API','Application Programming Interface'],['JWT','JSON Web Token'],['REST','Representational State Transfer'],['GPS','Global Positioning System'],['SSE','Server-Sent Events'],['UI','User Interface'],['DB','Database'],['INR','Indian Rupee'],['PDF','Portable Document Format'],['ID','Identifier']], [Cm(3),Cm(12)],10)
    add_p(doc,'Preliminary page numbers use lower-case Roman numerals because standard Microsoft Word page-number fields do not provide a reliable Greek-alphabetic format. The section is independently configured and can be changed when the institution confirms a specific alternative format.')
    # main section
    main=doc.add_section(WD_SECTION.NEW_PAGE); configure_section(main); main.header.is_linked_to_previous=False; main.footer.is_linked_to_previous=False; page_number(main,'decimal',1)
    hp=main.header.paragraphs[0]; hp.alignment=WD_ALIGN_PARAGRAPH.CENTER; rr=hp.add_run('RideShare Vehicle Rental and Sharing Management System'); set_run(rr,10,False)
    # CHAPTER 1
    add_heading(doc,'CHAPTER 1 INTRODUCTION',1)
    add_heading(doc,'1.1 PROJECT SUMMARY',2)
    add_p(doc,'RideShare is a vehicle rental and sharing management system for a web browser. It addresses the coordination required when a vehicle owner offers a car for rental and a renter needs to discover a suitable vehicle, assess availability, choose pickup and drop locations, request a booking, and manage the rental lifecycle. The verified implementation includes a public vehicle catalogue, proximity search based on stored latitude and longitude, detail pages with date selection and quotes, owner-facing vehicle management, renter and owner booking views, administrative access controls, location and route services, notifications, reviews, invoices, pricing suggestions, and a recommendation chat interface.',indent=True)
    add_p(doc,'The application is implemented as a React and Vite client coupled to an Express server. MongoDB documents are accessed through Mongoose. Authentication is based on Clerk session token verification and organization membership, while the local User document mirrors the authenticated profile and application role. The status of the codebase is an implemented web application with configuration-dependent integrations rather than a verified production deployment. No source evidence was found for deployed user counts, completed transactions, formal performance measurements, or automated test results.',indent=True)
    add_heading(doc,'1.2 PROJECT PROFILE',2)
    caption_above(doc,'Table 1.1 Project Profile')
    add_table(doc,['Item','Verified or supplied detail'],[['Project title','RideShare Vehicle Rental and Sharing Management System'],['Category','Web-based software engineering project'],['Programme','B.Tech Computer Science and Engineering AI and ML'],['Institution','Maharana Institute of Professional Studies Kanpur'],['University affiliation','Dr. A.P.J. Abdul Kalam Technical University Uttar Pradesh'],['Academic session','2026 to 2027 supplied for confirmation'],['Student','Sweta Singh'],['Roll number','[INSERT ROLL NUMBER]'],['Guide','[INSERT GUIDE NAME AND DESIGNATION]'],['Team','[INSERT TEAM MEMBER DETAILS OR INDIVIDUAL PROJECT]'],['Development stack','React 19, Vite 6, Express 5, Node.js, MongoDB and Mongoose'],['Core integrations','Clerk, ImageKit, Razorpay, Leaflet, Google Maps or Nominatim and OSRM']], [Cm(4),Cm(11)],9)
    add_p(doc,'The project objective is to centralize vehicle listings, rental requests, availability control, handover coordination, and operational records. The application deliberately uses one local application role named user for regular organization members. A member can list vehicles and also create bookings; owner and renter are workflow roles inferred from vehicle and booking relationships. The only distinct authorization role is admin.',indent=True)
    add_heading(doc,'1.3 PURPOSE',2)
    add_p(doc,'Vehicle rental coordination commonly requires separate handling of vehicle details, date availability, owner confirmation, pickup communication, and financial records. The purpose of RideShare is to place these interactions in one browser-based workflow. It stores listing attributes such as vehicle category, fuel, transmission, capacity, pricing, handover choices, rental rules, address details, coordinates, and verification state. It also stores a booking record that preserves the calculated rental amount, delivery fee, security deposit, selected locations, lifecycle state, and later settlement values.',indent=True)
    add_p(doc,'Location visibility is treated as an operational requirement rather than merely a visual feature. The implementation normalizes coordinates, can geocode and reverse-geocode addresses, calculates routes, and renders maps using Leaflet. When an active trip has a tracking session, the client can receive event-stream updates and an owner device may submit browser geolocation updates. The system is designed to retain the route preview if live GPS is unavailable.',indent=True)
    add_heading(doc,'1.4 SCOPE',2)
    add_p(doc,'Current scope includes public browsing, controlled organizational access, car listing creation with multiple images and documents, availability and quotation checks, booking lifecycle actions, owner delivery selection, location validation, payment order and verification logic when enabled, refunds, extra-charge handling, in-application notifications, reviews, administrative member and vehicle-verification workflows, invoices, pricing suggestions, and heuristic or Gemini-assisted vehicle recommendations.',indent=True)
    add_p(doc,'The scope excludes a verified mobile-native application, a demonstrated production deployment, automatic external notification channels such as SMS or email, guaranteed real-time tracking without browser permission, fleet telemetry hardware, a demonstrated dispute-resolution workflow, and a demonstrated production payment configuration. The user interface contains disabled or informational elements such as Share trip and Safety support; they must not be treated as implemented operational services.',indent=True)
    add_heading(doc,'1.5 TECHNOLOGY AND LITERATURE REVIEW',2)
    add_p(doc,'The client uses React components, state, and routing to render the browser interface. React documentation describes the component model as reusable UI units [1]. Vite is used as the client build and development tool according to the project package configuration. The server uses Express 5 routing and middleware; its official API documents Express applications, routes, middleware, request processing, and response handling [2].',indent=True)
    add_p(doc,'The persistence design is document-oriented. Mongoose schemas define the shape, validation rules, indexes, defaults, relationships by ObjectId reference, and timestamps for collections such as User, Car, Booking, Payment, Review, Notification, Invoice, TrackingSession, AccessRequest, BookingCharge, PricingSnapshot, and AIConversation. Mongoose documentation explains that a schema maps the shape of documents and a model is compiled from a schema [3].',indent=True)
    add_p(doc,'Security decisions are informed by session-token verification and authorization. Clerk documentation recommends validation of token signature, expiry, and authorized-party claims [4]. The source verifies Clerk tokens, checks configured authorized parties, requires organization membership, and then applies route-level application roles. OWASP identifies broken object-level authorization, broken authentication, and broken function-level authorization as material API risks [5]. The code checks booking ownership or vehicle ownership in many mutation paths; future hardening should test every object-ID route systematically.',indent=True)
    add_p(doc,'The location module first attempts configured Google Geocoding and Routes services, then falls back to Nominatim and OSRM; maps are rendered from OpenStreetMap tiles through Leaflet. The design therefore has a provider-dependency risk and a graceful-degradation path. Payment logic uses Razorpay SDK order creation, signature verification, provider fetch verification, webhook handling, refunds, and additional charges, but is deliberately enabled only when the server configuration sets PAYMENTS_ENABLED to true. Provider documentation should be rechecked before release because external APIs and pricing change over time [6].',indent=True)
    # chapter 2
    add_heading(doc,'CHAPTER 2 PROJECT MANAGEMENT',1)
    add_heading(doc,'2.1 PROJECT PLANNING AND SCHEDULING',2)
    add_heading(doc,'2.1.1 PROJECT DEVELOPMENT MODEL',3)
    add_p(doc,'An iterative and incremental model is appropriate for this project. The repository exhibits separable increments: public browsing and listing management; authentication and role boundaries; booking and pricing; locations and route display; payments and refunds; tracking; administration; and recommendation features. The exact historical development process cannot be verified from the repository alone. Therefore, the model is presented as a recommended management interpretation rather than a claim about past dates or completed iterations.',indent=True)
    add_heading(doc,'2.1.2 PROJECT PLAN',3)
    add_p(doc,'Each increment should begin with acceptance criteria and a review of interfaces and data contracts. The plan comprises requirements and architecture, interface development, server models and routes, integrations, booking and operational workflows, verification, deployment preparation, and documentation. Configuration-dependent integrations should be tested in isolated sandbox environments before they are exposed to users.',indent=True)
    add_heading(doc,'2.1.3 SCHEDULE REPRESENTATION',3)
    add_p(doc,'Figure 2.1 is a relative 16-week plan. It avoids invented calendar dates. Blue bars identify code areas visible in the repository; green bars identify implemented areas that depend on correct third-party configuration; orange bars are proposed project activities.')
    add_figure(doc,'gantt.png','Fig. 2.1','Proposed iterative project schedule',Cm(14.7))
    caption_above(doc,'Table 2.1 Proposed Project Schedule')
    add_table(doc,['Phase','Relative weeks','Status interpretation'],[['Requirements and architecture','1 to 2','Recommended baseline'],['Client interface and navigation','2 to 6','Implemented source exists'],['API, models and data integration','3 to 8','Implemented source exists'],['External integrations','5 to 10','Implemented but configuration-dependent'],['Booking and operational workflow','7 to 12','Implemented source exists'],['Testing and release hardening','11 to 14','Proposed; no automated test suite identified'],['Documentation and submission','13 to 16','Proposed']], [Cm(5),Cm(3),Cm(7)],9)
    add_heading(doc,'2.2 RISK MANAGEMENT',2)
    add_heading(doc,'2.2.1 RISK IDENTIFICATION',3)
    add_p(doc,'The major risks arise from external identity, payment, map, routing, upload, and database dependencies; protection of personal and location data; concurrent booking requests; browser-level location permission; deployment configuration; and schedule uncertainty. Risks are assessed by their plausible likelihood in a student deployment and the effect on confidentiality, integrity, availability, or user experience. Ratings are qualitative: High means material disruption or sensitive-data exposure, Medium means notable rework or temporary service loss, and Low means localized recoverable effect.',indent=True)
    add_heading(doc,'2.2.2 RISK ANALYSIS AND PLANNING',3)
    caption_above(doc,'Table 2.2 Risk Register')
    add_table(doc,['Risk','Likelihood','Impact','Mitigation and contingency'],[['Invalid or replayed identity token','Low','High','Verify signature, expiry and authorized parties; reject missing organization membership; audit denied requests.'],['Unauthorized object access','Medium','High','Check request user against booking/car owner or renter; add regression tests for every ID route.'],['Concurrent booking conflict','Medium','High','Use conflict query and short vehicle lock; recheck before create; return conflict response.'],['Payment configuration or webhook failure','Medium','High','Keep payments disabled until configured; verify signatures and provider state; reconcile pending/refund states manually.'],['Map or route provider outage','Medium','Medium','Use Google then Nominatim/OSRM fallback; show route-preview limitations; retain validated coordinates.'],['Location privacy or inaccurate GPS','Medium','High','Obtain browser permission; transmit only while active; minimize retention and define user consent policy.'],['Database outage or bad configuration','Medium','High','Use monitored deployment, backups and restore procedures; surface safe errors.'],['Media upload abuse','Medium','Medium','Validate file types/size server-side and restrict ImageKit credentials; scan uploads if deployed.'],['Schedule delay','Medium','Medium','Prioritize booking/security workflows; defer non-core integrations and document residual work.']], [Cm(3.2),Cm(1.8),Cm(1.5),Cm(8.2)],8)
    add_heading(doc,'2.3 ESTIMATION',2)
    add_p(doc,'The following figures are planning estimates, not actual expenditure or effort records. They assume one developer, an educational prototype, a small pilot data volume, and managed or free-tier services where available. Usage-based billing, institutional hosting policy, domain costs, and provider plans must be confirmed before deployment.',indent=True)
    caption_above(doc,'Table 2.3 Estimate Assumptions')
    add_table(doc,['Item','Estimate or assumption','Notes'],[['Development effort','12 to 18 person-weeks','Includes implementation, integration, test design and report preparation.'],['Development duration','16 relative weeks','Schedule is a planning model, not historical evidence.'],['Developer hardware','Modern dual-core CPU, 8 GB RAM minimum','Higher memory improves local database and browser tooling use.'],['Infrastructure','Managed MongoDB, hosting, object storage and identity plan','Cost depends on actual provider plan and traffic.'],['Maps and payment','Usage-based or provider-plan dependent','Keys, quotas, transaction fees and policies must be verified.'],['Operational costs','Not estimated as zero','Monitoring, backups, domain and production service tiers may incur charges.']], [Cm(4),Cm(4),Cm(6.7)],9)
    # chapter 3
    add_heading(doc,'CHAPTER 3 SYSTEM REQUIREMENT STUDY',1)
    add_heading(doc,'3.1 HARDWARE REQUIREMENT',2)
    add_p(doc,'Development can be performed on a laptop or desktop with a dual-core 64-bit processor, 8 GB RAM, 10 GB free storage, and stable broadband connectivity. A recommended environment has a quad-core processor, 16 GB RAM, SSD storage, and reliable internet access to install packages and reach configured third-party services. These are reasonable development recommendations, not measured application minimums.',indent=True)
    add_p(doc,'Production requirements depend on actual traffic, uploaded media volume, database size, payment activity, and map requests. A production deployment should use a managed database or a properly maintained database host, HTTPS termination, environment-secret storage, backups, application logs, and health monitoring. The repository does not provide a verified capacity test or production sizing study.',indent=True)
    add_heading(doc,'3.2 SOFTWARE REQUIREMENT',2)
    caption_above(doc,'Table 3.1 Software Requirements')
    add_table(doc,['Category','Technology','Use and status'],[['Operating system','Windows, Linux or macOS','Development environment; project source is cross-platform Node.js.'],['Language and runtime','JavaScript ES modules and Node.js','Mandatory server and client implementation basis.'],['Client framework','React 19 and Vite 6','Mandatory UI and bundling dependencies.'],['Client UI','Tailwind CSS 4, Motion, React Router, Axios','Mandatory packaged client dependencies.'],['Maps','Leaflet and React Leaflet; OpenStreetMap tiles','Implemented client map rendering.'],['Server framework','Express 5, CORS, dotenv','Mandatory API framework and configuration.'],['Database','MongoDB through Mongoose 8','Mandatory persistent data model.'],['Authentication','Clerk React and Clerk backend','Implemented; requires configured Clerk instance and organization.'],['Media','Multer and ImageKit','Implemented listing/profile upload path; requires credentials.'],['Payments','Razorpay SDK and Checkout script','Implemented but optional; requires PAYMENTS_ENABLED and provider secrets.'],['Location services','Google Maps APIs or Nominatim / OSRM','Implemented fallback chain; external network dependent.'],['Document output','PDFKit','Implemented invoice generation.'],['Scheduling','node-cron','Implemented price-refresh job.'],['Browser','Current Chrome, Edge, Firefox or equivalent','Required for web access and optional geolocation.'],['Deployment','Vercel configuration files present','Deployment configuration exists; no verified live deployment found.']], [Cm(3.5),Cm(4.4),Cm(6.8)],8)
    # chapter 4
    add_heading(doc,'CHAPTER 4 SYSTEM ANALYSIS',1)
    add_heading(doc,'4.1 REQUIREMENT OF SYSTEM',2)
    add_p(doc,'Functional requirements reflect implemented routes, models, and client components. The terms owner and renter indicate the participant relationship in a transaction; both are regular user-role organization members in the current access model.',indent=True)
    caption_above(doc,'Table 4.1 Functional Requirements')
    add_table(doc,['ID','Requirement','Implementation evidence'],[['FR-01','Browse available vehicles and view listing details.','Public car routes and client Cars/CarDetails pages.'],['FR-02','Find nearby vehicles using coordinates and a radius.','Nearby car endpoint calculates geographic distance.'],['FR-03','Submit an access request and obtain organization-backed authenticated access.','AccessRequest model, Clerk token verification and admin invitation routes.'],['FR-04','Create, update, toggle, and delete owned vehicle listings.','Owner routes, image/document upload and Car model.'],['FR-05','Calculate quote and check date-range availability.','Booking service validates dates, duration, discounts, delivery and conflicts.'],['FR-06','Create and manage rental bookings.','Booking routes, lifecycle statuses, ownership checks and coordination fields.'],['FR-07','Use mapped pickup/drop locations and route information.','Location routes, geocoding, routing, Leaflet map components.'],['FR-08','Create and verify online payment orders when enabled.','Razorpay order, signature and capture verification endpoints.'],['FR-09','Track an active trip with route preview and owner GPS when consented.','TrackingSession model, SSE stream and browser geolocation updates.'],['FR-10','Store notifications, reviews, invoices and settlement records.','Respective models, controllers and UI components.'],['FR-11','Allow admin membership, verification and review moderation actions.','Admin-only routes and role middleware.'],['FR-12','Recommend vehicles from natural-language requests.','AI/recommendation routes, rules-based scoring, optional Gemini service.']], [Cm(1.5),Cm(6),Cm(7.2)],8)
    caption_above(doc,'Table 4.2 Non-functional Requirements')
    add_table(doc,['ID','Requirement','Design response'],[['NFR-01','Security','Token verification, authorized-party checking, organization gate, role middleware, ownership checks and secret environment variables.'],['NFR-02','Data integrity','Schema validation, unique fields/indexes, booking lock, conflict checks and state transitions.'],['NFR-03','Availability','Provider fallbacks for location; error responses; configuration-gated payments.'],['NFR-04','Usability','Responsive React UI, map markers, quote display, notifications and booking status feedback.'],['NFR-05','Performance','In-memory location cache, limited route payloads, indexes and event stream with polling fallback.'],['NFR-06','Privacy','Sensitive vehicle documents are excluded from public-car responses; location and contact data need deployment policy controls.'],['NFR-07','Maintainability','Separated routes, controllers, services, models and client components.']], [Cm(1.7),Cm(3.4),Cm(9.6)],8)
    add_p(doc,'Roles and permissions are as follows. A guest can browse cars, nearby cars, public reviews, access-request submission, and public location functions. An authenticated user can create and manage their own listings and bookings, coordinate a booking to which they belong, view related invoices, submit a review after a completed rental, and use protected tracking functions. An administrator can manage organization invitations and users, review access requests and vehicle verification status, and moderate reviews. The code does not establish a separate owner role.',indent=True)
    add_p(doc,'Important business rules include a valid return date after pickup date; car availability windows; rental day minima and maxima; delivery only when configured for the car; date-overlap conflict prevention; owner approval before confirmation; payment before confirmation when enabled; ownership checks for mutation; and review creation only by the renter after completion. Data includes personal profile data, vehicle identifiers/documents, booking records, location coordinates, payment-provider identifiers, reviews, and notification text. These categories require purpose limitation, access controls, retention policy, and incident procedures in any deployment.',indent=True)
    add_heading(doc,'4.2 FEASIBILITY STUDY',2)
    add_p(doc,'Technical feasibility is high for a prototype because the repository provides a modular JavaScript architecture and mature service SDKs. Integration feasibility remains conditional on externally configured Clerk, MongoDB, ImageKit, Razorpay, and map services. Economic feasibility is plausible for educational use but cannot be asserted as cost-free because provider quotas, payment charges, hosting, storage, and operational support vary. Operational feasibility is supported by focused roles and dashboard flows, although staff procedures for vehicle verification, refunds, dispute handling, and support remain necessary.',indent=True)
    add_p(doc,'Schedule feasibility is reasonable when work is prioritized: secure access, listings, availability, bookings, and test coverage should precede advanced recommendations and tracking enhancements. Legal, privacy, and security feasibility requires local institutional and deployment review. The report does not provide legal advice or claim compliance with a particular law. Production use should provide consent notices for location tracking, privacy and retention disclosures, secure secrets, access review, and payment-provider onboarding.',indent=True)
    # Chapter 5
    add_heading(doc,'CHAPTER 5 SYSTEM DESIGN',1)
    add_heading(doc,'5.1 USE CASES',2)
    add_p(doc,'Figure 5.2 models verified actors and services. The member actor covers both owner and renter workflows because the current role model grants the same regular user role. Payment-provider interaction is conditional on the server payment switch and provider credentials. Map and identity services are architectural dependencies rather than human actors.',indent=True)
    add_figure(doc,'architecture.png','Fig. 5.1','System architecture',Cm(14.7))
    add_figure(doc,'use_case.png','Fig. 5.2','Use case diagram',Cm(14.7))
    add_heading(doc,'5.2 DATA DICTIONARY',2)
    add_p(doc,'The application uses MongoDB collections, not a relational database. Consequently, references below are Mongoose ObjectId fields rather than SQL foreign keys. Every schema with timestamps stores createdAt and updatedAt automatically. “Sensitive” identifies personal, operational, financial, or verification information that requires controlled access; it does not imply encryption at rest in this repository.',indent=True)
    caption_above(doc,'Table 5.1 Core Data Dictionary')
    core=[['User','_id; clerkId','ObjectId; String','PK; unique sparse index','Local identity mirror; clerkId is sensitive identifier'],['User','name; email; phone; location; image','String','email unique; name/email required','Profile data; email/phone/location sensitive'],['User','role; totalTrips; averageRating; responseRate; responseTime','String; Number; String','role enum admin/user','Authorization and operational summary'],['Car','_id; owner','ObjectId','PK; owner ref User','Vehicle owner relationship'],['Car','brand; model; variant; year; category; seating_capacity; fuel_type; transmission','String; Number','several required; fuel enum','Public listing identity/specification'],['Car','image; images; description; features; rentalRules','String; String[]','image and description required','Listing media and content'],['Car','pricePerDay; pricePerHour; discounts; deposit; distance/late charges','Number','pricePerDay required; nonnegative checks on selected fields','Commercial terms'],['Car','location; pickupAddress; locality; landmark; coordinates','String; nested Number','location required; coordinate bounds','Operational location; sensitive precision'],['Car','availability/delivery/rental constraints','Boolean; Date; Number; String[]','defaults, min/max rental days','Availability and handover policy'],['Car','documents; registrationNumber; vin; insurance/puc; verificationStatus','nested docs; String; Date','verification enum','Verification/sensitive vehicle records'],['Booking','_id; car; user; owner','ObjectId','PK; required refs','Rental relationship'],['Booking','pickupDate; returnDate; status','Date; String','required dates; lifecycle enum','Rental period and state'],['Booking','price and amount fields','Number','required selected totals','Quote, deposit, payment and settlement values'],['Booking','handoverOption; pickup/drop location; coordinates; route values','String; nested Number','handover enum; coordinate bounds','Handover and route information'],['Booking','odometer, km, late and settlement fields','Number; Date','nonnegative selected fields','Post-trip settlement'],['Booking','notes, readiness and handoverCode','String; Boolean','notes max 500; code required','Coordination; code is sensitive operational data']]
    add_table(doc,['Collection','Field group','Type','Key or constraint','Purpose and sensitivity'], core, [Cm(2),Cm(3.4),Cm(2.2),Cm(3.2),Cm(4)],7)
    caption_above(doc,'Table 5.2 Supporting Collections')
    supporting=[['Payment','booking, user, provider, providerOrderId, providerPaymentId, providerRefundId, amount, currency, status, timestamps','One payment per booking; provider identifiers are sensitive.'],['BookingCharge','booking, user, amount, extraKmAmount, lateReturnAmount, provider IDs, status','Stores post-trip additional payment data.'],['Invoice','booking, invoiceNumber, user, owner, currency, amounts, issuedAt','One invoice per booking; financial record.'],['Notification','recipient, type, title, message, booking, read, readAt','In-app notification record.'],['Review','booking, reviewer, reviewee, car, rating, comment, moderation fields','One review per booking; rating 1 to 5.'],['TrackingSession','booking, start/destination/current coordinates, route, distance, ETA, progress, status, isSimulated','One session per booking; location data is sensitive.'],['AccessRequest','name, email, status, reviewer values','Pre-membership request; identity data is sensitive.'],['PricingSnapshot','car, owner, dateKey, prices, utilization, recommendation','Daily pricing-analysis output.'],['AIConversation','user, sessionId, messages, preferences','Natural-language history; treat as personal content.']]
    add_table(doc,['Collection','Fields','Constraints and purpose'], supporting, [Cm(3),Cm(9),Cm(5.8)],8)
    add_heading(doc,'5.3 CLASS DIAGRAM OR E R DIAGRAM',2)
    add_p(doc,'Figure 5.3 uses the document relationships found in the Mongoose schemas. A User can own many Cars and participate in many Bookings. Each Booking links a Car, renter User, and owner User and can have one Payment, Review, Invoice, and TrackingSession. Notifications and AI conversations are user-centric. The diagram is an ER-style representation suitable for a document database, not a claim that MongoDB enforces relational foreign keys.',indent=True)
    add_figure(doc,'er_diagram.png','Fig. 5.3','Entity relationship diagram',Cm(14.7))
    add_heading(doc,'5.4 DATA FLOW DIAGRAM LEVEL 1 AND LEVEL 2',2)
    add_p(doc,'The Level 1 diagram partitions the main system into account/access, vehicle/availability, and booking-lifecycle processes. The Level 2 diagram expands booking creation and shows validation, a short booking lock, quote and conflict assessment, persistence, notification, and optional payment-order interaction. Data stores represent MongoDB collections.',indent=True)
    add_figure(doc,'dfd_level_1.png','Fig. 5.4','Level 1 data flow diagram',Cm(14.7))
    add_figure(doc,'dfd_level_2.png','Fig. 5.5','Level 2 data flow diagram for booking creation',Cm(14.7))
    add_heading(doc,'5.5 SEQUENCE DIAGRAM',2)
    add_p(doc,'The central workflow begins with a date and location request from the renter. The API validates the request, locks the vehicle briefly, checks a server-calculated quote and conflicts, and persists the booking. If payments are enabled, payment order creation, checkout, signature verification, and provider capture confirmation occur before the booking can be confirmed. The owner receives a notification for the booking request. The diagram labels conditional payment behavior explicitly.',indent=True)
    add_figure(doc,'sequence.png','Fig. 5.6','Booking and payment sequence diagram',Cm(14.7))
    add_heading(doc,'5.6 PSEUDO CODE OF MODULES OR DESIGN OF ALGORITHMS',2)
    caption_above(doc,'Table 5.3 Module Algorithms')
    algorithms=[['Authentication and authorization','Receive Authorization token; verify Clerk signature, expiry and authorized party; resolve organization membership/role; load or provision local User; reject missing organization role; require allowed route role; attach trusted user to request.'],['Availability and quote','Validate pickup and return dates; validate rental duration against car limits; validate availability window and delivery option; compute base amount, applicable weekly/monthly discount, delivery fee and deposit; query overlapping bookings in blocking states; return quote or conflict.'],['Booking creation','Authenticate user; acquire short car lock atomically; calculate server quote; validate pickup/drop coordinates; recheck booking conflicts; create Booking with pending or pending_payment state; create owner notification; release lock in finally block.'],['Location retrieval','Normalize latitude and longitude; for text query try Google when configured then Nominatim; remove duplicate results; for route try Google then OSRM; if unavailable return straight-line estimate where permitted; cache limited results.'],['Payment verification','Reject when payment feature is off; resolve owned pending booking; verify Razorpay signature; fetch order and payment from provider; require captured status and matching amount; persist provider IDs/status; confirm booking; process webhook events idempotently where possible.'],['Tracking update','Require active booking owned by sender; normalize coordinates; enforce distance/time threshold; update TrackingSession current point, distance/ETA/progress and isSimulated false; expose snapshot through protected GET/SSE endpoints.']]
    add_table(doc,['Module','Pseudocode summary'], algorithms, [Cm(3.2),Cm(12.8)],9)
    add_p(doc,'The pseudocode summarizes design intent from modules in the source tree. It is not a claim that every external integration has been configured or exercised in a production environment.',indent=True)
    # Future plan
    add_heading(doc,'CHAPTER 6 FUTURE PLAN',1)
    add_p(doc,'Future work should strengthen features that are absent, configuration-dependent, or not verified as deployed. First, create an automated test suite covering authentication boundaries, ownership checks, booking conflicts, payment-webhook signatures, refunds, route fallbacks, and state transitions. Add continuous integration, dependency scanning, centralized error monitoring, structured audit logs, backups, and restore drills.',indent=True)
    add_p(doc,'Second, evolve location capability with an explicit consent, retention, and visibility policy; improve live tracking only after consented device testing; and add reliable customer-support and incident paths. A production notification strategy can add email, SMS, or push channels after opt-in and provider evaluation. Search can be enhanced through indexed geoqueries, richer filter controls, and transparent recommendation explanations.',indent=True)
    add_p(doc,'Third, implement operational policies and interfaces for payment reconciliation, refund exceptions, disputes, security-deposit outcomes, cancellation rules, vehicle document review, and owner onboarding. Payment and map credentials should remain separate by environment, rotated, and stored outside source control. A mobile-responsive usability review and later native mobile client may be considered, but neither is represented here as an existing mobile application.',indent=True)
    add_p(doc,'Finally, the pricing service can be evaluated against clear fairness and explainability criteria before using it for automated pricing. The present code calculates suggestions from recent booking utilization and price heuristics; it should remain advisory unless business controls, monitoring, and user communication are introduced.',indent=True)
    # References
    add_heading(doc,'CHAPTER 7 REFERENCES',1)
    refs=['[1] React Team, “React Documentation,” React.dev. [Online]. Available: https://react.dev/learn. [Accessed: 27-Oct-2026].','[2] Express.js, “Express 5.x API Reference,” Expressjs.com. [Online]. Available: https://expressjs.com/en/api/. [Accessed: 27-Oct-2026].','[3] Mongoose, “Schemas and Models,” Mongoose Documentation. [Online]. Available: https://mongoosejs.com/docs/guide.html and https://mongoosejs.com/docs/models.html. [Accessed: 27-Oct-2026].','[4] Clerk, “Manual JWT verification,” Clerk Documentation. [Online]. Available: https://clerk.com/docs/guides/sessions/manual-jwt-verification. [Accessed: 27-Oct-2026].','[5] OWASP Foundation, “OWASP API Security Top 10 2023,” OWASP. [Online]. Available: https://api-security.owasp.org/editions/2023/en/0x11-t10/. [Accessed: 27-Oct-2026].','[6] Razorpay, “Payment Gateway Documentation,” Razorpay. [Online]. Available: https://razorpay.com/docs/payments/. [Accessed: 27-Oct-2026].','[7] Leaflet, “Leaflet Reference,” Leafletjs.com. [Online]. Available: https://leafletjs.com/reference.html. [Accessed: 27-Oct-2026].','[8] OpenStreetMap Foundation, “Nominatim Usage Policy,” OpenStreetMap Wiki. [Online]. Available: https://operations.osmfoundation.org/policies/nominatim/. [Accessed: 27-Oct-2026].','[9] Project OSRM, “OSRM API Documentation,” Project-OSRM.org. [Online]. Available: https://project-osrm.org/docs/v5.24.0/api/. [Accessed: 27-Oct-2026].','[10] Google, “Geocoding API and Routes API Documentation,” Google for Developers. [Online]. Available: https://developers.google.com/maps/documentation/geocoding and https://developers.google.com/maps/documentation/routes. [Accessed: 27-Oct-2026].','[11] MongoDB, “MongoDB Documentation,” MongoDB. [Online]. Available: https://www.mongodb.com/docs/. [Accessed: 27-Oct-2026].']
    for ref in refs: add_p(doc,ref)
    # Appendices
    add_heading(doc,'APPENDIX A INSTALLATION AND TEST DESIGN',1)
    add_heading(doc,'A.1 DEVELOPMENT SETUP SUMMARY',2)
    add_p(doc,'The repository contains separate client and server package manifests. Install dependencies in each directory using the package manager compatible with the checked-in lock file. Configure required environment variables outside source control, including database, Clerk, ImageKit, and optional payment/map/AI values. Start the server with its start or development script and the Vite client with its development script. Exact values and secrets are intentionally excluded from this report.',indent=True)
    add_heading(doc,'A.2 REPRESENTATIVE TEST CASES',2)
    caption_above(doc,'Table A.1 Representative Test Cases')
    add_table(doc,['ID','Test scenario','Expected result'],[['TC-01','Guest searches catalogue and nearby cars with valid coordinates.','Only available cars with stored valid coordinates within capped radius are returned.'],['TC-02','Renter submits invalid or reverse date range.','API rejects request with validation response.'],['TC-03','Two users request overlapping dates for one vehicle.','Conflict/lock prevents a second blocking booking.'],['TC-04','Nonparticipant tries to update booking coordination.','API returns authorization failure.'],['TC-05','Payment enabled, payment signature invalid.','Verification is rejected and booking is not confirmed.'],['TC-06','Map provider unavailable.','Fallback provider or controlled error is returned; UI does not claim live route.'],['TC-07','Owner denies GPS permission during active trip.','Route preview remains; live GPS status explains limitation.'],['TC-08','Admin moderates a review.','Only admin route can change moderation state.']], [Cm(1.7),Cm(7),Cm(7.3)],8)
    add_heading(doc,'APPENDIX B IMPLEMENTATION STATUS NOTES',1)
    add_p(doc,'Implemented source modules exist for the capabilities described in Chapters 1 through 5. External execution remains dependent on environment configuration, third-party service availability, and deployment setup. No application screenshot has been included because the repository contains interface assets but no verified runtime screenshot set. The diagrams in this report are technical representations created from the inspected source structure, not screenshots.',indent=True)
    add_heading(doc,'PUBLICATIONS',1)
    add_p(doc,'No publications were identified in the repository or supplied project information. This section is retained to satisfy the prescribed report order and may be updated if a related paper, poster, or conference submission is available.')
    doc.save(OUT)
    print(OUT)

if __name__ == '__main__': build()
