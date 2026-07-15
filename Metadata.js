/**
 * ==========================================================
 * METADATA.GS
 * ==========================================================
 */



// ==========================================================
// METADATA CACHE
// ==========================================================

const METADATA_CACHE = {

  FOLDERS: {}

};


// ==========================================================
// MAIN METADATA
// ==========================================================

/**
 * Refreshes metadata for all media records.
 *
 * Reads information from Google Drive and updates
 * the Media worksheet.
 */
function refreshMetadata() {

  info("Refreshing metadata...");


  const sheet = getMediaSheet();
  const lastRow = sheet.getLastRow();


  if (lastRow < 2) {

    showError("No media records found.");
    return;

  }


  const batchSize = 100;


  let startRow = 2;


  while (startRow <= lastRow) {


    const rowsToProcess = Math.min(
      batchSize,
      lastRow - startRow + 1
    );


    info(
      "Processing rows " +
      startRow +
      " to " +
      (startRow + rowsToProcess - 1)
    );


    const range = sheet.getRange(
      startRow,
      1,
      rowsToProcess,
      sheet.getLastColumn()
    );


    const data = range.getValues();


    for (let i = 0; i < data.length; i++) {

      data[i] = updateMetadata(data[i]);

    }


    range.setValues(data);



    info(
      "Completed rows " +
      startRow +
      " to " +
      (startRow + rowsToProcess - 1)
    );


    startRow += batchSize;


  }


  showSuccess(
    "Metadata refresh complete."
  );


}


// ==========================================================
// FOLDER METADATA
// ==========================================================

/**
 * Returns the full folder path for a file.
 *
 * Uses caching to avoid repeated Drive lookups.
 *
 * @param {File} file
 * @returns {string}
 */
function getFolderPath(file) {

  const parents = file.getParents();

  if (!parents.hasNext()) {
    return "";
  }

  const firstFolder = parents.next();

  const folderId = firstFolder.getId();


  // Return cached result if available
  if (METADATA_CACHE.FOLDERS[folderId]) {

    return METADATA_CACHE.FOLDERS[folderId];

  }


  let folder = firstFolder;

  const path = [];


  while (folder) {

    path.unshift(folder.getName());

    const parentFolders = folder.getParents();


    if (parentFolders.hasNext()) {

      folder = parentFolders.next();

    } else {

      folder = null;

    }

  }


  const fullPath = path.join("/");


  // Save result
  METADATA_CACHE.FOLDERS[folderId] = fullPath;


  return fullPath;

}

/**
 * Returns the year from a folder path.
 *
 * @param {string} folderPath
 * @returns {string}
 */
function getYear(folderPath) {

  const match = folderPath.match(/20\d{2}/);

  return match ? match[0] : "";

}


/**
 * Returns the photographer name from a folder path.
 *
 * Example:
 * Photos/2026/Pacome - Google Pixel 9 Pro XL
 *
 * Returns:
 * Pacome
 *
 * @param {string} folderPath
 * @returns {string}
 */
function getPhotographer(folderPath) {

  const folders = folderPath.split("/");

  const photographerFolder = folders[folders.length - 1];

  const parts = photographerFolder.split(" - ");

  return parts.length ? parts[0] : "";

}

// ==========================================================
// FILE HELPERS
// ==========================================================

/**
 * Returns a Google Drive File from its File ID.
 *
 * @param {string} fileId
 * @returns {File}
 */
function getFile(fileId) {

  return DriveApp.getFileById(fileId);

}

// ==========================================================
// FILE METADATA
// ==========================================================

/**
 * Returns the file extension.
 *
 * @param {File} file
 * @returns {string}
 */
function getFileExtension(file) {

  const parts = file.getName().split(".");

  return parts.length > 1
    ? parts.pop().toLowerCase()
    : "";

}

/**
 * Returns the camera model.
 *
 * @param {File} file
 * @returns {string}
 */
function getCameraModel(file) {

}

/**
 * Returns the date the media was captured.
 *
 * @param {File} file
 * @returns {Date}
 */
function getDateTaken(file) {

}

/**
 * Returns the media width.
 *
 * @param {File} file
 * @returns {number}
 */
function getMediaWidth(file) {
}

/**
 * Returns the media height.
 *
 * @param {File} file
 * @returns {number}
 */
function getMediaHeight(file) {
}

/**
 * Returns the media dimensions.
 *
 * @param {File} file
 * @returns {{width:number, height:number}}
 */
function getMediaDimensions(file) {
}

// ==========================================================
// METADATA WRITERS
// ==========================================================


/**
 * Updates metadata for a single row.
 *
 * @param {Array} row
 * @returns {Array}
 */
function updateMetadata(row) {


  const fileId = row[COL.FILE_ID - 1];


  if (!fileId) {

    return row;

  }


  const file = getFile(fileId);


  const folderPath = getFolderPath(file);



  row[COL.FOLDER_PATH - 1] = folderPath;


  row[COL.YEAR - 1] =
    getYear(folderPath);


  row[COL.PHOTOGRAPHER - 1] =
    getPhotographer(folderPath);


  row[COL.FILE_EXTENSION - 1] =
    getFileExtension(file);



  return row;

}
