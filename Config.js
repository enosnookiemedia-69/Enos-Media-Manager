/**
 * ==========================================================
 * CONFIG.GS
 * ----------------------------------------------------------
 * Central configuration for the Enos Media Manager.
 *
 * This should be the ONLY place where fixed values are
 * defined. Other files should reference CONFIG rather than
 * hard-coding values.
 * ==========================================================
 */

// ==========================================================
// APPLICATION INFORMATION
// ==========================================================



const APP = {

  NAME: "Enos Media Manager",

  VERSION: "2.0.0",

  AUTHOR: "Enos Nookie",

  COPYRIGHT: "© 2026 Enos Nookie",

  DESCRIPTION: "Google Drive media catalogue and editorial management system",

  CREATED: "2026-07-08",

  LAST_UPDATED: "2026-07-09"

};



// ==========================================================
// CONFIGURATION OBJECT
// ==========================================================

const CONFIG = {};



// ==========================================================
// WORKSHEETS
// ==========================================================

CONFIG.SHEETS = {

  SETTINGS: "Settings",

  MEDIA: "Media Database",

  BOOK: "Final Book Image Possibilities",

  LOG: "Sync Log"

};


// ==========================================================
// MEDIA SHEET COLUMN INDEXS
// ==========================================================

const COL = {

  THUMBNAIL: 1,
  FILE_NAME: 2,
  FOLDER_PATH: 3,
  FILE_ID: 4,
  FILE_SIZE: 5,
  DATE_CREATED: 6,
  URL: 7,
  YEAR: 8,
  PHOTOGRAPHER: 9,
  CAMERA_MODEL: 10,
  FILE_EXTENSION: 11,
  WIDTH: 12,
  HEIGHT: 13,
  ORIENTATION: 14,
  DATE_TAKEN: 15,
  LAYOUT_SUITABILITY: 16,
  PRINT_SUITABILITY: 17,
  CATEGORY: 18,
  GRADE: 19,
  STORY_VALUE: 20,
  HERO_IMAGE: 21,
  BOOK_CANDIDATE: 22,
  FINAL_BOOK: 23,
  SELECTION_STAGE: 24,
  CAPTION: 25,
  SPREAD: 26,
  PAGE: 27,
  NOTES: 28

};


// ==========================================================
// MEDIA CATEGORIES
// ==========================================================
/**
 * Official image categories.
 *
 * These are used throughout the application for:
 *
 * • Dropdown validation
 * • Filtering
 * • Sorting
 * • Reports
 * • Dashboard statistics
 */

CONFIG.CATEGORIES = [

  "Setup & Workshop",
  "Build Onsite",
  "Jollers & People",
  "Artworks & Burns",
  "Landscapes & Nature",
  "Nightlife & DJs",
  "Strike & Packing",
  "Cover"

];

// ==========================================================
// IMAGE METADATA
// ==========================================================
/**
 * Standard metadata values used throughout the application.
 */

// Image Grades
CONFIG.GRADES = [

  "S",
  "A",
  "B",
  "C",
  "Reject"

];

// Image Orientation
CONFIG.ORIENTATIONS = [

  "Landscape",
  "Portrait",
  "Square",
  "Panorama"

];

// Editing Status
CONFIG.EDIT_STATUS = [

  "Not Edited",
  "Edited",
  "Exported"

];

// ==========================================================
// EDITORIAL WORKFLOW
// ==========================================================

/**
 * Editorial progression for book selection.
 */

CONFIG.SELECTION_STAGES = [

  "None",
  "Candidate",
  "Book Possibility",
  "Shortlist",
  "Final",
  "Published"

];

// ==========================================================
// BOOK INFORMATION
// ==========================================================
/**
 * General information about the Enos Book project.
 */

CONFIG.BOOK = {

  TITLE: "Enos Bookie",
  SUBTITLE: "A Monkey's Guide to Enos Nookie",

  START_YEAR: 2023,
  END_YEAR: 2026

};

// ==========================================================
// BOOK ASSETS
// ==========================================================
/**
 * Non-photographic assets required for the book.
 */

CONFIG.BOOK_ASSETS = [

  "Front Cover",
  "Back Cover",
  "Spine",
  "Inside Front DPS",
  "Inside Back DPS",
  "Title Page",
  "Introduction",
  "Timeline"

];

// ==========================================================
// DASHBOARD TARGETS
// ==========================================================
/**
 * Editorial targets shown on the dashboard.
 */

CONFIG.TARGETS = {

  BOOK_IMAGES: 300,
  SHORTLIST: 150,
  FINAL_IMAGES: 100,

  MIN_S_PER_CATEGORY: 8,
  MIN_A_PER_CATEGORY: 8

};

// ==========================================================
// SUPPORTED FILE TYPES
// ==========================================================
/**
 * Supported image file extensions.
 */

CONFIG.FILE_TYPES = [

  "jpg",
  "jpeg",
  "png",
  "gif",
  "tif",
  "tiff",
  "cr2",
  "cr3",
  "nef",
  "arw",
  "dng",
  "heic",
  "webp"

];

// ==========================================================
// THUMBNAIL SETTINGS
// ==========================================================
/**
 * Thumbnail size options.
 */

CONFIG.THUMBNAIL_SIZES = [

  "Small",
  "Medium",
  "Large"

];

// ==========================================================
// DEBUG SETTINGS
// ==========================================================
/**
 * Application debugging options.
 */

CONFIG.DEBUG = {

  ENABLED: true,
  LOG_TIMERS: true

};

// ==========================================================
// CONFIGURATION FUNCTIONS
// ==========================================================

/**
 * Returns the active spreadsheet.
 *
 * @returns {Spreadsheet}
 */
function getSpreadsheet() {

  return SpreadsheetApp.getActiveSpreadsheet();

}

/**
 * Returns a worksheet by name.
 *
 * @param {string} sheetName
 * @returns {Sheet}
 */
function getSheet(sheetName) {

  return getSpreadsheet().getSheetByName(sheetName);

}

/**
 * Returns the Settings worksheet.
 *
 * @returns {Sheet}
 */
function getSettingsSheet() {

  return getSheet(CONFIG.SHEETS.SETTINGS);
}

/**
 * Returns the Media worksheet.
 *
 * @returns {Sheet}
 */
function getMediaSheet() {

  return getSheet(CONFIG.SHEETS.MEDIA);
}


/**
 * Returns all settings from the Settings worksheet.
 *
 * @returns {Array}
 */
function getAllSettings() {

  return getSettingsSheet()
    .getDataRange()
    .getValues();
}

/**
 * Returns a setting value by its name.
 *
 * @param {string} settingName
 * @returns {*}
 */
function getSetting(settingName) {

  const settings = getAllSettings();

  for (let i = 1; i < settings.length; i++) {

    if (settings[i][0] === settingName) {
      return settings[i][1];
    }
  }
  return null;
}
