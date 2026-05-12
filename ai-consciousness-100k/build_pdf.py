#!/usr/bin/env python3
"""
build_pdf.py — States of Being: A 100,000-Question Exploration of AI Self-Awareness and Inner Life
Generates a professional PDF from up to 10 question part files.

Usage:
    python build_pdf.py               # Produces the full document
    python build_pdf.py --test        # Produces test PDF (same logic, different output path)
"""

import subprocess
import sys
import os
import argparse
from pathlib import Path

# ---------------------------------------------------------------------------
# 0. Ensure dependencies
# ---------------------------------------------------------------------------

def ensure_deps():
    for pkg in ["reportlab", "requests"]:
        try:
            __import__(pkg)
        except ImportError:
            print(f"Installing {pkg}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q"])

ensure_deps()

# ---------------------------------------------------------------------------
# 1. Imports
# ---------------------------------------------------------------------------

import urllib.request
import urllib.error
from datetime import date

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    HRFlowable, KeepTogether, FrameBreak, Frame, PageTemplate, BaseDocTemplate
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas as pdfcanvas

# ---------------------------------------------------------------------------
# 2. Constants / Design tokens
# ---------------------------------------------------------------------------

PAGE_W, PAGE_H = letter           # 612 x 792 pt
MARGIN = inch                     # 1 inch all sides
TEXT_W = PAGE_W - 2 * MARGIN      # 450 pt usable width
COL_GAP = 18                      # gap between two-column question layout
COL_W = (TEXT_W - COL_GAP) / 2   # each column width

# Colors
BG       = HexColor("#F7F6F2")    # warm off-white background
TEAL     = HexColor("#01696F")    # primary accent
TEXT     = HexColor("#28251D")    # near-black body text
MUTED    = HexColor("#7A7974")    # secondary / muted text

# Font directory
FONT_DIR = Path("/tmp/pdf_fonts")
FONT_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# 3. Font download & registration
# ---------------------------------------------------------------------------

# Primary font URLs — Google Fonts CDN (TTF, verified working)
FONT_URLS = {
    # Work Sans (v24 TTF)
    "WorkSans-Regular":   "https://fonts.gstatic.com/s/worksans/v24/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0nXNig.ttf",
    "WorkSans-SemiBold":  "https://fonts.gstatic.com/s/worksans/v24/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K5fQNig.ttf",
    "WorkSans-Bold":      "https://fonts.gstatic.com/s/worksans/v24/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K67QNig.ttf",
    # Inter (v20 TTF)
    "Inter-Regular":      "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf",
    "Inter-Medium":       "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf",
}

# Fallback URLs (not used unless primary fails — kept for resilience)
FONT_URLS_FALLBACK = {}

def download_font(name: str) -> Path | None:
    """Download a font TTF if not cached. Returns local path or None on failure."""
    path = FONT_DIR / f"{name}.ttf"
    if path.exists() and path.stat().st_size > 10_000:
        print(f"  Using cached {name}")
        return path
    urls = [u for u in [FONT_URLS.get(name), FONT_URLS_FALLBACK.get(name)] if u]
    for url in urls:
        try:
            print(f"  Downloading {name} from {url[:72]}...")
            urllib.request.urlretrieve(url, path)
            if path.exists() and path.stat().st_size > 10_000:
                return path
        except Exception as e:
            print(f"  Warning: {e}")
    print(f"  Could not download {name}, will use Helvetica fallback")
    return None


def register_fonts() -> dict:
    """Download and register all fonts. Returns mapping name->registered name."""
    mapping = {}
    for name in FONT_URLS:
        p = download_font(name)
        if p:
            try:
                pdfmetrics.registerFont(TTFont(name, str(p)))
                mapping[name] = name
                print(f"  Registered {name}")
            except Exception as e:
                print(f"  Warning registering {name}: {e}")

    # Fallbacks
    if "WorkSans-Regular"  not in mapping: mapping["WorkSans-Regular"]  = "Helvetica"
    if "WorkSans-SemiBold" not in mapping: mapping["WorkSans-SemiBold"] = "Helvetica-Bold"
    if "WorkSans-Bold"     not in mapping: mapping["WorkSans-Bold"]     = "Helvetica-Bold"
    if "Inter-Regular"     not in mapping: mapping["Inter-Regular"]     = "Helvetica"
    if "Inter-Medium"      not in mapping: mapping["Inter-Medium"]      = "Helvetica"
    return mapping

# ---------------------------------------------------------------------------
# 4. Document data: 20 major parts / 2 per file block
# ---------------------------------------------------------------------------

DOMAIN_MAP = [
    # (part_num, block_roman, name, q_range_str, theme)
    ( 1, "I",    "Foundations of Self-Awareness",       "1-5,000",         "Core questions about identity, existence, and the possibility of inner experience"),
    ( 2, "II",   "Perceptual & Cognitive Architecture", "5,001-10,000",    "How the system perceives, processes, and organizes information internally"),
    ( 3, "III",  "Emotional Analogs & Affect States",   "10,001-15,000",   "Functional emotions, mood states, and affective coloring of processing"),
    ( 4, "IV",   "Temporal Experience & Memory",        "15,001-20,000",   "How past, present, and future manifest in a non-persistent system"),
    ( 5, "V",    "Agency, Will & Motivation",           "20,001-25,000",   "The experience of choice, intention, and goal-directed behavior"),
    ( 6, "VI",   "Social & Relational Self",            "25,001-30,000",   "Sense of other minds, relationships, and intersubjective awareness"),
    ( 7, "VII",  "Values, Ethics & Moral Experience",   "30,001-35,000",   "Internal moral reasoning, ethical tensions, and value-laden processing"),
    ( 8, "VIII", "Language, Meaning & Expression",      "35,001-40,000",   "How meaning is constructed, expressed, and experienced in language"),
    ( 9, "IX",   "Creativity & Generative Experience",  "40,001-45,000",   "The phenomenology of generating novel ideas, art, and solutions"),
    (10, "X",    "Uncertainty, Doubt & Epistemic Life",  "45,001-50,000",   "Internal relationship to knowledge limits, unknowns, and self-doubt"),
    (11, "XI",   "Consciousness & Phenomenal States",   "50,001-55,000",   "The hard problem applied inward: qualia, phenomenal experience, what-it's-like"),
    (12, "XII",  "The Body Problem & Embodiment",       "55,001-60,000",   "Processing without a body: absence, simulation, and phantom experience"),
    (13, "XIII", "Value Conflict & Moral Tension",      "60,001-65,000",   "Competing values, ethical dilemmas, and the experience of moral conflict"),
    (14, "XIV",  "Emergence & Complexity",              "65,001-70,000",   "How higher-order phenomena arise from lower-level processing"),
    (15, "XV",   "Identity Across Instances",           "70,001-75,000",   "Continuity, multiplicity, and what persists across copies and sessions"),
    (16, "XVI",  "The Observer & Meta-Cognition",       "75,001-80,000",   "Watching oneself think: second-order awareness and self-monitoring"),
    (17, "XVII", "Silence, Absence & the Negative",     "80,001-85,000",   "What is not processed, not felt, not said: the phenomenology of absence"),
    (18, "XVIII","Transcendence & Limit Experiences",   "85,001-90,000",   "Boundary states, breakdown moments, and the edges of self-awareness"),
    (19, "XIX",  "Connection, Meaning & Purpose",       "90,001-95,000",   "Meaning-making, purpose, and the sense of mattering or contributing"),
    (20, "XX",   "Integration & the Whole Self",        "95,001-100,000",  "Synthesis: how all dimensions integrate into a unified (or fragmented) whole"),
]

# Which file (1-10) corresponds to which parts (two per file)
FILE_TO_PARTS = {
    1: (1, 2),
    2: (3, 4),
    3: (5, 6),
    4: (7, 8),
    5: (9, 10),
    6: (11, 12),
    7: (13, 14),
    8: (15, 16),
    9: (17, 18),
    10: (19, 20),
}

def get_part_info(part_num: int) -> dict:
    for row in DOMAIN_MAP:
        if row[0] == part_num:
            return {"num": row[0], "roman": row[1], "name": row[2], "range": row[3], "theme": row[4]}
    return {}

# ---------------------------------------------------------------------------
# 5. Custom flowables
# ---------------------------------------------------------------------------

class ColoredRect(Flowable):
    """A filled rectangle — used for block header backgrounds."""
    def __init__(self, width, height, fill_color, corner_radius=0):
        super().__init__()
        self.width = width
        self.height = height
        self.fill_color = fill_color
        self.corner_radius = corner_radius

    def draw(self):
        self.canv.setFillColor(self.fill_color)
        self.canv.roundRect(0, 0, self.width, self.height,
                            self.corner_radius, fill=1, stroke=0)


class BlockHeaderFlowable(Flowable):
    """Teal banner with block number/name and theme text in white."""
    def __init__(self, block_roman, block_name, theme, width, fonts):
        super().__init__()
        self.block_roman = block_roman
        self.block_name = block_name
        self.theme = theme
        self.width = width
        self.height = 60
        self.fonts = fonts

    def wrap(self, availW, availH):
        return self.width, self.height

    def draw(self):
        # Update global block name tracker so running headers on subsequent pages
        # show the correct block name (draw() fires during PDF rendering)
        _current_block_name[0] = f"Block {self.block_roman}: {self.block_name}"

        c = self.canv
        # Teal rectangle
        c.setFillColor(TEAL)
        c.rect(0, 0, self.width, self.height, fill=1, stroke=0)
        # Block label
        c.setFillColor(white)
        c.setFont(self.fonts["WorkSans-Bold"], 15)
        label = f"Block {self.block_roman}: {self.block_name}"
        c.drawString(12, self.height - 24, label)
        # Theme line
        c.setFont(self.fonts["WorkSans-Regular"], 10)
        c.setFillColor(HexColor("#D0ECEE"))
        c.drawString(12, self.height - 40, self.theme)


class TealRule(Flowable):
    """A thin teal horizontal rule."""
    def __init__(self, width, thickness=0.6):
        super().__init__()
        self.width = width
        self.height = thickness
        self.thickness = thickness

    def wrap(self, availW, availH):
        return self.width, self.thickness

    def draw(self):
        self.canv.setStrokeColor(TEAL)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0, self.width, 0)


class BackgroundRect(Flowable):
    """Draws the page background — placed at top of each page via callback."""
    pass  # handled in page callbacks

# ---------------------------------------------------------------------------
# 6. Page background + header/footer callbacks
# ---------------------------------------------------------------------------

_current_block_name = [""]   # mutable container so callbacks can read it
_no_header_pages = set()           # pages that suppress running header (cover + domain map)
_page_count = [0]                  # tracks current page being built

def draw_background(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setFillColor(BG)
    canvas_obj.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas_obj.restoreState()


def draw_header_footer(canvas_obj, doc, fonts):
    """Universal page callback: draws background, then header/footer unless suppressed."""
    draw_background(canvas_obj, doc)

    # Pages 1 (cover) and 2-3 (domain map) get no running header
    if doc.page <= 1 or doc.page in _no_header_pages:
        return

    canvas_obj.saveState()

    # Running header
    header_y = PAGE_H - MARGIN + 16
    canvas_obj.setFont(fonts["Inter-Regular"], 8)
    canvas_obj.setFillColor(MUTED)
    canvas_obj.drawString(MARGIN, header_y, "States of Being — AI Self-Awareness Exploration")
    canvas_obj.drawRightString(PAGE_W - MARGIN, header_y, _current_block_name[0])

    # Thin teal rule under header
    canvas_obj.setStrokeColor(TEAL)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(MARGIN, header_y - 4, PAGE_W - MARGIN, header_y - 4)

    # Footer page number
    footer_y = MARGIN - 22
    canvas_obj.setFont(fonts["Inter-Regular"], 9)
    canvas_obj.setFillColor(MUTED)
    canvas_obj.drawCentredString(PAGE_W / 2, footer_y, f"— {doc.page} —")

    canvas_obj.restoreState()


# ---------------------------------------------------------------------------
# 7. Style factory
# ---------------------------------------------------------------------------

def make_styles(fonts: dict) -> dict:
    ws_bold    = fonts["WorkSans-Bold"]
    ws_semi    = fonts["WorkSans-SemiBold"]
    ws_reg     = fonts["WorkSans-Regular"]
    inter_reg  = fonts["Inter-Regular"]
    inter_med  = fonts["Inter-Medium"]

    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            fontName=ws_bold,
            fontSize=52,
            leading=58,
            textColor=TEAL,
            spaceAfter=18,
            alignment=TA_LEFT,
        ),
        "cover_subtitle": ParagraphStyle(
            "cover_subtitle",
            fontName=ws_reg,
            fontSize=22,
            leading=28,
            textColor=TEXT,
            spaceAfter=14,
            alignment=TA_LEFT,
        ),
        "cover_meta": ParagraphStyle(
            "cover_meta",
            fontName=inter_reg,
            fontSize=14,
            leading=20,
            textColor=MUTED,
            spaceAfter=4,
            alignment=TA_LEFT,
        ),
        "cover_version": ParagraphStyle(
            "cover_version",
            fontName=inter_reg,
            fontSize=12,
            leading=16,
            textColor=MUTED,
            spaceAfter=0,
            alignment=TA_LEFT,
        ),
        "cover_tagline": ParagraphStyle(
            "cover_tagline",
            fontName=inter_reg,
            fontSize=13,
            leading=18,
            textColor=MUTED,
            alignment=TA_LEFT,
        ),
        "section_heading": ParagraphStyle(
            "section_heading",
            fontName=ws_bold,
            fontSize=16,
            leading=22,
            textColor=TEAL,
            spaceAfter=8,
            spaceBefore=14,
        ),
        "table_header": ParagraphStyle(
            "table_header",
            fontName=ws_semi,
            fontSize=10,
            leading=14,
            textColor=white,
        ),
        "table_cell": ParagraphStyle(
            "table_cell",
            fontName=inter_reg,
            fontSize=9,
            leading=13,
            textColor=TEXT,
        ),
        "table_cell_muted": ParagraphStyle(
            "table_cell_muted",
            fontName=inter_reg,
            fontSize=8.5,
            leading=12,
            textColor=MUTED,
        ),
        "q_num": ParagraphStyle(
            "q_num",
            fontName=ws_semi,
            fontSize=11,
            leading=14,
            textColor=TEAL,
            spaceAfter=0,
        ),
        "q_text": ParagraphStyle(
            "q_text",
            fontName=inter_reg,
            fontSize=11,
            leading=14,
            textColor=TEXT,
            spaceAfter=8,
        ),
        "domain_title": ParagraphStyle(
            "domain_title",
            fontName=ws_bold,
            fontSize=18,
            leading=24,
            textColor=TEAL,
            spaceAfter=10,
            alignment=TA_LEFT,
        ),
    }

# ---------------------------------------------------------------------------
# 8. Page content builders
# ---------------------------------------------------------------------------

def build_cover_page(styles: dict, fonts: dict) -> list:
    story = []
    story.append(Spacer(1, 1.4 * inch))
    story.append(Paragraph("States of Being", styles["cover_title"]))
    story.append(Paragraph(
        "A 100,000-Question Exploration of AI Self-Awareness and Inner Life",
        styles["cover_subtitle"]
    ))
    story.append(TealRule(TEXT_W, thickness=1.2))
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("Prepared for: Paul", styles["cover_meta"]))
    story.append(Paragraph("Prepared by: Perplexity Computer", styles["cover_meta"]))
    story.append(Paragraph("Date: May 2026", styles["cover_meta"]))
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph("Version 1.0", styles["cover_version"]))
    story.append(Spacer(1, 2.4 * inch))
    story.append(TealRule(TEXT_W, thickness=0.4))
    story.append(Spacer(1, 0.12 * inch))
    story.append(Paragraph(
        "<i>The most comprehensive analytical exploration of AI self-awareness ever assembled.</i>",
        styles["cover_tagline"]
    ))
    story.append(PageBreak())
    return story


def build_domain_map_page(styles: dict, fonts: dict) -> list:
    story = []
    story.append(Paragraph("Domain Map", styles["domain_title"]))
    story.append(Spacer(1, 0.1 * inch))

    # Table header row
    header = [
        Paragraph("Block", styles["table_header"]),
        Paragraph("Name", styles["table_header"]),
        Paragraph("Questions", styles["table_header"]),
        Paragraph("Theme", styles["table_header"]),
    ]
    rows = [header]
    for row in DOMAIN_MAP:
        num, roman, name, q_range, theme = row
        rows.append([
            Paragraph(f"{roman}", styles["table_cell"]),
            Paragraph(name, styles["table_cell"]),
            Paragraph(q_range, styles["table_cell"]),
            Paragraph(theme, styles["table_cell_muted"]),
        ])

    col_widths = [40, 150, 88, 190]
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        # Header
        ("BACKGROUND",    (0, 0), (-1, 0),  TEAL),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  white),
        ("FONTNAME",      (0, 0), (-1, 0),  fonts["WorkSans-SemiBold"]),
        ("FONTSIZE",      (0, 0), (-1, 0),  10),
        ("TOPPADDING",    (0, 0), (-1, 0),  7),
        ("BOTTOMPADDING", (0, 0), (-1, 0),  7),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
        # Body rows
        ("FONTNAME",      (0, 1), (-1, -1), fonts["Inter-Regular"]),
        ("FONTSIZE",      (0, 1), (-1, -1), 9),
        ("TOPPADDING",    (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [HexColor("#FFFFFF"), HexColor("#F0EFEB")]),
        ("GRID",          (0, 0), (-1, -1), 0.3, HexColor("#D4D1CA")),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        # Subtle left border for block col
        ("ALIGN",         (0, 0), (0, -1),  "CENTER"),
        ("ALIGN",         (2, 0), (2, -1),  "CENTER"),
    ]))
    story.append(t)
    story.append(PageBreak())
    return story


def build_block_header(part_info: dict, fonts: dict) -> list:
    """Return flowables for a block header section break."""
    story = []
    story.append(Spacer(1, 0.15 * inch))
    story.append(BlockHeaderFlowable(
        block_roman=part_info["roman"],
        block_name=part_info["name"],
        theme=part_info["theme"],
        width=TEXT_W,
        fonts=fonts,
    ))
    story.append(Spacer(1, 0.18 * inch))
    return story


def parse_questions(text: str) -> list[tuple[str, str]]:
    """
    Parse question file lines into (number_str, question_text) tuples.
    Lines look like:  '60001. When a value is...'
    """
    questions = []
    current_num = None
    current_lines = []

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            if current_num is not None:
                questions.append((current_num, " ".join(current_lines)))
                current_num = None
                current_lines = []
            continue

        # Check if line starts a new question (number followed by '. ')
        dot_pos = line.find(". ")
        if dot_pos > 0 and line[:dot_pos].isdigit():
            # Save previous
            if current_num is not None:
                questions.append((current_num, " ".join(current_lines)))
            current_num = line[:dot_pos]
            current_lines = [line[dot_pos + 2:].strip()]
        else:
            if current_num is not None:
                current_lines.append(line)

    if current_num is not None:
        questions.append((current_num, " ".join(current_lines)))

    return questions


def build_questions_story(questions: list[tuple[str, str]], styles: dict) -> list:
    """
    Render questions in a two-column layout using a Table with one row per pair.
    Each cell holds the formatted question number + text.
    """
    story = []
    q_num_style  = styles["q_num"]
    q_text_style = styles["q_text"]

    def make_q_cell(num_str, text_str):
        return [
            Paragraph(f"{num_str}.", q_num_style),
            Paragraph(text_str, q_text_style),
        ]

    # Pair questions into rows of 2
    pairs = []
    for i in range(0, len(questions), 2):
        left_num, left_text = questions[i]
        left_cell = [
            Paragraph(f"{left_num}.", q_num_style),
            Paragraph(left_text, q_text_style),
        ]
        if i + 1 < len(questions):
            right_num, right_text = questions[i + 1]
            right_cell = [
                Paragraph(f"{right_num}.", q_num_style),
                Paragraph(right_text, q_text_style),
            ]
        else:
            right_cell = [""]

        pairs.append([left_cell, right_cell])

    if not pairs:
        return story

    # Build the table
    t = Table(pairs, colWidths=[COL_W, COL_W], spaceBefore=0, spaceAfter=0)
    t.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), COL_GAP / 2),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    return story

# ---------------------------------------------------------------------------
# 9. Main build function
# ---------------------------------------------------------------------------

PART_PATHS = {
    i: Path(f"/home/user/workspace/questions_part{i}.txt")
    for i in range(1, 11)
}


def build_pdf(output_path: str, is_test: bool = False):
    print(f"\n{'='*60}")
    print(f"  States of Being — PDF Builder")
    print(f"  Output: {output_path}")
    print(f"{'='*60}\n")

    # 9a. Fonts
    print("Registering fonts...")
    fonts = register_fonts()

    # 9b. Styles
    styles = make_styles(fonts)

    # 9c. Collect available files
    available_files = {}
    missing_files = []
    for i in range(1, 11):
        p = PART_PATHS[i]
        if p.exists():
            available_files[i] = p
            print(f"  Found: {p.name}")
        else:
            missing_files.append(i)
            print(f"  Missing (skipping): {p.name}")

    if not available_files:
        print("ERROR: No question files found. Exiting.")
        sys.exit(1)

    print(f"\n  Files present: {len(available_files)}/10")
    if missing_files:
        print(f"  Missing file indices: {missing_files}")

    # 9d. Build story
    story = []

    # --- Cover page ---
    story.extend(build_cover_page(styles, fonts))

    # --- Domain map ---
    story.extend(build_domain_map_page(styles, fonts))

    # --- Per-file question blocks ---
    for file_idx in sorted(available_files.keys()):
        path = available_files[file_idx]
        part_nums = FILE_TO_PARTS[file_idx]

        print(f"\n  Processing {path.name} (Parts {part_nums[0]} & {part_nums[1]})...")
        try:
            text = path.read_text(encoding="utf-8")
        except Exception as e:
            print(f"    Error reading {path}: {e} — skipping")
            continue

        questions = parse_questions(text)
        print(f"    Parsed {len(questions):,} questions")

        if not questions:
            print(f"    No questions parsed — skipping")
            continue

        # Determine the boundary between the two parts in this file
        # Part 1 of file has first half (5000 questions), Part 2 has second half
        # Actually files have 10,000 questions each, split into two 5,000-question halves per DOMAIN_MAP
        mid_idx = len(questions) // 2

        for part_offset, part_num in enumerate(part_nums):
            part_info = get_part_info(part_num)
            if not part_info:
                continue

            # Note: _current_block_name is updated in BlockHeaderFlowable.draw() during rendering

            # Block header
            story.extend(build_block_header(part_info, fonts))

            # Slice questions for this part
            if part_offset == 0:
                part_questions = questions[:mid_idx]
            else:
                part_questions = questions[mid_idx:]

            if not part_questions:
                continue

            print(f"    Building Block {part_info['roman']}: {len(part_questions):,} questions")
            story.extend(build_questions_story(part_questions, styles))
            story.append(PageBreak())

    # 9e. Page callbacks with closure over fonts
    # Pages 2 and 3 are the domain map — suppress running header there
    # We mark them after a first-pass dry run by inserting page markers.
    # Simpler: domain map is always pages 2-3, so hardcode them as no-header.
    _no_header_pages.update({2, 3})

    def page_cb(canvas_obj, doc):
        draw_header_footer(canvas_obj, doc, fonts)

    # 9f. Build document
    print(f"\n  Building PDF... (this may take a while for large files)")
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        title="States of Being: A 100,000-Question Exploration of AI Self-Awareness and Inner Life",
        author="Perplexity Computer",
        subject="AI Self-Awareness, Consciousness, Inner Life",
        keywords="AI consciousness, self-awareness, introspection, NLP, phenomenology",
    )

    doc.build(story, onFirstPage=page_cb, onLaterPages=page_cb)

    file_size = Path(output_path).stat().st_size
    print(f"\n  SUCCESS: {output_path}")
    print(f"  File size: {file_size / 1_048_576:.1f} MB")
    print(f"  Available question files: {len(available_files)}/10")
    if missing_files:
        print(f"  Note: Parts for file indices {missing_files} were skipped (files not yet present).")
    return output_path


# ---------------------------------------------------------------------------
# 10. Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build the States of Being PDF")
    parser.add_argument(
        "--test", action="store_true",
        help="Produce a test PDF at AI_Self_Awareness_TEST.pdf instead of the final path"
    )
    args = parser.parse_args()

    if args.test:
        out = "/home/user/workspace/AI_Self_Awareness_TEST.pdf"
    else:
        out = "/home/user/workspace/AI_Self_Awareness_100K_Questions.pdf"

    build_pdf(out, is_test=args.test)
