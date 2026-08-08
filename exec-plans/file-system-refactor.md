# Goal
Create a dedicated file-system service layer for the TDocs files experience, moving the current tree state and filesystem operations out of the files tab component and into a shared service so the refactor is centralized and easier to extend.

# Current State
The existing filesystem logic is embedded directly in [src/tdocs/files/FilesPage.jsx](src/tdocs/files/FilesPage.jsx): tree creation, local storage persistence, path resolution, and item creation/rename/delete operations are all implemented there. The TDocs shell in [src/tdocs/TDocs.jsx](src/tdocs/TDocs.jsx) currently owns the active tab state but not the filesystem state.

# Next Step
Create the execution plan for the file-system service refactor and begin by isolating the current filesystem helpers into a dedicated service module.

# Milestones
- [x] Review the current filesystem behavior in [src/tdocs/files/FilesPage.jsx](src/tdocs/files/FilesPage.jsx) and identify the functions that belong in a shared service.
- [x] Create a new file-system service module under [src/tdocs/files](src/tdocs/files) that encapsulates tree initialization, storage persistence, path lookup, and file/directory mutation operations.
- [x] Move the filesystem state ownership to [src/tdocs/TDocs.jsx](src/tdocs/TDocs.jsx) so the tree lives above the files tab and can be shared by the relevant components.
- [x] Refactor [src/tdocs/files/FilesPage.jsx](src/tdocs/files/FilesPage.jsx) to consume the new service instead of defining its own filesystem helpers.
- [x] Preserve existing behavior for creating, renaming, deleting, navigating, and persisting files and directories while keeping the refactor scoped to the filesystem layer.
- [x] Verify the refactor by exercising the main filesystem flows and confirming the build remains healthy.

# New Learnings
- The current implementation uses a nested directory tree structure with path-based lookups, so the service should preserve that data shape to avoid unnecessary UI changes.
- The migration should focus on behavior preservation first; the files tab can be simplified once the shared service is in place.
- The refactor completed successfully and the production build remains healthy.
