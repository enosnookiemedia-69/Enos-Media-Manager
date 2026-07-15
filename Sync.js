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
 * • Detect deleted files
 * • Add new media records
 * • Update existing records
 * • Keep the Media worksheet in sync with Google Drive
 *
 * This file communicates with:
 * • Google Drive
 * • Database.gs
 * • Config.gs
 * • Utilities.gs
 * ==========================================================
 */


// ==========================================================
// MAIN SYNC
// ==========================================================

/**
 * Synchronises Google Drive with Media Database.
 */
function sync() {

  info("Starting media synchronisation...");


  const folder = getRootFolder();

  info(
    "Connected to folder: " +
    folder.getName()
  );

const files = scanFolder(folder);

const existingIds = getExistingFileIds();

  info(
    "Files found: " +
    files.length
  );


  const records = [];


  files.forEach(function(file, index) {


    // Skip files already in database

    if (existingIds[file.getId()]) {

      return;

    }

    if (index % 100 === 0) {

      info(
        "Processing files: " +
        (index + 1) +
        " / " +
        files.length
      );

    }


   const folderPath = getFolderPath(file);

    const record = [

      "",                         // Thumbnail

      file.getName(),             // File Name

      folderPath,                 // Folder Path

      file.getId(),               // File ID

      file.getSize(),             // File Size

      file.getDateCreated(),      // Date Created

      file.getUrl(),              // URL


      getYear(folderPath),        // Year

      getPhotographer(folderPath),// Photographer

      "",                         // Camera Model


      getFileExtension(file),     // Extension


      "",                         // Width

      "",                         // Height

      "",                         // Orientation

      "",                         // Date Taken


      "",                         // Layout

      "",                         // Print

      "",                         // Category

      "",                         // Grade

      "",                         // Story Value

      "",                         // Hero

      "",                         // Book Candidate

      "",                         // Final Book

      "",                         // Selection Stage

      "",                         // Caption

      "",                         // Spread

      "",                         // Page

      ""                          // Notes

    ];


    records.push(record);


  });


if (records.length > 0) {


  info(
    "Writing " +
    records.length +
    " records to sheet..."
  );


  const sheet = getMediaSheet();


  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      records.length,
      records[0].length
    )
    .setValues(records);


} else {

  info(
    "No new files found."
  );

}

  showSuccess(
  "Sync complete. Added " +
  records.length +
  " new files."
);

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

  const folderId = getSetting("Media Root Folder ID");

  return DriveApp.getFolderById(folderId);

}


// ==========================================================
// DATABASE CHECKS
// ==========================================================

/**
 * Returns File IDs already stored in Media Database.
 *
 * Used to prevent duplicate imports.
 *
 * @returns {Object}
 */
function getExistingFileIds() {

  const sheet = getMediaSheet();

  const lastRow = sheet.getLastRow();


  const existing = {};


  // No data yet
  if (lastRow < 2) {

    return existing;

  }


  const ids = sheet
    .getRange(
      2,
      COL.FILE_ID,
      lastRow - 1,
      1
    )
    .getValues();



  ids.forEach(function(row) {

    const fileId = row[0];


    if (fileId) {

      existing[fileId] = true;

    }

  });


  return existing;

}


