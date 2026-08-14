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

    aspectRatio: "",

    megapixels: "",

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

    // ----------------------------------------------------
    // Image dimensions
    // ----------------------------------------------------

    const width =
      Number(image.width) || 0;

    const height =
      Number(image.height) || 0;

    // ----------------------------------------------------
    // Build metadata object
    // ----------------------------------------------------

    const metadata = {

      mimeType:
        file.mimeType || "",

      cameraMake:
        image.cameraMake || "",

      cameraModel:
        image.cameraModel || "",

      width:
        width,

      height:
        height,

      orientation:
        getOrientation(
          width,
          height
        ),

      aspectRatio:
        getAspectRatio(
          width,
          height
        ),

      megapixels:
        getMegapixels(
          width,
          height
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

    // ----------------------------------------------------
    // Save to cache
    // ----------------------------------------------------

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

    // ----------------------------------------------------
    // Cache failed lookup
    // ----------------------------------------------------

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
// IMAGE DIMENSION CALCULATIONS
// ==========================================================

/**
 * Returns a simplified aspect ratio for an image.
 *
 * Examples:
 * 4032 × 3024 → 4:3
 * 2048 × 1536 → 4:3
 * 4032 × 2268 → 16:9
 * 2048 × 2048 → 1:1
 *
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
function getAspectRatio(width, height) {

  if (!width || !height) {
    return "";
  }

  const divisor =
    gcd(
      Number(width),
      Number(height)
    );

  return (
    Number(width) / divisor
  ) + ":" +
  (
    Number(height) / divisor
  );

}


/**
 * Returns image resolution in megapixels.
 *
 * @param {number} width
 * @param {number} height
 * @returns {number|string}
 */
function getMegapixels(width, height) {

  if (!width || !height) {
    return "";
  }

  return Number(
    (
      Number(width) *
      Number(height)
    ) / 1000000
  ).toFixed(1);

}


/**
 * Calculates the greatest common divisor
 * of two numbers.
 *
 * Used to simplify image aspect ratios.
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */

function gcd(a, b) {

  a = Math.abs(a);
  b = Math.abs(b);

  while (b !== 0) {

    const remainder = a % b;

    a = b;
    b = remainder;

  }

  return a;

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

row[COL.ASPECT_RATIO - 1] =
  image.aspectRatio;

row[COL.MEGAPIXELS - 1] =
  image.megapixels;

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

media.aspectRatio =
    image.aspectRatio;

  media.megapixels =
    image.megapixels;

  media.dateTaken =
    image.dateTaken;

  // ------------------------------------------------------
  // Status
  // ------------------------------------------------------

  media.metadataUpdated =
    new Date();

  return media;
}

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

