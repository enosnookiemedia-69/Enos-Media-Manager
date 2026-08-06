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

  DESCRIPTION:
    "Google Drive media catalogue and editorial management system",

  CREATED: "2026-07-08",

  LAST_UPDATED: "2026-07-09",

  TIMEZONE: "Africa/Johannesburg"

};


// Master configuration object.
// Additional configuration sections are attached below.

const CONFIG = {};


// ==========================================================
// WORKSHEETS
// ==========================================================

CONFIG.SHEETS = {

  SETTINGS: "Settings",

  MEDIA: "Media Database",

  BOOK: "Final Book Image Possibilities",

  LOG: "Sync Log",

  DASHBOARD: "Dashboard"

};


// ==========================================================
// MEDIA DATABASE COLUMN INDEXES
// ==========================================================
//
// IMPORTANT
// ----------------------------------------------------------
// Column numbers are 1-based to match Google Sheets.
//
// Example:
// Spreadsheet Column A = 1
// Spreadsheet Column B = 2
//
// These values are the single source of truth
// for accessing Media Database columns.
// ==========================================================


const COL = {


  // ========================================================
  // FILE & DRIVE METADATA
  // Columns A - G
  // ========================================================

  THUMBNAIL: 1,

  FILE_NAME: 2,

  FOLDER_PATH: 3,

  FILE_ID: 4,

  FILE_SIZE: 5,

  DATE_CREATED: 6,

  URL: 7,



  // ========================================================
  // IMAGE METADATA
  // Columns H - Q
  // ========================================================

  YEAR: 8,

  PHOTOGRAPHER: 9,

  CAMERA_MODEL: 10,

  EXIF_CAMERA: 11,

  FILE_EXTENSION: 12,

  MIME_TYPE: 13,

  WIDTH: 14,

  HEIGHT: 15,

  ORIENTATION: 16,

  DATE_TAKEN: 17,



  // ========================================================
  // PROCESSING STATUS
  // Columns R - S
  // ========================================================

  METADATA_UPDATED: 18,

  THUMBNAIL_STATUS: 19,



  // ========================================================
  // EDITORIAL REVIEW
  // Columns T - AB
  // ========================================================

  LAYOUT_SUITABILITY: 20,

  PRINT_SUITABILITY: 21,

  CATEGORY: 22,

  GRADE: 23,

  STORY_VALUE: 24,

  HERO_IMAGE: 25,

  BOOK_CANDIDATE: 26,

  FINAL_BOOK: 27,

  SELECTION_STAGE: 28,



  // ========================================================
  // BOOK PRODUCTION
  // Columns AC - AF
  // ========================================================

  CAPTION: 29,

  SPREAD: 30,

  PAGE: 31,

  NOTES: 32,



  // ========================================================
  // REVIEW TRACKING
  // Columns AG - AH
  // ========================================================

  REVIEW_DATE: 33,

  REVIEW_STATUS: 34

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

// Keep in display order.

CONFIG.CATEGORIES = [

  "Setup & Workshop",
  "Build Onsite",
  "Jollers & People",
  "Artworks & Burns",
  "Landscapes & Nature",
  "Nightlife & DJs",
  "Strike & Packing",
  "Portraits & Extras"

];

// ==========================================================
// IMAGE METADATA
// ==========================================================
/**
 * Standard metadata values used throughout
 * the application.
 */


// ----------------------------------------------------------
// Image Grades
// ----------------------------------------------------------

CONFIG.GRADES = [

  "S",
  "A",
  "B",
  "C",
  "Reject"

];


// ----------------------------------------------------------
// Image Orientations
// ----------------------------------------------------------

CONFIG.ORIENTATIONS = [

  "Landscape",
  "Portrait",
  "Square",
  "Panorama"

];


// ----------------------------------------------------------
// Editing Status
// ----------------------------------------------------------

CONFIG.EDIT_STATUS = [

  "Not Edited",
  "Edited",
  "Exported"

];



// ==========================================================
// EDITORIAL WORKFLOW
// ==========================================================
/**
 * Official workflow used during image selection.
 *
 * Images should progress through these stages
 * in order.
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
 * General information relating to the
 * Enos Book project.
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
 * Non-photographic assets required
 * for the finished publication.
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
 * Editorial targets displayed on
 * the dashboard.
 *
 * These are goals only and do not
 * affect application logic.
 */

CONFIG.TARGETS = {

  TARGET_EDITS: 300,

  SHORTLIST: 150,

  FINAL_BOOK: 100,

  MIN_S_PER_CATEGORY: 8,

  MIN_A_PER_CATEGORY: 8

};



// ==========================================================
// SUPPORTED FILE TYPES
// ==========================================================
/**
 * Supported image file extensions.
 *
 * These should always be lowercase.
 */

CONFIG.FILE_TYPES = [

  "arw",
  "cr2",
  "cr3",
  "dng",
  "gif",
  "heic",
  "jpeg",
  "jpg",
  "nef",
  "png",
  "tif",
  "tiff",
  "webp"

];



// ==========================================================
// MEDIA SETTINGS
// ==========================================================
/**
 * General media scanning settings.
 */

CONFIG.MEDIA = {

  // Drive API
  PAGE_SIZE: 1000,

  ROOT_SETTING: "Media Root Folder ID",

  // File Filtering
  MIME_PREFIX: "image/",

  INCLUDE_SUBFOLDERS: true,

  SKIP_HIDDEN: true,

  // Synchronisation
  UPDATE_EXISTING: true,

  CREATE_THUMBNAILS: true

};


// ==========================================================
// DRIVE MIME TYPES
// ==========================================================
/**
 * Google Drive MIME type constants.
 *
 * Used when scanning Google Drive and
 * validating imported files.
 */

CONFIG.MIME = {

  IMAGE: "image/",

  FOLDER: "application/vnd.google-apps.folder",

  JPEG: "image/jpeg",

  PNG: "image/png",

  TIFF: "image/tiff",

  GIF: "image/gif",

  WEBP: "image/webp",

  HEIC: "image/heic"

};

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
// SETTINGS CACHE
// ==========================================================

// Stores Settings sheet values in memory during execution.

let SETTINGS_CACHE = null;


// ==========================================================
// SPREADSHEET HELPERS
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


// ==========================================================
// WORKSHEET HELPERS
// ==========================================================

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
 * Returns the Book worksheet.
 *
 * @returns {Sheet}
 */
function getBookSheet() {

  return getSheet(CONFIG.SHEETS.BOOK);

}

/**
 * Returns the Log worksheet.
 *
 * @returns {Sheet}
 */
function getLogSheet() {

  return getSheet(CONFIG.SHEETS.LOG);

}

/**
 * Returns the Dashboard worksheet.
 *
 * @returns {Sheet}
 */
function getDashboardSheet() {

  return getSheet(CONFIG.SHEETS.DASHBOARD);

}

// Future worksheet helpers
//
// getContributorSheet()
// getArchiveSheet()
// getSettingsRange()



// ==========================================================
// SETTINGS HELPERS
// ==========================================================

/**
 * Returns all settings.
 *
 * Settings are cached during execution
 * to avoid repeatedly reading the sheet.
 *
 * @returns {Array}
 */
function getAllSettings() {

  if (SETTINGS_CACHE) {

    return SETTINGS_CACHE;

  }

  SETTINGS_CACHE =
    getSettingsSheet()
      .getDataRange()
      .getValues();

  return SETTINGS_CACHE;

}


/**
 * Clears the settings cache.
 *
 * Forces the next call to getAllSettings()
 * to reload values from the Settings sheet.
 */
function clearSettingsCache() {

  SETTINGS_CACHE = null;

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

  // --------------------------------------------------------
  // Setting not found
  // --------------------------------------------------------

  warning(

    "Setting not found: " + settingName

  );

  return null;

}


/**
 * Updates a setting value in the Settings sheet.
 *
 * If the setting does not exist,
 * it will be added automatically.
 *
 * @param {string} settingName
 * @param {*} value
 */

function setSetting(settingName, value) {

  const sheet = getSettingsSheet();

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {

    if (data[i][0] === settingName) {

      sheet.getRange(i + 1, 2).setValue(value);

      clearSettingsCache();

      return;

    }

  }

  // --------------------------------------------------------
  // Setting not found
  // Add it automatically.
  // --------------------------------------------------------

  sheet.appendRow([settingName, value]);

  clearSettingsCache();

}