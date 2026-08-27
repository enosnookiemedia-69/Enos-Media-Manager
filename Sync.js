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
 * • Maintain missing thumbnails
 * • Skip unchanged existing files
 * • Record synchronisation statistics
 *
 * This file communicates with:
 * • Google Drive
 * • Database.gs
 * • Config.gs
 * • Metadata.gs
 * • Utilities.gs
 * • Thumbnails.gs
 *
 * IMPORTANT
 * ---------
 * Sync is responsible for:
 *
 * 1. Discovering NEW files
 * 2. Importing complete metadata for NEW files
 * 3. Generating thumbnails for NEW files
 * 4. Repairing missing thumbnails on EXISTING files
 *
 * Existing metadata is NOT rebuilt during normal Sync.
 *
 * Existing metadata can be deliberately refreshed using
 * refreshMetadata().
 * ==========================================================
 */


// ==========================================================
// SYNC STATISTICS
// ==========================================================

const SYNC_STATS = {

  scanned: 0,

  added: 0,

  updated: 0,

  skipped: 0,

  thumbnailsFixed: 0,

  errors: 0

};


// ==========================================================
// MAIN SYNC
// ==========================================================

/**
 * Synchronises Google Drive with the Media Database.
 *
 * The sync process:
 *
 * 1. Validate the configured root folder
 * 2. Scan Google Drive recursively
 * 3. Load existing database records
 * 4. Compare Drive File IDs
 * 5. Repair missing thumbnails on existing records
 * 6. Build complete metadata for new files
 * 7. Generate thumbnails for new files
 * 8. Add new records in one batch
 * 9. Record synchronisation statistics
 *
 * Existing metadata is NOT rebuilt during Sync.
 *
 * Metadata refreshes for existing records are handled
 * separately by refreshMetadata().
 */
function sync() {

  const startTime =
    new Date();


  // ========================================================
  // RESET SYNC STATISTICS
  // ========================================================

  SYNC_STATS.scanned = 0;

  SYNC_STATS.added = 0;

  SYNC_STATS.updated = 0;

  SYNC_STATS.skipped = 0;

  SYNC_STATS.thumbnailsFixed = 0;

  SYNC_STATS.errors = 0;


  // ========================================================
  // VALIDATE ROOT FOLDER
  // ========================================================

  const folderId =
    getSetting("Media Root Folder ID");


  if (!folderId) {

    throw new Error(
      "Media Root Folder ID is not configured."
    );

  }


  // ========================================================
  // START SYNC
  // ========================================================

  info(
    "Starting media synchronisation..."
  );


  // ========================================================
  // SCAN GOOGLE DRIVE
  // ========================================================

  info(
    "Scanning Drive..."
  );


  const driveFiles =
    scanFolderDriveAPI(folderId);


  SYNC_STATS.scanned =
    driveFiles.length;


  info(
    "Files scanned: " +
    SYNC_STATS.scanned
  );


  // ========================================================
  // LOAD EXISTING DATABASE RECORDS
  // ========================================================
  //
  // getMediaCache() reads the database once and creates
  // an in-memory lookup keyed by Google Drive File ID.
  //
  // This allows Sync to determine whether a file has already
  // been imported without repeatedly reading the sheet.
  //
  // ========================================================

  const mediaCache =
    getMediaCache();


  info(
    "Existing database records: " +
    Object.keys(mediaCache).length
  );


  // ========================================================
  // PREPARE NEW RECORDS
  // ========================================================

  const newRecords = [];


  // ========================================================
  // PROCESS DRIVE FILES
  // ========================================================

  driveFiles.forEach(function(file) {

    try {

      // ====================================================
      // EXISTING RECORD CHECK
      // ====================================================
      //
      // The Google Drive File ID is the unique identifier
      // used to determine whether this image has already
      // been imported.
      //
      // Existing records are NOT rebuilt or reprocessed.
      //
      // Sync does, however, maintain the required thumbnail.
      //
      // If an existing record has no valid thumbnail,
      // the thumbnail is repaired without touching any
      // other field.
      //
      // ====================================================

      const existing =
        mediaCache[file.id];


      if (existing) {

        // ==================================================
        // CHECK EXISTING THUMBNAIL
        // ==================================================

        const thumbnail =
          existing["Thumbnail"];


        const thumbnailStatus =
          existing["Thumbnail Status"];


        // ==================================================
        // REPAIR MISSING THUMBNAIL
        // ==================================================

        if (
          !hasThumbnail(thumbnail) ||
          thumbnailStatus !== "Generated"
        ) {

          // ----------------------------------------------
          // Respect thumbnail configuration
          // ----------------------------------------------

          if (
            getSetting("Create Thumbnails") === true
          ) {

            const thumbnailFormula =
              getThumbnailFormula(file.id);


            const repaired =
              updateMediaThumbnail(
                file.id,
                thumbnailFormula,
                "Generated"
              );


            if (repaired) {

              SYNC_STATS.updated++;

              SYNC_STATS.thumbnailsFixed++;

            }

            else {

              SYNC_STATS.errors++;

              warning(
                "Unable to update thumbnail for " +
                file.id
              );

            }

          }

          else {

            SYNC_STATS.skipped++;

          }

        }

        else {

          // ----------------------------------------------
          // Existing record is already complete
          // ----------------------------------------------

          SYNC_STATS.skipped++;

        }


        return;

      }


      // ====================================================
      // NEW RECORD
      // ====================================================
      //
      // Only genuinely new files reach this section.
      //
      // ====================================================


      // ----------------------------------------------------
      // Build Media Object
      // ----------------------------------------------------

      let media =
        buildMediaObject(file);


      // ----------------------------------------------------
      // Populate Complete Metadata
      // ----------------------------------------------------
      //
      // Metadata extraction occurs only for newly imported
      // files.
      //
      // ----------------------------------------------------

      media =
        populateMediaMetadata(media);


      // ----------------------------------------------------
      // Generate Thumbnail
      // ----------------------------------------------------
      //
      // Thumbnail generation is performed for new records.
      //
      // This keeps newly imported records consistent with
      // existing records repaired by Sync.
      //
      // ----------------------------------------------------

      if (
        getSetting("Create Thumbnails") === true
      ) {

        media =
          generateThumbnail(media);

      }


      // ----------------------------------------------------
      // Convert Media Object to Database Row
      // ----------------------------------------------------

      const currentRecord =
        mediaObjectToRow(media);


      // ----------------------------------------------------
      // Queue New Record
      // ----------------------------------------------------

      newRecords.push(
        currentRecord
      );

    }

    catch (err) {

      SYNC_STATS.errors++;


      warning(
        "Unable to process " +
        (file.title || file.id) +
        ": " +
        err.message
      );

    }

  });


  // ========================================================
  // ADD NEW RECORDS
  // ========================================================
  //
  // All new records are written to the database in one
  // spreadsheet operation.
  //
  // ========================================================

  if (newRecords.length) {

    SYNC_STATS.added =
      addMediaBatch(newRecords);

  }


  // ========================================================
  // SYNC DURATION
  // ========================================================

  const duration =
    (
      new Date().getTime() -
      startTime.getTime()
    ) / 1000;


  // ========================================================
  // SYNC SUMMARY
  // ========================================================

  info(
    "--------------------------------"
  );


  info(
    "Sync complete."
  );


  info(
    "Scanned : " +
    SYNC_STATS.scanned
  );


  info(
    "Added   : " +
    SYNC_STATS.added
  );


  info(
    "Updated : " +
    SYNC_STATS.updated
  );


  info(
    "Skipped : " +
    SYNC_STATS.skipped
  );


  info(
    "Thumbs  : " +
    SYNC_STATS.thumbnailsFixed
  );


  info(
    "Errors  : " +
    SYNC_STATS.errors
  );


  info(
    "Duration: " +
    duration.toFixed(1) +
    " seconds."
  );


  info(
    "--------------------------------"
  );

}


// ==========================================================
// DRIVE HELPERS
// ==========================================================

/**
 * Returns the configured root media folder.
 *
 * The folder ID is always obtained from Settings.
 *
 * @returns {Folder}
 */
function getRootFolder() {

  const folderId =
    getSetting("Media Root Folder ID");


  if (!folderId) {

    throw new Error(
      "Media Root Folder ID is not configured."
    );

  }


  return DriveApp.getFolderById(
    folderId
  );

}







function testSingleSyncPipeline() {

  info("==========================================");
  info("SINGLE SYNC PIPELINE TEST");
  info("==========================================");

  const folderId =
    getSetting("Media Root Folder ID");

  info("Root folder: " + folderId);

  const files =
    scanFolderDriveAPI(folderId);

  info("Files found: " + files.length);

  if (!files.length) {
    throw new Error("No media files found.");
  }

  const file = files[0];

  info("Testing file: " + file.title);
  info("File ID: " + file.id);

  // --------------------------------------------------------
  // BUILD MEDIA OBJECT
  // --------------------------------------------------------

  let media =
    buildMediaObject(file);

  info("buildMediaObject: PASS");

  // --------------------------------------------------------
  // POPULATE METADATA
  // --------------------------------------------------------

  media =
    populateMediaMetadata(media);

  info("populateMediaMetadata: PASS");

  // --------------------------------------------------------
  // CONVERT TO DATABASE ROW
  // --------------------------------------------------------

  const row =
    mediaObjectToRow(media);

  info("mediaObjectToRow: PASS");
  info("Row columns: " + row.length);

  info("==========================================");
  info("SINGLE SYNC PIPELINE TEST PASSED");
  info("==========================================");
}






function testFullSyncPipeline() {

  info("==========================================");
  info("FULL SYNC PIPELINE DRY RUN");
  info("==========================================");

  const folderId =
    getSetting("Media Root Folder ID");

  info("Root folder: " + folderId);

  const driveFiles =
    scanFolderDriveAPI(folderId);

  info("Files found: " + driveFiles.length);

  if (!driveFiles.length) {
    throw new Error("No media files found.");
  }

  let passed = 0;
  let failed = 0;

  const failures = [];

  driveFiles.forEach(function(file, index) {

    try {

      let media =
        buildMediaObject(file);

      media =
        populateMediaMetadata(media);

      if (
        getSetting("Create Thumbnails") === true
      ) {

        media =
          generateThumbnail(media);

      }

      const row =
        mediaObjectToRow(media);

      if (row.length !== 36) {

        throw new Error(
          "Expected 36 columns, got " +
          row.length
        );

      }

      passed++;

      if ((index + 1) % 100 === 0) {

        info(
          "Processed: " +
          (index + 1) +
          " / " +
          driveFiles.length
        );

      }

    }

    catch (err) {

      failed++;

      failures.push({
        file: file.title || file.id,
        id: file.id,
        error: err.message
      });

    }

  });

  info("==========================================");
  info("FULL PIPELINE DRY RUN COMPLETE");
  info("==========================================");

  info("Total : " + driveFiles.length);
  info("Passed: " + passed);
  info("Failed: " + failed);

  if (failures.length) {

    info("------------------------------------------");
    info("FAILURES");
    info("------------------------------------------");

    failures.forEach(function(item) {

      warning(
        item.file +
        " | " +
        item.id +
        " | " +
        item.error
      );

    });

  }

  if (failed > 0) {

    throw new Error(
      "Full pipeline test failed: " +
      failed +
      " file(s)."
    );

  }

  info("==========================================");
  info("FULL SYNC PIPELINE TEST PASSED");
  info("==========================================");

}