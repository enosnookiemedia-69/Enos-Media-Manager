/**
 * ==========================================================
 * SELECTIONENGINE.JS
 * ----------------------------------------------------------
 *
 * Assists editorial image selection.
 *
 * Responsibilities:
 *
 * • Calculate image scores
 * • Recommend selection stages
 * • Identify strong candidates
 *
 * Does not replace human decisions.
 *
 * ==========================================================
 */


function calculateSelectionScore(record) {


  let score = 0;


  if (
    record[COL.GRADE - 1] === "S"
  ) {

    score += 10;

  }


  if (
    record[COL.GRADE - 1] === "A"
  ) {

    score += 7;

  }


  if (
    Number(record[COL.STORY_VALUE - 1]) >= 5
  ) {

    score += 10;

  }


  if (
    record[COL.HERO_IMAGE - 1] === true
  ) {

    score += 10;

  }


  return score;

}


