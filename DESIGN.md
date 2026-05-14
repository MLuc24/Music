---
name: Nhac
description: Local-first YouTube audio downloader and listening library for personal playback.
colors:
  burnished-amber: "#aa6b43"
  amber-glow: "#cf9d55"
  ember-brown: "#935838"
  paper-base: "#f5f0e7"
  oat-surface: "#efe7da"
  porcelain-surface: "#fffdfa"
  linen-surface: "#f5efe4"
  sand-surface: "#ece3d4"
  hover-wash: "#f3ecdf"
  ink-brown: "#2b2119"
  cedar-text: "#7b6654"
  dust-text: "#a4917b"
  success-green: "#15803d"
  error-red: "#dc2626"
  rail-panel: "#fffcf7c7"
  panel-white: "#ffffffd1"
  queue-wash: "#513b2b14"
  overlay-veil: "#22191252"
typography:
  display:
    fontFamily: "\"Segoe UI\", \"Trebuchet MS\", Verdana, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "\"Segoe UI\", \"Trebuchet MS\", Verdana, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  title:
    fontFamily: "\"Segoe UI\", \"Trebuchet MS\", Verdana, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "\"Segoe UI\", \"Trebuchet MS\", Verdana, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "\"Segoe UI\", \"Trebuchet MS\", Verdana, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "22px"
  hero: "24px"
  grand: "26px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "18px"
  section: "24px"
  roomy: "28px"
components:
  button-primary:
    backgroundColor: "{colors.burnished-amber}"
    textColor: "{colors.porcelain-surface}"
    rounded: "{rounded.lg}"
    padding: "14px 28px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.ember-brown}"
    textColor: "{colors.porcelain-surface}"
    rounded: "{rounded.lg}"
    padding: "14px 28px"
    typography: "{typography.body}"
  button-secondary:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.ink-brown}"
    rounded: "14px"
    padding: "12px 14px"
    typography: "{typography.body}"
  input-default:
    backgroundColor: "{colors.porcelain-surface}"
    textColor: "{colors.ink-brown}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
    typography: "{typography.body}"
  nav-item:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.cedar-text}"
    rounded: "14px"
    padding: "12px 14px"
    typography: "{typography.body}"
  nav-item-active:
    backgroundColor: "{colors.oat-surface}"
    textColor: "{colors.ink-brown}"
    rounded: "14px"
    padding: "12px 14px"
    typography: "{typography.body}"
  card-panel:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.ink-brown}"
    rounded: "{rounded.xl}"
    padding: "18px"
    typography: "{typography.body}"
  toast-panel:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.ink-brown}"
    rounded: "18px"
    padding: "14px 16px"
    typography: "{typography.body}"
---

# Design System: Nhac

## Overview

**Creative North Star: "The Warm Archive"**

Nhac should feel like a curated local listening library, not a flashy streaming promo surface. The interface is tactile and dependable: soft paper-toned layers, a single burnished accent, and controls that feel ready for daily use. The app is allowed to be dense because users are in a task, but the density must read as organized, not crowded.

This system rejects decorative SaaS behavior. It must not drift into gradient purple-blue AI generic styling, overbuilt marketing polish, or stacks of nested cards competing for attention. Surfaces stay warm, focused, and legible, with the strongest emphasis reserved for the downloader, playback controls, active selection, and progress feedback.

Depth is present, but only to separate layers and states. Rail, panel, modal, toast, and command-palette surfaces use lift to establish structure, not atmosphere for its own sake. If a screen starts to feel showroom-polished instead of library-usable, the system has gone off-course.

**Key Characteristics:**
- Warm neutral surfaces with one amber action family.
- Familiar product patterns, tuned for daily keyboard-and-mouse use.
- Strong text contrast and explicit state feedback.
- Structural layering instead of ornamental depth.
- Content-first density, especially in library and queue views.

## Colors

The palette is restrained and warm: paper neutrals carry almost the whole surface, while Burnished Amber appears only where the interface needs direction, progress, or active emphasis.

### Primary
- **Burnished Amber** (`#aa6b43`): The main action color for primary buttons, selected navigation, progress fills, and focus-adjacent emphasis when the interface needs a clear next step.

### Secondary
- **Amber Glow** (`#cf9d55`): A brighter companion used inside gradients, active progress states, and warm highlights where the primary accent needs lift without switching hue families.

### Tertiary
- **Ember Brown** (`#935838`): The pressed and hover-deep tone for the main accent family. It keeps interaction states grounded and avoids synthetic saturation spikes.

### Neutral
- **Paper Base** (`#f5f0e7`): The page-wide foundation. Use for the main app field and broad background areas.
- **Oat Surface** (`#efe7da`): A warmer secondary field for larger shell transitions and gradient-backed shells.
- **Porcelain Surface** (`#fffdfa`): The cleanest content surface for cards, forms, and primary reading zones.
- **Linen Surface** (`#f5efe4`): The first tonal step down from porcelain, used for inputs, secondary panels, and soft distinction between adjacent blocks.
- **Sand Surface** (`#ece3d4`): The denser neutral for tracks, skeletons, and quieter background separation.
- **Hover Wash** (`#f3ecdf`): Hover-only surface tint for list rows and interactive containers.
- **Ink Brown** (`#2b2119`): The primary reading color. All critical labels and titles live here.
- **Cedar Text** (`#7b6654`): Secondary metadata, helper text, timestamps, and support copy.
- **Dust Text** (`#a4917b`): Tertiary text, placeholders, and low-priority affordances only.
- **Error Red** (`#dc2626`): Error copy and destructive feedback.
- **Success Green** (`#15803d`): Success badges and confirmed completion states.

**The Accent Scarcity Rule.** Burnished Amber is not decoration. It belongs on primary actions, current selection, progress, and active transport controls only. If amber starts appearing on inactive chrome, the surface has lost discipline.

## Typography

**Display Font:** `Segoe UI` (with `Trebuchet MS`, `Verdana`, `sans-serif`)
**Body Font:** `Segoe UI` (with `Trebuchet MS`, `Verdana`, `sans-serif`)
**Label/Mono Font:** No separate mono family. Labels stay in the main sans stack.

**Character:** The type system is native-feeling, legible, and unpretentious. It behaves like a dependable desktop utility with enough warmth in spacing and weight to avoid feeling sterile.

### Hierarchy
- **Display** (`700`, `34px`, `1`): Reserved for app and dashboard hero titles such as the current section heading.
- **Headline** (`700`, `28px`, `1.05`): Used for home hero values and larger content headers that still sit inside product surfaces.
- **Title** (`700`, `18px`, `1.2`): For rail branding, panel titles, and other compact structural headings.
- **Body** (`400`, `14px`, `1.5`): Default UI copy, forms, list rows, and metadata. Keep prose-like passages within `65-75ch`.
- **Label** (`600`, `12px`, `0.12em` letter-spacing): Used for uppercase eyebrows, small section labels, counts, and category markers.

**The Native Utility Rule.** One sans family carries the whole product. Do not introduce display fonts, stylized numerals, or decorative alternates into buttons, labels, or library metadata.

## Elevation

Nhac uses structural elevation. Shadows separate layers and states: rail against canvas, panels against shell, modal against app, toast against background. Depth exists to make the interface easier to parse, not softer or dreamier. Flatness is acceptable inside a panel, but cross-layer boundaries must stay readable.

### Shadow Vocabulary
- **Panel Lift** (`0 12px 36px rgba(70, 51, 35, 0.08)`): The default panel shadow for dashboard shelves, command palette, toasts, and lifted content groups.
- **Hover Lift** (`0 8px 28px rgba(124, 58, 237, 0.18)`): Used sparingly on album cards and other direct-manipulation surfaces that rise under pointer intent.
- **Action Glow** (`0 4px 16px rgba(170, 107, 67, 0.22)`): The primary action shadow, reserved for playback and download affordances.

**The Separation Rule.** If a shadow does not clarify which layer the user is acting on, it does not belong. Structural ambiguity is the only reason to add more depth.

## Components

Components should feel tactile and focused. They are soft enough to invite use, but precise enough that the user never wonders what is clickable, selected, loading, or pending.

### Buttons
- **Shape:** Soft corners with clear edge definition (`16px` on primary, `14px` on secondary, `10-12px` on utility actions).
- **Primary:** Burnished Amber to Ember Brown gradient with light text, generous horizontal padding (`14px 28px`), and mild lift. Use for download, play, and other decisive actions.
- **Hover / Focus:** Hover rises slightly and deepens contrast. Focus uses a clear `2px` accent outline or a `0 0 0 3px` amber tint ring.
- **Secondary / Ghost / Tertiary:** Secondary controls use translucent white or neutral fills with brown borders. Danger actions stay neutral in structure and change text color to red rather than becoming loud red blocks.

### Chips
- **Style:** Small utility badges use amber-tinted fills (`rgba`-style amber wash in code) with warm borders and compact padding.
- **State:** Chips signal queue count, loop, playback rate, and state markers. They are informational, not decorative.

### Cards / Containers
- **Corner Style:** Large, friendly rounding (`22-26px`) on major containers and `16-18px` on smaller panels.
- **Background:** Lifted panels use translucent white over warm shell backgrounds. Supporting rows use low-contrast brown washes.
- **Shadow Strategy:** Default to Panel Lift. Hover Lift is reserved for directly interactive containers such as album cards.
- **Border:** Thin warm borders (`1px` or `1.5px`) define edges without turning the UI skeletal.
- **Internal Padding:** Standard panel rhythm uses `18px`, `22px`, `24px`, or `28px` depending on prominence.

### Inputs / Fields
- **Style:** Inputs are clean porcelain or linen surfaces with warm brown borders and medium rounding (`12-16px`).
- **Focus:** Focus shifts border color to Burnished Amber and adds a visible tinted ring. This is required, not optional.
- **Error / Disabled:** Error text switches to Error Red. Disabled states reduce emphasis through opacity, never through ambiguity.

### Navigation
- **Style, typography, default/hover/active states, mobile treatment.** The left rail uses stacked rounded items with subtle translucent fills. Active state uses a warm amber wash, not a hard pill or neon fill. On smaller screens the rail collapses into a top section with the same tone and border vocabulary.

### Signature Component
- **Downloader Preview Block:** The downloader pairs an input row, preview card, and progress bar into one compact task module. It should always feel like the fastest path from pasted link to trusted local file, with preview and progress states visually connected to the same warm action family.

## Do's and Don'ts

### Do:
- **Do** keep the surface restrained: warm neutrals first, Burnished Amber second.
- **Do** use strong text contrast with `#2b2119` for core reading and `#7b6654` for metadata.
- **Do** keep primary interactions large enough to hit comfortably, especially play, download, favorite, and queue actions.
- **Do** make loading, empty, and error states explicit and readable. The app is a utility, so silent failure is prohibited.
- **Do** use structural shadows and thin warm borders to separate layers when shell, panel, modal, and toast overlap.

### Don't:
- **Don't** build a giao diện SaaS marketing quá màu mè. This is a listening tool, not a growth page.
- **Don't** use gradient tím/xanh kiểu AI generic anywhere in the active design language.
- **Don't** stack card lồng card quá nhiều, shadow nặng, bo góc quá lớn. If the layout feels puffed up, reduce nesting first.
- **Don't** create layout quá chật, nhiều nút cạnh tranh sự chú ý. Priority must remain obvious at a glance.
- **Don't** allow text contrast thấp hoặc font quá nhỏ, especially in metadata, form hints, and list controls.
- **Don't** use `border-left` or `border-right` greater than `1px` as a colored accent stripe on cards, lists, or alerts.
- **Don't** use gradient text, decorative glassmorphism, or ornamental motion that does not communicate state.
