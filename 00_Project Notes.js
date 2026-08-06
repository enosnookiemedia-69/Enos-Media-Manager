/**
 * ==========================================================
 * ENOS MEDIA MANAGER
 * ==========================================================
 *
 * PROJECT DEVELOPMENT NOTES
 * ----------------------------------------------------------
 *
 * Application:
 * Enos Media Manager
 *
 * Purpose:
 * Google Apps Script based media management and editorial
 * workflow system created to manage the Enos Nookie photo
 * archive and support the Enos Bookie coffee table book.
 *
 * ==========================================================
 *
 * CURRENT VERSION
 * ----------------------------------------------------------
 *
 * Version:
 * 2.0.0
 *
 * Status:
 * Active Development
 *
 * Current Focus:
 * Dashboard development and editorial workflow refinement.
 *
 * ==========================================================
 *
 * PROJECT ARCHITECTURE
 * ----------------------------------------------------------
 *
 * The application is structured into several layers:
 *
 *
 * 1. CONFIGURATION
 *
 * Config.js
 *
 * Central application settings including:
 *
 * - Application information
 * - Sheet references
 * - Column mappings
 * - Categories
 * - Workflow values
 * - Targets
 *
 *
 * 2. MEDIA INGESTION PIPELINE
 *
 * Sync.js
 * Scanner.js
 * Metadata.js
 * Thumbnails.js
 *
 * Responsibilities:
 *
 * - Connect Google Drive
 * - Scan folders recursively
 * - Identify media files
 * - Extract metadata
 * - Generate thumbnails
 * - Update Media Database
 *
 *
 * 3. DATABASE LAYER
 *
 * Database.js
 * MediaObject.js
 *
 * Responsibilities:
 *
 * - Store media records
 * - Create and update records
 * - Convert between database rows and objects
 * - Maintain consistent media structures
 *
 *
 * 4. EDITORIAL WORKFLOW
 *
 * Review.js
 * ReviewerUI.js
 * ReviewUI.js
 * BookList.js
 * SelectionEngine.js
 *
 * Responsibilities:
 *
 * - Review images
 * - Apply creative decisions
 * - Track book candidates
 * - Manage final image selection
 * - Prepare book content
 *
 *
 * 5. USER INTERFACE
 *
 * Dashboard.js
 * DashboardHTML.html
 * DashboardStylesHTML.html
 * ReviewHTML.html
 * StylesHTML.html
 *
 * Responsibilities:
 *
 * - Provide visual interfaces
 * - Display project progress
 * - Support editorial workflows
 *
 * ==========================================================
 *
 * COMPLETED DEVELOPMENT
 * ----------------------------------------------------------
 *
 * ✓ Custom spreadsheet menu
 * ✓ Central configuration system
 * ✓ Utility helper library
 * ✓ Google Drive integration
 * ✓ Recursive folder scanning
 * ✓ Metadata extraction system
 * ✓ Thumbnail generation
 * ✓ Media database structure
 * ✓ Media object model
 * ✓ Review workflow foundation
 * ✓ Book workflow foundation
 * ✓ Dashboard foundation
 * ✓ Logging system
 * ✓ clasp / Git workflow
 *
 * ==========================================================
 *
 * CURRENT DEVELOPMENT PRIORITIES
 * ----------------------------------------------------------
 *
 * 1. Dashboard
 *
 * Expand dashboard into a project overview tool:
 *
 * - Image counts
 * - Review progress
 * - Category statistics
 * - Book progress
 * - Workflow status
 *
 *
 * 2. Selection Engine
 *
 * Develop automated editorial assistance:
 *
 * - Score images
 * - Identify strongest candidates
 * - Assist final book selection
 *
 *
 * 3. Workflow Improvements
 *
 * Improve:
 *
 * - Bulk editing
 * - Filtering
 * - Search
 * - Reporting
 *
 * ==========================================================
 *
 * DEVELOPMENT HISTORY
 * ----------------------------------------------------------
 *
 * Initial Development:
 *
 * July 2026
 *
 * Started as a Google Sheets based photo catalogue.
 *
 * Evolved into a complete media management and editorial
 * production system for the Enos Bookie project.
 *
 * ==========================================================
 *
 * DEVELOPMENT WORKFLOW
 * ----------------------------------------------------------
 *
 * Primary development:
 * Google Apps Script editor
 *
 * Local backup/version control:
 * clasp + Git + GitHub
 *
 * Typical workflow:
 *
 * 1. Develop in Apps Script
 * 2. Test changes
 * 3. clasp pull
 * 4. Review changes
 * 5. Commit to Git
 *
 * ==========================================================
 */