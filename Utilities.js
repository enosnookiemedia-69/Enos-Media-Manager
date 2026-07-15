/**
 * ==========================================================
 * UTILITIES.GS
 * ----------------------------------------------------------
 * Shared helper functions used throughout the application.
 *
 * Purpose:
 * • Display messages
 * • Logging
 * • Formatting
 * • Validation
 * • General helper functions
 *
 * This file should never contain application-specific logic.
 * ==========================================================
 */


// ==========================================================
// USER MESSAGES
// ==========================================================

/**
 * Display a message box.
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
 * Display an error message.
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
 * Display a success message.
 *
 * Uses logging during script execution.
 *
 * @param {string} message
 */
function showSuccess(message) {

  info(
    "[SUCCESS] " + message
  );

}

// ==========================================================
// LOGGING
// ==========================================================

/**
 * Write an information message to the execution log.
 *
 * @param {string} message
 */
function info(message) {

  console.log("[INFO] " + message);

}


/**
 * Write a warning message to the execution log.
 *
 * @param {string} message
 */
function warn(message) {

  console.log("[WARNING] " + message);

}


/**
 * Write an error message to the execution log.
 *
 * @param {string} message
 */
function showError(message) {

  info(
    "[ERROR] " + message
  );

}


/**
 * Standard log message.
 *
 * @param {string} message
 */
function log(message) {

  info(message);

}


// ==========================================================
// FORMATTING
// ==========================================================

// Future formatting functions go here.
//
// Examples:
//
// formatDate()
// formatFileSize()
// formatDuration()




// ==========================================================
// VALIDATION
// ==========================================================

// Future validation functions go here.
//
// Examples:
//
// isImageFile()
// isEmpty()
// isSupportedExtension()




// ==========================================================
// HELPERS
// ==========================================================

// Future helper functions go here.
//
// Examples:
//
// generateUUID()
// sleep()
// chunkArray()