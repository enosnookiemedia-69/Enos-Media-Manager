/**
 * ==========================================================
 * UTILITIES.GS
 * ----------------------------------------------------------
 * General helper functions used throughout the application.
 *
 * Responsibilities
 * ----------------
 * • User messages
 * • Formatting
 * • Validation
 * • General helper functions
 * • Date helpers
 * • Array helpers
 * • Object helpers
 *
 * NOTE
 * ----
 * Logging functions belong in Logging.gs.
 * This file should never contain application-specific logic.
 * ==========================================================
 */



// ==========================================================
// USER MESSAGES
// ==========================================================

/**
 * Displays a message box.
 *
 * @param {string} title
 * @param {string} message
 */
function showMessage(title, message) {

  SpreadsheetApp
    .getUi()
    .alert(
      title,
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

}


/**
 * Displays an error message.
 *
 * @param {string} message
 */
function showError(message) {

  SpreadsheetApp
    .getUi()
    .alert(
      "Error",
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

}


/**
 * Displays a success message.
 *
 * This can later be replaced with
 * a toast, sidebar notification,
 * or dialog without changing any
 * other code.
 *
 * @param {string} message
 */
function showSuccess(message) {

  SpreadsheetApp
    .getActiveSpreadsheet()
    .toast(
      message,
      "Success",
      5
    );

}



// ==========================================================
// FORMATTING
// ==========================================================

/**
 * Future formatting functions.
 *
 * Examples:
 *
 * formatDate()
 * formatFileSize()
 * formatDimensions()
 * formatOrientation()
 */



// ==========================================================
// DATE HELPERS
// ==========================================================

/**
 * Future date helper functions.
 *
 * Examples:
 *
 * getCurrentTimestamp()
 * formatTimestamp()
 * daysBetween()
 */



// ==========================================================
// VALIDATION
// ==========================================================

/**
 * Future validation functions.
 *
 * Examples:
 *
 * isImageFile()
 * isSupportedExtension()
 * isBlank()
 * isFolder()
 */



// ==========================================================
// STRING HELPERS
// ==========================================================

/**
 * Future string helper functions.
 *
 * Examples:
 *
 * capitalize()
 * slugify()
 * cleanFilename()
 * trimWhitespace()
 */



// ==========================================================
// ARRAY HELPERS
// ==========================================================

/**
 * Future array helper functions.
 *
 * Examples:
 *
 * chunkArray()
 * uniqueArray()
 * flattenArray()
 */



// ==========================================================
// OBJECT HELPERS
// ==========================================================

/**
 * Future object helper functions.
 *
 * Examples:
 *
 * cloneObject()
 * mergeObjects()
 * objectHasValue()
 */



// ==========================================================
// GOOGLE DRIVE HELPERS
// ==========================================================

/**
 * Future Drive helper functions.
 *
 * Examples:
 *
 * getFolderPath()
 * getFileExtension()
 * buildDriveUrl()
 */



// ==========================================================
// SPREADSHEET HELPERS
// ==========================================================

/**
 * Future spreadsheet helper functions.
 *
 * Examples:
 *
 * getLastDataRow()
 * autoResizeColumns()
 * clearDataRange()
 */



// ==========================================================
// GENERAL HELPERS
// ==========================================================

/**
 * Future general helper functions.
 *
 * Examples:
 *
 * generateUUID()
 * sleep()
 * clamp()
 * randomInteger()
 */