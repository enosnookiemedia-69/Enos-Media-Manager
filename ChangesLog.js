/**
 * ==========================================================
 * ENOS MEDIA MANAGER
 * ==========================================================
 *
 * DEVELOPMENT CHANGE LOG
 *
 * ----------------------------------------------------------
 *
 * Purpose:
 *
 * Personal development notes tracking:
 *
 * • What was worked on
 * • What changed
 * • What was completed
 * • Known issues
 * • Where to continue next
 *
 * This is not a technical version history.
 * Git commits provide that history.
 *
 * ==========================================================
 */

/**
 * ==========================================================
 * 2026-09-03
 *
 * ----------------------------------------------------------
 *
 * Session:
 * Second Pass Reviewer build
 *
 * ----------------------------------------------------------
 *
 * Completed:
 *
 * ✓ Fixed image loading/error status messages sticking
 *   in the First Pass Reviewer (ReviewHTML.html)
 *
 * ✓ Hero Image / Final Book checkboxes now auto-push the
 *   reviewed record into Final Book Image Possibilities
 *   (Status = "Pushed") without waiting for a full sync
 *
 * ✓ Fixed Caption / Notes not carrying across into
 *   Final Book Image Possibilities on first creation
 *   (BookList.js buildBookRow was only ever preserving
 *   the Book List's own existing value, never falling
 *   back to the Media Database's Caption / Notes)
 *
 * ✓ Built SecondPassEngine.js:
 *
 *   - Category quotas calculated directly from Book
 *     Final Layout (needed x2 per category, so there
 *     are 2 candidate images per book slot)
 *   - Confirmed layout-derived total = 123, matching
 *     CONFIG.TARGETS.FINAL_BOOK
 *   - Added CONFIG.MANUAL_CATEGORY_TARGETS for categories
 *     not tied to specific pages (Portraits & Extras = 15
 *     needed / 30 target)
 *   - Candidate pool = Reviewed, not Hero/Final Book,
 *     not already decided by Second Pass, not already
 *     in Book List — sorted strongest Grade/Story Value
 *     first
 *   - Decisions stamp Selection Stage ("Book Possibility"
 *     / "Not Selected") and Add syncs into Book List with
 *     Status = "Reviewed"
 *
 * ✓ Built SecondPassUI.js, SecondPassHTML.html,
 *   SecondPassStyles.html — full working dialog with
 *   category dropdown, live progress chips, image
 *   loading matching First Pass Reviewer's fixed
 *   loading/error behaviour
 *
 * ✓ Wired "Open Second Pass Reviewer" into the menu
 *
 *
 * ----------------------------------------------------------
 *
 * Known Issues / Notes:
 *
 * • Selection Stage is blank on ordinary First Pass
 *   reviewed images (only Second Pass currently writes
 *   to it). Terminology across Selection Stage ("Book
 *   Possibility" / "Not Selected") and Book List Status
 *   ("Pushed" / "Reviewed") should be reconciled in one
 *   pass together, not fixed piecemeal.
 *
 * • Book List thumbnails not rendering — likely just
 *   column width / row height in that sheet (same
 *   working IMAGE() formula as Media Database). Confirmed
 *   low priority: thumbnails in the sheet itself aren't
 *   used day-to-day, only relevant if the app is ever
 *   packaged for other users.
 *
 * • Book Image Balance sheet is blank / unused — Second
 *   Pass calculates quotas directly from Book Final
 *   Layout instead, so this sheet may not be needed
 *   going forward.
 *
 *
 * ----------------------------------------------------------
 *
 * Future Ideas (not started):
 *
 * • Customization engine: let a user configure/rename
 *   columns and categories through the app UI instead of
 *   editing code + sheet structure directly. Would matter
 *   most if this is ever released for others to use.
 *
 * • Visual polish pass on all reviewer HTML/CSS — make
 *   First Pass, Second Pass, and Dashboard styling
 *   noticeably sleeker/more modern.
 *
 * • User-facing help/guide file for someone new to the
 *   app (only relevant once the app is stable and,
 *   again, mainly if shared beyond personal use).
 *
 * • A "beta" area for testing newly written functions
 *   without risk to the working Reviewer/Second Pass
 *   scripts already in daily use — e.g. a separate
 *   Beta.js file, or a dedicated test menu section,
 *   so in-progress work never risks breaking what's
 *   already working.
 *
 *
 * ----------------------------------------------------------
 *
 * Next Task:
 *
 * • Confirm Second Pass works end-to-end on real data
 *   (~300 First Pass reviewed images)
 * • Start working through categories toward a draft book
 *   using Drive images
 *
 * ==========================================================
 */


/**
 * ==========================================================
 * 2026-08-12
 *
 * ----------------------------------------------------------
 *
 * Session:
 * Sync pipeline integration testing
 *
 * ----------------------------------------------------------
 *
 * Completed:
 *
 * ✓ Confirmed Metadata.gs metadata pipeline is working
 *
 * ✓ Confirmed MediaObject creation from Google Drive files
 *
 * ✓ Confirmed folder path extraction
 *
 * ✓ Confirmed Year extraction
 *
 * ✓ Confirmed Photographer extraction
 *
 * ✓ Confirmed folder camera model extraction
 *
 * ✓ Confirmed EXIF camera metadata
 *
 * ✓ Confirmed image dimensions
 *
 * ✓ Confirmed orientation calculation
 *
 * ✓ Confirmed aspect ratio generation
 *
 * ✓ Confirmed megapixel calculation
 *
 * ✓ Confirmed Date Taken extraction
 *
 * ✓ Confirmed thumbnail generation
 *
 * ✓ Confirmed metadata timestamps
 *
 * ✓ Tested recursive Drive scanning
 *
 * ✓ Scanner successfully scanned 29 folders
 *
 * ✓ Scanner successfully discovered 1,265 existing images
 *
 * ✓ Confirmed 0 unsupported files were encountered
 *
 * ✓ Confirmed Sync can retrieve the configured
 *   Media Root Folder ID
 *
 * ✓ Confirmed complete read-only Sync pipeline:
 *
 *   Scanner
 *      ↓
 *   buildMediaObject()
 *      ↓
 *   populateMediaMetadata()
 *      ↓
 *   mediaObjectToRow()
 *
 * ✓ Confirmed MediaObject → spreadsheet row conversion
 *
 * ✓ Confirmed database contains 1,265 existing File IDs
 *
 * ✓ Confirmed duplicate detection correctly recognised
 *   all 1,265 existing files
 *
 * ✓ Confirmed production sync can safely run when
 *   all files already exist
 *
 * ✓ Production sync result:
 *
 *   Scanned  : 1265
 *   Existing : 1265
 *   Added    : 0
 *   Errors   : 0
 *
 * ✓ Created one controlled test image to verify
 *   new-file importing
 *
 * ✓ Confirmed production Sync successfully detected
 *   exactly one new file
 *
 * ✓ Confirmed new-file import successfully completed
 *
 *   Scanned  : 1266
 *   Existing : 1265
 *   Added    : 1
 *   Errors   : 0
 *
 * ✓ Confirmed addMediaBatch() successfully wrote
 *   the new record to Media Database
 *
 * ✓ Confirmed the newly imported record contains
 *   the expected Drive and image metadata
 *
 * ✓ Investigated Aspect Ratio storage issue
 *
 * ✓ Identified Google Sheets automatic interpretation
 *   of colon-separated aspect ratios as the cause
 *   of the incorrect stored value
 *
 * ✓ Changed Media Database → Aspect Ratio column
 *   to Plain text
 *
 * ✓ Confirmed Plain text storage preserves:
 *
 *   2048:1363
 *
 *   as a string without conversion
 *
 * ✓ Confirmed no production code change is required
 *   for Aspect Ratio handling
 *
 * ✓ Confirmed Sync pipeline is currently functioning
 *   correctly end-to-end
 *
 *
 * ----------------------------------------------------------
 *
 * Current Project State:
 *
 * Version:
 * 2.0.0
 *
 * Core systems tested:
 *
 * ✓ Configuration
 * ✓ Drive synchronisation
 * ✓ Scanner
 * ✓ Metadata
 * ✓ Thumbnails
 * ✓ Database
 * ✓ Media Object conversion
 * ✓ Duplicate detection
 * ✓ New media importing
 * ✓ Review workflow
 * ✓ Book workflow foundation
 * ✓ Dashboard foundation
 *
 *
 * ----------------------------------------------------------
 *
 * Current Database State:
 *
 * Existing media records before Sync testing:
 * 1,265
 *
 * Test media record added:
 * 1
 *
 * Current expected database total:
 * 1,266
 *
 * Test file:
 * AFRIKABURNROAD TOM2 - Copy.jpg
 *
 * Test file was intentionally retained temporarily
 * for continued testing and verification.
 *
 *
 * ----------------------------------------------------------
 *
 * Current Sync Status:
 *
 * The Sync pipeline has now passed:
 *
 * ✓ Full Drive scan
 * ✓ Existing-file detection
 * ✓ Duplicate prevention
 * ✓ Read-only media processing
 * ✓ New-file detection
 * ✓ New-file database insertion
 * ✓ Batch database writing
 * ✓ Error handling
 * ✓ Aspect Ratio storage verification
 *
 * No Sync errors were encountered during testing.
 *
 *
 * ----------------------------------------------------------
 *
 * Known Issues / Notes:
 *
 * • The Aspect Ratio column in Media Database must remain
 *   formatted as Plain text.
 *
 *   This prevents values such as:
 *
 *   4:3
 *   3:2
 *   16:9
 *   2048:1363
 *
 *   from being interpreted by Google Sheets as times,
 *   durations, or other automatic formats.
 *
 * • The test image AFRIKABURNROAD TOM2 - Copy.jpg
 *   is currently present in the Media Database and
 *   should eventually be removed together with the
 *   corresponding Drive test file once testing is complete.
 *
 * • The test image was stored directly under the Photos
 *   folder and therefore had limited folder-derived
 *   metadata. This is expected and confirmed that the
 *   Sync pipeline handles incomplete metadata without
 *   producing an error.
 *
 * • SelectionEngine.js exists but is currently placeholder.
 *
 * • Sidebar files may need removal if confirmed unused.
 *
 *
 * ----------------------------------------------------------
 *
 * Current Focus:
 *
 * Complete validation of the Media Manager foundation
 * before moving into Dashboard development and the
 * higher-level media selection workflow.
 *
 *
 * ----------------------------------------------------------
 *
 * Next Task:
 *
 * • Finish any remaining Sync / Database cleanup
 *
 * • Remove the temporary Sync test file and database
 *   record when testing is complete
 *
 * • Confirm the Media Database structure and formatting
 *
 * • Begin Dashboard data functions
 *
 *   Start with:
 *
 *   getDashboardStats()
 *
 * • Connect Dashboard HTML to Apps Script
 *
 * • Replace static Dashboard values with live values
 *
 * • Continue toward Review / Selection workflow
 *
 *
 * ==========================================================
 */


/**
 * ==========================================================
 * 2026-08-06
 *
 * ----------------------------------------------------------
 *
 * Session:
 * Documentation and project review
 *
 * ----------------------------------------------------------
 *
 * Completed:
 *
 * ✓ Reviewed complete Apps Script file structure
 * ✓ Confirmed 23 project files
 * ✓ Confirmed 6,371 lines of code/UI
 * ✓ Updated README.md architecture description
 * ✓ Updated 00_Project Notes.js
 * ✓ Synced Apps Script with local Git using clasp
 * ✓ Committed documentation updates
 * ✓ Pushed changes to GitHub
 *
 *
 * Current Project State:
 *
 * Version:
 * 2.0.0
 *
 * Core systems completed:
 *
 * ✓ Configuration
 * ✓ Drive synchronisation
 * ✓ Scanner
 * ✓ Metadata
 * ✓ Thumbnails
 * ✓ Database
 * ✓ Review workflow
 * ✓ Book workflow foundation
 * ✓ Dashboard foundation
 *
 *
 * Current Focus:
 *
 * Create a simple dashboard showing:
 *
 * • Total images
 * • Reviewed images
 * • Book candidates
 * • Final book images
 * • Project progress
 *
 *
 * Next Task:
 *
 * Build Dashboard data functions.
 *
 * Start with:
 *
 * • getDashboardStats()
 * • Connect dashboard HTML to Apps Script
 * • Replace static zeros with live values
 *
 *
 * Issues / Notes:
 *
 * • SelectionEngine.js exists but is currently placeholder.
 *
 * • Sidebar files may need removal if confirmed unused.
 *
 * ==========================================================
 */


/**
 * ==========================================================
 * 2026-07-09
 *
 * ----------------------------------------------------------
 *
 * Session:
 * Initial Version 2 architecture
 *
 * ----------------------------------------------------------
 *
 * Completed:
 *
 * ✓ Config system
 * ✓ Menu system
 * ✓ Utility helpers
 * ✓ Initial Drive connection
 *
 *
 * Next:
 *
 * Build database layer.
 *
 * ==========================================================
 */
