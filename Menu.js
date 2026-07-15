/**
 * ==========================================================
 * MENU.GS
 * ----------------------------------------------------------
 * Creates the custom user interface for the spreadsheet.
 *
 * Responsibilities
 * ----------------
 * • Create the custom menu
 * • Open sidebars and dialogs
 * • Launch application functions
 * • Provide quick access to tools
 *
 * This file communicates with:
 * • Sync.gs
 * • Metadata.gs
 * • Utilities.gs
 * • Config.gs
 * ==========================================================
 */

// ==========================================================
// MENU CREATION
// ==========================================================

/**
 * Creates the custom spreadsheet menu.
 */
function onOpen() {

  SpreadsheetApp.getUi()
    .createMenu("📸 " + APP.NAME)
    .addItem("Open Media Manager", "showSidebar")
    .addSeparator()
    .addItem("Sync Media", "syncDrive")
    .addItem("Refresh Metadata", "refreshMetadataMenu")
    .addItem("Create Thumbnails", "createThumbnailsMenu")
    .addSeparator()
    .addItem("Settings", "openSettings")
    .addSeparator()
    .addItem("About", "showAbout")
    .addToUi();

}

// ==========================================================
// USER INTERFACE
// ==========================================================

/**
 * Opens the application sidebar.
 */
function showSidebar() {

  const html = HtmlService
    .createHtmlOutputFromFile("Sidebar")
    .setTitle(APP.NAME);

  SpreadsheetApp.getUi().showSidebar(html);

}

/**
 * Displays application information.
 */
function showAbout() {

  SpreadsheetApp.getUi().alert(

    APP.NAME +
    "\nVersion " + APP.VERSION +
    "\n\n" +
    APP.DESCRIPTION +
    "\n\nCreated by " + APP.AUTHOR +
    "\n" +
    APP.COPYRIGHT

  );

}

// ==========================================================
// MENU COMMANDS
// ==========================================================

/**
 * Runs the media synchronisation.
 */
function syncDrive() {

  sync();

}

/**
 * Runs the metadata refresh.
 */
function refreshMetadataMenu() {

  refreshMetadata();

}

/**
 * Generates media thumbnails.
 *
 * Placeholder for future implementation.
 */
function createThumbnailsMenu() {

  SpreadsheetApp.getUi().alert(
    "Thumbnail generation has not been implemented yet."
  );

}

/**
 * Opens the Settings worksheet.
 */
function openSettings() {

  getSettingsSheet().activate();

}

/**
 * Rebuilds the custom menu.
 *
 * Useful while developing.
 */
function installMenu() {

  onOpen();

}
