# Goal
Implement the Trash Cans tab according to the provided data model and UX requirements, while keeping the rest of the TDocs screens unchanged aside from the required top-level data wiring.

# Current State
The Trashes tab and top-level trash-can state already exist. Trash entries preserve a display path and a snapshot, but they do not yet expose per-item actions or a structured original path for restore.

# Next Step
Store each item's original path when it is trashed, add nearest-existing-parent restore logic, and expose the requested item menu in the trash detail view.

# Milestones
- [x] Add top-level trash-can state and persistence in TDocs
- [x] Implement the trash can list and detail view UI
- [x] Store original paths and implement restore/delete-forevermore item actions
- [x] Add styling for the trash item menu and confirm the app builds cleanly

# New Learnings
- The trash can settings dialog should reuse the existing file prompt styling rather than invent a different modal pattern.
- The empty-vs-delete behavior depends on the selected can’s item count and should be handled in the menu actions.
