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
 */
function onOpen() {

  SpreadsheetApp.getUi()

    .createMenu("📸 " + APP.NAME)

    // ------------------------------------------------------
    // Main
    // ------------------------------------------------------

    .addItem(
      "Open Media Manager",
      "showSidebar"
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

    // Second Pass Reviewer will be added here
    // once its current function name is confirmed.

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
// USER INTERFACE
// ==========================================================

/**
 * Opens the application sidebar.
 */
function showSidebar() {

  const html =
    HtmlService
      .createHtmlOutputFromFile("Sidebar")
      .setTitle(APP.NAME);

  SpreadsheetApp
    .getUi()
    .showSidebar(html);

}


/**
 * Displays application information.
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
 * Refreshes thumbnails for all
 * records in the Media Database.
 */
function refreshThumbnailsMenu() {

  refreshThumbnails();

}


/**
 * Clears every imported media record.
 *
 * Keeps the header row intact.
 */
function clearMediaDatabaseMenu() {

  const ui =
    SpreadsheetApp.getUi();


  const response =
    ui.alert(

      "Reset Media Database",

      "This will delete every imported media record.\n\n" +
      "This cannot be undone.\n\n" +
      "Continue?",

      ui.ButtonSet.YES_NO

    );


  if (
    response !== ui.Button.YES
  ) {

    return;

  }


  clearMediaDatabase();


  ui.alert(
    "Media database has been cleared."
  );

}


// ==========================================================
// SETTINGS
// ==========================================================

/**
 * Opens the Settings worksheet.
 */
function openSettings() {

  getSettingsSheet().activate();

}


// ==========================================================
// DEVELOPMENT
// ==========================================================

/**
 * Rebuilds the custom menu.
 *
 * Useful while developing.
 */
function installMenu() {

  onOpen();

}