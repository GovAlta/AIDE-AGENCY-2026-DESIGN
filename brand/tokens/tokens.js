/* GENERATED from tokens.json. */
window.AGENCY = {
 "$comment": "Agency 2026 design tokens: the one source for every medium (print, slides, digital, video). Values are taken from the MVAI goa-agency kit (aide-motion-video/engine/kits/goa-agency.js, const C, SPECTRUM, ON_LIGHT, ON_DARK, GROUNDS) and the event invite vectors. Edit here, then run: node scripts/build-tokens.mjs",
 "version": "1.0.0",
 "color": {
  "navy": "#022C4C",
  "navy2": "#0E3B63",
  "ink": "#06233C",
  "body": "#22384C",
  "mute": "#4F6274",
  "night": "#041B30",
  "night2": "#0A2A47",
  "maroon": "#882831",
  "grey": "#5F6A72",
  "white": "#FFFFFF",
  "paper": "#F6F7FA",
  "field": "#F2F5F9",
  "track": "#EDF0F4",
  "line": "rgba(2,44,76,0.14)",
  "neutralBar": "#9AA6B2",
  "purple": "#6F2C83",
  "blue": "#0177CD",
  "lilac": "#9C90C5",
  "pink": "#E86BA5",
  "rose": "#F38CBA",
  "coral": "#EE7A63",
  "orange": "#EE9A2E",
  "yellow": "#F2C230",
  "lime": "#C4D17F",
  "green": "#8DC63F",
  "cyan": "#00AAD2"
 },
 "spectrum": [
  "#6F2C83",
  "#0177CD",
  "#9C90C5",
  "#E86BA5",
  "#EE7A63",
  "#EE9A2E",
  "#F2C230",
  "#8DC63F",
  "#00AAD2"
 ],
 "spectrumNames": [
  "purple",
  "blue",
  "lilac",
  "pink",
  "coral",
  "orange",
  "yellow",
  "green",
  "cyan"
 ],
 "textOnLight": {
  "$comment": "Accent colours safe for TEXT on white (contrast >= 4.5:1). Use the raw accent for fills, bars, traces and rules; use these for words.",
  "purple": "#6F2C83",
  "blue": "#015FA8",
  "lilac": "#5A4E9A",
  "pink": "#B0306E",
  "rose": "#B0306E",
  "coral": "#B4442C",
  "orange": "#A85A00",
  "yellow": "#8A6A00",
  "green": "#4E7A12",
  "cyan": "#00708C",
  "maroon": "#882831",
  "navy": "#022C4C"
 },
 "textOnDark": {
  "$comment": "Accent colours safe for TEXT on night or navy.",
  "purple": "#C9A2DB",
  "blue": "#6FB8F0",
  "lilac": "#C3BBE6",
  "pink": "#F7A8CB",
  "rose": "#F7A8CB",
  "coral": "#F6A693",
  "orange": "#F7BD6B",
  "yellow": "#F7D774",
  "green": "#B5DE7C",
  "cyan": "#6FD6EC",
  "maroon": "#E79AA2",
  "navy": "#9CC3E4"
 },
 "grounds": {
  "$comment": "Same names as the MVAI kit's scene 'ground' field, so a slide, a page and a video scene can be specified the same way.",
  "board": {
   "bg": "#FFFFFF",
   "ink": "#022C4C",
   "soft": "#4F6274",
   "field": "#F2F5F9",
   "fieldLine": "rgba(2,44,76,0.12)",
   "dark": false
  },
  "paper": {
   "bg": "#F6F7FA",
   "ink": "#022C4C",
   "soft": "#4F6274",
   "field": "#FFFFFF",
   "fieldLine": "rgba(2,44,76,0.12)",
   "dark": false
  },
  "night": {
   "bg": "#041B30",
   "ink": "#FFFFFF",
   "soft": "#A9C1D6",
   "field": "rgba(255,255,255,0.06)",
   "fieldLine": "rgba(255,255,255,0.16)",
   "dark": true
  },
  "navy": {
   "bg": "#022C4C",
   "ink": "#FFFFFF",
   "soft": "#B4CBDF",
   "field": "rgba(255,255,255,0.07)",
   "fieldLine": "rgba(255,255,255,0.18)",
   "dark": true
  },
  "spectrum": {
   "bg": "#0177CD",
   "ink": "#FFFFFF",
   "soft": "rgba(255,255,255,0.86)",
   "field": "rgba(255,255,255,0.14)",
   "fieldLine": "rgba(255,255,255,0.3)",
   "dark": true
  }
 },
 "font": {
  "display": "Inter",
  "body": "Inter",
  "mono": "Geist Mono",
  "fallbackDisplay": "Arial",
  "fallbackMono": "Consolas",
  "weights": {
   "regular": 400,
   "medium": 500,
   "semibold": 600,
   "bold": 700,
   "extrabold": 800
  },
  "tracking": {
   "display": -0.025,
   "headline": -0.015,
   "kicker": 0.18,
   "label": 0.06
  }
 },
 "type": {
  "$comment": "Print sizes in pt (Letter page). Slide sizes in px at 1920x1080 (PowerPoint uses px * 0.5 = pt at 13.333 in wide). Video sizes are the MVAI kit's own.",
  "print": {
   "display": 34,
   "h1": 26,
   "h2": 13,
   "h3": 10.4,
   "lead": 11.6,
   "body": 9.4,
   "small": 8.6,
   "note": 7.8,
   "kicker": 8.4,
   "stat": 21
  },
  "slide": {
   "display": 132,
   "h1": 88,
   "h2": 56,
   "lead": 40,
   "body": 32,
   "small": 24,
   "kicker": 22,
   "stat": 120
  },
  "lineHeight": {
   "display": 1.02,
   "heading": 1.1,
   "body": 1.38
  }
 },
 "shape": {
  "radiusTile": 7,
  "radiusCard": 8,
  "radiusSlide": 18,
  "ruleTop": 4,
  "busHeight": 3,
  "busGap": 3
 },
 "motion": {
  "$comment": "From the MVAI kit. Digital (HTML) media that animate use the same values.",
  "sweep": 0.45,
  "rise": 0.42,
  "pop": 0.4,
  "stagger": 0.07,
  "ease": "cubic-bezier(0.16, 1, 0.3, 1)"
 },
 "event": {
  "$comment": "Facts printed on the official materials: the invite vectors (brand/art/invites), the compliant slide template (brand/pptx) and the motion library (motion/library). Use only these; do not invent others.",
  "name": "Agency 2026",
  "dates": "Dec. 7–9, 2026",
  "cities": "Edmonton · Calgary",
  "anchor": "Anchored by the Velocity White Papers",
  "host": "Ministry of Technology and Innovation",
  "days": [
   {
    "day": "Monday, December 7",
    "title": "The Art of the Possible",
    "sub": "A Showcase for Government",
    "place": "Edmonton Convention Centre",
    "accent": "blue",
    "access": ""
   },
   {
    "day": "Tuesday, December 8",
    "title": "Research & the Future AI Economy",
    "sub": "A Closed Policy Roundtable",
    "place": "Edmonton · By invitation",
    "accent": "purple"
   },
   {
    "day": "Wednesday, December 9",
    "title": "Alberta Velocity: Full Speed Ahead",
    "sub": "An Open Industry Day",
    "place": "Platform Calgary",
    "accent": "orange",
    "access": "Open to the public"
   }
  ],
  "callForDemos": {
   "kicker": "How do you fuel",
   "title": "velocity?",
   "cta": "Call for Demos"
  },
  "hostLine": "Hosted by Technology and Innovation",
  "datesLong": "December 7–9, 2026 · Edmonton and Calgary",
  "tagline": "Alberta is moving. Come and see how fast.",
  "figures": [
   {
    "value": "3",
    "label": "days of programming"
   },
   {
    "value": "2",
    "label": "cities: Edmonton and Calgary"
   },
   {
    "value": "40",
    "label": "working demos built by Technology and Innovation"
   },
   {
    "value": "2",
    "label": "challenges set by government"
   }
  ],
  "dayAccentSource": "Day colours from the compliant template and motion library (agency-pieces.js DAYS): #0077CD, #730067, #ED8C00"
 },
 "classification": {
  "default": "UNCLASSIFIED"
 },
 "compliant": {
  "$comment": "The event team's palette and type in the compliant slide template and motion library (Arial / Liberation Sans). Pending owner decision on which system is canonical; see guides/BRAND.md.",
  "font": "Arial",
  "fontAlt": "Liberation Sans",
  "color": {
   "navy": "#002C4E",
   "blue": "#0077CD",
   "red": "#9E2B33",
   "pink": "#EF4B8B",
   "orange": "#ED8C00",
   "yellow": "#FFC836",
   "green": "#78BF26",
   "plum": "#730067",
   "cyan": "#00B6ED",
   "rule": "#D0D1DB",
   "ground": "#F4F5F8"
  }
 }
};
