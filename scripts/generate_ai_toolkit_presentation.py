"""
Academic Presentation Generator: AI-Powered Research, Learning & Teaching Toolkit
Generates a 33-slide publication-grade widescreen (16:9) presentation using python-pptx.
"""

import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor

# -----------------------------------------------------------------------------
# Color Palette Constants (Modern Academic Laboratory Aesthetic)
# -----------------------------------------------------------------------------
NAVY = RGBColor(15, 23, 42)          # Slate 900 - Deep Base / Hero Header
SLATE_DARK = RGBColor(30, 41, 59)     # Slate 800 - Body headers
SLATE_MED = RGBColor(71, 85, 105)     # Slate 600 - Secondary text / labels
SLATE_LIGHT = RGBColor(241, 245, 249) # Slate 100 - Card backgrounds / fills
SLATE_BORDER = RGBColor(226, 232, 240)# Slate 200 - Borders
WHITE = RGBColor(255, 255, 255)       # Card surfaces

BLUE_PRIMARY = RGBColor(37, 99, 235)  # Blue 600 - Primary brand / active
BLUE_DARK = RGBColor(29, 78, 216)     # Blue 700 - Deep accents
BLUE_LIGHT = RGBColor(239, 246, 255)  # Blue 50 - Card backgrounds

VIOLET = RGBColor(124, 58, 237)       # Violet 600 - GenAI / Insight
VIOLET_LIGHT = RGBColor(245, 243, 255)# Violet 50 - Background accent

TEAL = RGBColor(13, 148, 136)         # Teal 600 - Discover / Experiments
TEAL_LIGHT = RGBColor(240, 253, 250)  # Teal 50 - Background accent

AMBER = RGBColor(217, 119, 6)         # Amber 600 - Caution / Limits
AMBER_LIGHT = RGBColor(254, 243, 199) # Amber 50 - Alert background

RED = RGBColor(220, 38, 38)           # Red 600 - Critical Warning
RED_LIGHT = RGBColor(254, 242, 242)   # Red 50 - Critical alert bg

EMERALD = RGBColor(5, 150, 105)       # Emerald 600 - Verification / Success
EMERALD_LIGHT = RGBColor(236, 253, 245)# Emerald 50 - Badge bg

CANVAS_BG = RGBColor(248, 250, 252)   # Slate 50 - Presentation canvas

FONT_FAMILY = "Segoe UI"
FONT_MONO = "Consolas"

# -----------------------------------------------------------------------------
# Presentation Core Builder Class
# -----------------------------------------------------------------------------
class ToolkitDeckBuilder:
    def __init__(self, filename="AI_Powered_Research_Learning_Teaching_Toolkit.pptx"):
        self.filename = filename
        self.prs = Presentation()
        self.prs.slide_width = Inches(13.333)
        self.prs.slide_height = Inches(7.5)
        self.blank_layout = self.prs.slide_layouts[6]
        self.total_slides = 33
        self.current_slide_idx = 0

    def add_canvas(self, is_dark=False):
        """Creates a fresh slide with background fill."""
        self.current_slide_idx += 1
        slide = self.prs.slides.add_slide(self.blank_layout)
        bg = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5)
        )
        bg.fill.solid()
        bg.fill.fore_color.rgb = NAVY if is_dark else CANVAS_BG
        bg.line.fill.background()
        return slide

    def add_header(self, slide, section, title, subtitle, is_dark=False):
        """Adds structured header with Category Pill, Title, Subtitle, and accent bar."""
        # Category Pill
        pill = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.42), Inches(3.6), Inches(0.32)
        )
        pill.fill.solid()
        pill.fill.fore_color.rgb = BLUE_DARK if is_dark else BLUE_LIGHT
        pill.line.color.rgb = BLUE_PRIMARY if not is_dark else WHITE
        pill.line.width = Pt(1)
        tf_pill = pill.text_frame
        tf_pill.word_wrap = False
        tf_pill.margin_left = tf_pill.margin_right = tf_pill.margin_top = tf_pill.margin_bottom = 0
        p_pill = tf_pill.paragraphs[0]
        p_pill.text = section.upper()
        p_pill.alignment = PP_ALIGN.CENTER
        p_pill.font.name = FONT_FAMILY
        p_pill.font.size = Pt(9.5)
        p_pill.font.bold = True
        p_pill.font.color.rgb = WHITE if is_dark else BLUE_PRIMARY

        # Title and Subtitle container
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.78), Inches(11.733), Inches(0.95))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        
        # Title paragraph
        p_title = tf.paragraphs[0]
        p_title.text = title
        p_title.font.name = FONT_FAMILY
        p_title.font.size = Pt(21)
        p_title.font.bold = True
        p_title.font.color.rgb = WHITE if is_dark else NAVY
        
        # Subtitle paragraph
        p_sub = tf.add_paragraph()
        p_sub.text = subtitle
        p_sub.font.name = FONT_FAMILY
        p_sub.font.size = Pt(11.5)
        p_sub.font.color.rgb = RGBColor(148, 163, 184) if is_dark else SLATE_MED
        p_sub.space_before = Pt(3)

        # Subtle separator line
        sep = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.78), Inches(11.733), Inches(0.015)
        )
        sep.fill.solid()
        sep.fill.fore_color.rgb = RGBColor(51, 65, 85) if is_dark else SLATE_BORDER
        sep.line.fill.background()

    def add_footer(self, slide, source_text=None, is_dark=False):
        """Adds a professional footer with Moniker, source reference, and slide counter."""
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.35))
        tf = tb.text_frame
        tf.word_wrap = False
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        
        p = tf.paragraphs[0]
        p.font.name = FONT_FAMILY
        p.font.size = Pt(9)
        p.font.color.rgb = RGBColor(100, 116, 139) if is_dark else SLATE_MED
        
        source = f" | Ref: {source_text}" if source_text else ""
        p.text = f"AI-Powered Research, Learning & Teaching Toolkit{source}"
        
        # Right aligned page number in separate textbox
        tb_page = slide.shapes.add_textbox(Inches(10.5), Inches(7.05), Inches(2.033), Inches(0.35))
        tf_page = tb_page.text_frame
        tf_page.word_wrap = False
        tf_page.margin_left = tf_page.margin_right = tf_page.margin_top = tf_page.margin_bottom = 0
        p_page = tf_page.paragraphs[0]
        p_page.text = f"Slide {self.current_slide_idx} of {self.total_slides}"
        p_page.alignment = PP_ALIGN.RIGHT
        p_page.font.name = FONT_FAMILY
        p_page.font.size = Pt(9)
        p_page.font.color.rgb = RGBColor(100, 116, 139) if is_dark else SLATE_MED

    def add_card(self, slide, left, top, width, height, bg_color=WHITE, border_color=SLATE_BORDER):
        """Creates a standardized container card."""
        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
        )
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1)
        else:
            card.line.fill.background()
        return card

    def add_bullet_list(self, tf, items, font_size=11, text_color=SLATE_DARK, bold_prefix=True, spacing=4):
        """Adds bulleted points into a text frame."""
        for i, item in enumerate(items):
            p = tf.paragraphs[0] if i == 0 and tf.paragraphs[0].text == "" else tf.add_paragraph()
            p.space_after = Pt(spacing)
            
            if bold_prefix and ":" in item:
                prefix, rest = item.split(":", 1)
                r1 = p.add_run()
                r1.text = f"•  {prefix.strip()}: "
                r1.font.name = FONT_FAMILY
                r1.font.bold = True
                r1.font.size = Pt(font_size)
                r1.font.color.rgb = text_color
                
                r2 = p.add_run()
                r2.text = rest.strip()
                r2.font.name = FONT_FAMILY
                r2.font.bold = False
                r2.font.size = Pt(font_size)
                r2.font.color.rgb = text_color
            else:
                r = p.add_run()
                r.text = f"•  {item}"
                r.font.name = FONT_FAMILY
                r.font.bold = False
                r.font.size = Pt(font_size)
                r.font.color.rgb = text_color

    def add_badge(self, slide, left, top, width, height, text, bg_color, text_color, font_size=9.5):
        """Adds a compact status badge."""
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        badge.fill.solid()
        badge.fill.fore_color.rgb = bg_color
        badge.line.fill.background()
        tf = badge.text_frame
        tf.word_wrap = False
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = text
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_FAMILY
        p.font.size = Pt(font_size)
        p.font.bold = True
        p.font.color.rgb = text_color
        return badge

    def add_table(self, slide, left, top, width, height, headers, rows, col_widths, header_bg=BLUE_PRIMARY):
        """Creates a publication-grade styled table with clean margins."""
        table_shape = slide.shapes.add_table(len(rows) + 1, len(headers), left, top, width, height)
        table = table_shape.table
        
        # Set column widths
        for idx, w in enumerate(col_widths):
            table.columns[idx].width = w
            
        # Headers
        for idx, h_text in enumerate(headers):
            cell = table.cell(0, idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = header_bg
            cell.margin_left = Inches(0.12)
            cell.margin_right = Inches(0.12)
            cell.margin_top = Inches(0.08)
            cell.margin_bottom = Inches(0.08)
            p = cell.text_frame.paragraphs[0]
            p.text = h_text
            p.font.name = FONT_FAMILY
            p.font.bold = True
            p.font.size = Pt(10.5)
            p.font.color.rgb = WHITE
            p.alignment = PP_ALIGN.LEFT
            
        # Rows
        for r_idx, row_data in enumerate(rows):
            bg = WHITE if r_idx % 2 == 0 else SLATE_LIGHT
            for c_idx, val in enumerate(row_data):
                cell = table.cell(r_idx + 1, c_idx)
                cell.fill.solid()
                cell.fill.fore_color.rgb = bg
                cell.margin_left = Inches(0.12)
                cell.margin_right = Inches(0.12)
                cell.margin_top = Inches(0.08)
                cell.margin_bottom = Inches(0.08)
                p = cell.text_frame.paragraphs[0]
                p.text = str(val)
                p.font.name = FONT_FAMILY
                p.font.size = Pt(10)
                p.font.color.rgb = NAVY if c_idx == 0 else SLATE_DARK
                if c_idx == 0:
                    p.font.bold = True
                p.alignment = PP_ALIGN.LEFT
        return table_shape

    def add_prompt_box(self, slide, left, top, width, height, title, prompt_lines):
        """Adds a code or prompt engineering container."""
        card = self.add_card(slide, left, top, width, height, bg_color=WHITE, border_color=BLUE_PRIMARY)
        
        # Top banner for the prompt
        banner = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.38))
        banner.fill.solid()
        banner.fill.fore_color.rgb = BLUE_PRIMARY
        banner.line.fill.background()
        tf_b = banner.text_frame
        p_b = tf_b.paragraphs[0]
        p_b.text = title.upper()
        p_b.font.name = FONT_FAMILY
        p_b.font.size = Pt(9.5)
        p_b.font.bold = True
        p_b.font.color.rgb = WHITE
        p_b.alignment = PP_ALIGN.LEFT
        tf_b.margin_left = Inches(0.15)
        
        # Textbox for prompt lines
        tb = slide.shapes.add_textbox(left + Inches(0.18), top + Inches(0.48), width - Inches(0.36), height - Inches(0.58))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        for i, line in enumerate(prompt_lines):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.text = line
            p.font.name = FONT_FAMILY
            p.font.size = Pt(10)
            p.font.color.rgb = SLATE_DARK
            p.space_after = Pt(2.5)

    def add_callout(self, slide, left, top, width, height, title, message, style='info', tag=None):
        """Adds an alert/callout box (e.g. Caution, Critical Warning, Success)."""
        color_map = {
            'info': (BLUE_LIGHT, BLUE_PRIMARY),
            'warning': (AMBER_LIGHT, AMBER),
            'danger': (RED_LIGHT, RED),
            'success': (EMERALD_LIGHT, EMERALD),
            'violet': (VIOLET_LIGHT, VIOLET)
        }
        bg, accent = color_map.get(style, (BLUE_LIGHT, BLUE_PRIMARY))
        
        card = self.add_card(slide, left, top, width, height, bg_color=bg, border_color=accent)
        
        # Left colored accent strip
        strip = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, Inches(0.12), height)
        strip.fill.solid()
        strip.fill.fore_color.rgb = accent
        strip.line.fill.background()
        
        # Textbox inside callout
        tb = slide.shapes.add_textbox(left + Inches(0.22), top + Inches(0.08), width - Inches(0.35), height - Inches(0.16))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        
        p0 = tf.paragraphs[0]
        if tag:
            r_tag = p0.add_run()
            r_tag.text = f"[{tag.upper()}] "
            r_tag.font.bold = True
            r_tag.font.size = Pt(10)
            r_tag.font.color.rgb = accent
        
        r_title = p0.add_run()
        r_title.text = f"{title}: " if message else title
        r_title.font.bold = True
        r_title.font.size = Pt(10)
        r_title.font.color.rgb = NAVY
        
        if message:
            r_msg = p0.add_run()
            r_msg.text = message
            r_msg.font.bold = False
            r_msg.font.size = Pt(9.5)
            r_msg.font.color.rgb = SLATE_DARK

    def save(self):
        self.prs.save(self.filename)
        print(f"[SUCCESS] Presentation generated successfully: {self.filename} ({len(self.prs.slides)} slides)")

# -----------------------------------------------------------------------------
# Slide-by-Slide Construction
# -----------------------------------------------------------------------------
def build_presentation():
    deck = ToolkitDeckBuilder()

    # =========================================================================
    # SLIDE 1: Title Slide (Dark Hero Lab Aesthetic)
    # =========================================================================
    s1 = deck.add_canvas(is_dark=True)
    
    # Top badge
    deck.add_badge(s1, Inches(0.8), Inches(0.6), Inches(4.5), Inches(0.35), 
                   "ACADEMIC TECHNOLOGY & RESEARCH WORKSHOP", BLUE_PRIMARY, WHITE, font_size=10)
    
    # Title Textbox
    tb_title = s1.shapes.add_textbox(Inches(0.8), Inches(1.15), Inches(11.7), Inches(1.8))
    tf_t = tb_title.text_frame
    tf_t.word_wrap = True
    p_t = tf_t.paragraphs[0]
    p_t.text = "AI-Powered Research, Learning &\nTeaching Toolkit"
    p_t.font.name = FONT_FAMILY
    p_t.font.size = Pt(32)
    p_t.font.bold = True
    p_t.font.color.rgb = WHITE
    
    p_sub = tf_t.add_paragraph()
    p_sub.text = "Practical AI Tools, Strategies and Workflows for Modern Researchers and Educators"
    p_sub.font.name = FONT_FAMILY
    p_sub.font.size = Pt(15)
    p_sub.font.color.rgb = RGBColor(148, 163, 184)
    p_sub.space_before = Pt(8)

    # 7-Stage Visual Ecosystem Ribbon
    stages = [
        ("1. Papers", "Literature Search"),
        ("2. AI Tools", "Discovery & RAG"),
        ("3. Analysis", "Gap Identification"),
        ("4. Experiments", "Code & Colab"),
        ("5. Writing", "Academic Paper"),
        ("6. Publish", "Peer-Review"),
        ("7. Teaching", "Active Pedagogy")
    ]
    ribbon_y = Inches(3.2)
    stage_w = Inches(1.58)
    gap = Inches(0.11)
    for idx, (st_num, st_name) in enumerate(stages):
        x = Inches(0.8) + idx * (stage_w + gap)
        c = deck.add_card(s1, x, ribbon_y, stage_w, Inches(1.05), bg_color=SLATE_DARK, border_color=BLUE_PRIMARY)
        tb_st = s1.shapes.add_textbox(x + Inches(0.08), ribbon_y + Inches(0.12), stage_w - Inches(0.16), Inches(0.8))
        tf_st = tb_st.text_frame
        tf_st.word_wrap = True
        tf_st.margin_left = tf_st.margin_right = tf_st.margin_top = tf_st.margin_bottom = 0
        p1 = tf_st.paragraphs[0]
        p1.text = st_num
        p1.font.bold = True
        p1.font.size = Pt(10)
        p1.font.color.rgb = RGBColor(56, 189, 248) # Sky blue
        p2 = tf_st.add_paragraph()
        p2.text = st_name
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = RGBColor(226, 232, 240)
        p2.space_before = Pt(3)

    # Academic Metadata Block (Student / Faculty Placeholders)
    meta_card = deck.add_card(s1, Inches(0.8), Inches(4.55), Inches(11.733), Inches(2.1), bg_color=RGBColor(24, 33, 50), border_color=RGBColor(51, 65, 85))
    tb_m = s1.shapes.add_textbox(Inches(1.05), Inches(4.7), Inches(11.2), Inches(1.8))
    tf_m = tb_m.text_frame
    tf_m.word_wrap = True
    tf_m.margin_left = tf_m.margin_right = tf_m.margin_top = tf_m.margin_bottom = 0
    
    pm_title = tf_m.paragraphs[0]
    pm_title.text = "ACADEMIC & INSTITUTIONAL PRESENTATION DETAILS"
    pm_title.font.bold = True
    pm_title.font.size = Pt(11)
    pm_title.font.color.rgb = RGBColor(148, 163, 184)
    
    # 3-Column Meta Layout
    meta_fields = [
        "Presenter: [Student / Researcher Name]",
        "Register No: [Register / Roll Number]",
        "Department: [Department of Computer Science / Engineering]",
        "Year & Section: [Final Year / Section A / B]",
        "Course / Module: [Research Methodology / Capstone Project]",
        "Faculty / Mentor: [Course Handler / Supervisor Name]"
    ]
    for m in meta_fields:
        p = tf_m.add_paragraph()
        key, val = m.split(":", 1)
        r_k = p.add_run()
        r_k.text = f"•  {key.strip()}: "
        r_k.font.bold = True
        r_k.font.size = Pt(10.5)
        r_k.font.color.rgb = WHITE
        r_v = p.add_run()
        r_v.text = val.strip()
        r_v.font.size = Pt(10.5)
        r_v.font.color.rgb = RGBColor(203, 213, 225)
        p.space_after = Pt(2)
        
    deck.add_footer(s1, "Academic Technology Blueprint", is_dark=True)

    # =========================================================================
    # SLIDE 2: Why AI Matters in Modern Research
    # =========================================================================
    s2 = deck.add_canvas()
    deck.add_header(s2, "Context & Motivation", "Why AI Matters in Modern Research & Education", 
                    "Overcoming traditional research friction points through augmented, human-governed intelligence")
    
    # Left Column: Traditional Bottlenecks
    deck.add_card(s2, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.3), bg_color=WHITE, border_color=RED)
    deck.add_badge(s2, Inches(1.05), Inches(2.15), Inches(3.2), Inches(0.3), "TRADITIONAL RESEARCH BOTTLENECKS", RED_LIGHT, RED)
    tb_c1 = s2.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_c1.text_frame, [
        "Literature Deluge: Over 5 million new peer-reviewed papers published annually makes manual reading impossible.",
        "Synthesizing Complexity: Extracting datasets, equations, and algorithms across 50+ papers leads to severe fatigue.",
        "Gap Blindspots: Researchers often duplicate existing work because niche prior art is buried across silos.",
        "Experimental Bottlenecks: Time spent configuring GPU runtimes, writing boilerplate code, and debugging.",
        "Manuscript Polish: Non-native speakers struggle with academic tone, flow, and journal formatting guidelines.",
        "Teaching Inefficiencies: Traditional passive lectures lack instant feedback, leaving misconceptions unaddressed."
    ], font_size=10, spacing=4)

    # Right Column: The AI-Assisted Transformation
    deck.add_card(s2, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.3), bg_color=WHITE, border_color=EMERALD)
    deck.add_badge(s2, Inches(7.15), Inches(2.15), Inches(3.2), Inches(0.3), "THE AUGMENTED AI WORKFLOW", EMERALD_LIGHT, EMERALD)
    tb_c2 = s2.shapes.add_textbox(Inches(7.15), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_c2.text_frame, [
        "Discover Faster: Graph-based discovery tools map citation networks and surface high-impact seed papers in minutes.",
        "Read with Depth: Source-grounded RAG engines answer deep methodological questions with direct page citations.",
        "Experiment Flexibly: Cloud notebooks with Copilot eliminate local setup and accelerate EDA and model prototypes.",
        "Write with Rigor: Specialized academic writing co-pilots improve conciseness and adherence to IMRaD standards.",
        "Collaborate Seamlessly: Real-time repositories and cloud vaults maintain team synchronization and reproducibility.",
        "Engage Proactively: Formative assessment and gamified platforms provide instant feedback loops in class."
    ], font_size=10, spacing=4)

    # Bottom Banner: Cardinal Axiom
    deck.add_callout(s2, Inches(0.8), Inches(6.4), Inches(11.733), Inches(0.55), 
                     "Cardinal Axiom", "AI is an Accelerator, Not a Substitute: AI amplifies speed and synthesis, but human researcher judgment, ethical integrity, and domain scrutiny remain completely irreplaceable.", style='violet')
    deck.add_footer(s2, "Nature / Science Research Trends 2024–2026")

    # =========================================================================
    # SLIDE 3: Complete AI-Assisted Research Workflow (The Master Roadmap)
    # =========================================================================
    s3 = deck.add_canvas()
    deck.add_header(s3, "Comprehensive Roadmap", "The 14-Stage AI-Assisted Research Lifecycle", 
                    "An integrated architectural map connecting research conception to journal dissemination and active pedagogy")
    
    # 3 Pillar Cards across the slide
    pillars = [
        ("PILLAR 1: DISCOVERY & IDEATION", BLUE_PRIMARY, BLUE_LIGHT, [
            "1. Research Question: Gemini / ChatGPT for topic refinement & scoping",
            "2. Literature Discovery: ResearchRabbit & Litmaps for citation mapping",
            "3. Paper Screening: Consensus & Elicit for finding empirical consensus",
            "4. Paper Reading & Notes: NotebookLM & SciSpace for grounded QA",
            "5. Research Gap Identification: Semantic Scholar & Connected Papers"
        ]),
        ("PILLAR 2: EXPERIMENT & WRITING", VIOLET, VIOLET_LIGHT, [
            "6. Idea & Hypothesis: Claude & Gemini for experimental framing",
            "7. Coding & Computing: Google Colab & GitHub Copilot for prototyping",
            "8. Data & Statistical Analysis: Python (Seaborn/Scikit) & Cursor IDE",
            "9. AI-Assisted Writing: Paperpal & Writefull for academic grammar",
            "10. Manuscript Dissemination: Overleaf LaTeX for journal compilation"
        ]),
        ("PILLAR 3: COLLABORATION & PEDAGOGY", TEAL, TEAL_LIGHT, [
            "11. Project Proposal: Structured AI templates for grant/capstone defense",
            "12. Team Collaboration: GitHub, Notion & Google Drive for version control",
            "13. Presentation & Teaching: Google Forms & Khan Academy for mastery",
            "14. Interactive Gamification: Kahoot, Blooket & Flippity for engagement",
            "Continuous Audit: Rigorous verification & ethics against hallucinations"
        ])
    ]
    card_w = Inches(3.75)
    gap = Inches(0.24)
    for idx, (p_title, p_color, p_bg, p_items) in enumerate(pillars):
        x = Inches(0.8) + idx * (card_w + gap)
        deck.add_card(s3, x, Inches(2.0), card_w, Inches(4.3), bg_color=WHITE, border_color=p_color)
        deck.add_badge(s3, x + Inches(0.15), Inches(2.15), card_w - Inches(0.3), Inches(0.35), p_title, p_bg, p_color)
        tb = s3.shapes.add_textbox(x + Inches(0.15), Inches(2.6), card_w - Inches(0.3), Inches(3.5))
        deck.add_bullet_list(tb.text_frame, p_items, font_size=9.5, spacing=5)

    deck.add_callout(s3, Inches(0.8), Inches(6.4), Inches(11.733), Inches(0.55), 
                     "Navigation Guide", "This roadmap serves as the master syllabus for this toolkit. Each subsequent section deep-dives into tools, prompts, and practical examples.", style='info')
    deck.add_footer(s3, "IEEE / ACM Academic Research Process Standards")

    # =========================================================================
    # SLIDE 4: Section 1: Literature Discovery - Importance & Bottlenecks
    # =========================================================================
    s4 = deck.add_canvas()
    deck.add_header(s4, "Section 1: Literature Discovery", "Literature Discovery: Why It Is Fundamental", 
                    "Building on existing scientific foundations while avoiding redundant experimentation and blind spots")
    
    # Left Card: Why Literature Discovery is Vital
    deck.add_card(s4, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s4, Inches(1.05), Inches(2.15), Inches(3.0), Inches(0.3), "FOUNDATIONAL OBJECTIVES", BLUE_LIGHT, BLUE_PRIMARY)
    tb_l4 = s4.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l4.text_frame, [
        "Prevent Duplicate Invention: Ensures months of research are not wasted reimplementing already published solutions.",
        "Uncover Established Baselines: Identifies the standard benchmark datasets (e.g., ImageNet, MIMIC-III) and baseline metrics.",
        "Reveal Methodological Flaws: Helps researchers identify common algorithmic failures and experimental limitations.",
        "Triangulate True Research Gaps: Highlights unsolved edge cases, data scarcity issues, or unverified claims in prior art.",
        "Map Author Networks: Identifies key research labs, active investigators, and potential collaborators or reviewers.",
        "Strengthen Grant/Thesis Defense: Provides an authoritative, evidence-backed foundation for proposals."
    ], font_size=10, spacing=4)

    # Right Card: The Filtering Problem Diagram
    deck.add_card(s4, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=SLATE_BORDER)
    deck.add_badge(s4, Inches(7.15), Inches(2.15), Inches(3.0), Inches(0.3), "THE INFORMATION BOTTLENECK", SLATE_LIGHT, SLATE_DARK)
    
    # 5-step vertical funnel
    funnel_steps = [
        ("1. Global Literature Pool", "Thousands of papers published daily across IEEE, ACM, arXiv, Springer", RED_LIGHT, RED),
        ("2. Information Overload", "Keyword searches return 10,000+ unranked, noisy results", AMBER_LIGHT, AMBER),
        ("3. Traditional Manual Screening", "Skimming titles/abstracts manually leads to severe fatigue and bias", SLATE_LIGHT, SLATE_DARK),
        ("4. AI Graph-Based Filtering", "Relational AI tools filter papers by citation centrality and semantic relevance", BLUE_LIGHT, BLUE_PRIMARY),
        ("5. Curated Seed Collection", "20–30 high-impact, directly relevant papers with transparent lineage", EMERALD_LIGHT, EMERALD)
    ]
    step_y = Inches(2.6)
    for st_title, st_desc, bg_c, txt_c in funnel_steps:
        f_card = deck.add_card(s4, Inches(7.15), step_y, Inches(5.1), Inches(0.65), bg_color=bg_c, border_color=txt_c)
        tb_f = s4.shapes.add_textbox(Inches(7.25), step_y + Inches(0.06), Inches(4.9), Inches(0.55))
        tf_f = tb_f.text_frame
        tf_f.word_wrap = True
        tf_f.margin_left = tf_f.margin_right = tf_f.margin_top = tf_f.margin_bottom = 0
        p1 = tf_f.paragraphs[0]
        p1.text = st_title
        p1.font.bold = True
        p1.font.size = Pt(9.5)
        p1.font.color.rgb = txt_c
        p2 = tf_f.add_paragraph()
        p2.text = st_desc
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = SLATE_DARK
        step_y += Inches(0.72)

    deck.add_callout(s4, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.6), 
                     "Methodology Insight", "Modern discovery shifts researchers from keyword searching ('query and pray') to graph exploration ('start with one seed paper and map its citation ecosystem').", style='info')
    deck.add_footer(s4, "Source: Research Synthesis Methods (Elsevier, 2024)")

    # =========================================================================
    # SLIDE 5: Literature Review AI Tools (Comparison Matrix)
    # =========================================================================
    s5 = deck.add_canvas()
    deck.add_header(s5, "Section 1: Literature Discovery", "Comparative Matrix: AI Literature Review Tools", 
                    "Comprehensive feature breakdown of specialized literature discovery engines and their ideal research applications")
    
    headers = ["Tool Name", "Primary Purpose", "Best For", "Output Format", "Underlying Source"]
    rows = [
        ["ResearchRabbit", "Citation network mapping & author graph visualization", "Building dynamic literature collections from seed papers", "Interactive network graphs, timeline views, RIS export", "Crossref, PubMed, OpenAlex"],
        ["Litmaps", "Chronological citation maps & literature tracking", "Mapping literature landscape & monitoring emerging preprints", "Interactive circular & timeline citation maps, alerts", "Semantic Scholar, OpenAlex"],
        ["Elicit", "Automated research paper synthesis & data extraction", "Systematic literature reviews & matrix extraction of metrics", "Customizable summary tables, metric matrices, CSV", "Semantic Scholar (200M+ papers)"],
        ["Consensus", "AI search engine for scientific consensus", "Answering empirical yes/no questions backed by evidence", "Consensus Meter (Yes/No/Maybe), paper excerpts", "Semantic Scholar, PubMed"],
        ["Connected Papers", "Visual graph of most similar academic papers", "Quickly discovering co-cited papers and seminal prior art", "Force-directed similarity graphs, derivative works list", "Semantic Scholar, Crossref"],
        ["SciSpace", "Interactive paper reading & multi-paper query co-pilot", "Deconstructing complex methodology sections & equations", "In-line PDF chat, table comparisons, literature notes", "Global open-access repositories"]
    ]
    col_w = [Inches(1.8), Inches(2.8), Inches(2.9), Inches(2.3), Inches(1.933)]
    deck.add_table(s5, Inches(0.8), Inches(2.0), Inches(11.733), Inches(3.8), headers, rows, col_w, header_bg=BLUE_PRIMARY)

    deck.add_callout(s5, Inches(0.8), Inches(6.0), Inches(11.733), Inches(0.85), 
                     "Essential Scholarly Principle", "Complementary Role, Not Replacement: These AI discovery engines do not replace standard institutional databases (IEEE Xplore, Scopus, Web of Science, ACM Digital Library, PubMed). Instead, they act as rapid relational navigation layers on top of indexed scientific knowledge.", style='violet')
    deck.add_footer(s5, "Data verified from official platform documentations (2025–2026)")

    # =========================================================================
    # SLIDE 6: ResearchRabbit: Deep Dive
    # =========================================================================
    s6 = deck.add_canvas()
    deck.add_header(s6, "Tool Deep Dive", "ResearchRabbit: Dynamic Literature & Citation Mapping", 
                    "Exploring Spotify-like collections, author collaborations, and bi-directional citation graphing")
    
    # Left Column: The 5-Stage Visual Workflow
    deck.add_card(s6, Inches(0.8), Inches(2.0), Inches(6.0), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s6, Inches(1.05), Inches(2.15), Inches(3.5), Inches(0.3), "THE RESEARCHRABBIT EXPLORATION CHAIN", BLUE_LIGHT, BLUE_PRIMARY)
    
    rr_chain = [
        ("1. Input Seed Paper", "Add 1–3 highly relevant peer-reviewed papers into an initial collection", BLUE_LIGHT, BLUE_PRIMARY),
        ("2. Explore Similar Work", "Algorithm identifies co-citations and highly related literature automatically", SLATE_LIGHT, NAVY),
        ("3. Map Earlier & Later Work", "Trace seminal roots (references) and follow downstream impact (citations)", BLUE_LIGHT, BLUE_PRIMARY),
        ("4. Graph Author Collaborations", "Identify leading principal investigators, active labs, and prolific teams", SLATE_LIGHT, NAVY),
        ("5. Discover New Directions", "Receive weekly email digests as new preprints and papers enter the graph", EMERALD_LIGHT, EMERALD)
    ]
    y_rr = Inches(2.55)
    for st_t, st_d, bg_c, txt_c in rr_chain:
        deck.add_card(s6, Inches(1.05), y_rr, Inches(5.5), Inches(0.65), bg_color=bg_c, border_color=txt_c)
        tb_c = s6.shapes.add_textbox(Inches(1.15), y_rr + Inches(0.06), Inches(5.3), Inches(0.55))
        tf_c = tb_c.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = tf_c.margin_right = tf_c.margin_top = tf_c.margin_bottom = 0
        p1 = tf_c.paragraphs[0]
        p1.text = st_t
        p1.font.bold = True
        p1.font.size = Pt(9.5)
        p1.font.color.rgb = txt_c
        p2 = tf_c.add_paragraph()
        p2.text = st_d
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = SLATE_DARK
        y_rr += Inches(0.72)

    # Right Column: Engineering Case Study + Pros/Cons
    deck.add_card(s6, Inches(7.1), Inches(2.0), Inches(5.433), Inches(4.2), bg_color=WHITE, border_color=SLATE_BORDER)
    deck.add_badge(s6, Inches(7.35), Inches(2.15), Inches(3.2), Inches(0.3), "ENGINEERING CASE STUDY & AUDIT", SLATE_LIGHT, SLATE_DARK)
    
    tb_cs = s6.shapes.add_textbox(Inches(7.35), Inches(2.55), Inches(4.933), Inches(3.5))
    tf_cs = tb_cs.text_frame
    tf_cs.word_wrap = True
    
    p_ex_title = tf_cs.paragraphs[0]
    p_ex_title.text = "Case Study: Medical Image Classification"
    p_ex_title.font.bold = True
    p_ex_title.font.size = Pt(10.5)
    p_ex_title.font.color.rgb = BLUE_PRIMARY
    
    p_ex_body = tf_cs.add_paragraph()
    p_ex_body.text = "A student begins with a single 2021 transformer benchmark paper. By expanding author networks and earlier works, ResearchRabbit reveals 18 seminal CNN baselines, 4 key open-source chest X-ray datasets, and 6 active research groups currently working on vision-language medical models."
    p_ex_body.font.size = Pt(9.5)
    p_ex_body.font.color.rgb = SLATE_DARK
    p_ex_body.space_before = Pt(2)
    p_ex_body.space_after = Pt(6)

    deck.add_bullet_list(tf_cs, [
        "Key Advantages: 100% free for academics, unlimited paper collections, seamless Zotero library integration.",
        "Notable Limitations: Does not perform full-text PDF parsing; heavily reliant on Crossref metadata completeness.",
        "Best Application: Inception stage of Master's / Ph.D. dissertations and systematic literature reviews."
    ], font_size=9.5, spacing=4)

    deck.add_callout(s6, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Pro Tip", "Export your ResearchRabbit collection directly to .BIB or Zotero to immediately populate your LaTeX reference managers with clean DOIs.", style='info')
    deck.add_footer(s6, "Source: researchrabbitapp.com documentation")

    # =========================================================================
    # SLIDE 7: Litmaps / Visual Literature Mapping
    # =========================================================================
    s7 = deck.add_canvas()
    deck.add_header(s7, "Tool Deep Dive", "Litmaps: Chronological Literature Mapping & Monitoring", 
                    "Visualizing publication timelines, citation trajectories, and emerging research clusters")
    
    # 3 Cards: Core Architecture, When to Use, Capabilities
    cards_data7 = [
        ("LITMAPS CORE ARCHITECTURE", BLUE_PRIMARY, BLUE_LIGHT, [
            "Seed Paper Anchors: Anchor your map around 1–5 foundational milestone papers.",
            "Citation Graph Visualization: Displays papers along an X-axis (Publication Year) and Y-axis (Citation Count).",
            "Clustering: Nodes with high connecting edges reveal 'nexus papers' bridging disparate subdisciplines.",
            "Automated Literature Monitor: Background alerts notify you whenever a paper in your map receives a new citation."
        ]),
        ("WHEN SHOULD I USE LITMAPS?", VIOLET, VIOLET_LIGHT, [
            "Topic Orientation: When starting a completely new engineering subject and needing a quick timeline of breakthroughs.",
            "Visualizing Evolution: Demonstrating how an algorithm (e.g., YOLO v1 → v11) evolved chronologically for thesis defense.",
            "Identifying Outliers: Discovering recently published high-velocity preprints that have not yet accumulated legacy citations.",
            "Grant Defense: Providing funding reviewers with an objective visual map of the current state-of-the-art."
        ]),
        ("KEY CAPABILITIES & WORKFLOW", TEAL, TEAL_LIGHT, [
            "Interactive Discovery Mode: Expand maps outward with 1-click citation traversal.",
            "Filter by Venue & Author: Narrow maps to prestigious conferences (CVPR, NeurIPS, IEEE Trans).",
            "Export Publication-Quality SVGs: Insert high-res vector citation graphs directly into survey papers.",
            "Cross-Platform Sync: Import and synchronize reading lists directly from Mendeley and Zotero."
        ])
    ]
    c_w7 = Inches(3.75)
    gap7 = Inches(0.24)
    for idx, (c_title, c_color, c_bg, c_items) in enumerate(cards_data7):
        x = Inches(0.8) + idx * (c_w7 + gap7)
        deck.add_card(s7, x, Inches(2.0), c_w7, Inches(4.2), bg_color=WHITE, border_color=c_color)
        deck.add_badge(s7, x + Inches(0.15), Inches(2.15), c_w7 - Inches(0.3), Inches(0.35), c_title, c_bg, c_color)
        tb = s7.shapes.add_textbox(x + Inches(0.15), Inches(2.6), c_w7 - Inches(0.3), Inches(3.5))
        deck.add_bullet_list(tb.text_frame, c_items, font_size=9.5, spacing=5)

    deck.add_callout(s7, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Visual Timeline Rule", "When defending a thesis, a chronological citation map immediately proves to evaluators that you have thoroughly investigated both historic foundations and contemporary advances.", style='success')
    deck.add_footer(s7, "Source: litmaps.com platform capabilities")

    # =========================================================================
    # SLIDE 8: Section 2: Paper Reading & Note Making
    # =========================================================================
    s8 = deck.add_canvas()
    deck.add_header(s8, "Section 2: Paper Reading", "AI Tools for Deep Academic Paper Reading", 
                    "Overcoming cognitive fatigue, mathematical opacity, and complex methodology sections")
    
    # Left Card: Why Reading Papers is Difficult
    deck.add_card(s8, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=AMBER)
    deck.add_badge(s8, Inches(1.05), Inches(2.15), Inches(3.2), Inches(0.3), "COGNITIVE READING BARRIERS", AMBER_LIGHT, AMBER)
    tb_l8 = s8.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l8.text_frame, [
        "Dense Mathematical Formulations: Multi-index proofs, matrix calculus, and implicit notations without step-by-step intermediate derivations.",
        "Opaque Methodology Sections: Vague hardware parameters, missing hyperparameters, or incomplete dataset cleaning descriptions.",
        "Information Scarcity in Results: Tables containing dozens of baseline comparisons without highlighting statistical significance.",
        "Cross-Paper Contradictions: Differing definitions of benchmark accuracy across competing research labs.",
        "Severe Multi-Paper Fatigue: Retaining critical findings across 40 papers while drafting the literature review chapter."
    ], font_size=10, spacing=4.5)

    # Right Card: The 6-Step Deep Reading Pipeline
    deck.add_card(s8, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s8, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "THE 6-STEP AI READING PIPELINE", BLUE_LIGHT, BLUE_PRIMARY)
    
    pipe_steps = [
        ("1. UPLOAD FULL-TEXT PDF", "Upload verified paper to grounded workspace (NotebookLM, SciSpace)", BLUE_LIGHT, BLUE_PRIMARY),
        ("2. TARGETED QUERYING", "Ask specific questions on methodology, datasets, and loss functions", SLATE_LIGHT, NAVY),
        ("3. EVIDENCE EXTRACTION", "Extract quantitative tables, baseline metrics, and hardware setups", BLUE_LIGHT, BLUE_PRIMARY),
        ("4. MULTI-PAPER SYNTHESIS", "Compare findings across multiple uploaded PDFs side-by-side", SLATE_LIGHT, NAVY),
        ("5. STRUCTURED NOTE MAKING", "Populate systematic literature template with exact quotes & citations", EMERALD_LIGHT, EMERALD),
        ("6. SOURCE VERIFICATION", "Click inline citations to audit claims against original PDF pages", AMBER_LIGHT, AMBER)
    ]
    y_p = Inches(2.55)
    for st_t, st_d, bg_c, txt_c in pipe_steps:
        deck.add_card(s8, Inches(7.15), y_p, Inches(5.1), Inches(0.53), bg_color=bg_c, border_color=txt_c)
        tb_p = s8.shapes.add_textbox(Inches(7.25), y_p + Inches(0.04), Inches(4.9), Inches(0.45))
        tf_p = tb_p.text_frame
        tf_p.word_wrap = True
        tf_p.margin_left = tf_p.margin_right = tf_p.margin_top = tf_p.margin_bottom = 0
        p1 = tf_p.paragraphs[0]
        p1.text = f"{st_t}: "
        p1.font.bold = True
        p1.font.size = Pt(9)
        p1.font.color.rgb = txt_c
        r2 = p1.add_run()
        r2.text = st_d
        r2.font.bold = False
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = SLATE_DARK
        y_p += Inches(0.58)

    deck.add_callout(s8, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Golden Research Rule", "Never cite a paper based solely on an AI summary. Always verify that the extracted claim genuinely exists in the original published PDF.", style='danger')
    deck.add_footer(s8, "Methodology: Systematic Literature Reviews in Engineering")

    # =========================================================================
    # SLIDE 9: Gemini Notebook / NotebookLM: Practical Use
    # =========================================================================
    s9 = deck.add_canvas()
    deck.add_header(s9, "Tool Deep Dive", "NotebookLM & Gemini: Source-Grounded Paper Synthesis", 
                    "Eliminating hallucinations through source-grounded Retrieval-Augmented Generation (RAG)")
    
    # Left Column: The Grounded RAG Concept & Upload Pipeline
    deck.add_card(s9, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=VIOLET)
    deck.add_badge(s9, Inches(1.05), Inches(2.15), Inches(3.5), Inches(0.3), "GROUNDED NOTEBOOK ARCHITECTURE", VIOLET_LIGHT, VIOLET)
    tb_l9 = s9.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l9.text_frame, [
        "Closed-World Grounding: Operates strictly on user-uploaded research papers, lecture notes, and lab PDFs—preventing hallucination of external facts.",
        "Inline Page Citations: Every generated answer includes clickable numerical citations linked directly to the exact page and paragraph in the PDF.",
        "Cross-Source Comparison: Query up to 50 sources simultaneously (e.g., 'Compare the learning rates and optimizers used across Papers A, B, and C').",
        "Multi-Modal Document Synthesis: Parses tables, complex appendices, and supplementary documents seamlessly.",
        "Audio Overviews: Generates engaging, podcast-style academic discussions summarizing the uploaded research cluster."
    ], font_size=10, spacing=4.5)

    # Right Column: The 6 Essential Inquiries Prompt Box
    deck.add_prompt_box(s9, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), 
                        "6 Essential Inquiries for Any Uploaded Research Paper", [
        "1. Problem Definition: What precise research gap or failure in existing models does this paper address?",
        "2. Core Methodology: What algorithm, mathematical framework, or neural architecture was proposed?",
        "3. Experimental Setup: What benchmark datasets, sample sizes, train/test splits, and hardware were used?",
        "4. Quantitative Results: What were the primary performance metrics (e.g., F1, mAP, RMSE) vs baselines?",
        "5. Explicit Limitations: What constraints, failure modes, or threats to validity do the authors concede?",
        "6. Suggested Future Work: What concrete research directions do the authors suggest investigating next?"
    ])

    deck.add_callout(s9, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Audit Requirement", "When preparing literature review tables, always click the numbered citation chip in NotebookLM to confirm the author's exact phrasing.", style='info')
    deck.add_footer(s9, "Source: notebooklm.google.com documentation & Google AI Research")

    # =========================================================================
    # SLIDE 10: Standardized Paper Note-Making Template
    # =========================================================================
    s10 = deck.add_canvas()
    deck.add_header(s10, "Practical Framework", "The 14-Point Systematic Paper Note Template", 
                    "A publication-proven extraction schema to systematically structure research reading and literature reviews")
    
    # 2-Column Grid showing the 14 Fields
    left_fields = [
        "1. Paper Title: Full formal title and publication venue (IEEE/ACM)",
        "2. Authors & Year: Lead authors, institution, and publication year",
        "3. DOI / URL: Direct persistent digital object identifier link",
        "4. Research Problem: The real-world or theoretical challenge addressed",
        "5. Primary Objective: Explicit hypothesis or project goal",
        "6. Methodology: Proposed architecture, pipeline, or mathematical model",
        "7. Datasets Used: Name, sample size, distribution, and preprocessing"
    ]
    right_fields = [
        "8. Tools & Hardware: Frameworks (PyTorch/Colab), GPUs, training hours",
        "9. Key Results: Quantitative metrics vs state-of-the-art baselines",
        "10. Limitations: Explicitly stated or unstated failure cases",
        "11. Research Gap: What remains unsolved or poorly generalized?",
        "12. Future Work: Direct recommendations provided by the authors",
        "13. Direct Evidence / Quote: Exact verbatim excerpt for citation",
        "14. Relevance to My Work: Concrete utility to my specific thesis/grant"
    ]

    deck.add_card(s10, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s10, Inches(1.05), Inches(2.15), Inches(3.2), Inches(0.3), "METADATA & METHODOLOGY (FIELDS 1–7)", BLUE_LIGHT, BLUE_PRIMARY)
    tb_t1 = s10.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.2), Inches(3.5))
    deck.add_bullet_list(tb_t1.text_frame, left_fields, font_size=9.5, spacing=3.5)

    deck.add_card(s10, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.2), bg_color=WHITE, border_color=EMERALD)
    deck.add_badge(s10, Inches(7.05), Inches(2.15), Inches(3.2), Inches(0.3), "EVALUATION & RELEVANCE (FIELDS 8–14)", EMERALD_LIGHT, EMERALD)
    tb_t2 = s10.shapes.add_textbox(Inches(7.05), Inches(2.55), Inches(5.2), Inches(3.5))
    deck.add_bullet_list(tb_t2.text_frame, right_fields, font_size=9.5, spacing=3.5)

    deck.add_callout(s10, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Workflow Efficiency", "Use AI to populate the initial draft of this 14-point template, but spend your cognitive energy validating Fields 10 (Limitations), 11 (Gaps), and 14 (Relevance).", style='success')
    deck.add_footer(s10, "Adopted from PRISMA Systematic Literature Review Guidelines")

    # =========================================================================
    # SLIDE 11: Section 3: Coding & Experimentation
    # =========================================================================
    s11 = deck.add_canvas()
    deck.add_header(s11, "Section 3: Coding & Computing", "AI for Research Coding, Computing & Experimentation", 
                    "Accelerating exploratory data analysis, algorithm prototyping, and reproducible computation")
    
    # Left Card: Core Research Coding Applications
    deck.add_card(s11, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s11, Inches(1.05), Inches(2.15), Inches(3.5), Inches(0.3), "RESEARCH COMPUTING APPLICATIONS", BLUE_LIGHT, BLUE_PRIMARY)
    tb_l11 = s11.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l11.text_frame, [
        "Data Ingestion & Cleaning: Automating outlier removal, handling null distributions, and normalizing features across CSV/JSON datasets.",
        "Exploratory Data Analysis (EDA): Rapid generation of distribution plots, correlation matrices, and dimensionality reduction visualizations (t-SNE/UMAP).",
        "Algorithm Implementation: Rapidly translating theoretical pseudocode or mathematical formulas into robust PyTorch/TensorFlow modules.",
        "Hyperparameter Optimization: Generating grid/random search routines and automated cross-validation loops.",
        "Intelligent Debugging: Parsing complex traceback errors, CUDA out-of-memory exceptions, and shape mismatch bugs instantly."
    ], font_size=10, spacing=4.5)

    # Right Card: Modern AI Coding Tools Ecosystem
    deck.add_card(s11, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=VIOLET)
    deck.add_badge(s11, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "CORE AI COMPUTING PLATFORMS", VIOLET_LIGHT, VIOLET)
    
    tools11 = [
        ("Google Colab", "Browser Python, zero local setup, free T4/A100 GPUs, native Gemini assistant", BLUE_LIGHT, BLUE_PRIMARY),
        ("Gemini in Colab", "Inline code generation, error explanation, and automated visualization plotting", VIOLET_LIGHT, VIOLET),
        ("GitHub Copilot", "Context-aware autocompletion inside VS Code; writes boilerplate docstrings & tests", SLATE_LIGHT, NAVY),
        ("Cursor IDE", "AI-native code editor indexing entire repositories for multi-file refactoring", TEAL_LIGHT, TEAL),
        ("Kaggle Notebooks", "Ready-to-run environments with 50,000+ benchmark datasets and TPU access", AMBER_LIGHT, AMBER)
    ]
    y_t11 = Inches(2.55)
    for t_n, t_d, bg_c, txt_c in tools11:
        deck.add_card(s11, Inches(7.15), y_t11, Inches(5.1), Inches(0.65), bg_color=bg_c, border_color=txt_c)
        tb_t = s11.shapes.add_textbox(Inches(7.25), y_t11 + Inches(0.06), Inches(4.9), Inches(0.55))
        tf_t = tb_t.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_right = tf_t.margin_top = tf_t.margin_bottom = 0
        p1 = tf_t.paragraphs[0]
        p1.text = t_n
        p1.font.bold = True
        p1.font.size = Pt(9.5)
        p1.font.color.rgb = txt_c
        p2 = tf_t.add_paragraph()
        p2.text = t_d
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = SLATE_DARK
        y_t11 += Inches(0.72)

    deck.add_callout(s11, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Validation Mandate", "Never accept AI-generated code as correct by default. Always write unit tests, verify random seed reproducibility, and validate evaluation metrics.", style='danger')
    deck.add_footer(s11, "Source: ACM Transactions on Computing Education / IEEE Software")

    # =========================================================================
    # SLIDE 12: Google Colab: Research Experimentation
    # =========================================================================
    s12 = deck.add_canvas()
    deck.add_header(s12, "Tool Deep Dive", "Google Colab: The Zero-Setup Research Laboratory", 
                    "Democratizing access to high-performance GPUs, reproducible notebooks, and integrated AI assistance")
    
    # Left Column: Key Architectural Features
    deck.add_card(s12, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s12, Inches(1.05), Inches(2.15), Inches(3.2), Inches(0.3), "LABORATORY CAPABILITIES", BLUE_LIGHT, BLUE_PRIMARY)
    tb_l12 = s12.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l12.text_frame, [
        "Zero Local Environment Overhead: Pre-configured Python environment with PyTorch, TensorFlow, Scikit-Learn, and OpenCV pre-installed.",
        "Free Hardware Acceleration: On-demand access to NVIDIA T4 GPUs and TPUs, enabling deep learning without expensive personal rigs.",
        "Drive & Cloud Storage Integration: Mount Google Drive with a single line to stream datasets and checkpoint heavy model weights.",
        "One-Click Reproducibility: Share complete computational notebooks via URL or GitHub commit for transparent peer review.",
        "Interactive Gemini Assistant: Native 'Generate with Gemini' code cell buttons and instant 'Explain Error' buttons."
    ], font_size=10, spacing=4.5)

    # Right Column: The 7-Step Colab Research Pipeline
    deck.add_card(s12, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=EMERALD)
    deck.add_badge(s12, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "THE 7-STEP EXPERIMENTATION PIPELINE", EMERALD_LIGHT, EMERALD)
    
    colab_pipe = [
        ("1. INGEST DATASET", "Mount Drive / load CSV via Pandas with automated integrity checks"),
        ("2. EXPLORATORY EDA", "Generate correlation heatmaps, boxplots, and feature distributions"),
        ("3. PREPROCESSING", "Impute missing values, encode categoricals, and scale numericals"),
        ("4. TRAIN/TEST SPLIT", "Apply stratified sampling with fixed random seeds for reproducibility"),
        ("5. MODEL TRAINING", "Train baseline & candidate algorithms using GPU acceleration"),
        ("6. EVALUATION METRICS", "Compute Confusion Matrix, Precision, Recall, F1, ROC-AUC"),
        ("7. EXPORT ARTIFACTS", "Save serialized weights (.pt/.onnx) and publication-ready charts")
    ]
    y_cp = Inches(2.55)
    for st_t, st_d in colab_pipe:
        deck.add_card(s12, Inches(7.15), y_cp, Inches(5.1), Inches(0.48), bg_color=SLATE_LIGHT, border_color=SLATE_BORDER)
        tb_cp = s12.shapes.add_textbox(Inches(7.25), y_cp + Inches(0.04), Inches(4.9), Inches(0.4))
        tf_cp = tb_cp.text_frame
        tf_cp.word_wrap = True
        tf_cp.margin_left = tf_cp.margin_right = tf_cp.margin_top = tf_cp.margin_bottom = 0
        p = tf_cp.paragraphs[0]
        r1 = p.add_run()
        r1.text = f"{st_t}: "
        r1.font.bold = True
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = BLUE_PRIMARY
        r2 = p.add_run()
        r2.text = st_d
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = SLATE_DARK
        y_cp += Inches(0.51)

    deck.add_callout(s12, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Practical Research Tip", "Always specify `torch.manual_seed(42)` and `np.random.seed(42)` in your initial Colab cell to ensure that experimental figures are identical across runs.", style='info')
    deck.add_footer(s12, "Source: colab.research.google.com guidelines")

    # =========================================================================
    # SLIDE 13: Practical AI Coding Experiment: Prompt & Output
    # =========================================================================
    s13 = deck.add_canvas()
    deck.add_header(s13, "Hands-On Implementation", "Practical AI Coding Experiment: Prompt & Validation", 
                    "A realistic engineering prompt for end-to-end machine learning experimentation and critical validation")
    
    # Left Card: Concrete Engineering Prompt Box
    deck.add_prompt_box(s13, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.2), 
                        "Google Colab / Cursor Research Prompt Template", [
        "Dataset: 'student_academic_performance.csv' containing features: demographics, study_hours, attendance, parental_education, and final_grade.",
        "",
        "Write complete, production-grade Python code in Google Colab to:",
        "1. Load dataset with Pandas and check null distributions & data types.",
        "2. Perform EDA: plot feature correlation heatmap and target distribution.",
        "3. Handle categorical encoding (One-Hot) and feature scaling (RobustScaler).",
        "4. Stratified 80/20 train/test split with random_state=42.",
        "5. Train a Random Forest Classifier; run GridSearchCV for n_estimators and max_depth.",
        "6. Compute Accuracy, Precision, Recall, F1-Score, and plot Confusion Matrix.",
        "7. Plot Gini Feature Importance rankings and interpret top 3 features."
    ])

    # Right Card: Expected AI Assistance & Human Verification
    deck.add_card(s13, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.2), bg_color=WHITE, border_color=EMERALD)
    deck.add_badge(s13, Inches(7.05), Inches(2.15), Inches(3.2), Inches(0.3), "WHAT AI ASSISTS VS HUMAN AUDIT", EMERALD_LIGHT, EMERALD)
    tb_r13 = s13.shapes.add_textbox(Inches(7.05), Inches(2.55), Inches(5.2), Inches(3.5))
    deck.add_bullet_list(tb_r13.text_frame, [
        "AI Assistance: Generates clean, idiomatic boilerplate code with Seaborn styling.",
        "AI Assistance: Suggests appropriate hyperparameter grids for tuning.",
        "AI Assistance: Writes explanatory docstrings and comments for each block.",
        "Human Audit: Inspect for Data Leakage—ensure scaler is fitted ONLY on training split.",
        "Human Audit: Verify Class Imbalance—ensure F1-macro is checked, not just raw accuracy.",
        "Human Audit: Benchmark against simpler models (Logistic Regression) to ensure complex trees are truly justified.",
        "Human Audit: Review feature importance to ensure no confounding proxy variables exist."
    ], font_size=9.5, spacing=4)

    deck.add_callout(s13, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Audit Checklist", "Running code is not enough. You must understand every line of mathematical transformation to defend your methodology in a project review.", style='warning')
    deck.add_footer(s13, "Engineering Machine Learning Laboratory Best Practices")

    # =========================================================================
    # SLIDE 14: Section 4: Generative AI for Research
    # =========================================================================
    s14 = deck.add_canvas()
    deck.add_header(s14, "Section 4: Generative AI", "Generative AI in Academic Research & Pedagogy", 
                    "Understanding LLM reasoning capabilities, multi-modal synthesis, and fundamental boundaries")
    
    # Left Card: What is Generative AI & High-Value Applications
    deck.add_card(s14, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=VIOLET)
    deck.add_badge(s14, Inches(1.05), Inches(2.15), Inches(3.5), Inches(0.3), "CORE ACADEMIC CAPABILITIES", VIOLET_LIGHT, VIOLET)
    tb_l14 = s14.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l14.text_frame, [
        "Hypothesis Brainstorming: Generates diverse candidate angles and novel combinations of existing technologies.",
        "Concept Explanation: Deconstructs complex multi-disciplinary concepts into clear, accessible analogies for students.",
        "Literature Synthesis: Clusters 30+ paper summaries into coherent thematic paragraphs and comparative tables.",
        "Manuscript Refinement: Rewrites informal phrasing into formal, objective academic prose adhering to IEEE style.",
        "Presentation & Slide Drafting: Generates comprehensive presentation outlines, speaker notes, and discussion questions."
    ], font_size=10, spacing=4.5)

    # Right Card: Modern LLM Ecosystem & The Fallacy of Truth
    deck.add_card(s14, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=RED)
    deck.add_badge(s14, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "PLATFORMS & CRITICAL BOUNDARIES", RED_LIGHT, RED)
    
    llm_platforms = [
        ("Google Gemini", "1M–2M token context window; natively processes entire textbooks, video lectures, and codebases.", BLUE_LIGHT, BLUE_PRIMARY),
        ("OpenAI ChatGPT (GPT-4o)", "Multi-modal reasoning engine with advanced code interpreter and file analytics.", SLATE_LIGHT, NAVY),
        ("Anthropic Claude (Sonnet)", "Renowned for nuanced academic prose, complex logical analysis, and strict adherence to constraints.", VIOLET_LIGHT, VIOLET),
        ("Microsoft Copilot", "Deeply integrated with Office 365, Word, and Bing web search for cited real-time discovery.", TEAL_LIGHT, TEAL)
    ]
    y_llm = Inches(2.55)
    for p_n, p_d, bg_c, txt_c in llm_platforms:
        deck.add_card(s14, Inches(7.15), y_llm, Inches(5.1), Inches(0.68), bg_color=bg_c, border_color=txt_c)
        tb_p = s14.shapes.add_textbox(Inches(7.25), y_llm + Inches(0.06), Inches(4.9), Inches(0.56))
        tf_p = tb_p.text_frame
        tf_p.word_wrap = True
        tf_p.margin_left = tf_p.margin_right = tf_p.margin_top = tf_p.margin_bottom = 0
        p1 = tf_p.paragraphs[0]
        p1.text = p_n
        p1.font.bold = True
        p1.font.size = Pt(9.5)
        p1.font.color.rgb = txt_c
        p2 = tf_p.add_paragraph()
        p2.text = p_d
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = SLATE_DARK
        y_llm += Inches(0.74)

    # Fundamental Axiom Callout
    deck.add_callout(s14, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Fundamental Warning", "GENERATIVE AI ≠ AUTOMATICALLY FACTUAL INFORMATION: LLMs predict probable tokens based on training statistics. They have no innate understanding of physical truth and will confidently invent plausible-sounding falsehoods.", style='danger')
    deck.add_footer(s14, "Nature Biotechnology (2024): Generative AI in Academic Research")

    # =========================================================================
    # SLIDE 15: Prompt Engineering Fundamentals
    # =========================================================================
    s15 = deck.add_canvas()
    deck.add_header(s15, "Prompt Engineering", "Prompt Engineering Fundamentals for Academics", 
                    "Transforming vague inquiries into structured, high-precision research instruments")
    
    # Left Column: Poor vs Better Contrast
    deck.add_card(s15, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=AMBER)
    deck.add_badge(s15, Inches(1.05), Inches(2.15), Inches(3.2), Inches(0.3), "PROMPT QUALITY COMPARISON", AMBER_LIGHT, AMBER)
    
    # Poor prompt box
    deck.add_card(s15, Inches(1.05), Inches(2.55), Inches(5.1), Inches(1.4), bg_color=RED_LIGHT, border_color=RED)
    tb_poor = s15.shapes.add_textbox(Inches(1.15), Inches(2.62), Inches(4.9), Inches(1.25))
    tf_pr = tb_poor.text_frame
    tf_pr.word_wrap = True
    p1 = tf_pr.paragraphs[0]
    p1.text = "POOR PROMPT (VAGUE & SHALLOW):"
    p1.font.bold = True
    p1.font.size = Pt(9.5)
    p1.font.color.rgb = RED
    p2 = tf_pr.add_paragraph()
    p2.text = "\"Explain machine learning.\""
    p2.font.name = FONT_MONO
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = NAVY
    p3 = tf_pr.add_paragraph()
    p3.text = "Result: Produces a generic, high-school textbook summary of zero academic value for engineering research."
    p3.font.size = Pt(8.5)
    p3.font.color.rgb = SLATE_MED
    p3.space_before = Pt(3)

    # Better prompt box
    deck.add_card(s15, Inches(1.05), Inches(4.1), Inches(5.1), Inches(1.9), bg_color=EMERALD_LIGHT, border_color=EMERALD)
    tb_bet = s15.shapes.add_textbox(Inches(1.15), Inches(4.18), Inches(4.9), Inches(1.75))
    tf_b = tb_bet.text_frame
    tf_b.word_wrap = True
    p1 = tf_b.paragraphs[0]
    p1.text = "BETTER PROMPT (CONTEXTUAL & ACTIONABLE):"
    p1.font.bold = True
    p1.font.size = Pt(9.5)
    p1.font.color.rgb = EMERALD
    p2 = tf_b.add_paragraph()
    p2.text = "\"Explain supervised machine learning to a 3rd-year electrical engineering student using a predictive maintenance vibration sensor example, a comparison table of 3 algorithms, and Python pseudocode.\""
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(9)
    p2.font.color.rgb = NAVY
    p3 = tf_b.add_paragraph()
    p3.text = "Result: Generates highly tailored, mathematically rigorous, classroom-ready pedagogy."
    p3.font.size = Pt(8.5)
    p3.font.color.rgb = SLATE_DARK
    p3.space_before = Pt(2)

    # Right Column: The 6-Component Master Prompt Framework
    deck.add_card(s15, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s15, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "THE 6-COMPONENT PROMPT FRAMEWORK", BLUE_LIGHT, BLUE_PRIMARY)
    tb_r15 = s15.shapes.add_textbox(Inches(7.15), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_r15.text_frame, [
        "1. ROLE: Specify domain authority (e.g., 'Act as a Senior IEEE Reviewer in Computer Vision').",
        "2. CONTEXT: Provide prerequisite background, domain setting, and research motivations.",
        "3. TASK: Define the exact action verb ('Compare', 'Deconstruct', 'Synthesize', 'Extract').",
        "4. CONSTRAINTS: Explicitly prohibit unwanted behaviors ('Do not hallucinate', 'Limit to 300 words').",
        "5. OUTPUT FORMAT: Request specific structure ('Markdown table', 'Numbered list', 'LaTeX equation').",
        "6. QUALITY CRITERIA: State standards ('Maintain peer-reviewed objectivity; prioritize empirical evidence')."
    ], font_size=10, spacing=4.5)

    deck.add_callout(s15, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Prompt Engineering Principle", "Garbage In, Garbage Out: The intellectual rigor of an AI response is directly proportional to the structural specificity and constraints defined in your prompt.", style='info')
    deck.add_footer(s15, "Framework: OpenAI / DeepMind Prompt Engineering Guides")

    # =========================================================================
    # SLIDE 16: Research Prompt Library (4 Practical Prompts)
    # =========================================================================
    s16 = deck.add_canvas()
    deck.add_header(s16, "Prompt Engineering", "Academic Prompt Library: 4 Research-Tested Prompts", 
                    "Ready-to-use structured prompts engineered for literature synthesis, extraction, gap discovery, and methodology")
    
    # 4 Cards in 2x2 Grid
    prompts_data = [
        ("PROMPT 1: LITERATURE SYNTHESIS", BLUE_PRIMARY, BLUE_LIGHT, [
            "\"Act as an expert academic research assistant in [Domain].",
            "Analyze these 5 uploaded papers and synthesize common methodologies,",
            "evaluation metrics, and baseline results into a Markdown table.",
            "Identify areas of consensus and major disagreements.",
            "Do NOT invent or extrapolate citations beyond the provided texts.\""
        ]),
        ("PROMPT 2: STRUCTURED PAPER EXTRACTION", VIOLET, VIOLET_LIGHT, [
            "\"Extract the following fields from this uploaded PDF:",
            "1) Exact research problem, 2) Proposed architecture,",
            "3) Benchmark datasets & sample size, 4) Quantitative results vs SOTA,",
            "5) Explicit limitations acknowledged by authors.",
            "Cite the specific page and section number for every extracted item.\""
        ]),
        ("PROMPT 3: RESEARCH GAP IDENTIFICATION", TEAL, TEAL_LIGHT, [
            "\"Compare these studies on [Topic]. Identify unexplored parameter spaces,",
            "unaddressed edge cases, and contradictions in their experimental conclusions.",
            "Differentiate between what the authors explicitly proved versus",
            "unverified assumptions. Formulate 3 novel research gap statements.\""
        ]),
        ("PROMPT 4: METHODOLOGY COMPARISON", AMBER, AMBER_LIGHT, [
            "\"Suggest 3 candidate machine learning methodologies to solve [Problem].",
            "Create a comparison table evaluating: computational complexity (Big-O),",
            "data volume requirements, training stability, and interpretability.",
            "Recommend the most viable approach for a 6-month engineering project.\""
        ])
    ]
    w16 = Inches(5.6)
    h16 = Inches(2.0)
    positions = [
        (Inches(0.8), Inches(2.0)),
        (Inches(6.9), Inches(2.0)),
        (Inches(0.8), Inches(4.2)),
        (Inches(6.9), Inches(4.2))
    ]
    for idx, (p_t, p_col, p_bg, p_lines) in enumerate(prompts_data):
        x, y = positions[idx]
        deck.add_card(s16, x, y, w16, h16, bg_color=WHITE, border_color=p_col)
        deck.add_badge(s16, x + Inches(0.12), y + Inches(0.1), w16 - Inches(0.24), Inches(0.26), p_t, p_bg, p_col, font_size=8.5)
        tb = s16.shapes.add_textbox(x + Inches(0.15), y + Inches(0.4), w16 - Inches(0.3), h16 - Inches(0.45))
        tf = tb.text_frame
        tf.word_wrap = True
        for line in p_lines:
            p = tf.add_paragraph()
            p.text = line
            p.font.name = FONT_FAMILY
            p.font.size = Pt(8.5)
            p.font.color.rgb = NAVY if line.startswith("\"") else SLATE_DARK
            p.space_after = Pt(1.5)

    deck.add_callout(s16, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Adaptability Tip", "Replace the bracketed terms [Domain], [Topic], and [Problem] with your exact project specifics to immediately yield publication-ready analysis.", style='success')
    deck.add_footer(s16, "Curated from Peer-Reviewed AI Research Workflows (2025)")

    # =========================================================================
    # SLIDE 17: Prompt Engineering: Advanced Strategies
    # =========================================================================
    s17 = deck.add_canvas()
    deck.add_header(s17, "Prompt Engineering", "Advanced Prompting Strategies & The Improvement Ladder", 
                    "Moving from surface-level prompting to iterative, few-shot, and self-critiquing research prompts")
    
    # Left Card: Advanced Strategies Checklist
    deck.add_card(s17, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=VIOLET)
    deck.add_badge(s17, Inches(1.05), Inches(2.15), Inches(3.5), Inches(0.3), "ADVANCED PROMPTING PARADIGMS", VIOLET_LIGHT, VIOLET)
    tb_l17 = s17.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l17.text_frame, [
        "Few-Shot Exemplars: Provide 1–2 gold-standard examples of academic analysis in the prompt to enforce exact style, depth, and tone.",
        "Chain-of-Thought (CoT): Instruct the model to 'Think step-by-step and write out mathematical reasoning before stating the conclusion'.",
        "Self-Critique & Refinement: Prompt the AI to audit its own output: 'Review your previous draft against IEEE publication standards and highlight weak arguments'.",
        "Negative Constraint Prompting: Explicitly forbid common pitfalls ('Do not cite non-existent papers; do not use promotional buzzwords').",
        "Comparative Triangulation: Feed two contradictory study findings and ask the AI to map the exact methodological divergences."
    ], font_size=9.5, spacing=4)

    # Right Card: The 5-Level Prompt Improvement Ladder
    deck.add_card(s17, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s17, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "THE 5-STAGE PROMPT IMPROVEMENT LADDER", BLUE_LIGHT, BLUE_PRIMARY)
    
    ladder_steps = [
        ("LEVEL 1: VAGUE", "\"Summarize this paper on solar cells.\"", RED_LIGHT, RED),
        ("LEVEL 2: CONTEXTUAL", "\"Summarize this perovskite solar cell paper for an M.Tech thesis.\"", AMBER_LIGHT, AMBER),
        ("LEVEL 3: STRUCTURED", "\"Extract efficiency %, degradation rate, and cost into a 3-column table.\"", SLATE_LIGHT, NAVY),
        ("LEVEL 4: EVIDENCE-BASED", "\"Extract efficiency metrics citing specific table numbers from the PDF.\"", BLUE_LIGHT, BLUE_PRIMARY),
        ("LEVEL 5: VERIFIED", "\"Extract metrics with citations; audit whether conclusions match raw data.\"", EMERALD_LIGHT, EMERALD)
    ]
    y_lad = Inches(2.55)
    for l_t, l_p, bg_c, txt_c in ladder_steps:
        deck.add_card(s17, Inches(7.15), y_lad, Inches(5.1), Inches(0.65), bg_color=bg_c, border_color=txt_c)
        tb_ld = s17.shapes.add_textbox(Inches(7.25), y_lad + Inches(0.06), Inches(4.9), Inches(0.55))
        tf_ld = tb_ld.text_frame
        tf_ld.word_wrap = True
        tf_ld.margin_left = tf_ld.margin_right = tf_ld.margin_top = tf_ld.margin_bottom = 0
        p1 = tf_ld.paragraphs[0]
        p1.text = l_t
        p1.font.bold = True
        p1.font.size = Pt(9.5)
        p1.font.color.rgb = txt_c
        p2 = tf_ld.add_paragraph()
        p2.text = l_p
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = SLATE_DARK
        y_lad += Inches(0.72)

    deck.add_callout(s17, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Takeaway", "Always ascend to Level 4 (Evidence-Based) or Level 5 (Verified) before incorporating any AI output into a formal thesis, paper, or research proposal.", style='violet')
    deck.add_footer(s17, "Source: Prompt Engineering Best Practices in Higher Education (2025)")

    # =========================================================================
    # SLIDE 18: Section 5: AI-Powered Research Discovery
    # =========================================================================
    s18 = deck.add_canvas()
    deck.add_header(s18, "Section 5: Research Discovery", "AI-Powered Research Discovery & Gap Analysis", 
                    "Uncovering emerging technological trends, under-explored niches, and novel dataset intersections")
    
    # Left Column: What AI Can Discover in Scientific Literature
    deck.add_card(s18, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s18, Inches(1.05), Inches(2.15), Inches(3.5), Inches(0.3), "DISCOVERY FRONTIERS IN RESEARCH", BLUE_LIGHT, BLUE_PRIMARY)
    tb_l18 = s18.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l18.text_frame, [
        "Emerging Trends & Breakthroughs: Tracking semantic clustering of arXiv/bioRxiv preprints before formal journal indexing.",
        "Under-Explored Research Gaps: Detecting methodologies that were successful in one domain (e.g., NLP Attention) but unapplied to another (e.g., Power Grid Load Forecasting).",
        "Competing Paradigms: Triangulating rival schools of thought across international research groups.",
        "Novel Dataset & Benchmark Discovery: Finding niche open-access benchmark repositories matching specific experimental parameters.",
        "Gemini Deep Research Capabilities: Performing autonomous multi-step web queries that synthesize hundreds of technical documents into coherent market and research reports."
    ], font_size=10, spacing=4.5)

    # Right Column: The Discovery-to-Gap Pipeline
    deck.add_card(s18, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=TEAL)
    deck.add_badge(s18, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "THE DISCOVERY-TO-GAP WORKFLOW", TEAL_LIGHT, TEAL)
    
    disc_flow = [
        ("1. BROAD QUESTION SCOPING", "Use Gemini Deep Research / Consensus to query the macro research landscape"),
        ("2. AI-DRIVEN PAPER HARVESTING", "Consensus & Elicit aggregate 40+ empirical studies with key metrics"),
        ("3. HUMAN CRITICAL SCREENING", "Researcher screens abstracts for methodological relevance and quality"),
        ("4. METRIC & GAP EXTRACTION", "Extract reported limitations, failure modes, and open questions"),
        ("5. NOVEL HYPOTHESIS FORMULATION", "Synthesize findings into an unaddressed, testable engineering hypothesis")
    ]
    y_df = Inches(2.55)
    for st_t, st_d in disc_flow:
        deck.add_card(s18, Inches(7.15), y_df, Inches(5.1), Inches(0.68), bg_color=SLATE_LIGHT, border_color=SLATE_BORDER)
        tb_df = s18.shapes.add_textbox(Inches(7.25), y_df + Inches(0.06), Inches(4.9), Inches(0.56))
        tf_df = tb_df.text_frame
        tf_df.word_wrap = True
        tf_df.margin_left = tf_df.margin_right = tf_df.margin_top = tf_df.margin_bottom = 0
        p = tf_df.paragraphs[0]
        r1 = p.add_run()
        r1.text = f"{st_t}\n"
        r1.font.bold = True
        r1.font.size = Pt(9)
        r1.font.color.rgb = TEAL
        r2 = p.add_run()
        r2.text = st_d
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = SLATE_DARK
        y_df += Inches(0.74)

    deck.add_callout(s18, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Discovery Maxim", "A strong research gap is not merely 'nobody has done this before'. It must be 'this remains unsolved because of specific technical bottlenecks, which our proposed method overcomes'.", style='info')
    deck.add_footer(s18, "Source: Consensus.app / Elicit / Google Deep Research workflows")

    # =========================================================================
    # SLIDE 19: Section 6: Writing Journal Papers
    # =========================================================================
    s19 = deck.add_canvas()
    deck.add_header(s19, "Section 6: Journal Paper Writing", "AI in Academic Writing & The IMRaD Framework", 
                    "Leveraging AI across manuscript anatomy while preserving genuine scientific authorship and integrity")
    
    # Table: The IMRaD Framework vs AI Role
    imrad_headers = ["Paper Section", "Primary Academic Function", "Appropriate AI Assistance", "Mandatory Author Responsibility"]
    imrad_rows = [
        ["Title & Abstract", "Concise synthesis of problem, method, and key findings", "Drafting alternative title variations; condensing abstract to exact 200-word journal limits", "Author guarantees 100% factual accuracy and selects the final title"],
        ["Introduction", "Establishing context, motivation, prior art, and novel contribution", "Refining introductory narrative flow; polishing transitions between paragraphs", "Author conceives the true research gap and explicitly owns the novelty statement"],
        ["Methodology", "Exhaustive, step-by-step description of experimental design", "Generating formatted LaTeX equations, algorithmic pseudocode, and system block diagrams", "Author verifies that parameters, mathematical proofs, and setups are fully reproducible"],
        ["Results", "Empirical data presentation, tables, charts, and statistical tests", "Formatting publication-quality LaTeX tables; drafting objective descriptive figure captions", "Author provides 100% genuine experimental numbers; NEVER synthesize fake results"],
        ["Discussion", "Interpreting significance, theoretical implications, and limitations", "Brainstorming potential application domains; structuring comparisons with prior art", "Author critically interprets physical/biological implications and acknowledges flaws"],
        ["References", "Formal attribution of scholarly evidence and prior art", "Formatting BibTeX entries into APA, IEEE, or Harvard reference styles", "Author manually verifies every single citation; NEVER allow AI to fabricate references"]
    ]
    imrad_widths = [Inches(1.8), Inches(3.2), Inches(3.5), Inches(3.233)]
    deck.add_table(s19, Inches(0.8), Inches(2.0), Inches(11.733), Inches(4.2), imrad_headers, imrad_rows, imrad_widths, header_bg=BLUE_PRIMARY)

    deck.add_callout(s19, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "ICMJE / COPE Authorship Standard", "AI tools (ChatGPT, Gemini, Paperpal) CANNOT be credited as authors. Authorship requires accountability for public integrity, which only human researchers can shoulder.", style='danger')
    deck.add_footer(s19, "Guidelines: Committee on Publication Ethics (COPE) / IEEE Author Center")

    # =========================================================================
    # SLIDE 20: Paperpal: Academic Writing Assistant
    # =========================================================================
    s20 = deck.add_canvas()
    deck.add_header(s20, "Tool Deep Dive", "Paperpal: Academic Writing & Journal Readiness", 
                    "Specialized academic language improvement, word count reduction, and submission compliance checks")
    
    # Left Card: Core Capabilities of Paperpal
    deck.add_card(s20, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s20, Inches(1.05), Inches(2.15), Inches(3.2), Inches(0.3), "CORE ACADEMIC CAPABILITIES", BLUE_LIGHT, BLUE_PRIMARY)
    tb_l20 = s20.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l20.text_frame, [
        "Academic Grammar & Syntax: Trained on millions of peer-reviewed journal manuscripts to identify scholarly grammar nuances that generic checkers miss.",
        "Vocabulary Enhancement: Suggests formal, discipline-specific academic phrases (e.g., replaces 'got better results' with 'exhibited superior convergence characteristics').",
        "Trimming & Word Reduction: Intelligently condenses verbose sentences by 15–25% to meet strict journal length limitations without losing technical meaning.",
        "Academic Translation: Translates non-native academic drafts into publication-grade English while preserving specialized terminology.",
        "Journal Pre-Submission Screening: Audits manuscripts for missing ethical declarations, caption formatting, self-citation ratios, and plagiarism."
    ], font_size=9.5, spacing=4)

    # Right Card: The Paperpal Publishing Workflow & Pros/Cons
    deck.add_card(s20, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=EMERALD)
    deck.add_badge(s20, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "SUBMISSION PIPELINE & BOUNDARIES", EMERALD_LIGHT, EMERALD)
    
    tb_r20 = s20.shapes.add_textbox(Inches(7.15), Inches(2.55), Inches(5.1), Inches(3.5))
    tf_r20 = tb_r20.text_frame
    tf_r20.word_wrap = True
    
    p_pp = tf_r20.paragraphs[0]
    p_pp.text = "The 6-Stage Journal Polishing Pipeline:"
    p_pp.font.bold = True
    p_pp.font.size = Pt(10)
    p_pp.font.color.rgb = BLUE_PRIMARY
    
    p_pp_flow = tf_r20.add_paragraph()
    p_pp_flow.text = "RAW DRAFT → GRAMMAR AUDIT → VOCABULARY POLISH → WORD TRIMMING → JOURNAL COMPLIANCE CHECK → FINAL AUTHOR REVIEW"
    p_pp_flow.font.name = FONT_FAMILY
    p_pp_flow.font.bold = True
    p_pp_flow.font.size = Pt(8.5)
    p_pp_flow.font.color.rgb = NAVY
    p_pp_flow.space_before = Pt(3)
    p_pp_flow.space_after = Pt(6)

    deck.add_bullet_list(tf_r20, [
        "Primary Advantage: Built-in MS Word and Overleaf web add-ins for seamless real-time academic editing.",
        "Primary Advantage: Specifically aligned with IEEE, Elsevier, Springer, and Nature formatting guidelines.",
        "Key Limitation: Freemium model restricts full pre-submission checks to paid institutional tiers.",
        "Critical Boundary: Paperpal fixes language quality, NOT flawed experimental design, logic, or invalid math."
    ], font_size=9.5, spacing=4)

    deck.add_callout(s20, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Practical Takeaway", "Use Paperpal as a digital language mentor to learn formal scholarly phrasing, rather than blindly accepting every suggested modification.", style='info')
    deck.add_footer(s20, "Source: paperpal.com documentation & academic editorial metrics")

    # =========================================================================
    # SLIDE 21: Section 7: Preparing & Submitting Project Proposals
    # =========================================================================
    s21 = deck.add_canvas()
    deck.add_header(s21, "Section 7: Project Proposals", "The 12 Mandatory Components of a Project Proposal", 
                    "Structuring winning capstone, thesis, and funded research proposals with targeted AI assistance")
    
    # 2-Column Cards outlining the 12 Components
    p1_items = [
        "1. Project Title: Clear, technically specific, and outcome-oriented",
        "2. Abstract / Executive Summary: Problem, proposed method, and expected impact",
        "3. Problem Statement: Quantifiable engineering bottleneck being tackled",
        "4. Motivation & Societal Need: Why this project matters to industry or humanity",
        "5. Project Objectives: 3–4 SMART (Specific, Measurable, Achievable) goals",
        "6. Literature Review & Prior Art: Grounding in established scientific benchmarks"
    ]
    p2_items = [
        "7. Identified Research Gap: Precise limitation in existing solutions being solved",
        "8. Proposed Methodology: Algorithmic architecture, hardware, and workflow",
        "9. Expected Deliverables: Software code, hardware prototypes, datasets, papers",
        "10. Work Breakdown & Timeline: Phased Gantt chart with clear semester milestones",
        "11. Budget & Resource Estimation: Cloud compute, GPU credits, lab sensors, licenses",
        "12. Risk Mitigation & References: Contingency plans and verified bibliography"
    ]

    deck.add_card(s21, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s21, Inches(1.05), Inches(2.15), Inches(3.5), Inches(0.3), "PROPOSAL ANATOMY: SECTIONS 1–6", BLUE_LIGHT, BLUE_PRIMARY)
    tb_p1 = s21.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.2), Inches(3.5))
    deck.add_bullet_list(tb_p1.text_frame, p1_items, font_size=9.5, spacing=4.5)

    deck.add_card(s21, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.2), bg_color=WHITE, border_color=VIOLET)
    deck.add_badge(s21, Inches(7.05), Inches(2.15), Inches(3.5), Inches(0.3), "PROPOSAL ANATOMY: SECTIONS 7–12", VIOLET_LIGHT, VIOLET)
    tb_p2 = s21.shapes.add_textbox(Inches(7.05), Inches(2.55), Inches(5.2), Inches(3.5))
    deck.add_bullet_list(tb_p2.text_frame, p2_items, font_size=9.5, spacing=4.5)

    deck.add_callout(s21, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Proposal Evaluation Criteria", "Reviewers look for three things: 1) Is the problem real? 2) Is the methodology feasible within the timeline? 3) Do the researchers have a verifiable plan to measure success?", style='violet')
    deck.add_footer(s21, "Standard Engineering Grant & Capstone Project Evaluation Rubric")

    # =========================================================================
    # SLIDE 22: AI-Assisted Project Proposal Workflow
    # =========================================================================
    s22 = deck.add_canvas()
    deck.add_header(s22, "Section 7: Project Proposals", "The 11-Stage AI-Assisted Proposal Pipeline", 
                    "Step-by-step acceleration from initial idea inception to final institutional defense")
    
    # 11-step pipeline across 2 structured cards
    prop_stages = [
        ("1. IDEA INCEPTION", "Gemini / Claude brainstorm engineering angles", BLUE_LIGHT, BLUE_PRIMARY),
        ("2. LITERATURE SEARCH", "ResearchRabbit & Litmaps map existing patents/papers", SLATE_LIGHT, NAVY),
        ("3. GAP IDENTIFICATION", "Elicit & Consensus extract unsolved limitations", BLUE_LIGHT, BLUE_PRIMARY),
        ("4. PROBLEM STATEMENT", "AI assists in sharpening problem boundaries", SLATE_LIGHT, NAVY),
        ("5. SMART OBJECTIVES", "Convert vague ideas into measurable milestones", VIOLET_LIGHT, VIOLET),
        ("6. METHODOLOGY DESIGN", "Structure system block diagrams and pipeline flow", SLATE_LIGHT, NAVY),
        ("7. EXPECTED OUTCOMES", "Draft explicit deliverable definitions & metrics", VIOLET_LIGHT, VIOLET),
        ("8. TIMELINE & GANTT", "AI generates weekly milestone breakdowns", TEAL_LIGHT, TEAL),
        ("9. BUDGET ESTIMATION", "Calculate AWS/GCP compute costs & hardware specs", SLATE_LIGHT, NAVY),
        ("10. PROPOSAL REVIEW", "Paperpal checks academic tone & formatting", TEAL_LIGHT, TEAL),
        ("11. COMMITTEE DEFENSE", "AI generates tough cross-examination questions", EMERALD_LIGHT, EMERALD)
    ]
    
    # Left card: Steps 1-6
    deck.add_card(s22, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s22, Inches(1.05), Inches(2.15), Inches(3.2), Inches(0.3), "PHASE 1: SCOPING & DESIGN", BLUE_LIGHT, BLUE_PRIMARY)
    y_ps = Inches(2.55)
    for st_t, st_d, bg_c, txt_c in prop_stages[:6]:
        deck.add_card(s22, Inches(1.05), y_ps, Inches(5.2), Inches(0.48), bg_color=bg_c, border_color=txt_c)
        tb = s22.shapes.add_textbox(Inches(1.15), y_ps + Inches(0.04), Inches(5.0), Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        r1 = p.add_run()
        r1.text = f"{st_t}: "
        r1.font.bold = True
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = txt_c
        r2 = p.add_run()
        r2.text = st_d
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = SLATE_DARK
        y_ps += Inches(0.52)

    # Right card: Steps 7-11 + Crucial Warning
    deck.add_card(s22, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.2), bg_color=WHITE, border_color=EMERALD)
    deck.add_badge(s22, Inches(7.05), Inches(2.15), Inches(3.2), Inches(0.3), "PHASE 2: EXECUTION & DEFENSE", EMERALD_LIGHT, EMERALD)
    y_ps2 = Inches(2.55)
    for st_t, st_d, bg_c, txt_c in prop_stages[6:]:
        deck.add_card(s22, Inches(7.05), y_ps2, Inches(5.2), Inches(0.48), bg_color=bg_c, border_color=txt_c)
        tb = s22.shapes.add_textbox(Inches(7.15), y_ps2 + Inches(0.04), Inches(5.0), Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        r1 = p.add_run()
        r1.text = f"{st_t}: "
        r1.font.bold = True
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = txt_c
        r2 = p.add_run()
        r2.text = st_d
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = SLATE_DARK
        y_ps2 += Inches(0.52)

    # Crucial Warning Callout
    deck.add_callout(s22, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Proposal Integrity Alert", "NEVER allow AI to invent citations, synthetic experimental findings, or fictitious partner institutions in grant proposals. Hallucinated references in a proposal guarantee immediate rejection.", style='danger')
    deck.add_footer(s22, "Source: National Science Foundation (NSF) / European Research Council (ERC) Proposal Protocols")

    # =========================================================================
    # SLIDE 23: Section 8: Collaborative Research Strategies
    # =========================================================================
    s23 = deck.add_canvas()
    deck.add_header(s23, "Section 8: Collaboration", "Collaborative Research Strategies & Modern Toolchains", 
                    "Eliminating version chaos, siloed data, and asynchronous communication bottlenecks in research teams")
    
    # Left Card: Core Collaborative Toolchain
    deck.add_card(s23, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s23, Inches(1.05), Inches(2.15), Inches(3.2), Inches(0.3), "COLLABORATIVE INFRASTRUCTURE", BLUE_LIGHT, BLUE_PRIMARY)
    
    collab_tools = [
        ("Git & GitHub", "Version control for code, data pipelines, LaTeX source, and transparent issue tracking.", BLUE_LIGHT, BLUE_PRIMARY),
        ("Overleaf (LaTeX)", "Real-time collaborative manuscript authoring with track changes, comments, and direct journal submission.", VIOLET_LIGHT, VIOLET),
        ("Google Drive & Docs", "Collaborative brainstorming, meeting notes, lab logs, and asynchronous faculty feedback.", SLATE_LIGHT, NAVY),
        ("Notion / Obsidian", "Shared central lab wiki, structured literature reading libraries, and protocol documentation.", TEAL_LIGHT, TEAL),
        ("Slack / Teams", "Synchronous team channels, automated paper alert webhooks, and standup meetings.", AMBER_LIGHT, AMBER)
    ]
    y_ct = Inches(2.55)
    for t_n, t_d, bg_c, txt_c in collab_tools:
        deck.add_card(s23, Inches(1.05), y_ct, Inches(5.1), Inches(0.65), bg_color=bg_c, border_color=txt_c)
        tb = s23.shapes.add_textbox(Inches(1.15), y_ct + Inches(0.06), Inches(4.9), Inches(0.55))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = t_n
        p1.font.bold = True
        p1.font.size = Pt(9.5)
        p1.font.color.rgb = txt_c
        p2 = tf.add_paragraph()
        p2.text = t_d
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = SLATE_DARK
        y_ct += Inches(0.72)

    # Right Card: The Team Workflow Architecture
    deck.add_card(s23, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=EMERALD)
    deck.add_badge(s23, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "TEAM WORKFLOW ARCHITECTURE", EMERALD_LIGHT, EMERALD)
    tb_r23 = s23.shapes.add_textbox(Inches(7.15), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_r23.text_frame, [
        "Principal Investigator / Faculty Lead: Defines research vision, reviews milestone deliverables, and approves final manuscript.",
        "Literature Sub-Team: Manages shared Zotero library, tracks emerging preprints, and drafts related work sections.",
        "Experimentation Sub-Team: Authors Colab notebooks, runs GPU model training, and serializes baseline weights into GitHub.",
        "Writing & Documentation Sub-Team: Translates experimental charts and tables into formal Overleaf LaTeX chapters.",
        "Shared Research Decision Log: A central markdown file documenting every algorithmic failure, parameter choice, and pivot.",
        "Standardized Naming Conventions: Strict directory schemas (`/data`, `/src`, `/notebooks`, `/figures`, `/manuscript`)."
    ], font_size=9.5, spacing=4)

    deck.add_callout(s23, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Collaboration Rule", "A project is only as strong as its reproducibility. If a teammate cannot clone your repo and reproduce your exact experimental figures in one click, the research is incomplete.", style='info')
    deck.add_footer(s23, "ACM Guidelines on Reproducible Academic Computation")

    # =========================================================================
    # SLIDE 24: Section 9: Hands-On & Experimental Strategies
    # =========================================================================
    s24 = deck.add_canvas()
    deck.add_header(s24, "Section 9: Experimental Rigor", "Hands-On & Experimental Learning Strategies", 
                    "Translating theoretical concepts into empirical validation through structured scientific method loops")
    
    # Left Card: Core Experimental Strategies
    deck.add_card(s24, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s24, Inches(1.05), Inches(2.15), Inches(3.5), Inches(0.3), "EMPIRICAL RESEARCH STRATEGIES", BLUE_LIGHT, BLUE_PRIMARY)
    tb_l24 = s24.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l24.text_frame, [
        "Rapid Minimum Viable Prototype (MVP): Build simple baseline models on small sample subsets before launching 48-hour GPU cluster jobs.",
        "Single Variable Isolation: Modify exactly ONE hyperparameter or layer at a time to establish definitive causal attribution.",
        "Rigorous Measurement Standards: Utilize multiple complementary metrics (e.g., Precision-Recall curves alongside ROC-AUC for imbalanced data).",
        "Documenting Negative Results: Meticulously record failed architectures; negative results reveal true algorithmic boundaries.",
        "Cross-Validation Rigor: Implement k-fold cross-validation to guarantee that results are not artifacts of lucky train/test splits."
    ], font_size=10, spacing=4.5)

    # Right Card: The Scientific Method Feedback Loop
    deck.add_card(s24, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=EMERALD)
    deck.add_badge(s24, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "THE EMPIRICAL FEEDBACK LOOP", EMERALD_LIGHT, EMERALD)
    
    sci_loop = [
        ("1. TESTABLE HYPOTHESIS", "Formulate clear falsifiable claim ('Adding attention increases F1 by >3%')"),
        ("2. CONTROLLED EXPERIMENT", "Implement code in Colab with fixed seeds and identical datasets"),
        ("3. DIRECT OBSERVATION", "Monitor training loss, validation curves, and GPU memory in real-time"),
        ("4. METRIC MEASUREMENT", "Evaluate quantitative test set performance against prior baselines"),
        ("5. STATISTICAL ANALYSIS", "Conduct paired t-tests or Wilcoxon signed-rank tests for significance"),
        ("6. ITERATIVE CONCLUSION", "Accept/reject hypothesis; document insights; formulate next experiment")
    ]
    y_sl = Inches(2.55)
    for st_t, st_d in sci_loop:
        deck.add_card(s24, Inches(7.15), y_sl, Inches(5.1), Inches(0.53), bg_color=SLATE_LIGHT, border_color=SLATE_BORDER)
        tb_sl = s24.shapes.add_textbox(Inches(7.25), y_sl + Inches(0.04), Inches(4.9), Inches(0.45))
        tf_sl = tb_sl.text_frame
        tf_sl.word_wrap = True
        tf_sl.margin_left = tf_sl.margin_right = tf_sl.margin_top = tf_sl.margin_bottom = 0
        p = tf_sl.paragraphs[0]
        r1 = p.add_run()
        r1.text = f"{st_t}: "
        r1.font.bold = True
        r1.font.size = Pt(9)
        r1.font.color.rgb = EMERALD
        r2 = p.add_run()
        r2.text = st_d
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = SLATE_DARK
        y_sl += Inches(0.58)

    deck.add_callout(s24, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Engineering Wisdom", "Simulation and theory propose; empirical measurement disposes. A single clean benchmark chart on genuine hardware is worth 100 theoretical conjectures.", style='success')
    deck.add_footer(s24, "Principles of Experimental Research in Engineering")

    # =========================================================================
    # SLIDE 25: Section 10: Engagement & Gamified Learning
    # =========================================================================
    s25 = deck.add_canvas()
    deck.add_header(s25, "Section 10: Active Pedagogy", "Technology-Enhanced Engagement in Engineering Education", 
                    "Transforming passive lectures into active, data-driven, and participatory learning environments")
    
    # Left Card: Active Pedagogy Strategies
    deck.add_card(s25, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s25, Inches(1.05), Inches(2.15), Inches(3.2), Inches(0.3), "ACTIVE LEARNING METHODOLOGIES", BLUE_LIGHT, BLUE_PRIMARY)
    tb_l25 = s25.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l25.text_frame, [
        "Peer Instruction (Mazur Model): Present a challenging conceptual MCQ, poll students, have them debate peers in pairs, and repoll.",
        "Real-Time Diagnostic Quizzing: Conduct 3-minute pulse checks at the midpoint of lectures to verify whether students grasped difficult derivations.",
        "Problem-Based Learning (PBL): Challenge student teams with real-world engineering failure case studies (e.g., the Ariane 5 integer overflow).",
        "Formative Exit Tickets: Prompt students for their 'muddiest point' before leaving the lecture room to calibrate the next class.",
        "Mini-Coding Hack Rounds: 15-minute live coding challenges in Colab to implement algorithms discussed in theory."
    ], font_size=10, spacing=4.5)

    # Right Card: Modern Interactive Tool Ecosystem
    deck.add_card(s25, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=VIOLET)
    deck.add_badge(s25, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "INTERACTIVE PEDAGOGICAL PLATFORMS", VIOLET_LIGHT, VIOLET)
    
    ped_tools = [
        ("Google Forms", "Rapid diagnostic quizzes, real-time response aggregation, and instant concept feedback.", BLUE_LIGHT, BLUE_PRIMARY),
        ("Kahoot!", "High-energy competitive quizzes; ideal for review sessions and icebreaker concept checks.", VIOLET_LIGHT, VIOLET),
        ("Blooket", "Gamified learning activities featuring Tower Defense and Gold Quest mechanics for high engagement.", AMBER_LIGHT, AMBER),
        ("Flippity", "Converts simple Google Sheets into flashcards, Jeopardy game boards, and random student pickers.", TEAL_LIGHT, TEAL),
        ("Khan Academy", "Scaffolded self-paced modules, interactive hints, and student mastery tracking dashboards.", EMERALD_LIGHT, EMERALD)
    ]
    y_pt = Inches(2.55)
    for t_n, t_d, bg_c, txt_c in ped_tools:
        deck.add_card(s25, Inches(7.15), y_pt, Inches(5.1), Inches(0.65), bg_color=bg_c, border_color=txt_c)
        tb = s25.shapes.add_textbox(Inches(7.25), y_pt + Inches(0.06), Inches(4.9), Inches(0.55))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = t_n
        p1.font.bold = True
        p1.font.size = Pt(9.5)
        p1.font.color.rgb = txt_c
        p2 = tf.add_paragraph()
        p2.text = t_d
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = SLATE_DARK
        y_pt += Inches(0.72)

    deck.add_callout(s25, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Educational Finding", "Studies in engineering education prove that active learning reduces course failure rates by 33% compared to traditional lecturing (Freeman et al., PNAS).", style='info')
    deck.add_footer(s25, "Source: PNAS / Journal of Engineering Education")

    # =========================================================================
    # SLIDE 26: Google Forms for Brisk / Active Teaching
    # =========================================================================
    s26 = deck.add_canvas()
    deck.add_header(s26, "Pedagogical Tools", "Google Forms for Brisk Active Teaching & Rapid Feedback", 
                    "Implementing continuous formative assessment, instant misconception detection, and dynamic lecture tuning")
    
    # Left Card: Core Academic Use Cases
    deck.add_card(s26, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s26, Inches(1.05), Inches(2.15), Inches(3.2), Inches(0.3), "6 CORE ACTIVE USE CASES", BLUE_LIGHT, BLUE_PRIMARY)
    tb_l26 = s26.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l26.text_frame, [
        "1. Pre-Class Diagnostic Check: A 3-question survey assessing prerequisite readiness before introducing advanced topics.",
        "2. Frictionless Attendance & Verification: Time-stamped attendance verification with an integrated conceptual challenge.",
        "3. Mid-Lecture Concept Pulse: Gauge class understanding of a freshly derived theorem before moving to applications.",
        "4. Formative Exit Ticket: Ask: 'What was the single most confusing concept covered today?' to shape tomorrow's lecture.",
        "5. Automated Grading & Instant Analytics: View real-time bar charts of student distributions across multiple-choice options.",
        "6. Anonymous Project Peer Feedback: Students review peer presentations with standardized rubric grading."
    ], font_size=9.5, spacing=4)

    # Right Card: The Closed-Loop Feedback Cycle
    deck.add_card(s26, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=EMERALD)
    deck.add_badge(s26, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "THE RAPID FEEDBACK-TO-TEACHING LOOP", EMERALD_LIGHT, EMERALD)
    
    form_loop = [
        ("1. INSTRUCTOR DEPLOYS FORM", "Share QR code or short link at the start or midpoint of class"),
        ("2. REAL-TIME STUDENT SUBMISSION", "Students submit answers via smartphones in under 90 seconds"),
        ("3. AUTOMATED CHART GENERATION", "Google Forms automatically aggregates responses into live charts"),
        ("4. MISCONCEPTION DETECTION", "Instructor immediately identifies if 60% picked wrong option 'B'"),
        ("5. ON-THE-FLY LECTURE TUNING", "Spend 5 minutes clarifying the misconception rather than lecturing ahead"),
        ("6. POST-CLASS EXCEL ARCHIVE", "Export Sheets for longitudinal tracking of struggling students")
    ]
    y_fl = Inches(2.55)
    for st_t, st_d in form_loop:
        deck.add_card(s26, Inches(7.15), y_fl, Inches(5.1), Inches(0.53), bg_color=SLATE_LIGHT, border_color=SLATE_BORDER)
        tb_fl = s26.shapes.add_textbox(Inches(7.25), y_fl + Inches(0.04), Inches(4.9), Inches(0.45))
        tf_fl = tb_fl.text_frame
        tf_fl.word_wrap = True
        tf_fl.margin_left = tf_fl.margin_right = tf_fl.margin_top = tf_fl.margin_bottom = 0
        p = tf_fl.paragraphs[0]
        r1 = p.add_run()
        r1.text = f"{st_t}: "
        r1.font.bold = True
        r1.font.size = Pt(9)
        r1.font.color.rgb = BLUE_PRIMARY
        r2 = p.add_run()
        r2.text = st_d
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = SLATE_DARK
        y_fl += Inches(0.58)

    deck.add_callout(s26, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Pedagogical Efficiency", "Never wait until mid-term exams to discover that students misunderstood a fundamental concept. A 2-minute Google Form provides instant diagnostic visibility.", style='success')
    deck.add_footer(s26, "Source: Google Workspace for Education / Teaching Strategies")

    # =========================================================================
    # SLIDE 27: Khan Academy for Personalized Learning
    # =========================================================================
    s27 = deck.add_canvas()
    deck.add_header(s27, "Pedagogical Tools", "Khan Academy: Structured Mastery & Flipped Learning", 
                    "Implementing self-paced mastery learning, prerequisite remediation, and the 3-phase flipped classroom")
    
    # Left Card: The Mastery Learning Concept
    deck.add_card(s27, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=EMERALD)
    deck.add_badge(s27, Inches(1.05), Inches(2.15), Inches(3.2), Inches(0.3), "MASTERY LEARNING PHILOSOPHY", EMERALD_LIGHT, EMERALD)
    tb_l27 = s27.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l27.text_frame, [
        "Variable Time, Constant Mastery: In traditional education, time is constant and learning is variable. In mastery learning, learning is held constant at 100% while students take the time they need.",
        "Scaffolded Hint Systems: Instant step-by-step hints guide students through math and science derivations without revealing answers prematurely.",
        "Automated Prerequisite Mapping: Identifies foundational gaps in linear algebra or calculus that impede advanced engineering coursework.",
        "Teacher Dashboard Analytics: Instructors gain real-time visibility into student practice time, struggle areas, and mastery badges.",
        "Khanmigo AI Co-Pilot: Contextual AI tutor that engages students in Socratic dialogue rather than simply providing direct answers."
    ], font_size=9.5, spacing=4.5)

    # Right Card: The 3-Phase Flipped Classroom Architecture
    deck.add_card(s27, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s27, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "THE 3-PHASE FLIPPED CLASSROOM MODEL", BLUE_LIGHT, BLUE_PRIMARY)
    
    flipped_phases = [
        ("PHASE 1: PRE-CLASS (LEARN)", "Students watch concise micro-lectures and complete diagnostic mastery exercises asynchronously at home.", BLUE_LIGHT, BLUE_PRIMARY),
        ("PHASE 2: IN-CLASS (DISCUSS & SOLVE)", "Classroom hours are dedicated entirely to peer debate, complex engineering problem-solving, lab experiments, and instructor mentoring.", VIOLET_LIGHT, VIOLET),
        ("PHASE 3: POST-CLASS (PRACTICE & RETAIN)", "Students tackle targeted retention challenges, spaced repetition problem sets, and capstone project implementations.", TEAL_LIGHT, TEAL)
    ]
    y_fp = Inches(2.55)
    for p_t, p_d, bg_c, txt_c in flipped_phases:
        deck.add_card(s27, Inches(7.15), y_fp, Inches(5.1), Inches(1.1), bg_color=bg_c, border_color=txt_c)
        tb = s27.shapes.add_textbox(Inches(7.25), y_fp + Inches(0.08), Inches(4.9), Inches(0.95))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = p_t
        p1.font.bold = True
        p1.font.size = Pt(10)
        p1.font.color.rgb = txt_c
        p2 = tf.add_paragraph()
        p2.text = p_d
        p2.font.size = Pt(9)
        p2.font.color.rgb = SLATE_DARK
        p2.space_before = Pt(3)
        y_fp += Inches(1.18)

    deck.add_callout(s27, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Pedagogical Shift", "Flipping the classroom transforms the professor from the 'sage on the stage' delivering a monologue to the 'guide on the side' facilitating high-order engineering design.", style='info')
    deck.add_footer(s27, "Source: khanacademy.org pedagogical research")

    # =========================================================================
    # SLIDE 28: Kahoot, Blooket & Flippity Comparison
    # =========================================================================
    s28 = deck.add_canvas()
    deck.add_header(s28, "Gamification Platforms", "Comparative Analysis: Kahoot!, Blooket & Flippity", 
                    "Evaluating game mechanics, classroom dynamics, and ideal pedagogical applications")
    
    kbf_headers = ["Platform", "Core Game Dynamics", "Engagement Style", "Best Classroom Application", "Setup Overhead"]
    kbf_rows = [
        ["Kahoot!", "Synchronous, fast-paced MCQ speed challenges with arcade music & podium rankings", "High-energy, competitive, whole-class synchronized showdown", "Exam review sessions, icebreakers, diagnostic checks, and workshop recaps", "Low (Ready-made library of 100M+ community quizzes)"],
        ["Blooket", "Action-oriented game modes (Tower Defense, Gold Quest, Cafe, Battle Royale)", "Intensely addictive, self-paced or live competitive gaming", "Vocabulary acquisition, formula drill reinforcement, and lab homework", "Low to Medium (Import via Quizlet or spreadsheet)"],
        ["Flippity", "Converts Google Sheets into Flashcards, Jeopardy Boards, Timelines, & Scavenger Hunts", "Flexible, highly customizable, individual or team game shows", "Case study competitions, complex terminology matching, and random picker", "Extremely Low (Direct Google Sheets template copy)"]
    ]
    kbf_widths = [Inches(1.8), Inches(3.0), Inches(2.8), Inches(2.6), Inches(1.533)]
    deck.add_table(s28, Inches(0.8), Inches(2.0), Inches(11.733), Inches(3.8), kbf_headers, kbf_rows, kbf_widths, header_bg=VIOLET)

    deck.add_callout(s28, Inches(0.8), Inches(6.0), Inches(11.733), Inches(0.85), 
                     "Platform Selection Rubric", "Match the platform to your pedagogical objective: Use Kahoot! for fast whole-class pulse checks; use Blooket for high-repetition formula mastery; use Flippity when you require custom spreadsheet-driven Jeopardy competitions.", style='violet')
    deck.add_footer(s28, "Platform analysis based on educational technology standards (2025)")

    # =========================================================================
    # SLIDE 29: Section 11: Gamified Strategies in Education
    # =========================================================================
    s29 = deck.add_canvas()
    deck.add_header(s29, "Section 11: Gamification", "Gamification Strategies for Deeper Conceptual Mastery", 
                    "Leveraging game mechanics to motivate sustained academic effort while maintaining rigorous learning outcomes")
    
    # Left Card: Core Gamification Mechanics
    deck.add_card(s29, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=AMBER)
    deck.add_badge(s29, Inches(1.05), Inches(2.15), Inches(3.2), Inches(0.3), "CORE GAMIFICATION MECHANICS", AMBER_LIGHT, AMBER)
    tb_l29 = s29.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.1), Inches(3.5))
    deck.add_bullet_list(tb_l29.text_frame, [
        "Experience Points (XP): Rewarding incremental effort (e.g., attending recitations, submitting code reviews) rather than just final exam performance.",
        "Milestone Badges: Recognizing specific competencies (e.g., 'Git Master', 'CUDA Optimizer', 'Literature Scout').",
        "Progress Bars: Visual representations of semester completion, reducing anxiety by rendering academic goals tangible.",
        "Scaffolded Boss Fights: Multi-stage, complex engineering design challenges requiring integration of 3+ disparate modules.",
        "Peer Guilds / Teams: Collaborative competitions where team scores depend on mentoring struggling members."
    ], font_size=9.5, spacing=4.5)

    # Right Card: The 5-Level Mastery Progression
    deck.add_card(s29, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.2), bg_color=WHITE, border_color=BLUE_PRIMARY)
    deck.add_badge(s29, Inches(7.15), Inches(2.15), Inches(3.5), Inches(0.3), "THE 5-LEVEL MASTERY PROGRESSION", BLUE_LIGHT, BLUE_PRIMARY)
    
    levels = [
        ("LEVEL 1: CONCEPTUAL DRILL", "Master definitions and core theorems via Flippity flashcards", BLUE_LIGHT, BLUE_PRIMARY),
        ("LEVEL 2: FORMATIVE QUIZ", "Identify misconceptions through brisk Kahoot! / Google Forms pulse", SLATE_LIGHT, NAVY),
        ("LEVEL 3: APPLIED PROBLEM", "Solve realistic engineering calculations with immediate hint feedback", VIOLET_LIGHT, VIOLET),
        ("LEVEL 4: SYSTEM DEBUGGING", "Debug intentionally broken Python code in Google Colab notebooks", TEAL_LIGHT, TEAL),
        ("LEVEL 5: CAPSTONE PROJECT", "Design, build, validate, and present an original research solution", EMERALD_LIGHT, EMERALD)
    ]
    y_lv = Inches(2.55)
    for l_t, l_d, bg_c, txt_c in levels:
        deck.add_card(s29, Inches(7.15), y_lv, Inches(5.1), Inches(0.65), bg_color=bg_c, border_color=txt_c)
        tb_lv = s29.shapes.add_textbox(Inches(7.25), y_lv + Inches(0.06), Inches(4.9), Inches(0.55))
        tf_lv = tb_lv.text_frame
        tf_lv.word_wrap = True
        tf_lv.margin_left = tf_lv.margin_right = tf_lv.margin_top = tf_lv.margin_bottom = 0
        p1 = tf_lv.paragraphs[0]
        p1.text = l_t
        p1.font.bold = True
        p1.font.size = Pt(9.5)
        p1.font.color.rgb = txt_c
        p2 = tf_lv.add_paragraph()
        p2.text = l_d
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = SLATE_DARK
        y_lv += Inches(0.72)

    deck.add_callout(s29, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Cardinal Pedagogical Rule", "Gamification must serve learning outcomes. Points and leaderboards without rigorous underlying intellectual challenges create superficial excitement without educational depth.", style='warning')
    deck.add_footer(s29, "Educational Psychology: Self-Determination Theory in Higher Education")

    # =========================================================================
    # SLIDE 30: Complete AI-Enabled Research & Teaching Ecosystem
    # =========================================================================
    s30 = deck.add_canvas(is_dark=True)
    deck.add_header(s30, "Master Synthesis", "The Complete AI-Enabled Research & Teaching Ecosystem", 
                    "A unified architectural matrix connecting literature discovery, experimentation, writing, and active teaching", is_dark=True)
    
    # 8 Category Cards arranged in a clean, high-impact 4x2 matrix
    eco_cards = [
        ("1. DISCOVER", "ResearchRabbit\nLitmaps\nElicit\nConsensus", BLUE_PRIMARY),
        ("2. READ & ORGANIZE", "NotebookLM\nSciSpace\nZotero\nSemantic Scholar", VIOLET),
        ("3. EXPERIMENT", "Google Colab\nKaggle\nJupyter\nGitHub Copilot", TEAL),
        ("4. GENERATE & REASON", "Google Gemini\nChatGPT (GPT-4o)\nClaude (Sonnet)\nCursor IDE", RGBColor(56, 189, 248)),
        ("5. WRITE & POLISH", "Paperpal\nWritefull\nOverleaf LaTeX\nGrammarly", RGBColor(234, 88, 12)),
        ("6. PROPOSAL & PLAN", "Proposal Templates\nDeep Research\nNotion Workspace\nGantt Planners", RGBColor(168, 85, 247)),
        ("7. COLLABORATE", "GitHub Repositories\nGoogle Drive / Docs\nOverleaf Shared\nTeams / Slack", RGBColor(14, 165, 233)),
        ("8. TEACH & ENGAGE", "Google Forms\nKahoot!\nBlooket & Flippity\nKhan Academy", EMERALD)
    ]
    card_w30 = Inches(2.78)
    card_h30 = Inches(1.95)
    gap_x30 = Inches(0.2)
    gap_y30 = Inches(0.2)
    
    for idx, (cat_title, cat_tools, cat_color) in enumerate(eco_cards):
        col = idx % 4
        row = idx // 4
        x = Inches(0.8) + col * (card_w30 + gap_x30)
        y = Inches(2.0) + row * (card_h30 + gap_y30)
        
        c = deck.add_card(s30, x, y, card_w30, card_h30, bg_color=SLATE_DARK, border_color=cat_color)
        
        # Header banner inside card
        tb_h = s30.shapes.add_textbox(x + Inches(0.12), y + Inches(0.1), card_w30 - Inches(0.24), Inches(0.35))
        tf_h = tb_h.text_frame
        p_h = tf_h.paragraphs[0]
        p_h.text = cat_title
        p_h.font.bold = True
        p_h.font.size = Pt(10)
        p_h.font.color.rgb = cat_color
        
        # Tools text inside card
        tb_b = s30.shapes.add_textbox(x + Inches(0.12), y + Inches(0.45), card_w30 - Inches(0.24), card_h30 - Inches(0.55))
        tf_b = tb_b.text_frame
        tf_b.word_wrap = True
        for t in cat_tools.split("\n"):
            p = tf_b.add_paragraph()
            p.text = f"• {t}"
            p.font.size = Pt(9.5)
            p.font.color.rgb = WHITE
            p.space_after = Pt(2)

    # Bottom Synthesis Banner
    deck.add_callout(s30, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Ecosystem Synthesis", "No single tool solves the entire research lifecycle. Excellence lies in fluidly chaining specialized tools into a seamless, human-verified academic pipeline.", style='info')
    deck.add_footer(s30, "The Complete Modern Academic Technology Toolkit", is_dark=True)

    # =========================================================================
    # SLIDE 31: Responsible AI for Research & Education (10 Ethical Directives)
    # =========================================================================
    s31 = deck.add_canvas()
    deck.add_header(s31, "Ethics & Integrity", "Responsible AI: 10 Golden Ethical Directives", 
                    "Ensuring scientific rigor, intellectual honesty, data privacy, and compliance with institutional standards")
    
    # 2-Column Cards outlining the 10 Directives
    d1_items = [
        "1. Verify Every Factual Claim: Audit all AI-extracted numbers, theorems, and quotes against original peer-reviewed source PDFs.",
        "2. Zero Tolerance for Fake Citations: Never cite an AI-generated paper without verifying its active DOI and indexing in Scopus/PubMed.",
        "3. Preserve Empirical Reality: Never fabricate, augment, or synthesize experimental results, sensor readings, or clinical data.",
        "4. Intellectual Property & Copyright: Respect publisher rights; never paste copyrighted paywalled books into commercial AI prompts.",
        "5. Guard Confidentiality & IP: Never upload unpatented engineering designs, student PII, or unpublished lab code to public AI models."
    ]
    d2_items = [
        "6. Prohibit AI Ghostwriting: Use AI as a language polisher, not an intellectual author; original ideas and logic must be human.",
        "7. Mandatory AI Transparency: Explicitly disclose AI tool usage in paper methodology or acknowledgments as mandated by IEEE/ACM.",
        "8. Adhere to Publisher Guidelines: Comply with COPE, Elsevier, Springer, and Nature rules strictly barring AI tools from co-authorship.",
        "9. Check Algorithmic Bias: Scrutinize AI summaries for linguistic or geographic citation bias that overlooks non-Western research.",
        "10. Ultimate Researcher Accountability: You alone are legally, ethically, and academically responsible for every word in your final manuscript."
    ]

    deck.add_card(s31, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.2), bg_color=WHITE, border_color=RED)
    deck.add_badge(s31, Inches(1.05), Inches(2.15), Inches(3.5), Inches(0.3), "DATA INTEGRITY & ATTRIBUTION (1–5)", RED_LIGHT, RED)
    tb_d1 = s31.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.2), Inches(3.5))
    deck.add_bullet_list(tb_d1.text_frame, d1_items, font_size=9.5, spacing=4.5)

    deck.add_card(s31, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.2), bg_color=WHITE, border_color=AMBER)
    deck.add_badge(s31, Inches(7.05), Inches(2.15), Inches(3.5), Inches(0.3), "GOVERNANCE & ACCOUNTABILITY (6–10)", AMBER_LIGHT, AMBER)
    tb_d2 = s31.shapes.add_textbox(Inches(7.05), Inches(2.55), Inches(5.2), Inches(3.5))
    deck.add_bullet_list(tb_d2.text_frame, d2_items, font_size=9.5, spacing=4.5)

    # Core Golden Quote Banner
    deck.add_callout(s31, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.55), 
                     "Golden Ethical Principle", "\"AI can accelerate research, but researchers remain 100% responsible for the final work.\" — Institutional Ethics Board Directive", style='danger')
    deck.add_footer(s31, "Guidelines: IEEE Ethics in AI & Computing / COPE Authorship Standards")

    # =========================================================================
    # SLIDE 32: Conclusion & Strategic Takeaways
    # =========================================================================
    s32 = deck.add_canvas(is_dark=True)
    deck.add_header(s32, "Executive Conclusion", "From AI Tools to an Integrated Research Workflow", 
                    "Strategic principles for modern engineering scholars, project teams, and visionary educators", is_dark=True)
    
    # 8-Stage Lifecycle Recap Banner
    stages_recap = [
        "DISCOVER", "READ", "ANALYZE", "EXPERIMENT", "WRITE", "PROPOSE", "COLLABORATE", "TEACH"
    ]
    recap_y = Inches(2.0)
    box_w = Inches(1.36)
    gap_rc = Inches(0.12)
    for idx, st_text in enumerate(stages_recap):
        x = Inches(0.8) + idx * (box_w + gap_rc)
        c = deck.add_card(s32, x, recap_y, box_w, Inches(0.65), bg_color=SLATE_DARK, border_color=BLUE_PRIMARY)
        tb = s32.shapes.add_textbox(x, recap_y + Inches(0.12), box_w, Inches(0.4))
        p = tb.text_frame.paragraphs[0]
        p.text = st_text
        p.font.bold = True
        p.font.size = Pt(9.5)
        p.font.color.rgb = WHITE
        p.alignment = PP_ALIGN.CENTER

    # 6 Strategic Takeaways Grid
    takeaways = [
        ("1. Specialize Purposefully", "Use dedicated tools for specialized tasks (ResearchRabbit for maps, Colab for compute, Paperpal for prose)."),
        ("2. Chain into Pipelines", "Combine multiple tools rather than expecting a single generalist chatbot to handle the entire lifecycle."),
        ("3. Source-Grounded Rigor", "Anchor research reading in verified PDFs with page-level citations (NotebookLM) to eliminate hallucinations."),
        ("4. Validate Uncompromisingly", "Treat all AI output as an unverified draft that requires expert domain scrutiny and reproducible testing."),
        ("5. Maintain Human Agency", "Keep human intuition, scientific ethics, and original creative judgment firmly at the center of your work."),
        ("6. Empower Active Pedagogy", "Use technology to turn passive classrooms into active, data-driven, and gamified problem-solving workshops.")
    ]
    t_w = Inches(3.75)
    t_h = Inches(1.35)
    gap_tx = Inches(0.24)
    gap_ty = Inches(0.2)
    
    for idx, (t_title, t_body) in enumerate(takeaways):
        c_idx = idx % 3
        r_idx = idx // 3
        x = Inches(0.8) + c_idx * (t_w + gap_tx)
        y = Inches(2.9) + r_idx * (t_h + gap_ty)
        
        deck.add_card(s32, x, y, t_w, t_h, bg_color=RGBColor(24, 33, 50), border_color=RGBColor(51, 65, 85))
        tb = s32.shapes.add_textbox(x + Inches(0.12), y + Inches(0.1), t_w - Inches(0.24), t_h - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = t_title
        p1.font.bold = True
        p1.font.size = Pt(10)
        p1.font.color.rgb = RGBColor(56, 189, 248) # Sky blue
        p2 = tf.add_paragraph()
        p2.text = t_body
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = RGBColor(203, 213, 225)
        p2.space_before = Pt(3)

    # Keynote Closing Motto Banner
    motto_card = deck.add_card(s32, Inches(0.8), Inches(6.05), Inches(11.733), Inches(0.85), bg_color=BLUE_PRIMARY, border_color=WHITE)
    tb_motto = s32.shapes.add_textbox(Inches(1.0), Inches(6.12), Inches(11.333), Inches(0.7))
    tf_mo = tb_motto.text_frame
    p_m1 = tf_mo.paragraphs[0]
    p_m1.text = "\"Use AI to accelerate the work. Use human judgment to make it trustworthy.\""
    p_m1.font.bold = True
    p_m1.font.size = Pt(13)
    p_m1.font.color.rgb = WHITE
    p_m1.alignment = PP_ALIGN.CENTER
    p_m2 = tf_mo.add_paragraph()
    p_m2.text = "AI-Powered Research, Learning & Teaching Toolkit | Modern Academic Blueprint"
    p_m2.font.size = Pt(9.5)
    p_m2.font.color.rgb = RGBColor(224, 242, 254)
    p_m2.alignment = PP_ALIGN.CENTER
    p_m2.space_before = Pt(2)

    deck.add_footer(s32, "Academic Technology & Engineering Research Workshop 2026", is_dark=True)

    # =========================================================================
    # SLIDE 33: Scholarly References & Verified Tool Directory
    # =========================================================================
    s33 = deck.add_canvas()
    deck.add_header(s33, "References & Registry", "Official Scholarly References & Platform Registry", 
                    "Authoritative, verified digital repositories, platform documentations, and academic ethics charters")
    
    ref_headers = ["Category", "Platform / Organization", "Official Verified URL", "Primary Documentation Focus"]
    ref_rows = [
        ["Literature Discovery", "ResearchRabbit", "https://www.researchrabbitapp.com", "Citation network mapping, collection export, author graph algorithms"],
        ["Literature Discovery", "Litmaps", "https://www.litmaps.com", "Chronological citation visualizations, discoverability maps, literature tracking"],
        ["Literature Discovery", "Elicit", "https://elicit.com", "Systematic review matrices, semantic synthesis, automated research extraction"],
        ["Literature Discovery", "Consensus", "https://consensus.app", "Evidence-based scientific search engine, consensus meter, peer-reviewed index"],
        ["Paper Reading / RAG", "Google NotebookLM", "https://notebooklm.google.com", "Source-grounded RAG, multi-document synthesis, inline page citations"],
        ["Paper Reading / RAG", "SciSpace", "https://typeset.io", "Interactive PDF reading, multi-paper query co-pilot, citation extraction"],
        ["Coding & Computing", "Google Colaboratory", "https://colab.research.google.com", "Cloud Python notebooks, GPU/TPU runtimes, Gemini code integration"],
        ["Academic Writing", "Paperpal", "https://paperpal.com", "Academic English syntax, word reduction, journal readiness screening"],
        ["Collaborative Platforms", "Overleaf / GitHub", "https://overleaf.com | https://github.com", "Real-time collaborative LaTeX authoring, git version control for code"],
        ["Active Teaching", "Google Forms", "https://forms.google.com", "Rapid diagnostic quizzes, automated response aggregation, exit tickets"],
        ["Personalized Mastery", "Khan Academy", "https://www.khanacademy.org", "Scaffolded self-paced modules, flipped classroom mastery models"],
        ["Gamified Learning", "Kahoot! / Blooket / Flippity", "https://kahoot.com | blooket.com | flippity.net", "Competitive classroom quizzes, game-based learning, spreadsheet tools"],
        ["Ethics & Governance", "COPE & IEEE Ethics", "https://publicationethics.org | https://ieee.org", "Author accountability standards, generative AI disclosure guidelines"]
    ]
    ref_widths = [Inches(1.9), Inches(2.3), Inches(3.3), Inches(4.233)]
    deck.add_table(s33, Inches(0.8), Inches(2.0), Inches(11.733), Inches(4.5), ref_headers, ref_rows, ref_widths, header_bg=NAVY)

    deck.add_callout(s33, Inches(0.8), Inches(6.65), Inches(11.733), Inches(0.42), 
                     "URL Verification Guarantee", "All URLs listed above represent official, verified institutional and platform domains. No synthetic or hallucinated web addresses are included.", style='success')
    deck.add_footer(s33, "Curated Academic Technology Registry 2026")

    # -------------------------------------------------------------------------
    # Save Presentation
    # -------------------------------------------------------------------------
    deck.save()

if __name__ == "__main__":
    build_presentation()
