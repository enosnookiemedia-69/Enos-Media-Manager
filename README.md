# 📸 Enos Media Manager

A Google Apps Script application for managing the complete Enos Nookie media archive and supporting the production of the **Enos Bookie** coffee table book.

---

# Overview

The Enos Media Manager is a custom-built media management system developed specifically for the Enos Nookie project.

The application synchronises photographs stored in Google Drive with a structured Google Sheets database, allowing thousands of images to be organised, reviewed, categorised and selected for publication.

Rather than acting as a traditional Digital Asset Management (DAM) system, the project focuses on the editorial workflow required to curate imagery for printed books and future digital archives.

The project is written entirely in **Google Apps Script** and integrates closely with Google Drive and Google Sheets.

---

# Project Goals

The application aims to:

* Synchronise media from Google Drive
* Automatically catalogue photographs
* Extract metadata from images and folders
* Preserve manual editorial information
* Assist with image review and selection
* Produce curated image lists for book production
* Reduce repetitive administrative work

Ultimately the goal is to make managing several thousand photographs as simple and efficient as possible.

---

# Current Features

## Media Synchronisation

* Google Drive integration
* Recursive folder scanning
* Automatic detection of new images
* Updates existing records
* Preserves manual spreadsheet data
* Logging and progress reporting

---

## Metadata Management

Automatically records information including:

* File name
* Folder path
* Google Drive File ID
* File size
* File extension
* Photographer
* Camera model
* Year
* Image dimensions
* Orientation
* Creation dates
* Drive links

---

## Editorial Workflow

Supports the complete editorial process for the Enos Bookie project.

Including:

* Categories
* Grades
* Story Value
* Hero Images
* Book Candidates
* Final Book Selection
* Captions
* Page planning
* Notes

---

## Review System

The review tools allow images to be browsed and assessed directly inside Google Sheets.

Features currently under development include:

* Image browser
* Review interface
* Navigation controls
* Selection tools
* Editorial workflow improvements

---

# Technology

The project uses:

* Google Apps Script
* Google Drive
* Google Sheets
* Google Drive Advanced Service
* clasp
* Git
* GitHub

---

# Project Structure

The application is divided into focused modules.

| File               | Responsibility                          |
| ------------------ | --------------------------------------- |
| Menu.js            | User menus and application entry points |
| Config.js          | Global configuration                    |
| Sync.js            | Synchronisation workflow                |
| Scanner.js         | Google Drive folder scanning            |
| Metadata.js        | Metadata extraction and caching         |
| Database.js        | Spreadsheet database operations         |
| MediaObject.js     | Standard media object model             |
| BookList.js        | Book image management                   |
| Review.js          | Review engine                           |
| ReviewUI.js        | Review interface                        |
| ReviewHTML.html    | Review dialog                           |
| Sidebar.js         | Sidebar interface                       |
| Utilities.js       | Shared helper functions                 |
| Logging.js         | Logging system                          |
| SelectionEngine.js | Editorial scoring and selection logic   |
| Thumbnails.js      | Thumbnail generation                    |
| Test.js            | Development testing                     |

---

# Development Philosophy

The project follows several design principles.

* Small, focused modules
* Minimal code duplication
* Centralised configuration
* Well documented source code
* Consistent object structures
* Separation between automated and manual data
* Maintainability before complexity

Where practical, configuration values are stored centrally rather than hard-coded throughout the project.

---

# Version

Current Version:

**2.0.0**

Status:

**Active Development**

The application is under continuous development with new features being added as the editorial workflow evolves.

---

# Source Control

## Source of Truth

The **Google Apps Script project** is the master copy of the application.

GitHub is used for:

* Version history
* Daily backups
* Source code sharing
* Documentation

The GitHub repository is **not** considered the primary development environment.

---

# Developer Workflow

Development is currently performed directly in the Google Apps Script editor.

Daily workflow:

1. Develop in Apps Script.
2. Save and test changes.
3. Pull the latest project locally.

```bash
clasp pull
```

4. Review changes.

```bash
git status
```

5. Stage modified files.

```bash
git add .
```

6. Commit changes.

```bash
git commit -m "Meaningful description"
```

7. Push to GitHub.

```bash
git push
```

---

# Repository Purpose

This repository exists to provide:

* Version control
* Daily project backups
* Code review
* Historical development record
* Project documentation

The repository mirrors the Apps Script project and should remain synchronised with it.

---

# Future Development

Planned improvements include:

* Faster synchronisation
* Improved metadata extraction
* Enhanced review workflow
* Batch editing tools
* Better thumbnail management
* Dashboard and statistics
* Advanced search and filtering
* Duplicate detection
* Book production tools
* Export utilities
* Performance optimisation

---

# Acknowledgements

Developed for the **Enos Nookie** project to support the creation and long-term management of the Enos Bookie media archive.

---

© 2026 Enos Nookie
