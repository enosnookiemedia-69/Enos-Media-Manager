/**
 * ==========================================================
 * SCANNER.GS
 * ----------------------------------------------------------
 * Searches Google Drive folders and returns media files.
 *
 * Responsibilities:
 * • Scan folders recursively
 * • Find files
 * • Ignore non-media files
 * • Return file information
 *
 * Communicates with:
 * • Sync.gs
 * • Config.gs
 * • Utilities.gs
 * ==========================================================
 */


/**
 * Scans a folder and all subfolders.
 *
 * @param {Folder} folder
 * @returns {Array}
 */
function scanFolder(folder) {

  const files = [];


  // Find files in current folder
  const folderFiles = folder.getFiles();

  while (folderFiles.hasNext()) {

    const file = folderFiles.next();

    files.push(file);

  }


  // Find subfolders
  const subFolders = folder.getFolders();

  while (subFolders.hasNext()) {

    const subFolder = subFolders.next();

    const subFiles = scanFolder(subFolder);

    files.push(...subFiles);

  }


  return files;

}