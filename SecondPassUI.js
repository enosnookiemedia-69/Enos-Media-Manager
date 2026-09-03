/**
 * ==========================================================
 * SECONDPASSUI.GS
 * ----------------------------------------------------------
 * Controls the Second Pass Reviewer interface.
 *
 * Responsibilities:
 * • Open the Second Pass Reviewer dialog
 * • Load SecondPassHTML interface
 * • Provide development testing tools
 *
 * Communicates with:
 * • SecondPassEngine.gs
 * • SecondPassHTML.html
 * • SecondPassStyles.html
 * • StylesHTML.html (reused via include())
 *
 * NOTE: The include() function used by SecondPassHTML.html
 * is already defined globally in ReviewerUI.gs and does not
 * need to be duplicated here.
 * ==========================================================
 */


// ==========================================================
// SECOND PASS UI SETTINGS
// ==========================================================

const SECOND_PASS_UI = {

  TITLE:
    "Second Pass Reviewer",

  WIDTH:
    1300,

  HEIGHT:
    950

};


// ==========================================================
// OPEN SECOND PASS REVIEWER
// ==========================================================

/**
 * Opens the Second Pass Reviewer dialog.
 *
 * Main entry point from the menu.
 */
function openSecondPassReviewer() {

  const html = HtmlService
    .createTemplateFromFile(
      "SecondPassHTML"
    )
    .evaluate()
    .setWidth(
      SECOND_PASS_UI.WIDTH
    )
    .setHeight(
      SECOND_PASS_UI.HEIGHT
    );

  SpreadsheetApp
    .getUi()
    .showModalDialog(
      html,
      SECOND_PASS_UI.TITLE
    );

}


// ==========================================================
// DEVELOPMENT TOOLS
// ==========================================================

/**
 * Opens the Second Pass Reviewer manually while developing.
 *
 * Avoids needing to refresh the spreadsheet menu.
 */
function testOpenSecondPassReviewer() {

  openSecondPassReviewer();

}
