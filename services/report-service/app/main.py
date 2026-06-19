import io
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

app = FastAPI(title="ASST Report Service")

class SummaryField(BaseModel):
    label: str
    value: str

class ReportPayload(BaseModel):
    title: str
    subtitle: Optional[str] = ""
    theme_color: Optional[str] = "#3b82f6"  # Hex color code
    summary: List[SummaryField] = []
    headers: List[str]
    rows: List[List[str]]

def parse_hex_color(hex_str: str) -> colors.Color:
    try:
        hex_str = hex_str.lstrip('#')
        if len(hex_str) == 6:
            r, g, b = int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16)
            return colors.Color(r/255.0, g/255.0, b/255.0)
    except Exception:
        pass
    return colors.HexColor("#3b82f6")

@app.get("/health")
def health():
    return {"status": "UP", "service": "Report Service"}

@app.post("/generate")
async def generate_pdf(payload: ReportPayload):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        rightMargin=40, 
        leftMargin=40, 
        topMargin=40, 
        bottomMargin=40
    )
    story = []
    
    theme_color = parse_hex_color(payload.theme_color)
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=theme_color,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=12,
        textColor=colors.HexColor("#4b5563"),
        spaceAfter=15
    )
    
    normal_style = styles['Normal']

    # Add Title
    story.append(Paragraph(payload.title, title_style))
    if payload.subtitle:
        story.append(Paragraph(payload.subtitle, subtitle_style))
        
    # Draw horizontal bar
    bar_data = [['']]
    bar_table = Table(bar_data, colWidths=[doc.width])
    bar_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), theme_color),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(bar_table)
    story.append(Spacer(1, 15))
    
    # Summary Fields
    if payload.summary:
        summary_data = []
        for i in range(0, len(payload.summary), 2):
            row = []
            # Field 1
            item = payload.summary[i]
            row.extend([
                Paragraph(f"<b>{item.label}:</b>", normal_style), 
                Paragraph(item.value, normal_style)
            ])
            
            # Field 2 (if exists)
            if i + 1 < len(payload.summary):
                item2 = payload.summary[i+1]
                row.extend([
                    Paragraph(f"<b>{item2.label}:</b>", normal_style), 
                    Paragraph(item2.value, normal_style)
                ])
            else:
                row.extend(['', ''])
            summary_data.append(row)
            
        summary_table = Table(summary_data, colWidths=[120, 140, 120, 140])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f3f4f6")),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
    # Data Table
    table_data = []
    # Headers
    header_row = [
        Paragraph(f"<b>{h}</b>", ParagraphStyle('HStyle', parent=normal_style, textColor=colors.white)) 
        for h in payload.headers
    ]
    table_data.append(header_row)
    
    # Rows
    for row in payload.rows:
        row_para = [Paragraph(cell, normal_style) for cell in row]
        table_data.append(row_para)
        
    # Col widths distribution
    num_cols = len(payload.headers)
    col_width = doc.width / num_cols
    col_widths = [col_width] * num_cols
    
    data_table = Table(table_data, colWidths=col_widths)
    t_style = [
        ('BACKGROUND', (0, 0), (-1, 0), theme_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
    ]
    data_table.setStyle(TableStyle(t_style))
    story.append(data_table)
    
    # Page numbering footer callback
    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(colors.HexColor("#9ca3af"))
        canvas.drawString(40, 20, "ASST Management System • Science & Technology")
        canvas.drawRightString(canvas._pagesize[0] - 40, 20, f"Page {doc.page}")
        canvas.restoreState()
        
    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=report.pdf"
    })
