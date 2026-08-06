/**
 * ==========================================================
 * DATABASE.GS
 * ----------------------------------------------------------
 * Responsible for all interaction with spreadsheet data.
 *
 * Responsibilities
 * ----------------
 * • Read media records
 * • Create new records
 * • Update existing records
 * • Delete records
 * • Search records
 * • Validate records
 * • Count records
 * • Locate duplicates
 *
 * Other files should never access the Media worksheet
 * directly. They should always use the functions in this file.
 * ==========================================================
 */


// ==========================================================
// READING DATA
// ==========================================================

/**
 * Returns every media record.
 *
 * Includes the header row.
 *
 * @returns {Array}
 */
function getAllMedia() {

  return getMediaSheet()
    .getDataRange()
    .getValues();

}


/**
 * Returns the column headings.
 *
 * @returns {Array}
 */
function getMediaHeaders() {

  const sheet =
    getMediaSheet();

  return sheet
    .getRange(
      1,
      1,
      1,
      sheet.getLastColumn()
    )
    .getValues()[0];

}


/**
 * Returns the total number
 * of imported media records.
 *
 * Header row excluded.
 *
 * @returns {number}
 */
function getMediaCount() {

  return Math.max(
    0,
    getMediaSheet().getLastRow() - 1
  );

}



// ==========================================================
// SEARCHING
// ==========================================================

/**
 * Finds the spreadsheet row for a
 * Google Drive File ID.
 *
 * Returns:
 * • Row number if found
 * • -1 if not found
 *
 * @param {string} fileId
 * @returns {number}
 */
function findRowByFileId(fileId) {

  const data =
    getAllMedia();

  for (let i = 1; i < data.length; i++) {

    if (data[i][COL.FILE_ID - 1] === fileId) {

      return i + 1;

    }

  }

  return -1;

}


/**
 * Returns TRUE if the media
 * already exists.
 *
 * @param {string} fileId
 * @returns {boolean}
 */
function mediaExists(fileId) {

  return findRowByFileId(fileId) !== -1;

}


/**
 * Returns a raw spreadsheet row.
 *
 * @param {string} fileId
 * @returns {Array|null}
 */
function getMediaRecord(fileId) {

  const row =
    findRowByFileId(fileId);

  if (row === -1) {

    return null;

  }

  const sheet =
    getMediaSheet();

  return sheet
    .getRange(
      row,
      1,
      1,
      sheet.getLastColumn()
    )
    .getValues()[0];

}


// ==========================================================
// MEDIA OBJECT LOOKUP
// ==========================================================

/**
 * Returns a media record as an object.
 *
 * Example:
 *
 * {
 *   name: "image.jpg",
 *   width: 2048,
 *   height: 1363
 * }
 *
 * @param {string} fileId
 * @returns {Object|null}
 */
function getMediaObjectById(fileId) {

  const row =
    getMediaRecord(fileId);

  if (!row) {

    return null;

  }

  const headers =
    getMediaHeaders();

  const media = {};

  headers.forEach(function(header, index) {

    media[header] =
      row[index];

  });

  return media;

}


/**
 * Returns an object containing
 * every existing Google Drive File ID.
 *
 * Used during synchronisation
 * to prevent duplicate imports.
 *
 * @returns {Object}
 */
function getExistingFileIds() {

  const data =
    getAllMedia();

  const ids = {};

  for (let i = 1; i < data.length; i++) {

    const fileId =
      data[i][COL.FILE_ID - 1];

    if (fileId) {

      ids[fileId] = true;

    }

  }

  return ids;

}

// ==========================================================
// MEDIA CACHE
// ==========================================================

/**
 * Creates an in-memory cache of all
 * existing media records.
 *
 * Key:
 * Google Drive File ID
 *
 * Value:
 * Media object
 *
 * Used during synchronisation to
 * minimise spreadsheet reads.
 *
 * @returns {Object}
 */
function getMediaCache() {

  const data =
    getAllMedia();

  const headers =
    getMediaHeaders();

  const cache = {};

  for (let i = 1; i < data.length; i++) {

    const row =
      data[i];

    const fileId =
      row[COL.FILE_ID - 1];

    if (!fileId) {

      continue;

    }

    const media = {};

    headers.forEach(function(header, index) {

      media[header] =
        row[index];

    });

    cache[fileId] =
      media;

  }

  return cache;

}

// ==========================================================
// WRITING DATA
// ==========================================================

/**
 * Adds multiple media records.
 *
 * Used by Sync for faster imports.
 *
 * @param {Array<Array>} records
 * @returns {number}
 */
function addMediaBatch(records) {

  if (!records.length) {
    return 0;
  }

  const sheet = getMediaSheet();

  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      records.length,
      records[0].length
    )
    .setValues(records);

  return records.length;

}


/**
 * Deletes a media record.
 *
 * @param {string} fileId
 */
function deleteMedia(fileId) {

  const row = findRowByFileId(fileId);

  if (row > 0) {

    getMediaSheet().deleteRow(row);

  }

}


/**
 * Updates an existing media record.
 *
 * Only automatic metadata columns are updated.
 * Manual/editorial columns are preserved.
 *
 * @param {string} fileId
 * @param {Array} record
 * @returns {boolean}
 */
function updateMedia(fileId, record) {

  const row =
    findRowByFileId(fileId);


  if (row === -1) {

    return false;

  }


  const sheet =
    getMediaSheet();


  const existing =
    sheet
      .getRange(
        row,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0];


  let changed = false;


  // --------------------------------------------------------
  // Update automatic metadata columns only
  // --------------------------------------------------------

  for (
    let col = 1;
    col < COL.LAYOUT_SUITABILITY;
    col++
  ) {


    if (existing[col - 1] !== record[col - 1]) {


      existing[col - 1] =
        record[col - 1];


      changed = true;

    }

  }


  if (!changed) {

    return false;

  }


  // --------------------------------------------------------
  // Write updated row
  // --------------------------------------------------------

  sheet
    .getRange(
      row,
      1,
      1,
      existing.length
    )
    .setValues([existing]);


  return true;

}


/**
 * Deletes all media records.
 *
 * Leaves the header row intact.
 */
function clearMediaDatabase() {

  const sheet = getMediaSheet();

  if (sheet.getLastRow() <= 1) {
    return;
  }

  sheet.deleteRows(
    2,
    sheet.getLastRow() - 1
  );

}

// ==========================================================
// SHEET HELPERS
// ==========================================================

/**
 * Cached Media worksheet.
 *
 * Prevents repeatedly looking up the same sheet
 * during long sync operations.
 */
let MEDIA_SHEET = null;


/**
 * Returns the Media worksheet.
 *
 * @returns {Sheet}
 */
function getMediaSheet() {

  if (!MEDIA_SHEET) {

    MEDIA_SHEET =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(CONFIG.SHEETS.MEDIA);

  }

  return MEDIA_SHEET;

}

// ==========================================================
// UTILITIES
// ==========================================================

/**
 * Returns number of duplicate records.
 *
 * @param {string} fileId
 * @returns {number}
 */
function countMedia(fileId) {

  return mediaExists(fileId) ? 1 : 0;
}


/**
 * Clears every imported media record.
 *
 * Preserves the header row.
 * Called from the custom menu.
 */
function clearMediaDatabaseMenu() {

  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    "Clear Media Database",
    "Delete all imported media records?\n\nThe header row will be preserved.",
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  clearMediaDatabase();

  showSuccess("Media Database cleared.");

}
