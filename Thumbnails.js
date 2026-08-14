/**
 * ==========================================================
 * THUMBNAILS.GS
 * ----------------------------------------------------------
 * Handles thumbnail generation for media files.
 *
 * Responsibilities
 * ----------------
 * • Generate thumbnail URLs
 * • Refresh thumbnails
 * • Track thumbnail status
 * ==========================================================
 */

// ==========================================================
// THUMBNAIL CACHE
// ==========================================================

/**
 * Stores generated thumbnail formulas
 * during the current execution.
 *
 * This avoids repeatedly rebuilding
 * identical IMAGE() formulas.
 */

let THUMBNAIL_CACHE = {};


/**
 * Clears the thumbnail cache.
 *
 * Called whenever thumbnails need to
 * be regenerated.
 */
function clearThumbnailCache() {

  THUMBNAIL_CACHE = {};

}



// ==========================================================
// THUMBNAIL SETTINGS
// ==========================================================

/**
 * Returns the configured thumbnail width.
 *
 * Uses the value stored in the Settings sheet.
 *
 * @returns {number}
 */
function getThumbnailWidth() {

  const width =
    Number(getSetting("Thumbnail Width"));

  return width || 250;

}


/**
 * Returns the configured thumbnail size.
 *
 * Example values:
 * • Small
 * • Medium
 * • Large
 *
 * @returns {string}
 */
function getThumbnailSize() {

  return String(

    getSetting("Thumbnail Size") ||

    "Medium"

  );

}

// ==========================================================
// THUMBNAIL HELPERS
// ==========================================================

/**
 * Returns a Google Drive thumbnail URL.
 *
 * @param {string} fileId
 * @returns {string}
 */
function getThumbnailUrl(fileId) {

  return (
    "https://drive.google.com/thumbnail?id=" +
    fileId +
    "&sz=w" +
    getThumbnailWidth()
  );

}


/**
 * Returns an IMAGE() formula for use
 * inside the spreadsheet.
 *
 * @param {string} fileId
 * @returns {string}
 */
function getThumbnailFormula(fileId) {

  if (THUMBNAIL_CACHE[fileId]) {

    return THUMBNAIL_CACHE[fileId];

  }

  const formula =
    `=IMAGE("${getThumbnailUrl(fileId)}")`;

  THUMBNAIL_CACHE[fileId] = formula;

  return formula;

}


/**
 * Returns the Google Drive preview URL.
 *
 * Used in sidebars and dialogs where
 * an embedded preview is required.
 *
 * @param {string} fileId
 * @returns {string}
 */
function getPreviewUrl(fileId) {

  return (
    "https://drive.google.com/file/d/" +
    fileId +
    "/preview"
  );

}


/**
 * Returns the Google Drive viewer URL.
 *
 * Opens the image in Google Drive.
 *
 * @param {string} fileId
 * @returns {string}
 */
function getViewerUrl(fileId) {

  return (
    "https://drive.google.com/open?id=" +
    fileId
  );

}



// ==========================================================
// THUMBNAIL GENERATION
// ==========================================================

/**
 * Populates thumbnail information
 * on a media object.
 *
 * @param {Object} media
 * @returns {Object}
 */
function generateThumbnail(media) {

  // Thumbnail generation disabled.

  if (!getSetting("Create Thumbnails")) {

    media.thumbnail = "";

    media.thumbnailStatus = "Disabled";

    return media;

  }

  // Missing Drive file.

  if (!media.id) {

    media.thumbnail = "";

    media.thumbnailStatus = "Missing File";

    return media;

  }

  // Generate thumbnail.

  media.thumbnail =
    getThumbnailFormula(media.id);

  media.thumbnailStatus =
    "Generated";

  media.thumbnailUpdated =
    new Date();

  return media;

}

// ==========================================================
// THUMBNAIL REFRESH
// ==========================================================

/**
 * Refreshes thumbnails for every
 * image in the Media Database.
 */
function refreshThumbnails() {

  info("Refreshing thumbnails...");

  // --------------------------------------------------------
  // Start with a clean cache.
  // --------------------------------------------------------

  clearThumbnailCache();

  // --------------------------------------------------------
  // Respect the application setting.
  // --------------------------------------------------------

  if (!getSetting("Create Thumbnails")) {

    showError(
      "Thumbnail generation is disabled."
    );

    return;

  }

  // --------------------------------------------------------
  // Get Media Database.
  // --------------------------------------------------------

  const sheet =
    getMediaSheet();

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {

    showError(
      "No media records found."
    );

    return;

  }

  // --------------------------------------------------------
  // Read File IDs.
  // --------------------------------------------------------

  const ids =
    sheet
      .getRange(
        2,
        COL.FILE_ID,
        lastRow - 1,
        1
      )
      .getValues();

  const thumbnailValues = [];
  const statusValues = [];

  // --------------------------------------------------------
  // Build thumbnail data.
  // --------------------------------------------------------

  for (
    let i = 0;
    i < ids.length;
    i++
  ) {

    const fileId =
      ids[i][0];

    if (!fileId) {

      thumbnailValues.push([
        ""
      ]);

      statusValues.push([
        "Missing File"
      ]);

      continue;

    }

    thumbnailValues.push([
      getThumbnailFormula(fileId)
    ]);

    statusValues.push([
      "Generated"
    ]);

    // ------------------------------------------------------
    // Progress logging for large libraries.
    // ------------------------------------------------------

    if ((i + 1) % 500 === 0) {

      info(
        "Processed " +
        (i + 1) +
        " thumbnails..."
      );

    }

  }

  // --------------------------------------------------------
  // Update Thumbnail column.
  // --------------------------------------------------------

  sheet
    .getRange(
      2,
      COL.THUMBNAIL,
      thumbnailValues.length,
      1
    )
    .setValues(
      thumbnailValues
    );

  // --------------------------------------------------------
  // Update Thumbnail Status column.
  // --------------------------------------------------------

  sheet
    .getRange(
      2,
      COL.THUMBNAIL_STATUS,
      statusValues.length,
      1
    )
    .setValues(
      statusValues
    );

  // --------------------------------------------------------
  // Complete.
  // --------------------------------------------------------

  showSuccess(
    thumbnailValues.length +
    " thumbnails refreshed."
  );

}

// ==========================================================
// THUMBNAIL VALIDATION
// ==========================================================
/**
 * Functions used to verify thumbnail information.
 *
 * Responsibilities
 * ----------------
 * • Verify file IDs exist
 * • Check thumbnail formulas
 * • Determine thumbnail status
 * */


/**
 * Returns true if a valid file ID exists.
 *
 * @param {*} fileId
 * @returns {boolean}
 */
function hasThumbnailFile(fileId) {

  return !!fileId;

}


/**
 * Returns true if a thumbnail formula exists.
 *
 * @param {*} thumbnail
 * @returns {boolean}
 */
function hasThumbnail(thumbnail) {

  return (
    typeof thumbnail === "string" &&
    thumbnail.startsWith("=IMAGE(")
  );

}


/**
 * Returns the appropriate thumbnail status.
 *
 * @param {*} fileId
 * @param {*} thumbnail
 * @returns {string}
 */
function getThumbnailStatus(fileId, thumbnail) {

  if (!hasThumbnailFile(fileId)) {

    return "Missing File";

  }

  if (!hasThumbnail(thumbnail)) {

    return "Missing Thumbnail";

  }

  return "Generated";

}


// ==========================================================
// THUMBNAIL UTILITIES
// ==========================================================
/**
 * Utility functions used for
 * thumbnail maintenance.
 *
 * Responsibilities
 * ----------------
 * • Regenerate thumbnails
 * • Clear cached thumbnails
 * • Repair missing thumbnails
 */


/**
 * Regenerates the thumbnail
 * for a media object.
 *
 * @param {Object} media
 * @returns {Object}
 */
function regenerateThumbnail(media) {

  clearThumbnailCache();

  return generateThumbnail(media);

}


/**
 * Clears the in-memory cache and
 * refreshes every thumbnail in
 * the Media Database.
 */
function regenerateAllThumbnails() {

  clearThumbnailCache();

  refreshThumbnails();

}



// ==========================================================
// FUTURE ENHANCEMENTS
// ==========================================================

/*
 * Planned thumbnail improvements.
 *
 * These features are not required for
 * Version 2 but may be added later.
 *
 * Possible additions:
 *
 * • Refresh selected thumbnails only
 * • Remove broken thumbnail formulas
 * • Validate Drive thumbnail URLs
 * • Generate multiple thumbnail sizes
 * • Export thumbnail contact sheets
 * • Store thumbnail statistics
 * • Preload thumbnail cache
 * • Detect missing Drive images
 * • Regenerate thumbnails automatically
 *   during metadata refresh
 */