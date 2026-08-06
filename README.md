# 📸 Enos Media Manager

Google Apps Script application for managing the Enos Bookie media archive.

## Current Features

- Google Drive synchronization
- Recursive folder scanning
- Metadata extraction
- Editorial workflow
- Google Sheets integration

## Status

Version 2.0.0

Currently under active development.




## Developer Workflow

Source of Truth

The Google Apps Script project is the master copy of the Enos Media Manager.

GitHub is used for:

Version history
Daily backups
Sharing the source code with collaborators for review

## Development is currently performed directly in the Apps Script editor.

Daily Workflow
Make changes in Google Apps Script.
Save and test the project.
Pull the latest code to the local project:
clasp pull
Check the changes:
git status
Stage all modified files:
git add .
Commit the changes with a meaningful message:
git commit -m "Describe the changes"
Push the backup to GitHub:
git push
Notes
Apps Script is always the source of truth.
Do not edit files directly on GitHub.
Avoid using automatic Git synchronisation features that may create unexpected commits or merge histories.
If development ever moves to VS Code in the future, this workflow can be updated accordingly.
Typical Commands
# Pull latest Apps Script files
clasp pull

# View changes
git status

# Stage files
git add .

# Commit
git commit -m "Meaningful description"

# Backup to GitHub
git push
Repository Purpose

This repository serves as:

A version-controlled backup of the Apps Script project.
A place for collaborators to review the source code.
A historical record of project development.

The GitHub repository is not considered the primary development environment.