# Remove
Remove the existing "Return Home" button and the caution/x icons that are currently hidden.

# View
The 404 page should have the following structure:

There is a vertical stack of components:
- Fancy 404 widget
- Error
    - "Error" literal text
    - Large font
    - Italics
    - All caps
    - border: 2px solid rgb(255, 255, 255);
- Message
    - "Xiao Mantou can't roll to that URL" literal text
    - Medium font
    - border: 2px solid rgb(255, 255, 255);
- Game form
    - "Enter a game name"
    - Single-line text field
        - Hint text: "Game name (e.g. Tic Tac Tumble)"
    - "Spaces will become dashes"
    - Submit Button

All of the components are constrained to be the same width (flexbox).

Be sure to factor the CSS styles so there isn't unnecessary repetition.

# Fancy 404 Widget
- A row of 3 boxes constrained to be the same size (flexbox).
- Left box: fancy 4
- Middle box: Xiao Mantou Icon
    - src/images/mantou.png
- Right box: fancy 4

## Fancy 4
- Use SVG src/images/fancy-4-icon.svg
    - Change lines (currently black) to white, using CSS

# Submit Button
- As the user enters text
    - If empty, button says "Go home" and clicking it will 
    - Otherwise, button labeled as "Go there"
- When user clicks "Go home" button
    - Send user to home page (/xiao-mantou-games)
- When user clicks "Go there" button
    - Trim the entered text, convert spaces and punctuation to dashes (consecutive dashes collapse to one) -> this becomes the "suffix"
    - Button should redirect the page to "/xiao-mantou-games/{suffix}"

