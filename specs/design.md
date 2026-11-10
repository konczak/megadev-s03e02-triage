# sched-prod · design conventions

How the product's interface is built. Every rule has an id; cite it by that id.

## DES-1 · type
One type scale, set in the tokens. No font size outside it.

## DES-2 · colour tokens
Every colour comes from a design token (`--color-*`). No raw hex, rgb or named colours in components.
New colour schemes (a theme, a high-contrast mode) are new token sets, never new values in components.
A scheme's values come from the palette already in the tokens file; nobody has to pick new colours.

## DES-3 · spacing
Spacing uses the 4 px scale in the tokens.

## DES-4 · errors stay inline
An error shows next to what caused it, or as a banner at the top of the page. No modal dialogs for errors —
nothing that sits over the page and has to be clicked away: it blocks the booking flow and screen readers
lose their place.

## DES-5 · copy
Buttons say what they do: a verb and its object ("Cancel booking", not "OK").
