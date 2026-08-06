/**
 * ==========================================================
 * METADATA.GS
 * ==========================================================
 */



// ==========================================================
// METADATA CACHE
// ==========================================================

/**
 * Stores metadata during the current execution.
 *
 * Prevents repeated Drive lookups while
 * processing large numbers of images.
 */
const METADATA_CACHE = {

  FOLDERS: {},

  IMAGE_METADATA: {},

  THUMBNAILS: {}

};


/**
 * Clears all cached metadata.
 */
function clearMetadataCache() {

  METADATA_CACHE.FOLDERS = {};
  METADATA_CACHE.IMAGE_METADATA = {};
  METADATA_CACHE.THUMBNAILS = {};

}


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

    startRow += batchSize;

  }

  clearMetadataCache();

  showSuccess(

    "Metadata refresh complete."

  );

}

// ==========================================================
// FOLDER METADATA
// ==========================================================

/**
 * Functions for extracting information
 * from the Google Drive folder structure.
 *
 * Includes:
 * • Folder Path
 * • Year
 * • Photographer
 * • Camera Model
 */



/**
 * Returns the camera model from the folder path.
 *
 * Example:
 * Photos/2026/Pacome - Google Pixel 9 Pro XL
 *
 * Returns:
 * Google Pixel 9 Pro XL
 *
 * @param {string} folderPath
 * @returns {string}
 */
function getCameraModel(folderPath) {

  if (!folderPath) {

    return "";

  }

  const folders = folderPath.split("/");

  const photographerFolder =
    folders[folders.length - 1];

  const parts =
    photographerFolder.split(" - ");

  return parts.length > 1

    ? parts[1].trim()

    : "";

}


/**
 * Returns the full folder path from a Folder ID.
 *
 * Uses caching to avoid repeated
 * Google Drive lookups.
 *
 * @param {string} folderId
 * @returns {string}
 */
function getFolderPath(folderId) {

  if (!folderId) {

    return "";

  }

  // Return cached value

  if (METADATA_CACHE.FOLDERS[folderId]) {

    return METADATA_CACHE.FOLDERS[folderId];

  }

  let folder =
    DriveApp.getFolderById(folderId);

  const path = [];

  while (folder) {

    path.unshift(folder.getName());

    const parents =
      folder.getParents();

    folder =
      parents.hasNext()
        ? parents.next()
        : null;

  }

  const fullPath =
    path.join("/");

  // Cache for future lookups

  METADATA_CACHE.FOLDERS[folderId] =
    fullPath;

  return fullPath;

}


/**
 * Returns the year from a folder path.
 *
 * Example:
 * Photos/2026/Pacome - Google Pixel 9 Pro XL
 *
 * Returns:
 * 2026
 *
 * @param {string} folderPath
 * @returns {string}
 */
function getYear(folderPath) {

  if (!folderPath) {

    return "";

  }

  const match = folderPath.match(/20\d{2}/);

  return match

    ? match[0]

    : "";

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

  if (!folderPath) {

    return "";

  }

  const folders = folderPath.split("/");

  const photographerFolder =
    folders[folders.length - 1];

  const parts =
    photographerFolder.split(" - ");

  return parts.length

    ? parts[0].trim()

    : "";

}

// ==========================================================
// FILE HELPERS
// ==========================================================

/**
 * Helper functions for working with
 * Google Drive files.
 *
 * Includes:
 * • File lookup
 * • File URL
 * • File ID
 * • File Name
 */


/**
 * Returns a Google Drive File
 * from its File ID.
 *
 * @param {string} fileId
 * @returns {File|null}
 */
function getFile(fileId) {

  if (!fileId) {

    return null;

  }

  return DriveApp.getFileById(fileId);

}


/**
 * Returns the Google Drive URL
 * for a file.
 *
 * @param {File} file
 * @returns {string}
 */
function getFileUrl(file) {

  if (!file) {

    return "";

  }

  return file.getUrl();

}


/**
 * Returns the Google Drive
 * File ID.
 *
 * @param {File} file
 * @returns {string}
 */
function getFileId(file) {

  if (!file) {

    return "";

  }

  return file.getId();

}


/**
 * Returns the filename.
 *
 * @param {File} file
 * @returns {string}
 */
function getFileName(file) {

  if (!file) {

    return "";

  }

  return file.getName();

}


// ==========================================================
// FILE METADATA
// ==========================================================

/**
 * Helper functions for reading metadata
 * from Google Drive and the Advanced
 * Drive API.
 *
 * Includes:
 * • File Extension
 * • MIME Type
 * • EXIF Camera
 * • Image Dimensions
 * • Orientation
 * • Date Taken
 */


/**
 * Returns the file extension.
 *
 * @param {File} file
 * @returns {string}
 */
function getFileExtension(file) {

  if (!file) {

    return "";

  }

  const parts =
    file.getName().split(".");

  return parts.length > 1
    ? parts.pop().toLowerCase()
    : "";

}


/**
 * Returns an empty image metadata object.
 *
 * Used whenever metadata cannot be read.
 *
 * @returns {Object}
 */
function emptyImageMetadata() {

  return {

    mimeType: "",

    cameraMake: "",

    cameraModel: "",

    width: "",

    height: "",

    orientation: "",

    dateTaken: "",

    exifCamera: ""

  };

}


/**
 * Reads all available image metadata
 * from the Advanced Google Drive API.
 *
 * Results are cached during execution
 * to avoid repeated API calls.
 *
 * @param {string} fileId
 * @returns {Object}
 */
function getImageMetadata(fileId) {

  // ------------------------------------------------------
  // Return cached metadata
  // ------------------------------------------------------

  if (METADATA_CACHE.IMAGE_METADATA[fileId]) {

    return METADATA_CACHE.IMAGE_METADATA[fileId];

  }

  try {

    const file =
      Drive.Files.get(fileId);

    const image =
      file.imageMediaMetadata || {};

    const metadata = {

      mimeType:
        file.mimeType || "",

      cameraMake:
        image.cameraMake || "",

      cameraModel:
        image.cameraModel || "",

      width:
        image.width || "",

      height:
        image.height || "",

      orientation:
        getOrientation(
          image.width,
          image.height
        ),

      dateTaken:
        image.date || "",

      exifCamera:
        [
          image.cameraMake || "",
          image.cameraModel || ""
        ]
          .join(" ")
          .trim()

    };

    // ------------------------------------------------------
    // Save to cache
    // ------------------------------------------------------

    METADATA_CACHE.IMAGE_METADATA[fileId] =
      metadata;

    return metadata;

  }

  catch (err) {

    warning(
      "Unable to read image metadata: " +
      fileId
    );

    const metadata =
      emptyImageMetadata();

    // Cache failed lookup
    METADATA_CACHE.IMAGE_METADATA[fileId] =
      metadata;

    return metadata;

  }
}


/**
 * Returns image orientation.
 *
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
function getOrientation(width, height) {

  if (!width || !height) {

    return "";

  }

  if (width > height) {

    return "Landscape";

  }

  if (height > width) {

    return "Portrait";

  }

  return "Square";

}


// ==========================================================
// METADATA WRITERS
// ==========================================================

/**
 * Updates metadata for a single spreadsheet row.
 *
 * Reads the latest information from Google Drive
 * and updates all automatic metadata fields.
 *
 * @param {Array} row
 * @returns {Array}
 */
function updateMetadata(row) {

  const fileId = row[COL.FILE_ID - 1];

  if (!fileId) {

    return row;

  }

  try {

    const file =
      getFile(fileId);

    const parents =
      file.getParents();

    if (!parents.hasNext()) {

      return row;

    }

    const folder =
      parents.next();

    const folderPath =
      getFolderPath(folder.getId());

    const image =
      getImageMetadata(fileId);

    // ------------------------------------------------------
    // Folder Metadata
    // ------------------------------------------------------

    row[COL.FOLDER_PATH - 1] =
      folderPath;

    row[COL.YEAR - 1] =
      getYear(folderPath);

    row[COL.PHOTOGRAPHER - 1] =
      getPhotographer(folderPath);

    row[COL.CAMERA_MODEL - 1] =
      getCameraModel(folderPath);

    // ------------------------------------------------------
    // File Metadata
    // ------------------------------------------------------

    row[COL.FILE_EXTENSION - 1] =
      getFileExtension(file);

    row[COL.FILE_SIZE - 1] =
      Math.round(file.getSize() / 1024);

    row[COL.DATE_CREATED - 1] =
      file.getDateCreated();

    row[COL.URL - 1] =
      getFileUrl(file);

    // ------------------------------------------------------
    // Image Metadata
    // ------------------------------------------------------

    row[COL.MIME_TYPE - 1] =
      image.mimeType;

    row[COL.EXIF_CAMERA - 1] =
      image.exifCamera;

    row[COL.WIDTH - 1] =
      image.width;

    row[COL.HEIGHT - 1] =
      image.height;

    row[COL.ORIENTATION - 1] =
      image.orientation;

    row[COL.DATE_TAKEN - 1] =
      image.dateTaken;

    // ------------------------------------------------------
    // Thumbnail
    // ------------------------------------------------------

    row[COL.THUMBNAIL - 1] =
      getThumbnailFormula(fileId);

    row[COL.THUMBNAIL_STATUS - 1] =
      "Generated";

    // ------------------------------------------------------
    // Status
    // ------------------------------------------------------

    row[COL.METADATA_UPDATED - 1] =
      new Date();

  }

  catch (err) {

    warning(
      "Unable to update metadata for " +
      fileId +
      " : " +
      err
    );

  }

  return row;

}

// ==========================================================
// MEDIA OBJECT POPULATION
// ==========================================================

/**
 * Populates all metadata on a media object.
 *
 * Used while scanning Google Drive so the
 * Media Object is completely populated before
 * being written to the spreadsheet.
 *
 * @param {Object} media
 * @returns {Object}
 */
function populateMediaMetadata(media) {

  // ------------------------------------------------------
  // Folder Metadata
  // ------------------------------------------------------

  const folderPath =
    getFolderPath(media.parentId);

  media.folderPath =
    folderPath;

  media.year =
    getYear(folderPath);

  media.photographer =
    getPhotographer(folderPath);

  media.cameraModel =
    getCameraModel(folderPath);

  // ------------------------------------------------------
  // File Metadata
  // ------------------------------------------------------

  const file =
    getFile(media.id);

  media.url =
    getFileUrl(file);

  media.extension =
    getFileExtension(file);

  media.size =
    Math.round(file.getSize() / 1024);

  media.createdTime =
    file.getDateCreated();

  // ------------------------------------------------------
  // Image Metadata
  // ------------------------------------------------------

  const image =
    getImageMetadata(media.id);

  media.mimeType =
    image.mimeType;

  media.exifCamera =
    image.exifCamera;

  media.width =
    image.width;

  media.height =
    image.height;

  media.orientation =
    image.orientation;

  media.dateTaken =
    image.dateTaken;

  // ------------------------------------------------------
  // Thumbnail
  // ------------------------------------------------------

  generateThumbnail(media);

  // ------------------------------------------------------
  // Status
  // ------------------------------------------------------

  media.metadataUpdated =
    new Date();

  return media;

}
// ==========================================================
// TEST FUNCTIONS
// ==========================================================

/**
 * Tests image metadata extraction
 * from the Advanced Drive API.
 */
function testDriveImageMetadata() {

  const fileId =
    "1N2_ysTkajEqvqwhc7_-LxjoWNOsPgsbP";

  const metadata =
    getImageMetadata(fileId);

  Logger.log(metadata);

}


/**
 * Tests the complete media object
 * population process.
 */
function testPopulateMediaMetadata() {

  const fileId =
    "1N2_ysTkajEqvqwhc7_-LxjoWNOsPgsbP";

  const file =
    Drive.Files.get(fileId);

  const media =
    buildMediaObject(file);

  populateMediaMetadata(media);

  Logger.log(media);

}


/**
 * Tests thumbnail generation.
 */
function testThumbnailGeneration() {

  const fileId =
    "1N2_ysTkajEqvqwhc7_-LxjoWNOsPgsbP";

  Logger.log(
    getThumbnailFormula(fileId)
  );

}


/**
 * Clears all metadata caches.
 *
 * Useful while testing.
 */
function clearMetadataCaches() {

  METADATA_CACHE.FOLDERS = {};

  METADATA_CACHE.IMAGE_METADATA = {};

  METADATA_CACHE.THUMBNAILS = {};

  Logger.log(
    "Metadata caches cleared."
  );

}

