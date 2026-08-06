/**
 * ==========================================================
 * TEST.JS
 * ----------------------------------------------------------
 * Development and integration tests.
 *
 * Used to verify:
 *
 * • Google Drive API connection
 * • Database functions
 * • Metadata extraction
 * • Dashboard calculations
 *
 * These functions are not part of normal application flow.
 * ==========================================================
 */


// ==========================================================
// GOOGLE DRIVE API TEST
// ==========================================================

/**
 * Confirms that the Advanced Drive API
 * is available and responding.
 */

function testDriveAPI() {

  const response =
    Drive.Files.list({
      pageSize: 5
    });


  Logger.log(
    response.files
  );

}


