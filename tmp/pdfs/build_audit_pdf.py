from pathlib import Path
import re, html, json, hashlib, unicodedata
from urllib.parse import quote
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, KeepTogether, Preformatted
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, Line, Polygon, String
from pypdf import PdfReader, PdfWriter

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'.qa-audit/production-2026-10-04/AUDIT-REPORT.md'
OUT=ROOT/'output/pdf/Valizent-CRM-Production-Readiness-Audit.pdf'
TMP=ROOT/'tmp/pdfs'
OUT.parent.mkdir(parents=True,exist_ok=True)
raw=SOURCE.read_text(encoding='utf-8')
for name,file in [('Segoe','segoeui.ttf'),('SegoeBold','segoeuib.ttf'),('SegoeItalic','segoeuii.ttf'),('SegoeBoldItalic','segoeuiz.ttf'),('Mono','consola.ttf')]:
    pdfmetrics.registerFont(TTFont(name,'C:/Windows/Fonts/'+file))
pdfmetrics.registerFontFamily('Segoe',normal='Segoe',bold='SegoeBold',italic='SegoeItalic',boldItalic='SegoeBoldItalic')
NAVY=colors.HexColor('#132A40'); TEAL=colors.HexColor('#007F86'); INK=colors.HexColor('#263547'); GRAY=colors.HexColor('#607385'); LIGHT=colors.HexColor('#EDF4F7')
W,H=A4; M=47; CW=W-2*M
styles={
 'body':ParagraphStyle('body',fontName='Segoe',fontSize=10.5,leading=15.5,textColor=INK,spaceAfter=10,splitLongWords=True,allowWidows=0,allowOrphans=0),
 'h2':ParagraphStyle('h2',fontName='SegoeBold',fontSize=23,leading=28,textColor=NAVY,spaceAfter=19,keepWithNext=True),
 'h3':ParagraphStyle('h3',fontName='SegoeBold',fontSize=17,leading=22,textColor=NAVY,spaceAfter=15,keepWithNext=True),
 'small':ParagraphStyle('small',fontName='Segoe',fontSize=8,leading=11,textColor=GRAY,spaceAfter=8),
 'cell':ParagraphStyle('cell',fontName='Segoe',fontSize=8.5,leading=12,textColor=INK,spaceAfter=0,splitLongWords=True),
 'thead':ParagraphStyle('thead',fontName='SegoeBold',fontSize=8.5,leading=12,textColor=colors.white),
 'code':ParagraphStyle('code',fontName='Mono',fontSize=6.9,leading=10,textColor=INK,backColor=LIGHT,borderPadding=12,spaceAfter=12),
}
expected=[]; links=[]; images=[]; mermaid=''
def norm(s):
    return s.replace('\u2014','-').replace('\u2013','-').replace('\u2011','-')
pat=re.compile(r'(!?\[([^\]]+)\]\((?:<([^>]+)>|([^\)]+))\)|\*\*(.+?)\*\*|`([^`]+)`)',re.S)
def inline(s):
    chunks=[];pos=0
    for m in pat.finditer(s):
        chunks.append(html.escape(norm(s[pos:m.start()])))
        if m.group(2):
            label=m.group(2);dest=m.group(3) or m.group(4);links.append(dest)
            if re.match(r'^[A-Z]:/',dest):
                file=re.sub(r':(\d+)$','',dest);line=re.search(r':(\d+)$',dest)
                uri='file:///'+quote(file,safe='/:')+('#line='+line.group(1) if line else '')
            else: uri=dest
            chunks.append('<link href="'+html.escape(uri,quote=True)+'" color="#007F86">'+inline(label)+'</link>')
        elif m.group(5): chunks.append('<b>'+inline(m.group(5))+'</b>')
        else: chunks.append('<font name="Mono" size="8">'+html.escape(norm(m.group(6)))+'</font>')
        pos=m.end()
    chunks.append(html.escape(norm(s[pos:])))
    return ''.join(chunks).replace('\n','<br/>')
def plain(s):
    return norm(re.sub(r'\*\*|`','',re.sub(r'!?\[([^\]]+)\]\((?:<[^>]+>|[^\)]+)\)',r'\1',s)))
def para(s,style='body',track=True):
    if track:expected.append(plain(s))
    return Paragraph(inline(s),styles[style])

def diagram():
    d=Drawing(CW,470)
    nodes={
      'A':(0,415,242,42,['Browser / Android WebView:','untrusted client']),
      'B':(0,350,242,42,['Cloudflare Pages frontend']),
      'M':(292,350,CW-292,42,['MCP client with user credentials']),
      'C':(115,287,274,38,['HTTPS API boundary']),
      'D':(62,224,CW-124,40,['Origin checks / rate limits / JWT authentication']),
      'E':(62,161,CW-124,40,['Role + Section Access + ownership + Zod validation']),
      'F':(115,98,274,40,['Controllers and business services']),
      'K':(0,98,102,40,['Public NFC token pages','and click beacons']),
      'G':(0,0,118,60,['MongoDB: users,','employees, approvals,','finance']),
      'H':(128,0,118,60,['Private uploads /','Cloudinary delivery','boundary']),
      'I':(256,0,118,60,['Push and external','integrations']),
      'J':(384,0,CW-384,60,['Winston / Sentry /','audit events']),
    }
    def arrow(points):
        for a,b in zip(points,points[1:]):d.add(Line(*a,*b,strokeColor=GRAY,strokeWidth=1))
        a,b=points[-2:];x,y=b
        import math
        ang=math.atan2(y-a[1],x-a[0]);size=5
        pts=[x,y,x-size*math.cos(ang-0.45),y-size*math.sin(ang-0.45),x-size*math.cos(ang+0.45),y-size*math.sin(ang+0.45)]
        d.add(Polygon(pts,fillColor=GRAY,strokeColor=GRAY))
    arrow([(121,415),(121,392)])
    arrow([(121,350),(121,336),(252,336),(252,325)])
    arrow([(395,350),(395,336),(252,336),(252,325)])
    for top,bottom in [(287,264),(224,201),(161,138)]:arrow([(252,top),(252,bottom)])
    arrow([(102,118),(115,118)])
    for k in ['G','H','I','J']:
        x,y,w,h,_=nodes[k];arrow([(252,98),(252,80),(x+w/2,80),(x+w/2,60)])
    for key,(x,y,w,h,labels) in nodes.items():
        fill=NAVY if key in ['C','F'] else LIGHT
        d.add(Rect(x,y,w,h,rx=5,ry=5,fillColor=fill,strokeColor=TEAL if key in ['C','E'] else colors.HexColor('#D2DFE7'),strokeWidth=0.8))
        for i,label in enumerate(labels):d.add(String(x+w/2,y+h/2+(len(labels)-1)*5.5-i*11,label,fontName='Segoe',fontSize=7.8 if key not in ['D','E'] else 8.5,textAnchor='middle',fillColor=colors.white if fill==NAVY else INK))
    return d

class AuditDoc(BaseDocTemplate):
    def __init__(self,file):
        super().__init__(str(file),pagesize=A4,leftMargin=M,rightMargin=M,topMargin=65,bottomMargin=50,title='Valizent / Al Jazeera CRM - Production Readiness Audit',author='Project audit',allowSplitting=1)
        self.addPageTemplates(PageTemplate('report',[Frame(M,50,CW,H-115,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=self.decorate))
    def decorate(self,c,doc):
        c.saveState()
        if doc.page>1:
            c.setFillColor(TEAL);c.rect(M,H-35,24,3,fill=1,stroke=0)
            c.setFont('SegoeBold',8);c.setFillColor(NAVY);c.drawString(M+34,H-35,'VALIZENT / AL JAZEERA CRM')
            c.setFont('Segoe',7.4);c.setFillColor(GRAY);c.drawRightString(W-M,H-35,'PRODUCTION READINESS AUDIT')
            c.setStrokeColor(colors.HexColor('#D5E0E6'));c.line(M,38,W-M,38)
            c.setFont('Segoe',7.2);c.drawString(M,25,'Audit: 05 OCT 2026  |  Evidence: 04-05 OCT 2026')
            c.drawRightString(W-M,25,str(doc.page))
        c.restoreState()
    def afterFlowable(self,f):
        if isinstance(f,Paragraph) and hasattr(f,'audit_heading'):
            level,title,key=f.audit_heading
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title,key,level=level,closed=False)
            self.notify('TOCEntry',(level,title,self.page,key))

story=[]
cover=ParagraphStyle('cover',fontName='SegoeBold',fontSize=32,leading=39,textColor=NAVY,spaceAfter=22)
story.extend([Spacer(1,40),Paragraph('ENGINEERING / SECURITY / OPERATIONS',ParagraphStyle('eyebrow',fontName='SegoeBold',fontSize=9,leading=12,textColor=TEAL,spaceAfter=24)),Paragraph('Valizent /<br/>Al Jazeera CRM',cover),Paragraph('Production readiness audit',ParagraphStyle('subtitle',fontName='Segoe',fontSize=22,leading=28,textColor=GRAY,spaceAfter=30))])
expected.append(plain(raw.splitlines()[0][2:]))
story.append(Table([[Paragraph('RELEASE DECISION',styles['small']),Paragraph('<b>NO-GO</b>',ParagraphStyle('decision',fontName='SegoeBold',fontSize=22,leading=28,textColor=colors.HexColor('#AD313C')))]],colWidths=[CW-130,130],style=TableStyle([('BACKGROUND',(0,0),(-1,-1),LIGHT),('BOX',(0,0),(-1,-1),0.7,colors.HexColor('#D5E0E6')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),17),('BOTTOMPADDING',(0,0),(-1,-1),17),('LEFTPADDING',(0,0),(-1,-1),17)])))
story.extend([Spacer(1,25),Paragraph('19 findings  /  3 High  /  14 Medium  /  2 Low',ParagraphStyle('stats',fontName='SegoeBold',fontSize=12,leading=18,textColor=NAVY)),Spacer(1,22)])
lines=raw.splitlines(); i=2
intro=[]
while i<len(lines) and not lines[i].startswith('## '):intro.append(lines[i]);i+=1
intro=' '.join(s for s in intro if s.strip());story.append(para(intro))
story.extend([Spacer(1,32),para('Complete report edition. Original content, evidence references, tables and screenshots retained. The original Markdown is also embedded as a PDF attachment.','small',False),para('Local file links retain their original destinations and may require access to the audit workspace. Referenced external files are not reproduced in full.','small',False),PageBreak()])
story.append(Paragraph('Contents',styles['h2']))
toc=TableOfContents();toc.levelStyles=[ParagraphStyle('toc0',fontName='SegoeBold',fontSize=9.7,leading=14,textColor=NAVY,spaceBefore=6,leftIndent=0,firstLineIndent=0,rightIndent=20),ParagraphStyle('toc1',fontName='Segoe',fontSize=8.8,leading=12,textColor=GRAY,leftIndent=14,firstLineIndent=0,rightIndent=20,spaceBefore=3)]
story.append(toc)
last='toc';heading_count=0;image_intro=None
while i<len(lines):
    s=lines[i]
    if not s.strip():i+=1;continue
    if s.startswith('## ') or s.startswith('### '):
        level=1 if s.startswith('### ') else 0; title=s[4:] if level else s[3:]
        if level==0 or last!='h2':story.append(PageBreak())
        heading_count+=1
        p=para(title,'h3' if level else 'h2');p.audit_heading=(level,plain(title),'section-'+str(heading_count));story.append(p);last='h3' if level else 'h2';i+=1;continue
    if s.startswith('~~~') or s.startswith('```'):
        code=[];i+=1
        while i<len(lines) and not lines[i].startswith(('~~~','```')):code.append(lines[i]);i+=1
        mermaid='\n'.join(code)
        story.extend([Spacer(1,9),diagram(),Spacer(1,12),para('Architecture map rendered from the source. Exact diagram source is retained in the appendix.','small',False)])
        i+=1;last='diagram';continue
    if s.startswith('|'):
        rows=[]
        while i<len(lines) and lines[i].startswith('|'):
            cells=[c.strip() for c in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?',c) for c in cells):rows.append(cells)
            i+=1
        count=len(rows[0]); widths={2:[CW*.255,CW*.745],3:[39,63,CW-102],4:[98,48,65,CW-211]}[count]
        data=[[para(c,'thead' if ri==0 else 'cell') for c in row] for ri,row in enumerate(rows)]
        t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
        padding=2 if count==4 else 4 if count==2 else 8
        t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),NAVY),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,LIGHT]),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),padding),('BOTTOMPADDING',(0,0),(-1,-1),padding),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('LINEBELOW',(0,0),(-1,0),1,TEAL),('LINEBELOW',(0,1),(-1,-1),0.35,colors.HexColor('#D5E0E6'))]))
        story.extend([t,Spacer(1,12)]);last='table';continue
    image_match=re.fullmatch(r'!\[([^\]]*)\]\(<([^>]+)>\)',s)
    if image_match:
        label,file=image_match.groups(); images.append(file)
        from PIL import Image as PILImage
        wi,he=PILImage.open(file).size; scale=min(CW/wi,555/he)
        prefix=[image_intro,Spacer(1,3)] if image_intro is not None else []
        story.append(KeepTogether(prefix+[Image(file,width=wi*scale,height=he*scale),Spacer(1,8),para(label,'small')]))
        image_intro=None
        i+=1;last='image';continue
    block=[]
    bullet=re.match(r'^(\d+\.|-)\s',s)
    if bullet:
        block=[s];i+=1
        while i<len(lines) and lines[i].strip() and not re.match(r'^(\d+\.|-)\s',lines[i]) and not lines[i].startswith('#'):block.append(lines[i]);i+=1
    else:
        while i<len(lines) and lines[i].strip() and not lines[i].startswith(('#','|','~~~','```','![')):
            block.append(lines[i]);i+=1
    text='\n'.join(block) if any(x.endswith('  ') for x in block) else ' '.join(block)
    if not text:raise RuntimeError('Unparsed source at '+str(i))
    p=para(text)
    upcoming=next((x for x in lines[i:] if x.strip()),'')
    if upcoming.startswith('!['):
        image_intro=p
    else:story.append(KeepTogether([p]))
    last='paragraph'

story.append(PageBreak());p=para('Appendix - architecture diagram source','h2',False);p.audit_heading=(0,'Appendix - architecture diagram source','mermaid-source');story.append(p)
story.append(para('Original Mermaid source, preserved for editing and exact reference.','small',False));story.append(Preformatted(norm(mermaid),styles['code']));expected.append(norm(mermaid))
story.append(para('The exact original AUDIT-REPORT.md is embedded in this PDF, including original links, punctuation and Markdown formatting.','small',False))
original_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
story.append(para('Original source SHA-256: '+original_hash,'small',False))
draft=TMP/'audit-layout.pdf';AuditDoc(draft).multiBuild(story)
reader=PdfReader(draft);writer=PdfWriter();writer.clone_document_from_reader(reader)
writer.add_attachment('AUDIT-REPORT.md',SOURCE.read_bytes())
writer.add_metadata({'/Title':'Valizent / Al Jazeera CRM - Production Readiness Audit','/Author':'Project audit','/Subject':'Complete production readiness audit - October 5, 2026','/Keywords':'QA, security, performance, production readiness, handover'})
with OUT.open('wb') as f:writer.write(f)
result=PdfReader(OUT)
extracted='\n'.join(p.extract_text() or '' for p in result.pages)
extracted=re.sub(r'VALIZENT / AL JAZEERA CRM\s*PRODUCTION READINESS AUDIT','',extracted)
extracted=re.sub(r'Audit: 05 OCT 2026\s*\|\s*Evidence: 04-05 OCT 2026\s*\d+','',extracted)
def compact(s):return re.sub(r'\s+','',norm(unicodedata.normalize('NFKC',s)))
flat=compact(extracted)
missing=[t for t in expected if compact(t) not in flat]
# Cover title is deliberately typeset across several lines with a distinct case.
missing=[t for t in missing if t!=plain(raw.splitlines()[0][2:])]
annotations=[a.get_object() for p in result.pages for a in p.get('/Annots',[])]
verify={'pages':len(result.pages),'expected_text_blocks':len(expected),'unmatched_text_blocks':missing,'source_sha256':original_hash,'embedded_original_matches':result.attachments['AUDIT-REPORT.md'][0]==SOURCE.read_bytes(),'image_count':len(images),'link_annotations':len(annotations),'output_bytes':OUT.stat().st_size}
(TMP/'validation.json').write_text(json.dumps(verify,indent=2),encoding='utf-8')
(TMP/'expected-text.json').write_text(json.dumps(expected,ensure_ascii=False,indent=2),encoding='utf-8')
(TMP/'extracted.txt').write_text(extracted,encoding='utf-8')
print(json.dumps({**verify,'unmatched_text_blocks':missing[:5]},indent=2))
