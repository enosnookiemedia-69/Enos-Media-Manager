function testDriveAPI() {

  const response = Drive.Files.list({
    pageSize: 5
  });

  Logger.log(response.files);

}