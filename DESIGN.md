---
name: BEOS
description: A precise field-ledger interface for company operations.
colors:
  engineering-paper: "#f1eee4"
  clean-paper: "#faf8f1"
  operations-navy: "#102b45"
  ink: "#13283d"
  muted-ink: "#536170"
  structural-line: "#c9c7bd"
  strong-line: "#9b9d98"
  signal-orange: "#e55a2f"
  signal-orange-deep: "#b94120"
  success-green: "#23735a"
typography:
  display:
    fontFamily: "Geist, sans-serif"
    fontSize: "clamp(2.4rem, 5vw, 5rem)"
    fontWeight: 620
    lineHeight: 0.96
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.13em"
rounded:
  none: "0"
spacing:
  xs: "0.4rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.signal-orange}"
    textColor: "{colors.clean-paper}"
    rounded: "{rounded.none}"
    padding: "0.68rem 1rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.68rem 1rem"
  input:
    backgroundColor: "{colors.clean-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "2.8rem"
---

# Design System: BEOS

## Overview

**Creative North Star: "The Engineering Field Ledger"**

BEOS treats operational data like a well-kept engineering field ledger: every
record has a place, every boundary communicates structure, and emphasis is
earned through hierarchy rather than decoration. The interface is precise,
calm, and operational. Engineering Paper carries the working surface,
Operations Navy anchors navigation and identity, and Signal Orange marks the
few actions or states that require attention.

The system is document-grade rather than dashboard-like. It favors readable
registers, explicit labels, square controls, and flat structural divisions.
Responsive changes preserve the information hierarchy instead of replacing it
with ornamental mobile patterns.

**Key Characteristics:**

- Flat, bordered working surfaces with square corners
- Large, tightly tracked headings paired with technical mono labels
- Restrained Signal Orange reserved for action and orientation
- Dense enough for real work, with generous separation between major regions
- Explicit loading, empty, error, denied, and active states

## Colors

The palette combines warm working paper with deep operational ink and one rare,
high-visibility signal.

### Primary

- **Signal Orange** (`#e55a2f`): Primary actions, the BE mark, and decisive
  orientation cues. Deep Signal Orange (`#b94120`) supplies hover and readable
  text accents.

### Neutral

- **Engineering Paper** (`#f1eee4`): The application ground.
- **Clean Paper** (`#faf8f1`): Fields and foreground working surfaces.
- **Operations Navy** (`#102b45`): Persistent navigation and high-authority
  fields.
- **Ink** (`#13283d`): Primary text and high-contrast structure.
- **Muted Ink** (`#536170`): Supporting copy and metadata.
- **Structural Line** (`#c9c7bd`) and **Strong Line** (`#9b9d98`): Dividers,
  fields, and state boundaries.

**The Signal Rarity Rule.** Signal Orange identifies action or location; it
does not become a decorative fill across unrelated regions.

## Typography

**Display Font:** Geist with a sans-serif fallback  
**Body Font:** Geist with a sans-serif fallback  
**Label/Mono Font:** Geist Mono with a monospace fallback

**Character:** Geist keeps records direct and contemporary. Geist Mono gives
coordinates, labels, statuses, and system context the measured cadence of
technical notation.

### Hierarchy

- **Display** (620, `clamp(2.4rem, 5vw, 5rem)`, `0.96`): Page purpose and major
  workspace headings.
- **Title** (600–750, `1rem–1.55rem`): Panels, records, and form regions.
- **Body** (400–600, `0.875rem–1rem`, up to `1.65`): Instructions and record
  content, normally constrained to readable line lengths.
- **Label** (700, `0.62rem–0.72rem`, tracked uppercase): Coordinates, field
  labels, scope, status, and navigation group names.

**The Two-Voice Rule.** Sans-serif explains the work; mono labels locate and
classify it. Mono is not used for long prose.

## Layout

The desktop workspace uses a fixed `16.5rem` Operations Navy rail and a fluid
main canvas. Content is centered at a maximum width of `92rem`, with responsive
horizontal padding between `1.2rem` and `3.2rem`. Major regions use clear rules
and one- or two-column structures; registers may use three columns when their
entries are directly comparable.

At `1100px`, management splits collapse to one column. At `800px`, the rail
becomes an off-canvas drawer, comparable grids stack, and the header exposes a
menu control. Mobile content retains the same reading order and uses natural
vertical scrolling without horizontal overflow.

## Elevation & Depth

The workspace is flat and structural. Depth comes from tonal contrast,
overlapping mobile navigation, and border hierarchy rather than card shadows.
The authentication form may use one restrained ambient shadow to separate the
entry surface; this is an exception, not a general container style.

**The Flat Working Surface Rule.** Workspace panels remain flat at rest.
Interaction is communicated through color, rules, and movement of no more than
one pixel rather than floating card stacks.

## Shapes

Corners are square (`0` radius). One-pixel rules define regions, inputs, active
navigation, and records. Avatars, marks, buttons, and badges use compact
rectilinear silhouettes. Circular pills, excessive clipping, glass panels, and
rounded SaaS cards are outside the system.

## Components

### Buttons

- **Shape:** Square, minimum height `2.65rem`, with a one-pixel boundary where
  needed.
- **Primary:** Signal Orange with Clean Paper text and `0.68rem 1rem` padding.
- **Hover / Focus:** Deepen the color or lift by one pixel; preserve the global
  visible focus ring.
- **Secondary / Quiet / Danger:** Transparent bordered, borderless text action,
  and reserved red destructive action respectively.

### Cards / Containers

- **Corner Style:** Square.
- **Background:** Clean Paper over Engineering Paper, or Operations Navy for
  persistent navigation.
- **Shadow Strategy:** None in the workspace.
- **Border:** One-pixel Structural Line; Strong Line for decisive boundaries.
- **Internal Padding:** Normally `1rem–2.4rem`, proportional to information
  density.

### Inputs / Fields

- **Style:** `2.8rem` high, Clean Paper, square corners, Strong Line border, and
  at least `1rem` text to avoid mobile zoom.
- **Focus:** Signal Orange border with a restrained translucent outline.
- **Error / Disabled:** Explicit red message and border; disabled controls stay
  legible and visibly inactive.

### Navigation

The Operations Navy rail uses muted labels, light links, and a low-contrast
active field with a one-pixel Signal Orange inset. Mobile navigation becomes a
focused drawer with a scrim and Escape dismissal. Header coordinates remain
mono, compact, and secondary to page content.

### Registers

Registers align comparable operational facts beneath one ruled header. Values,
scope, owners, timestamps, and actions remain easy to scan without turning each
row into a separate floating card.

## Do's and Don'ts

### Do:

- **Do** use persisted product data and truthful empty or unavailable states.
- **Do** align record metadata and actions into ruled registers.
- **Do** reserve Signal Orange for real action, state, and orientation.
- **Do** preserve square controls, visible focus, and readable mobile type.
- **Do** let typography and spacing establish hierarchy before adding chrome.

### Don't:

- **Don't** use rounded SaaS cards, decorative metric grids, floating glass
  panels, or ornamental dashboard clutter.
- **Don't** invent company metrics, activity, files, notifications, or proof to
  make an empty surface appear populated.
- **Don't** add shadows to routine workspace panels.
- **Don't** turn every section into an isolated card or every status into a
  colorful pill.
- **Don't** expose implementation or security mechanics in ordinary product
  copy.
