/**
 * ==========================================================
 * MEDIAOBJECT.GS
 * ----------------------------------------------------------
 * Creates and converts Media Objects.
 *
 * Responsibilities
 * ----------------
 * • Build media objects from Drive files
 * • Maintain the standard media object structure
 * • Convert media objects to spreadsheet rows
 * • Convert spreadsheet rows back to media objects
 *
 * The Media Object is the internal representation of an
 * image used throughout the application.
 *
 * Communicates with:
 * • Metadata.gs
 * • Database.gs
 * • Sync.gs
 * • Review.gs
 * • SelectionEngine.gs
 * • BookList.gs
 * • Config.gs
 * ==========================================================
 */


// ==========================================================
// BUILD MEDIA OBJECT
// ==========================================================

/**
 * Creates a standard Media Object from a Drive API file.
 *
 * This creates the internal representation of a media file.
 * Metadata such as dimensions, orientation, aspect ratio,
 * megapixels, photographer and folder information may be
 * populated later by Metadata.gs.
 *
 * @param {Object} file
 * @returns {Object}
 */
function buildMediaObject(file) {

  // --------------------------------------------------------
  // Determine parent folder
  // --------------------------------------------------------

  let parentId = "";

  if (
    file &&
    file.parents &&
    file.parents.length > 0 &&
    file.parents[0]
  ) {

    parentId =
      file.parents[0].id || "";

  }

  return {

    // ------------------------------------------------------
    // DRIVE INFORMATION
    // ------------------------------------------------------

    thumbnail:
      "",

    name:
      file.title || "",

    folderPath:
      "",

    parentId:
      parentId,

    id:
      file.id || "",

    size:
      Math.round(
        Number(file.fileSize || 0) / 1024
      ),

    createdTime:
      file.createdDate || "",

    url:
      file.id
        ? "https://drive.google.com/open?id=" + file.id
        : "",


    // ------------------------------------------------------
    // SOURCE / FOLDER METADATA
    // ------------------------------------------------------

    year:
      "",

    photographer:
      "",

    cameraModel:
      "",

    exifCamera:
      "",

    extension:
      (file.title || "")
        .split(".")
        .pop()
        .toLowerCase(),

    mimeType:
      file.mimeType || "",


    // ------------------------------------------------------
    // IMAGE METADATA
    // ------------------------------------------------------

    width:
      "",

    height:
      "",

    orientation:
      "",

    aspectRatio:
      "",

    megapixels:
      "",

    dateTaken:
      "",


    // ------------------------------------------------------
    // SYSTEM METADATA
    // ------------------------------------------------------

    metadataUpdated:
      new Date(),

    thumbnailStatus:
      "",


    // ------------------------------------------------------
    // EDITORIAL METADATA
    // ------------------------------------------------------

    layoutSuitability:
      "",

    printSuitability:
      "",

    category:
      "",

    grade:
      "",

    storyValue:
      "",

    hero:
      false,

    bookCandidate:
      false,

    finalBook:
      false,

    selectionStage:
      "",

    caption:
      "",

    spread:
      "",

    page:
      "",

    notes:
      "",


    // ------------------------------------------------------
    // REVIEW METADATA
    // ------------------------------------------------------

    reviewDate:
      "",

    reviewStatus:
      ""

  };

}


// ==========================================================
// MEDIA OBJECT → SPREADSHEET ROW
// ==========================================================

/**
 * Converts a Media Object into a Media Database row.
 *
 * IMPORTANT:
 * The order here must match the Media Database columns.
 *
 * @param {Object} media
 * @returns {Array}
 */
function mediaObjectToRow(media) {

  return [

    // ------------------------------------------------------
    // DRIVE INFORMATION
    // ------------------------------------------------------

    media.thumbnail,
    media.name,
    media.folderPath,
    media.id,
    media.size,
    media.createdTime,
    media.url,


    // ------------------------------------------------------
    // SOURCE / FOLDER METADATA
    // ------------------------------------------------------

    media.year,
    media.photographer,
    media.cameraModel,
    media.exifCamera,
    media.extension,
    media.mimeType,


    // ------------------------------------------------------
    // IMAGE METADATA
    // ------------------------------------------------------

    media.width,
    media.height,
    media.orientation,
    media.aspectRatio,
    media.megapixels,
    media.dateTaken,


    // ------------------------------------------------------
    // SYSTEM METADATA
    // ------------------------------------------------------

    media.metadataUpdated,
    media.thumbnailStatus,


    // ------------------------------------------------------
    // EDITORIAL METADATA
    // ------------------------------------------------------

    media.layoutSuitability,
    media.printSuitability,
    media.category,
    media.grade,
    media.storyValue,
    media.hero,
    media.bookCandidate,
    media.finalBook,
    media.selectionStage,
    media.caption,
    media.spread,
    media.page,
    media.notes,


    // ------------------------------------------------------
    // REVIEW METADATA
    // ------------------------------------------------------

    media.reviewDate,
    media.reviewStatus

  ];

}


// ==========================================================
// SPREADSHEET ROW → MEDIA OBJECT
// ==========================================================

/**
 * Converts a Media Database row into a Media Object.
 *
 * The indexes below correspond directly to the current
 * Media Database structure.
 *
 * @param {Array} row
 * @returns {Object}
 */
function rowToMediaObject(row) {

  return {

    // ------------------------------------------------------
    // DRIVE INFORMATION
    // ------------------------------------------------------

    thumbnail:
      row[0],

    name:
      row[1],

    folderPath:
      row[2],

    id:
      row[3],

    size:
      row[4],

    createdTime:
      row[5],

    url:
      row[6],


    // ------------------------------------------------------
    // SOURCE / FOLDER METADATA
    // ------------------------------------------------------

    year:
      row[7],

    photographer:
      row[8],

    cameraModel:
      row[9],

    exifCamera:
      row[10],

    extension:
      row[11],

    mimeType:
      row[12],


    // ------------------------------------------------------
    // IMAGE METADATA
    // ------------------------------------------------------

    width:
      row[13],

    height:
      row[14],

    orientation:
      row[15],

    aspectRatio:
      row[16],

    megapixels:
      row[17],

    dateTaken:
      row[18],


    // ------------------------------------------------------
    // SYSTEM METADATA
    // ------------------------------------------------------

    metadataUpdated:
      row[19],

    thumbnailStatus:
      row[20],


    // ------------------------------------------------------
    // EDITORIAL METADATA
    // ------------------------------------------------------

    layoutSuitability:
      row[21],

    printSuitability:
      row[22],

    category:
      row[23],

    grade:
      row[24],

    storyValue:
      row[25],

    hero:
      row[26],

    bookCandidate:
      row[27],

    finalBook:
      row[28],

    selectionStage:
      row[29],

    caption:
      row[30],

    spread:
      row[31],

    page:
      row[32],

    notes:
      row[33],


    // ------------------------------------------------------
    // REVIEW METADATA
    // ------------------------------------------------------

    reviewDate:
      row[34],

    reviewStatus:
      row[35]

  };

}


// ==========================================================
// TEST FUNCTIONS
// ==========================================================

/**
 * Tests Media Object creation and spreadsheet conversion.
 */
function testMediaObject() {

  const fileId =
    "1N2_ysTkajEqvqwhc7_-LxjoWNOsPgsbP";

  Logger.log("==========================================");
  Logger.log("MEDIA OBJECT TEST");
  Logger.log("==========================================");

  // --------------------------------------------------------
  // Get database record
  // --------------------------------------------------------

  const record =
    getMediaRecord(fileId);

  if (!record) {

    throw new Error(
      "Test media record could not be found."
    );

  }

  Logger.log(
    "Database record found: PASS"
  );

  // --------------------------------------------------------
  // Convert row to Media Object
  // --------------------------------------------------------

  const media =
    rowToMediaObject(record);

  Logger.log(
    "rowToMediaObject: PASS"
  );

  Logger.log(
    "File Name: " + media.name
  );

  Logger.log(
    "Width: " + media.width
  );

  Logger.log(
    "Height: " + media.height
  );

  Logger.log(
    "Orientation: " + media.orientation
  );

  // --------------------------------------------------------
  // Convert Media Object back to row
  // --------------------------------------------------------

  const row =
    mediaObjectToRow(media);

  Logger.log(
    "mediaObjectToRow: PASS"
  );

  // --------------------------------------------------------
  // Compare row lengths
  // --------------------------------------------------------

  Logger.log(
    "Original row columns: " +
    record.length
  );

  Logger.log(
    "Converted row columns: " +
    row.length
  );

  if (record.length !== row.length) {

    throw new Error(
      "Media Object conversion changed the number of columns."
    );

  }

  Logger.log(
    "Column count: PASS"
  );

  // --------------------------------------------------------
  // Build Media Object from Drive
  // --------------------------------------------------------

  const file =
    Drive.Files.get(fileId);

  const builtMedia =
    buildMediaObject(file);

  Logger.log(
    "buildMediaObject: PASS"
  );

  Logger.log(
    "Built file name: " +
    builtMedia.name
  );

  Logger.log("==========================================");
  Logger.log("MEDIA OBJECT TEST PASSED");
  Logger.log("==========================================");
}


/**
 * Tests Drive parent folder information.
 */


function testMediaParentFolder() {

  const fileId =
    "1N2_ysTkajEqvqwhc7_-LxjoWNOsPgsbP";

  const file =
    Drive.Files.get(fileId);

  Logger.log(
    "File Name: " +
    file.title
  );

  Logger.log(
    "Parents: " +
    JSON.stringify(file.parents)
  );

  const media =
    buildMediaObject(file);

  Logger.log(
    "Media Parent ID: " +
    media.parentId
  );

  if (media.parentId) {

    Logger.log(
      "Folder Path: " +
      getFolderPath(media.parentId)
    );

  } else {

    Logger.log(
      "Media Parent ID is EMPTY"
    );

  }

}

