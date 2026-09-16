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


  const rawDriveFiles =
    scanFolderDriveAPI(folderId);


  // ========================================================
  // DEDUPLICATE SCANNED FILES
  // ========================================================
  //
  // A Google Drive file can live under more than one parent
  // folder (e.g. filed under both a year folder and a
  // category folder). The recursive scanner walks every
  // folder independently, so the same file can be returned
  // more than once in a single scan.
  //
  // Without this step, a file with multiple parents would
  // be queued and written as more than one row.
  //
  // ========================================================

  const seenFileIds = {};
  const driveFiles = [];
  let duplicatesSkipped = 0;

  rawDriveFiles.forEach(function(file) {

    if (seenFileIds[file.id]) {

      duplicatesSkipped++;
      return;

    }

    seenFileIds[file.id] = true;
    driveFiles.push(file);

  });


  SYNC_STATS.scanned =
    driveFiles.length;


  info(
    "Files scanned: " +
    SYNC_STATS.scanned
  );


  if (duplicatesSkipped > 0) {

    info(
      "Duplicate files skipped (multiple parent folders): " +
      duplicatesSkipped
    );

  }


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
  // TIME BUDGET
  // ========================================================
  //
  // Apps Script kills long-running executions (around 6
  // minutes on standard accounts). With a large batch of
  // new files, a single sync can exceed that limit.
  //
  // Rather than let the platform kill the script mid-file
  // (losing all unsaved progress), Sync tracks elapsed time
  // and stops itself early, safely, with everything found
  // so far already written to the sheet.
  //
  // Re-running Sync Media will pick up where this run left
  // off, since already-added files are skipped via the
  // existing-record check above.
  //
  // ========================================================

  const TIME_BUDGET_MS = 4.5 * 60 * 1000;

  const BATCH_FLUSH_SIZE = 25;

  let stoppedEarly = false;


  // ========================================================
  // PROCESS DRIVE FILES
  // ========================================================

  for (let i = 0; i < driveFiles.length; i++) {

    // ------------------------------------------------------
    // Stop early if the time budget has been exceeded
    // ------------------------------------------------------

    const elapsedMs =
      new Date().getTime() -
      startTime.getTime();

    if (elapsedMs > TIME_BUDGET_MS) {

      stoppedEarly = true;

      info(
        "Time budget reached (" +
        (elapsedMs / 1000).toFixed(0) +
        "s). Stopping early to save progress."
      );

      info(
        "Files remaining: " +
        (driveFiles.length - i) +
        ". Re-run Sync Media to continue."
      );

      break;

    }


    const file = driveFiles[i];


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


        continue;

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


      // --------------------------------------------------
      // Periodic flush
      // --------------------------------------------------
      //
      // Write completed records to the sheet in small
      // batches as we go, rather than holding everything
      // in memory until the very end. This guarantees that
      // if the script stops (time budget or a platform
      // timeout), work already done is not lost.
      //
      // --------------------------------------------------

      if (newRecords.length >= BATCH_FLUSH_SIZE) {

        SYNC_STATS.added +=
          addMediaBatch(newRecords);

        newRecords.length = 0;

      }

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

  }


  // ========================================================
  // ADD NEW RECORDS
  // ========================================================
  //
  // Writes any records left over after the loop ends
  // (fewer than a full batch, or the final partial batch
  // before an early stop).
  //
  // ========================================================

  if (newRecords.length) {

    SYNC_STATS.added +=
      addMediaBatch(newRecords);

  }


  if (stoppedEarly) {

    info(
      "Sync stopped early on time budget. " +
      "Run Sync Media again to continue importing " +
      "the remaining files."
    );

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


  appendSyncLogRow(
    "Drive Sync",
    SYNC_STATS,
    duration,
    stoppedEarly
      ? "Stopped early on time budget"
      : ""
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



