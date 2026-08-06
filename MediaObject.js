/**
 * ==========================================================
 * MEDIAOBJECT.GS
 * ----------------------------------------------------------
 * Creates and converts Media Objects.
 *
 * Responsibilities
 * ----------------
 * • Build media objects from Drive files
 * • Convert media objects to spreadsheet rows
 * • Convert spreadsheet rows back to media objects
 * • Maintain the standard media object structure
 *
 * Communicates with:
 * • Metadata.gs
 * • Database.gs
 * • Sync.gs
 * • Config.gs
 * ==========================================================
 */



/**
 * Creates a media object from a Drive API file.
 *
 * @param {Object} file
 * @returns {Object}
 */
function buildMediaObject(file) {

  return {

    // ------------------------------------------------------
    // Drive Information
    // ------------------------------------------------------

    id:
      file.id,

    name:
      file.title || "",

    mimeType:
      file.mimeType || "",

    size:
      Math.round(Number(file.fileSize || 0) / 1024),

    createdTime:
      file.createdDate || "",

    parentId:
      file.parents &&
      file.parents.length > 0
        ? file.parents[0].id
        : "",

    url:
      "https://drive.google.com/open?id=" + file.id,

    status:
      "New",

    // ------------------------------------------------------
    // Folder Metadata
    // ------------------------------------------------------

    folderPath: "",

    year: "",

    photographer: "",

    cameraModel: "",

    exifCamera: "",

    // ------------------------------------------------------
    // Image Metadata
    // ------------------------------------------------------

    extension:
      (file.title || "")
        .split(".")
        .pop()
        .toLowerCase(),

    width: "",

    height: "",

    orientation: "",

    dateTaken: "",

    // ------------------------------------------------------
    // Thumbnail
    // ------------------------------------------------------

    thumbnail: "",

    thumbnailStatus: "",

    // ------------------------------------------------------
    // System Metadata
    // ------------------------------------------------------

    metadataUpdated:
      new Date(),

    // ------------------------------------------------------
    // Editorial
    // ------------------------------------------------------

    layoutSuitability: "",

    printSuitability: "",

    category: "",

    grade: "",

    storyValue: "",

    hero: false,

    bookCandidate: false,

    finalBook: false,

    selectionStage: "",

    caption: "",

    spread: "",

    page: "",

    notes: ""

  };

}


// ==========================================================
// SPREADSHEET CONVERSION
// ==========================================================

/**
 * Converts a Media Object into a spreadsheet row.
 *
 * @param {Object} media
 * @returns {Array}
 */
function mediaObjectToRow(media) {

  return [

    // ------------------------------------------------------
    // Auto Metadata
    // ------------------------------------------------------

    media.thumbnail,
    media.name,
    media.folderPath,
    media.id,
    media.size,
    media.createdTime,
    media.url,

    media.year,
    media.photographer,
    media.cameraModel,
    media.exifCamera,

    media.extension,
    media.mimeType,

    media.width,
    media.height,
    media.orientation,
    media.dateTaken,

    media.metadataUpdated,
    media.thumbnailStatus,

    // ------------------------------------------------------
    // Editorial
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
    media.notes

  ];

}


/**
 * Converts a spreadsheet row back into a Media Object.
 *
 * @param {Array} row
 * @returns {Object}
 */
function rowToMediaObject(row) {

  return {

    // ------------------------------------------------------
    // Auto Metadata
    // ------------------------------------------------------

    thumbnail:          row[0],
    name:               row[1],
    folderPath:         row[2],
    id:                 row[3],
    size:               row[4],
    createdTime:        row[5],
    url:                row[6],

    year:               row[7],
    photographer:       row[8],
    cameraModel:        row[9],
    exifCamera:         row[10],

    extension:          row[11],
    mimeType:           row[12],

    width:              row[13],
    height:             row[14],
    orientation:        row[15],
    dateTaken:          row[16],

    metadataUpdated:    row[17],
    thumbnailStatus:    row[18],

    // ------------------------------------------------------
    // Editorial
    // ------------------------------------------------------

    layoutSuitability:  row[19],
    printSuitability:   row[20],

    category:           row[21],
    grade:              row[22],
    storyValue:         row[23],

    hero:               row[24],
    bookCandidate:      row[25],
    finalBook:          row[26],

    selectionStage:     row[27],
    caption:            row[28],
    spread:             row[29],
    page:               row[30],
    notes:              row[31]

  };

}