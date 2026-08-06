/**
 * ==========================================================
 * SCANNER.GS
 * ----------------------------------------------------------
 * Searches Google Drive folders and returns media files.
 *
 * Responsibilities
 * ----------------
 * • Scan Google Drive recursively
 * • Detect folders
 * • Detect supported media files
 * • Ignore unsupported files
 * • Return Drive API file objects
 *
 * Communicates with:
 * • Sync.gs
 * • Config.gs
 * • Utilities.gs
 * ==========================================================
 */


// ==========================================================
// SCAN STATISTICS
// ==========================================================

const SCAN_STATS = {

  folders: 0,

  images: 0,

  skipped: 0

};


// ==========================================================
// DRIVE API SCANNER
// ==========================================================

/**
 * Scans the configured Drive folder.
 *
 * @param {string} folderId
 * @returns {Array<Object>}
 */
function scanFolderDriveAPI(folderId) {

  const files = [];

  scanRecursive(folderId, files);

  return files;

}


/**
 * Recursively scans Drive folders.
 *
 * @param {string} folderId
 * @param {Array<Object>} files
 */
function scanRecursive(folderId, files) {

  SCAN_STATS.folders++;

  let pageToken = null;

  do {

    try {

      const result = Drive.Files.list({

        q:
          "'" +
          folderId +
          "' in parents and trashed = false",

        maxResults:
          CONFIG.MEDIA.PAGE_SIZE,

        pageToken:
          pageToken,

        fields:
          "nextPageToken," +
          "items(" +
            "id," +
            "title," +
            "mimeType," +
            "fileSize," +
            "createdDate," +
            "thumbnailLink," +
            "imageMediaMetadata," +
            "parents" +
          ")"

      });

      const items = result.items || [];

      items.forEach(function(file) {

        // --------------------------------------------------
        // Folder
        // --------------------------------------------------

        if (file.mimeType === CONFIG.MIME.FOLDER) {

          scanRecursive(file.id, files);

          return;

        }

        // --------------------------------------------------
        // Supported Image
        // --------------------------------------------------

        if (isImageFile(file)) {

          SCAN_STATS.images++;

          files.push(file);

          return;

        }

        // --------------------------------------------------
        // Unsupported File
        // --------------------------------------------------

        SCAN_STATS.skipped++;

      });

      pageToken = result.nextPageToken;

    }

    catch (err) {

      throw new Error(
        "Scanner failed while reading folder " +
        folderId +
        ": " +
        err.message
      );

    }

  } while (pageToken);

}

// ==========================================================
// FILE VALIDATION
// ==========================================================

/**
 * Returns TRUE if the Drive file
 * should be imported.
 *
 * @param {Object} file
 * @returns {boolean}
 */
function isImageFile(file) {

  return (

    file.mimeType &&
    file.mimeType.startsWith(CONFIG.MEDIA.MIME_PREFIX) &&
    isSupportedExtension(file)

  );

}


/**
 * Returns TRUE if the file extension
 * is supported.
 *
 * @param {Object} file
 * @returns {boolean}
 */
function isSupportedExtension(file) {

  const name =
    file.title || file.name || "";

  const extension =
    name.includes(".")
      ? name.split(".").pop().toLowerCase()
      : "";

  return CONFIG.FILE_TYPES.includes(extension);

}


// ==========================================================
// PRIVATE HELPERS
// ==========================================================

// Future helper functions will live here.


// ==========================================================
// TEST FUNCTIONS
// ==========================================================

/**
 * Tests the Drive API scanner.
 */
function testDriveScanner() {

  SCAN_STATS.folders = 0;
  SCAN_STATS.images = 0;
  SCAN_STATS.skipped = 0;

  const folderId =
    getSetting("Media Root Folder ID");

  const files =
    scanFolderDriveAPI(folderId);

  info(
    "Folders scanned : " +
    SCAN_STATS.folders
  );

  info(
    "Images found : " +
    SCAN_STATS.images
  );

  info(
    "Skipped files : " +
    SCAN_STATS.skipped
  );

  Logger.log(files);

}


/**
 * Creates a single media object
 * for inspection.
 */
function testSingleMediaObject() {

  const folderId =
    getSetting("Media Root Folder ID");

  const files =
    scanFolderDriveAPI(folderId);

  if (!files.length) {

    warning("No files found.");

    return;

  }

  const media =
    buildMediaObject(files[0]);

  Logger.log(media);

}