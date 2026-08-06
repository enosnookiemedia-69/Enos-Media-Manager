/**
 * ==========================================================
 * SELECTIONENGINE.GS
 * ----------------------------------------------------------
 * Editorial decision support for the Enos Media Manager.
 *
 * Responsibilities
 * ----------------
 * • Calculate editorial scores
 * • Recommend selection stages
 * • Analyse image quality
 * • Identify strong candidates
 * • Report editorial statistics
 *
 * The Selection Engine never replaces human judgement.
 * It provides recommendations only.
 *
 * Communicates with:
 * • Review.gs
 * • Database.gs
 * • Dashboard.gs (future)
 * • BookList.gs (future)
 * ==========================================================
 */


// ==========================================================
// SELECTION SETTINGS
// ==========================================================

const SELECTION = {

  SCORE: {

    GRADE: {

      S: 40,
      A: 30,
      B: 20,
      C: 10,
      D: 0

    },

    STORY: {

      5: 25,
      4: 18,
      3: 12,
      2: 6,
      1: 0

    },

    PRINT: {

      Excellent: 15,
      Good: 10,
      Acceptable: 5,
      Poor: 0

    },

    LAYOUT: {

      Hero: 20,
      "Double Spread": 15,
      "Full Page": 10,
      Portrait: 8

    },

    HERO_IMAGE: 20,

    BOOK_CANDIDATE: 10

  }

};


// ==========================================================
// SCORE CALCULATION
// ==========================================================

/**
 * Calculates an editorial score for a media record.
 *
 * Higher scores indicate stronger candidates for
 * publication, but the score is advisory only.
 *
 * @param {Array} record
 * @returns {Number}
 */
function calculateSelectionScore(record) {

  let score = 0;

  score +=
    SELECTION.SCORE.GRADE[
      record[COL.GRADE - 1]
    ] || 0;

  score +=
    SELECTION.SCORE.STORY[
      record[COL.STORY_VALUE - 1]
    ] || 0;

  score +=
    SELECTION.SCORE.PRINT[
      record[COL.PRINT_SUITABILITY - 1]
    ] || 0;

  score +=
    SELECTION.SCORE.LAYOUT[
      record[COL.LAYOUT_SUITABILITY - 1]
    ] || 0;

  if (record[COL.HERO_IMAGE - 1] === true) {

    score += SELECTION.SCORE.HERO_IMAGE;

  }

  if (record[COL.BOOK_CANDIDATE - 1] === true) {

    score += SELECTION.SCORE.BOOK_CANDIDATE;

  }

  return score;

}


// ==========================================================
// SELECTION RECOMMENDATION
// ==========================================================

/**
 * Converts a numerical score into a recommended
 * editorial selection stage.
 *
 * @param {Number} score
 * @returns {String}
 */
function recommendSelectionStage(score) {

  if (score >= 90) {
    return "Final Selection";
  }

  if (score >= 70) {
    return "Shortlisted";
  }

  if (score >= 40) {
    return "Reviewed";
  }

  return "Rejected";

}


// ==========================================================
// MEDIA RANKING
// ==========================================================

/**
 * Returns the score and recommendation for
 * a single media record.
 *
 * @param {Array} record
 * @returns {Object}
 */
function rankMedia(record) {

  const score =
    calculateSelectionScore(record);

  return {

    score: score,

    recommendation:
      recommendSelectionStage(score)

  };

}


// ==========================================================
// STATISTICS
// ==========================================================

/**
 * Generates summary statistics for a collection
 * of media records.
 *
 * @param {Array[]} records
 * @returns {Object}
 */
function getSelectionStatistics(records) {

  const stats = {

    reviewed: 0,
    shortlisted: 0,
    finalSelection: 0,
    rejected: 0

  };

  records.forEach(function(record) {

    const stage =
      rankMedia(record).recommendation;

    switch (stage) {

      case "Reviewed":
        stats.reviewed++;
        break;

      case "Shortlisted":
        stats.shortlisted++;
        break;

      case "Final Selection":
        stats.finalSelection++;
        break;

      default:
        stats.rejected++;

    }

  });

  return stats;

}


// ==========================================================
// REVIEW ANALYSIS
// ==========================================================

/**
 * Returns media records that still require
 * editorial information.
 *
 * @param {Array[]} records
 * @returns {Array[]}
 */
function findIncompleteReviews(records) {

  return records.filter(function(record) {

    return !record[COL.GRADE - 1] ||

           !record[COL.STORY_VALUE - 1] ||

           !record[COL.PRINT_SUITABILITY - 1];

  });

}


/**
 * Returns records considered strong editorial
 * candidates.
 *
 * @param {Array[]} records
 * @returns {Array[]}
 */
function findStrongCandidates(records) {

  return records.filter(function(record) {

    return calculateSelectionScore(record) >= 65;

  });

}