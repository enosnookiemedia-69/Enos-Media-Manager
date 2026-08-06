/**
 * ==========================================================
 * LOGGING.GS
 * ==========================================================
 */

// ==========================================================
// INFORMATION
// ==========================================================

function info(message) {
  Logger.log("INFO: " + message);
}

// ==========================================================
// WARNINGS
// ==========================================================

function warning(message) {
  Logger.log("WARNING: " + message);
}

// ==========================================================
// ERRORS
// ==========================================================

function error(message) {
  Logger.log("ERROR: " + message);
}

// ==========================================================
// DIALOGS
// ==========================================================

function showSuccess(message) {

  SpreadsheetApp.getUi().alert(message);

}

function showError(message) {

  SpreadsheetApp.getUi().alert(
    "Error",
    message,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

}