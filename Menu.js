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
      "Open Image Reviewer",
      "openImageReviewer"
    )

    .addItem(
      "Open Second Pass Reviewer",
      "openSecondPassReviewer"
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