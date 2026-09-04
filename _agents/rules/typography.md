---
trigger: always_on
description: "Typography and font sizing standards for the v4 Developer Portal."
---

# Typography and Font Sizing Strategy

## 1. Core Principle: Readable, Unified Body Typography
All body text, prose copy, introductory descriptions, section subtitles, and
card summaries must use a unified font size of **1.05rem** (`text-[1.05rem]` /
`font-size: 1.05rem;`) with `leading-relaxed` (or `line-height: 1.6`).

Inconsistent, arbitrary font sizes (such as 1.1rem, 0.9rem, or sub-14px text
for body copy) are strictly prohibited.

## 2. Standard Typographic Hierarchy
- **Page Titles (`h1`)**: `text-4xl font-bold tracking-tight text-slate-900`
  (or `text-3xl` on sub-pages / layouts).
- **Section Headings (`h2`)**: `text-xl font-bold text-slate-900`
  (or `text-2xl`).
- **Card / Subsection Titles (`h3` / card header)**: `text-lg font-semibold`
  `text-slate-900` (or `text-base font-semibold`).
- **Body Text & Descriptions**: `text-[1.05rem] text-slate-600 leading-relaxed`.
  This includes:
  - Page introductory descriptions under headers.
  - Section introductory summaries.
  - Card summaries and description paragraphs.
  - Interactive demo and test box instructions.
  - Markdown content paragraphs (`.guide-content p`, `.prose p`).

## 3. Strict Review for Sub-1.05rem Text
Any text smaller than 1.05rem is considered an exception and requires special
review. Smaller text is permitted ONLY in the following scoped UI contexts:
1. **Metadata Badges & Chips**: Release milestone tags (e.g. `Chrome 153`) and
   status badges use `text-xs font-semibold` (with high-contrast background).
2. **Breadcrumbs & Taxonomy Navigation**: Breadcrumb items and separators use
   `text-xs`.
3. **Hardware / Telemetry Diagnostics**: Oscilloscope readouts, glitch counters,
   and audio hardware telemetry panels use `text-[10px]` or `text-xs font-mono`.
4. **Inline Code & Preformatted Blocks**: Inline code and pre blocks scale
   proportionally with monospace fonts (`font-size: 0.9em` / `0.8125rem`).

Never use `text-xs` (12px) or `text-sm` (14px) for descriptive paragraphs, card
bodies, or user instructions.
