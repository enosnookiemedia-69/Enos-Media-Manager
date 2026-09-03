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

  LAST_UPDATED: "2026-08-12",

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

  BOOK_LAYOUT: "Book Final Layout",

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
  // CORE FILE INFORMATION
  // ========================================================

  THUMBNAIL: 1,
  NAME: 2,
  FOLDER_PATH: 3,
  FILE_ID: 4,
  SIZE: 5,
  CREATED_TIME: 6,
  URL: 7,


  // ========================================================
  // IMAGE METADATA
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
  ASPECT_RATIO: 17,
  MEGAPIXELS: 18,
  DATE_TAKEN: 19,


  // ========================================================
  // PROCESSING STATUS
  // ========================================================

  METADATA_UPDATED: 20,
  THUMBNAIL_STATUS: 21,


  // ========================================================
  // EDITORIAL REVIEW
  // ========================================================

  LAYOUT_SUITABILITY: 22,
  PRINT_SUITABILITY: 23,
  CATEGORY: 24,
  GRADE: 25,
  STORY_VALUE: 26,
  HERO_IMAGE: 27,
  BOOK_CANDIDATE: 28,
  FINAL_BOOK: 29,
  SELECTION_STAGE: 30,


  // ========================================================
  // BOOK PRODUCTION
  // ========================================================

  CAPTION: 31,
  SPREAD: 32,
  PAGE: 33,
  NOTES: 34,


  // ========================================================
  // REVIEW TRACKING
  // ========================================================

  REVIEW_DATE: 35,
  REVIEW_STATUS: 36

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
// MANUAL CATEGORY TARGETS
// ----------------------------------------------------------
// Some categories (like "Portraits & Extras") aren't tied to
// specific pages in the Book Final Layout — they're a flexible
// pool of spares rather than fillers for numbered slots. Their
// "needed" count is set manually here instead of being counted
// from layout rows. Target shown in Second Pass = needed x 2,
// same convention as the layout-driven categories.
// ==========================================================

CONFIG.MANUAL_CATEGORY_TARGETS = {

  "Portraits & Extras": 15

};


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
  "Not Selected",
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
 *
 * FINAL_BOOK is derived from the actual
 * Final Book Layout sheet (94 pages):
 *   8 hero spreads    x 1 image  =   8
 *   48 dual pages     x 2 images =  96
 *   17 single pages   x 1 image  =  17
 *   2 single-portrait x 1 image  =   2
 *   ---------------------------------
 *   TOTAL                        = 123
 *
 * (4 pages are pre-made AI artwork and
 * 5 pages are text-only, so they don't
 * draw from the Media Database pool.)
 *
 * If the layout changes, recount and
 * update this value to match.
 */

CONFIG.TARGETS = {

  TARGET_EDITS: 300,

  SHORTLIST: 150,

  FINAL_BOOK: 123,

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

// NOTE: getBookSheet() lives in BookList.js, not here,
// since it caches the sheet reference and is called
// directly by the Book List sync functions.

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

/**
 * Returns the Final Book Layout worksheet.
 *
 * @returns {Sheet}
 */
function getBookLayoutSheet() {

  return getSheet(CONFIG.SHEETS.BOOK_LAYOUT);

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




// ==========================================================
// TEST FUNCTIONS
// ==========================================================

/**
 * Tests the central application configuration.
 *
 * Verifies:
 * • Application information
 * • Spreadsheet access
 * • Configured sheet names
 * • Required sheets exist
 */
function testConfig() {

  Logger.log("==========================================");
  Logger.log("CONFIGURATION TEST");
  Logger.log("==========================================");

  // --------------------------------------------------------
  // Application information
  // --------------------------------------------------------

  Logger.log(
    "App Name: " +
    APP.NAME
  );

  Logger.log(
    "Version: " +
    APP.VERSION
  );

  Logger.log(
    "Author: " +
    APP.AUTHOR
  );

  Logger.log(
    "Created: " +
    APP.CREATED
  );

  Logger.log(
    "Last Updated: " +
    APP.LAST_UPDATED
  );

  Logger.log(
    "Timezone: " +
    APP.TIMEZONE
  );

  // --------------------------------------------------------
  // Sheet configuration
  // --------------------------------------------------------

  Logger.log(
    "Media Sheet: " +
    CONFIG.SHEETS.MEDIA
  );

  Logger.log(
    "Book Sheet: " +
    CONFIG.SHEETS.BOOK
  );

  Logger.log(
    "Log Sheet: " +
    CONFIG.SHEETS.LOG
  );

  Logger.log(
    "Settings Sheet: " +
    CONFIG.SHEETS.SETTINGS
  );

   Logger.log(
    "Dashboard Sheet: " +
    CONFIG.SHEETS.DASHBOARD
  );

  Logger.log(
    "Book Layout Sheet: " +
    CONFIG.SHEETS.BOOK_LAYOUT
  );

  // --------------------------------------------------------
  // Spreadsheet access
  // --------------------------------------------------------


  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {

    throw new Error(
      "Unable to access active spreadsheet."
    );

  }

  Logger.log(
    "Spreadsheet: " +
    spreadsheet.getName()
  );

  // --------------------------------------------------------
  // Sheet existence
  // --------------------------------------------------------

  const mediaSheet =
    spreadsheet.getSheetByName(
      CONFIG.SHEETS.MEDIA
    );

  const bookSheet =
    spreadsheet.getSheetByName(
      CONFIG.SHEETS.BOOK
    );

  const logSheet =
    spreadsheet.getSheetByName(
      CONFIG.SHEETS.LOG
    );

  const settingsSheet =
    spreadsheet.getSheetByName(
      CONFIG.SHEETS.SETTINGS
    );

  const dashboardSheet =
    spreadsheet.getSheetByName(
      CONFIG.SHEETS.DASHBOARD
    );

  const bookLayoutSheet =
    spreadsheet.getSheetByName(
      CONFIG.SHEETS.BOOK_LAYOUT
    );

  Logger.log(
    "Media Sheet Found: " +
    !!mediaSheet
  );

  Logger.log(
    "Book Sheet Found: " +
    !!bookSheet
  );

  Logger.log(
    "Log Sheet Found: " +
    !!logSheet
  );

  Logger.log(
    "Settings Sheet Found: " +
    !!settingsSheet
  );

   Logger.log(
    "Dashboard Sheet Found: " +
    !!dashboardSheet
  );

  Logger.log(
    "Book Layout Sheet Found: " +
    !!bookLayoutSheet
  );

  // --------------------------------------------------------
  // Result
  // --------------------------------------------------------

  if (
    !mediaSheet ||
    !bookSheet ||
    !logSheet ||
    !settingsSheet ||
    !dashboardSheet ||
    !bookLayoutSheet
  ) {

    throw new Error(
      "One or more configured sheets could not be found."
    );

  }

  Logger.log("------------------------------------------");
  Logger.log("CONFIGURATION TEST PASSED");
  Logger.log("==========================================");

}



// ==========================================================
// MEDIA DATABASE COLUMN MAP TEST
// ==========================================================

/**
 * Validates the Config column map against
 * the actual Media Database headers.
 *
 * This test is read-only and does not modify
 * the spreadsheet.
 */
function testColumnMap() {

  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {

    throw new Error(
      "Unable to access active spreadsheet."
    );

  }

  const sheet =
    spreadsheet.getSheetByName(
      CONFIG.SHEETS.MEDIA
    );

  if (!sheet) {

    throw new Error(
      "Media Database sheet not found."
    );

  }

  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0];

  Logger.log("==========================================");
  Logger.log("MEDIA DATABASE COLUMN MAP TEST");
  Logger.log("==========================================");

  Logger.log(
    "Sheet columns: " +
    headers.length
  );

  // --------------------------------------------------------
  // Expected headers
  // --------------------------------------------------------

  const expected = {

    THUMBNAIL: "Thumbnail",
    NAME: "File Name",
    FOLDER_PATH: "Folder Path",
    FILE_ID: "File ID",
    SIZE: "File Size (KB)",
    CREATED_TIME: "Date Created",
    URL: "URL",

    YEAR: "Year",
    PHOTOGRAPHER: "Photographer",
    CAMERA_MODEL: "Camera Model",
    EXIF_CAMERA: "EXIF Camera",
    FILE_EXTENSION: "File Extension",
    MIME_TYPE: "Mime Type",
    WIDTH: "Width (px)",
    HEIGHT: "Height (px)",
    ORIENTATION: "Orientation",
    ASPECT_RATIO: "Aspect Ratio",
    MEGAPIXELS: "Megapixels",
    DATE_TAKEN: "Date Taken",

    METADATA_UPDATED: "Metadata Updated",
    THUMBNAIL_STATUS: "Thumbnail Status",

    LAYOUT_SUITABILITY: "Layout Suitability",
    PRINT_SUITABILITY: "Print Suitability",
    CATEGORY: "Category",
    GRADE: "Grade",
    STORY_VALUE: "Story Value",
    HERO_IMAGE: "Hero Image",
    BOOK_CANDIDATE: "Book Candidate",
    FINAL_BOOK: "Final Book",
    SELECTION_STAGE: "Selection Stage",

    CAPTION: "Caption",
    SPREAD: "Spread",
    PAGE: "Page",
    NOTES: "Notes",

    REVIEW_DATE: "Review Date",
    REVIEW_STATUS: "Review Status"

  };

  // --------------------------------------------------------
  // Validate column count
  // --------------------------------------------------------

  if (headers.length !== 36) {

    throw new Error(
      "Expected 36 Media Database columns but found " +
      headers.length +
      "."
    );

  }

  // --------------------------------------------------------
  // Compare Config against spreadsheet
  // --------------------------------------------------------

  let errors = 0;

  Object.keys(expected).forEach(function(key) {

    const column =
      COL[key];

    const expectedHeader =
      expected[key];

    const actualHeader =
      headers[column - 1];

    if (actualHeader !== expectedHeader) {

      errors++;

      Logger.log(
        "ERROR: " +
        key +
        " → Column " +
        column +
        " → Expected \"" +
        expectedHeader +
        "\" but found \"" +
        actualHeader +
        "\""
      );

    } else {

      Logger.log(
        "OK: " +
        key +
        " → Column " +
        column +
        " → " +
        actualHeader
      );

    }

  });

  // --------------------------------------------------------
  // Result
  // --------------------------------------------------------

  Logger.log("------------------------------------------");

  if (errors > 0) {

    throw new Error(
      "Column map validation failed with " +
      errors +
      " error(s)."
    );

  }

  Logger.log(
    "RESULT: Column map is correct."
  );

  Logger.log("==========================================");
  Logger.log("COLUMN MAP TEST PASSED");
  Logger.log("==========================================");

}