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
 * • Thumbnails.gs
 * • Database.gs
 * • Review.gs
 * • Config.gs
 * ==========================================================
 */


// ==========================================================
// MENU CREATION
// ==========================================================

/**
 * Creates the custom spreadsheet menu.
 *
 * Called automatically by the spreadsheet onOpen trigger.
 */
function onOpen(e) {

  createAppMenu();

}


/**
 * Builds the custom application menu.
 *
 * IMPORTANT:
 * SpreadsheetApp.getUi() is only called here because this
 * function is specifically intended to run in a spreadsheet
 * UI context.
 */
function createAppMenu() {

  const ui = SpreadsheetApp.getUi();

  ui.createMenu("📸 " + APP.NAME)

    // ------------------------------------------------------
    // Main
    // ------------------------------------------------------

    .addItem(
      "Open Media Manager",
      "openDashboard"
    )

    .addSeparator()


    // ------------------------------------------------------
    // Media
    // ------------------------------------------------------

    .addItem(
      "Sync Media",
      "syncDrive"
    )

    .addItem(
      "Refresh Metadata",
      "refreshMetadataMenu"
    )

    .addItem(
      "Refresh Thumbnails",
      "refreshThumbnailsMenu"
    )

    .addSeparator()


    // ------------------------------------------------------
    // Database
    // ------------------------------------------------------

    .addItem(
      "Reset Media Database",
      "clearMediaDatabaseMenu"
    )

    .addSeparator()


    // ------------------------------------------------------
    // Book Creation
    // ------------------------------------------------------

     .addItem(
      "Open Second Pass Reviewer",
      "openSecondPassReviewer"
    )

    .addSeparator()

    .addItem(
      "Rebuild Final Book Possibilities",
      "rebuildFinalBookPossibilitiesMenu"
    )

    .addItem(
      "Rebuild Book Image Balance",
      "syncBookBalanceMenu"
    )

    .addSeparator()


    // ------------------------------------------------------
    // Reset Tools
    // ------------------------------------------------------

    .addItem(
      "Reset Reviewed Images by Category…",
      "resetByCategoryMenu"
    )

    .addItem(
      "Reset \"Test\" Tagged Images…",
      "resetTestImagesMenu"
    )

    .addSeparator()


    // ------------------------------------------------------
    // Settings
    // ------------------------------------------------------

    .addItem(
      "Settings",
      "openSettings"
    )

    .addSeparator()


    // ------------------------------------------------------
    // About
    // ------------------------------------------------------

    .addItem(
      "About",
      "showAbout"
    )

    .addToUi();

}


// ==========================================================
// MENU COMMANDS
// ----------------------------------------------------------
// Thin wrappers so each menu item has a matching top-level
// function for ui.createMenu().addItem() to call by name.
// ==========================================================

/**
 * Runs the media synchronisation.
 *
 * Called from "Sync Media".
 */
function syncDrive() {

  sync();

}


/**
 * Runs the metadata refresh.
 *
 * Called from "Refresh Metadata".
 */
function refreshMetadataMenu() {

  refreshMetadata();

}


/**
 * Refreshes thumbnails for all records in the Media Database.
 *
 * Called from "Refresh Thumbnails".
 */
function refreshThumbnailsMenu() {

  refreshThumbnails();

}


// ==========================================================
// SETTINGS
// ==========================================================

/**
 * Opens the Settings worksheet.
 *
 * Called from "Settings".
 */
function openSettings() {

  getSettingsSheet().activate();

}


// ==========================================================
// ABOUT
// ==========================================================

/**
 * Displays application information.
 *
 * Called from "About".
 */
function showAbout() {

  SpreadsheetApp
    .getUi()
    .alert(

      APP.NAME +
      "\nVersion " +
      APP.VERSION +
      "\n\n" +
      APP.DESCRIPTION +
      "\n\nCreated by " +
      APP.AUTHOR +
      "\n" +
      APP.COPYRIGHT

    );

}


// ==========================================================
// DEVELOPMENT
// ==========================================================

/**
 * Rebuilds the custom menu.
 *
 * Run this manually ONLY while the script is being executed
 * from a spreadsheet-bound UI context.
 */
function installMenu() {

  createAppMenu();

}