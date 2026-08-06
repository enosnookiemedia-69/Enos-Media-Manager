# 📸 Enos Media Manager

A Google Apps Script application for managing the complete **Enos Nookie** media archive and supporting the production of the **Enos Bookie** coffee table book.

---

# Overview

The **Enos Media Manager** is a custom-built media management and editorial workflow system developed specifically for the Enos Nookie theme camp project.

The application manages the complete lifecycle of photographic assets:

```
Google Drive
      |
      ↓
Media Synchronisation
      |
      ↓
Metadata Extraction
      |
      ↓
Media Database
      |
      ↓
Editorial Review
      |
      ↓
Book Selection
      |
      ↓
Enos Bookie Production
```

The system synchronises photographs stored in Google Drive with a structured Google Sheets database, allowing thousands of images to be automatically catalogued, reviewed, categorised and selected for publication.

Unlike a traditional Digital Asset Management (DAM) system, the Enos Media Manager is designed around the creative and editorial requirements of producing a physical coffee table book.

The application is written entirely in **Google Apps Script** and integrates with:

* Google Drive
* Google Sheets
* Google Drive Advanced Services
* clasp
* Git/GitHub

---

# Project Goals

The application aims to:

* Create a searchable archive of Enos Nookie photography
* Automatically catalogue images from Google Drive
* Extract technical metadata from images and folders
* Preserve creative editorial decisions
* Provide a structured image review workflow
* Assist with book curation and page planning
* Reduce repetitive manual administration
* Maintain a long-term archive for future Enos projects

The ultimate goal is to make managing several thousand photographs simple while preserving the creative story behind the images.

---

# Current Features

## 📂 Media Synchronisation

The synchronisation system connects Google Drive folders with the Media Database.

Features:

* Google Drive integration
* Recursive folder scanning
* Automatic image detection
* New image discovery
* Existing record updates
* File ID matching
* Manual data preservation
* Sync logging
* Progress reporting

---

## 🖼 Metadata Management

The metadata system automatically records and maintains technical information.

Captured information includes:

* File name
* Folder path
* Google Drive File ID
* File size
* File extension
* MIME type
* Photographer
* Camera model
* EXIF camera information
* Year
* Image dimensions
* Orientation
* Date taken
* Creation dates
* Drive URLs

---

## 🗃 Media Database

The Media Database acts as the central source of truth for all images.

The database separates:

### Automated Data

Generated from Google Drive and image metadata.

Examples:

* File information
* Camera information
* Dimensions
* Dates
* Technical metadata

### Editorial Data

Created through the review process.

Examples:

* Category
* Grade
* Story Value
* Hero Image selection
* Book Candidate status
* Final Book selection
* Captions
* Page planning
* Notes

---

# Editorial Workflow

The editorial workflow supports the complete Enos Bookie image selection process.

Current editorial tools include:

* Image categories
* Quality grading
* Story value scoring
* Hero image selection
* Book candidate selection
* Final image selection
* Caption management
* Spread planning
* Page allocation
* Editorial notes

The system is designed to separate objective image metadata from subjective creative decisions.

---

# Review System

The Review system provides an interactive workspace for evaluating images directly from the Media Database.

Current capabilities:

* Image loading
* Reviewer position tracking
* Next/previous image navigation
* Creative review fields
* Review status tracking
* Review date tracking
* Book candidate selection
* Final book selection

Future improvements will include:

* Improved scoring automation
* Selection recommendations
* Dashboard analytics
* Faster bulk review workflows

---

# Dashboard

The Dashboard provides a central overview of project progress.

Current foundation includes:

* Application information
* Image statistics
* Review progress
* Book progress tracking

Future development will expand this into a full editorial control centre.

---

# Project Structure

The application is divided into focused modules.

| File                     | Responsibility                    |
| ------------------------ | --------------------------------- |
| 00_Project Notes.js      | Development notes and milestones  |
| Menu.js                  | Custom spreadsheet menu           |
| Config.js                | Central application configuration |
| Sync.js                  | Google Drive synchronisation      |
| Scanner.js               | Recursive folder scanning         |
| Metadata.js              | Metadata extraction and caching   |
| Database.js              | Media database operations         |
| MediaObject.js           | Standard media object structure   |
| Thumbnails.js            | Thumbnail generation              |
| BookList.js              | Book image management             |
| Review.js                | Review workflow engine            |
| ReviewerUI.js            | Review interface controls         |
| ReviewUI.js              | Review interface helpers          |
| ReviewHTML.html          | Review interface                  |
| Dashboard.js             | Dashboard controller              |
| DashboardHTML.html       | Dashboard interface               |
| DashboardStylesHTML.html | Dashboard styling                 |
| StylesHTML.html          | Shared interface styling          |
| SelectionEngine.js       | Future editorial scoring engine   |
| Logging.js               | Application logging               |
| Utilities.js             | Shared helper functions           |
| Test.js                  | Development testing               |

---

# Development Philosophy

The project follows several principles:

* Small focused modules
* Minimal duplication
* Centralised configuration
* Clear separation of responsibilities
* Consistent object structures
* Automated data separated from creative decisions
* Documentation alongside development
* Maintainability before complexity

Configuration values are stored centrally wherever possible rather than being hard-coded throughout the application.

---

# Version

Current Version:

**2.0.0**

Status:

**Active Development**

Version 2.0 represents the completion of the core application architecture:

Completed:

✅ Drive synchronisation
✅ Recursive scanning
✅ Metadata pipeline
✅ Media database
✅ Thumbnail generation
✅ Review workflow
✅ Book workflow foundation
✅ Dashboard foundation

---

# Source Control

## Source of Truth

The Google Apps Script project is the master copy of the application.

GitHub is used for:

* Version history
* Backup
* Documentation
* Code review
* Development history

The repository mirrors the Apps Script project through `clasp`.

---

# Developer Workflow

Current workflow:

1. Develop in Google Apps Script.
2. Save and test changes.
3. Pull source locally:

```bash
clasp pull
```

4. Review changes:

```bash
git status
```

5. Commit:

```bash
git add .
git commit -m "Description of changes"
```

6. Push:

```bash
git push
```

---

# Future Development

Planned improvements include:

* Complete editorial scoring engine
* Dashboard statistics
* Advanced image filtering
* Bulk editing tools
* Duplicate detection
* Improved search
* Automated book selection assistance
* Export tools
* Production workflow tools
* Performance optimisation

---

# Acknowledgements

Developed for the **Enos Nookie** theme camp project to support the creation, preservation and storytelling of the Enos Bookie coffee table book.

---

© 2026 Enos Nookie
