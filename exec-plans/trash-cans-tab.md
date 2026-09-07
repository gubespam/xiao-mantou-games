# Goal
Implement the Trash Cans tab according to the provided data model and UX requirements, while keeping the rest of the TDocs screens unchanged aside from the required top-level data wiring.

# Current State
The Trash Cans tab is still a placeholder, and there is no shared trash-can data model at the TDocs level. Reusable file naming and prompt patterns already exist for rename flows, but the trash-specific list/detail/settings UI has not been implemented yet.

# Next Step
Add the trash-can data model and state at the top level, then build the trash list, detail view, rename flow, and settings dialog to match the specification.

# Milestones
- [ ] Add top-level trash-can state and persistence in TDocs
- [ ] Implement the trash can list and detail view UI
- [ ] Add rename and settings behaviors with reusable prompt patterns
- [ ] Add styling for the trash tab and confirm the app builds cleanly

# New Learnings
- The trash can settings dialog should reuse the existing file prompt styling rather than invent a different modal pattern.
- The empty-vs-delete behavior depends on the selected can’s item count and should be handled in the menu actions.
