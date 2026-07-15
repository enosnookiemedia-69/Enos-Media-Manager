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




/**
 * Returns every media record.
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

  return getMediaSheet()
    .getRange(1, 1, 1, getMediaSheet().getLastColumn())
    .getValues()[0];

}


/**
 * Returns the total number of media records.
 *
 * Header row is excluded.
 *
 * @returns {number}
 */
function getMediaCount() {

  return getMediaSheet().getLastRow() - 1;

}



// ==========================================================
// SEARCHING
// ==========================================================

/**
 * Finds the row number of a media record by its Google Drive File ID.
 *
 * Returns:
 * • Row number if found
 * • -1 if not found
 *
 * @param {string} fileId
 * @returns {number}
 */
function findRowByFileId(fileId) {

  const data = getAllMedia();

  for (let i = 1; i < data.length; i++) {

    if (data[i][3] === fileId) {
      return i + 1;
    }

  }

  return -1;

}


/**
 * Checks whether a media record already exists.
 *
 * @param {string} fileId
 * @returns {boolean}
 */
function mediaExists(fileId) {

  return findRowByFileId(fileId) !== -1;

}


/**
 * Returns a single media record.
 *
 * @param {string} fileId
 * @returns {Array|null}
 */
function getMediaRecord(fileId) {

  const row = findRowByFileId(fileId);

  if (row === -1) {
    return null;
  }

  return getMediaSheet()
    .getRange(row, 1, 1, getMediaSheet().getLastColumn())
    .getValues()[0];

}


// ==========================================================
// WRITING DATA
// ==========================================================

/**
 * Adds a new media record.
 *
 * @param {Array} record
 */
function addMedia(record) {

  getMediaSheet().appendRow(record);

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
 * @param {string} fileId
 * @param {Array} record
 */
function updateMedia(fileId, record) {

  const row = findRowByFileId(fileId);

  if (row > 0) {

    getMediaSheet()
      .getRange(row, 1, 1, record.length)
      .setValues([record]);

  }

}



/**
 * Adds a media record to the Media worksheet.
 *
 * @param {Array} record
 */
function addMedia(record) {

  getMediaSheet().appendRow(record);

}


