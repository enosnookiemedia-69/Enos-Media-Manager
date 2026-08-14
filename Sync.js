/**
 * ==========================================================
 * SYNC.GS
 * ----------------------------------------------------------
 * Synchronises Google Drive with the Media worksheet.
 *
 * Responsibilities
 * ----------------
 * • Scan Google Drive folders
 * • Discover new media files
 * • Prevent duplicate imports
 * • Build media records
 * • Add new records to Media Database
 * • Prepare database for future update tracking
 *
 * This file communicates with:
 * • Google Drive
 * • Database.gs
 * • Config.gs
 * • Utilities.gs
 * ==========================================================
 */


// ==========================================================
// SYNC STATISTICS
// ==========================================================

const SYNC_STATS = {

  scanned: 0,
  existing: 0,
  added: 0,
  errors: 0

};


// ==========================================================
// MAIN SYNC
// ==========================================================

/**
 * Synchronises Google Drive with the Media Database.
 *
 * Scans Drive, builds complete media objects,
 * and writes new records in batches.
 */
function sync() {

  // --------------------------------------------------------
  // Reset Sync Statistics
  // --------------------------------------------------------

SYNC_STATS.scanned = 0;
SYNC_STATS.existing = 0;
SYNC_STATS.added = 0;
SYNC_STATS.errors = 0;

  info("Starting media synchronisation...");

  const folderId =
    getSetting("Media Root Folder ID");

  info("Scanning Drive folder...");


  // --------------------------------------------------------
  // Reset Scanner Statistics
  // --------------------------------------------------------

  SCAN_STATS.folders = 0;
  SCAN_STATS.images = 0;
  SCAN_STATS.skipped = 0;


  // --------------------------------------------------------
  // Scan Google Drive
  // --------------------------------------------------------

  const driveFiles =
    scanFolderDriveAPI(folderId);

  info(
    "Folders scanned: " +
    SCAN_STATS.folders
  );

  info(
    "Images found: " +
    SCAN_STATS.images
  );

  info(
    "Skipped files: " +
    SCAN_STATS.skipped
  );

  info(
    "Files found: " +
    driveFiles.length
  );


 // --------------------------------------------------------
// Prepare Import
// --------------------------------------------------------
// Load existing File IDs.
// Used to prevent duplicate imports.
// --------------------------------------------------------

const existingIds =
  getExistingFileIds();

const batchSize = 50;

let records = [];

  // --------------------------------------------------------
  // Process Files
  // --------------------------------------------------------

  driveFiles.forEach(function(file, index) {

  // ------------------------------------------------------
  // Statistics
  // ------------------------------------------------------

  SYNC_STATS.scanned++;

// ------------------------------------------------------
// Existing Record?
// ------------------------------------------------------
// Already imported.
// Skip immediately.
// ------------------------------------------------------

if (existingIds[file.id]) {

  SYNC_STATS.existing++;

  return;

}

// ------------------------------------------------------
// Progress Logging
// ------------------------------------------------------

if (index % 100 === 0) {

  info(
    "Processing " +
    (index + 1) +
    " / " +
    driveFiles.length
  );

}


  // ------------------------------------------------------
  // Import Media
  // ------------------------------------------------------

  try {

    let media = buildMediaObject(file);

    media = populateMediaMetadata(media);

    if (CONFIG.DEBUG.ENABLED) {
      Logger.log(media);
    }

    records.push(
      mediaObjectToRow(media)
    );

    if (records.length >= batchSize) {

      const written =
        addMediaBatch(records);

      SYNC_STATS.added += written;

      info(
        "Written " +
        written +
        " records."
      );

      records = [];

    }

  }

catch (err) {

  SYNC_STATS.errors++;

  warning(
    "Unable to import " +
    file.title +
    ": " +
    err.message
  );

}

});   // End of driveFiles.forEach()

// --------------------------------------------------------
// Write Remaining Records
// --------------------------------------------------------

if (records.length) {

  const written =
    addMediaBatch(records);

  SYNC_STATS.added += written;

}


// --------------------------------------------------------
// Summary
// --------------------------------------------------------

info("--------------------------------");

info("Scanned : " + SYNC_STATS.scanned);
info("Existing : " + SYNC_STATS.existing);
info("Added : " + SYNC_STATS.added);
info("Errors : " + SYNC_STATS.errors);
}

// ==========================================================
// DRIVE HELPERS
// ==========================================================

/**
 * Returns the configured root media folder.
 *
 * @returns {Folder}
 */
function getRootFolder() {

  const folderId =
    getSetting("Media Root Folder ID");

  return DriveApp.getFolderById(folderId);

}




/**
 * Tests the complete sync pipeline on ONE file.
 *
 * This test is READ-ONLY.
 * It does NOT write anything to Media Database.
 */
function testSingleSyncPipeline() {

  info("================================");
  info("TEST: Single Sync Pipeline");
  info("================================");

  const folderId =
    getSetting("Media Root Folder ID");

  if (!folderId) {
    warning("Media Root Folder ID is missing.");
    return;
  }

  info("Root folder ID: " + folderId);

  // ------------------------------------------------------
  // Scan Drive
  // ------------------------------------------------------

  SCAN_STATS.folders = 0;
  SCAN_STATS.images = 0;
  SCAN_STATS.skipped = 0;

  const files =
    scanFolderDriveAPI(folderId);

  info("Folders scanned : " + SCAN_STATS.folders);
  info("Images found    : " + SCAN_STATS.images);
  info("Skipped files   : " + SCAN_STATS.skipped);

  if (!files.length) {
    warning("No media files were found.");
    return;
  }

  // ------------------------------------------------------
  // Select first file
  // ------------------------------------------------------

  const file = files[0];

  info("Testing file:");
  info("ID   : " + file.id);
  info("Name : " + file.title);
  info("Type : " + file.mimeType);

  // ------------------------------------------------------
  // Build Media Object
  // ------------------------------------------------------

  let media =
    buildMediaObject(file);

  info("Media object created.");

  // ------------------------------------------------------
  // Populate Metadata
  // ------------------------------------------------------

  media =
    populateMediaMetadata(media);

  info("Metadata populated.");

  // ------------------------------------------------------
  // Convert to Database Row
  // ------------------------------------------------------

  const row =
    mediaObjectToRow(media);

  info("Database row created.");

  // ------------------------------------------------------
  // Output
  // ------------------------------------------------------

  Logger.log("========== MEDIA OBJECT ==========");
  Logger.log(media);

  Logger.log("========== DATABASE ROW ==========");
  Logger.log(row);

  info("================================");
  info("TEST COMPLETE");
  info("NO DATABASE WRITE PERFORMED");
  info("================================");

}


/**
 * Tests Sync duplicate detection.
 *
 * READ-ONLY.
 * Does NOT write to Media Database.
 */
function testSyncDuplicateDetection() {

  info("================================");
  info("TEST: Sync Duplicate Detection");
  info("================================");

  const folderId =
    getSetting("Media Root Folder ID");

  if (!folderId) {
    warning("Media Root Folder ID is missing.");
    return;
  }

  // ------------------------------------------------------
  // Scan Drive
  // ------------------------------------------------------

  SCAN_STATS.folders = 0;
  SCAN_STATS.images = 0;
  SCAN_STATS.skipped = 0;

  const files =
    scanFolderDriveAPI(folderId);

  info("Files scanned: " + files.length);

  // ------------------------------------------------------
  // Load existing database IDs
  // ------------------------------------------------------

  const existingIds =
    getExistingFileIds();

  const existingIdCount =
    Object.keys(existingIds).length;

  info(
    "Database IDs found: " +
    existingIdCount
  );

  // ------------------------------------------------------
  // Compare
  // ------------------------------------------------------

  let existing = 0;
  let newFiles = 0;

  files.forEach(function(file) {

    if (existingIds[file.id]) {
      existing++;
    } else {
      newFiles++;
    }

  });

  // ------------------------------------------------------
  // Results
  // ------------------------------------------------------

  info("Already existing: " + existing);
  info("New files: " + newFiles);

  info("--------------------------------");

  if (newFiles === 0) {

    info(
      "RESULT: All scanned files already exist."
    );

  } else {

    warning(
      "RESULT: " +
      newFiles +
      " scanned file(s) are not in the database."
    );

  }

  info("================================");
  info("TEST COMPLETE");
  info("NO DATABASE WRITE PERFORMED");
  info("================================");

}


