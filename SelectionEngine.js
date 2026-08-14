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

  // ========================================================
  // EDITORIAL SCORE
  // ========================================================

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
      "Half Page": 8,
      "Quarter Page": 5,
      Portrait: 8
    },

    HERO_IMAGE: 20

  },


  // ========================================================
  // SELECTION THRESHOLDS
  // ========================================================

  THRESHOLDS: {

    FINAL_SELECTION: 90,

    SHORTLISTED: 70,

    REVIEWED: 40

  },


  // ========================================================
  // HERO OVERRIDE
  // ========================================================

  HERO: {

    // A Hero image receives special treatment during
    // automatic Book Candidate selection.
    //
    // This allows a Hero image to become a candidate
    // even when its normal editorial score is below
    // the standard candidate threshold.
    //
    // The final decision will still consider the other
    // editorial fields so that extremely weak images
    // are not automatically promoted.

    MIN_SCORE: 30

  }

};


// ==========================================================
// SCORE CALCULATION
// ==========================================================

/**
 * Calculates an editorial score for a media record.
 *
 * The score is based on review and editorial fields.
 * Book Candidate is NOT used as an input because it is
 * calculated from the resulting editorial assessment.
 *
 * @param {Array} record
 * @returns {Number}
 */
function calculateSelectionScore(record) {

  let score = 0;

  // --------------------------------------------------------
  // Grade
  // --------------------------------------------------------

  score +=
    SELECTION.SCORE.GRADE[
      record[COL.GRADE - 1]
    ] || 0;

  // --------------------------------------------------------
  // Story Value
  // --------------------------------------------------------

  score +=
    SELECTION.SCORE.STORY[
      record[COL.STORY_VALUE - 1]
    ] || 0;

  // --------------------------------------------------------
  // Print Suitability
  // --------------------------------------------------------

  score +=
    SELECTION.SCORE.PRINT[
      record[COL.PRINT_SUITABILITY - 1]
    ] || 0;

  // --------------------------------------------------------
  // Layout Suitability
  // --------------------------------------------------------

  score +=
    SELECTION.SCORE.LAYOUT[
      record[COL.LAYOUT_SUITABILITY - 1]
    ] || 0;

  // --------------------------------------------------------
  // Hero Image
  //
  // Hero images receive additional weighting.
  // --------------------------------------------------------

  if (
    record[COL.HERO_IMAGE - 1] === true
  ) {

    score +=
      SELECTION.SCORE.HERO_IMAGE;

  }

  return score;

}

// ==========================================================
// IMAGE SUITABILITY
// ==========================================================

/**
 * Checks whether an image has the basic metadata
 * required for reliable editorial selection.
 *
 * This does not reject the image.
 * It identifies missing or potentially unsuitable metadata.
 *
 * @param {Array} record
 * @returns {Object}
 */
function analyseImageSuitability(record) {

  const result = {

    orientation:
      record[COL.ORIENTATION - 1] || "",

    aspectRatio:
      record[COL.ASPECT_RATIO - 1] || "",

    width:
      Number(record[COL.WIDTH - 1]) || 0,

    height:
      Number(record[COL.HEIGHT - 1]) || 0,

    megapixels:
      Number(record[COL.MEGAPIXELS - 1]) || 0,

    issues: []

  };


  // --------------------------------------------------------
  // Calculate megapixels if not already available.
  // --------------------------------------------------------

  if (
    result.megapixels === 0 &&
    result.width > 0 &&
    result.height > 0
  ) {

    result.megapixels =
      (
        result.width *
        result.height
      ) / 1000000;

  }


  // --------------------------------------------------------
  // Metadata checks
  // --------------------------------------------------------

  if (!result.orientation) {

    result.issues.push(
      "Missing orientation"
    );

  }


  if (!result.aspectRatio) {

    result.issues.push(
      "Missing aspect ratio"
    );

  }


  if (
    result.width === 0 ||
    result.height === 0
  ) {

    result.issues.push(
      "Missing image dimensions"
    );

  }


  return result;

}


// ==========================================================
// SELECTION RECOMMENDATION
// ==========================================================

/**
 * Converts an editorial score into a recommended
 * selection stage.
 *
 * This recommendation is generated automatically
 * by the Selection Engine.
 *
 * It does NOT determine Final Book status.
 *
 * Selection stages:
 *
 * • Excellent Candidate
 * • Strong Candidate
 * • Candidate
 * • Not Selected
 *
 * @param {Number} score
 * @returns {String}
 */
function recommendSelectionStage(score) {

  if (
    score >= SELECTION.THRESHOLDS.FINAL_SELECTION
  ) {

    return "Excellent Candidate";

  }

  if (
    score >= SELECTION.THRESHOLDS.SHORTLISTED
  ) {

    return "Strong Candidate";

  }

  if (
    score >= SELECTION.THRESHOLDS.REVIEWED
  ) {

    return "Candidate";

  }

  return "Not Selected";

}

// ==========================================================
// MEDIA RANKING
// ==========================================================

/**
 * Returns the editorial score and automatic recommendation
 * for a single media record.
 *
 * Book Candidate status is calculated separately by the
 * Selection Engine and is not used as an input to the score.
 *
 * @param {Array} record
 * @returns {Object}
 */
function rankMedia(record) {

  const score =
    calculateSelectionScore(record);

  const recommendation =
    recommendSelectionStage(score);

  return {

    score: score,

    recommendation: recommendation

  };

}


// ==========================================================
// STATISTICS
// ==========================================================

/**
 * Generates summary statistics for a collection
 * of media records.
 *
 * These statistics describe the Selection Engine's
 * recommendations and do not modify any records.
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

    const ranking =
      rankMedia(record);


    switch (ranking.recommendation) {

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

        break;

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
 * A record is considered incomplete when one or more
 * core editorial review fields have not been completed.
 *
 * @param {Array[]} records
 * @returns {Array[]}
 */
function findIncompleteReviews(records) {

  return records.filter(function(record) {

    const grade =
      record[COL.GRADE - 1];

    const storyValue =
      record[COL.STORY_VALUE - 1];

    const printSuitability =
      record[COL.PRINT_SUITABILITY - 1];


    return !grade ||
           !storyValue ||
           !printSuitability;

  });

}


/**
 * Returns records considered strong editorial
 * candidates based on their calculated score.
 *
 * This is a recommendation only.
 * It does not modify Book Candidate or Final Book.
 *
 * @param {Array[]} records
 * @returns {Array[]}
 */
function findStrongCandidates(records) {

  return records.filter(function(record) {

    return (
      calculateSelectionScore(record) >=
      SELECTION.THRESHOLDS.SHORTLISTED
    );

  });

}





// ==========================================================
// TEST FUNCTIONS
// ==========================================================

/**
 * Tests the Selection Engine using known editorial values.
 *
 * This is a read-only diagnostic test.
 * It does NOT modify the Media Database.
 */
function testSelectionEngine() {

  info("========================================");
  info("SELECTION ENGINE TEST");
  info("========================================");


  // --------------------------------------------------------
  // Test 1
  // Strong image
  // S + Story 5 + Excellent Print + Double Spread + Hero
  // --------------------------------------------------------

  const testRecord = [];

  testRecord[COL.GRADE - 1] = "S";
  testRecord[COL.STORY_VALUE - 1] = 5;
  testRecord[COL.PRINT_SUITABILITY - 1] = "Excellent";
  testRecord[COL.LAYOUT_SUITABILITY - 1] = "Double Spread";
  testRecord[COL.HERO_IMAGE - 1] = true;


  // --------------------------------------------------------
  // Run complete ranking
  // --------------------------------------------------------

  const result =
    rankMedia(testRecord);

  const score =
    result.score;

  const recommendation =
    result.recommendation;


  info("Test image:");
  info("Grade: S");
  info("Story Value: 5");
  info("Print Suitability: Excellent");
  info("Layout Suitability: Double Spread");
  info("Hero: TRUE");
  info("Calculated Score: " + score);
  info("Recommendation: " + recommendation);


  // --------------------------------------------------------
  // Expected score
  //
  // Grade S             = 40
  // Story 5             = 25
  // Excellent Print     = 15
  // Double Spread       = 15
  // Hero                = 20
  //
  // TOTAL               = 115
  // --------------------------------------------------------

  if (score !== 115) {

    throw new Error(
      "Selection score test failed. Expected 115, got " +
      score
    );

  }


  // --------------------------------------------------------
  // Expected recommendation
  // --------------------------------------------------------

  if (
    result.recommendation !== "Excellent Candidate"
  ) {

    throw new Error(
      "Selection recommendation test failed. " +
      "Expected Excellent Candidate, got " +
      result.recommendation
    );

  }


  // --------------------------------------------------------
  // Test 2
  // Weak image
  // --------------------------------------------------------

  const weakRecord = [];

  weakRecord[COL.GRADE - 1] = "D";
  weakRecord[COL.STORY_VALUE - 1] = 1;
  weakRecord[COL.PRINT_SUITABILITY - 1] = "Poor";
  weakRecord[COL.LAYOUT_SUITABILITY - 1] = "Quarter Page";
  weakRecord[COL.HERO_IMAGE - 1] = false;


  const weakResult =
    rankMedia(weakRecord);

  const weakScore =
    weakResult.score;

  const weakRecommendation =
    weakResult.recommendation;


  info(
    "Weak image score: " +
    weakScore
  );

  info(
    "Weak image recommendation: " +
    weakRecommendation
  );


  // --------------------------------------------------------
  // Expected weak score
  //
  // Grade D             = 0
  // Story 1             = 0
  // Poor Print          = 0
  // Quarter Page        = 5
  // Hero                = 0
  //
  // TOTAL               = 5
  // --------------------------------------------------------

  if (weakScore !== 5) {

    throw new Error(
      "Weak score test failed. Expected 5, got " +
      weakScore
    );

  }


  // --------------------------------------------------------
  // Expected weak recommendation
  // --------------------------------------------------------

  if (
    weakRecommendation !== "Not Selected"
  ) {

    throw new Error(
      "Weak recommendation test failed. " +
      "Expected Not Selected, got " +
      weakRecommendation
    );

  }


  // --------------------------------------------------------
  // Test 3
  // Hero image weighting
  // --------------------------------------------------------

  const heroRecord = [];

  heroRecord[COL.GRADE - 1] = "C";
  heroRecord[COL.STORY_VALUE - 1] = 2;
  heroRecord[COL.PRINT_SUITABILITY - 1] = "Acceptable";
  heroRecord[COL.LAYOUT_SUITABILITY - 1] = "Quarter Page";
  heroRecord[COL.HERO_IMAGE - 1] = true;


  const heroScore =
    calculateSelectionScore(heroRecord);


  info(
    "Hero weighting test score: " +
    heroScore
  );


  // C = 10
  // Story 2 = 6
  // Acceptable = 5
  // Quarter Page = 5
  // Hero = 20
  //
  // TOTAL = 46

  if (heroScore !== 46) {

    throw new Error(
      "Hero weighting test failed. Expected 46, got " +
      heroScore
    );

  }


  // --------------------------------------------------------
  // Test 4
  // Image suitability
  // --------------------------------------------------------

  const suitabilityRecord = [];

  suitabilityRecord[COL.ORIENTATION - 1] =
    "Landscape";

  suitabilityRecord[COL.ASPECT_RATIO - 1] =
    "3:2";

  suitabilityRecord[COL.WIDTH - 1] =
    3000;

  suitabilityRecord[COL.HEIGHT - 1] =
    2000;

  suitabilityRecord[COL.MEGAPIXELS - 1] =
    0;


  const suitability =
    analyseImageSuitability(
      suitabilityRecord
    );


  info(
    "Calculated megapixels: " +
    suitability.megapixels
  );

  info(
    "Suitability issues: " +
    suitability.issues.join(", ")
  );


  if (suitability.megapixels !== 6) {

    throw new Error(
      "Megapixel calculation test failed."
    );

  }


  if (suitability.issues.length !== 0) {

    throw new Error(
      "Suitability test failed. " +
      "Unexpected issues: " +
      suitability.issues.join(", ")
    );

  }


  // --------------------------------------------------------
  // Final result
  // --------------------------------------------------------

  info("========================================");
  info("SELECTION ENGINE TEST PASSED");
  info("========================================");

}