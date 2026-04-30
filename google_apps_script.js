function doPost(e) {
  // CORS Headers are managed by Google automatically for Web Apps when deployed,
  // but we will use "no-cors" mode in the React app so it just fires and forgets.
  try {
    var data;
    // Handle both JSON and plain text that contains JSON (from no-cors fetch)
    if (e.postData.type === "application/json" || e.postData.type === "text/plain") {
      data = JSON.parse(e.postData.contents);
    } else {
      return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "Unsupported content type"}))
          .setMimeType(ContentService.MimeType.JSON);
    }
    
    var action = data.action;
    
    if (action === "update") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheets = ss.getSheets();
      var sheet = null;
      
      // Find the specific tab (sheet) by its GID (taken from the URL)
      for (var i = 0; i < sheets.length; i++) {
        if (sheets[i].getSheetId().toString() === data.gid.toString()) {
          sheet = sheets[i];
          break;
        }
      }
      
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "Sheet GID not found: " + data.gid}))
            .setMimeType(ContentService.MimeType.JSON);
      }
      
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var headers = values[0]; // Row 1 is headers
      
      // Find which column has the ID, and which column needs updating
      var rowIdColIndex = headers.indexOf(data.rowIdColumn);
      var updateColIndex = headers.indexOf(data.columnName);
      
      if (rowIdColIndex === -1 || updateColIndex === -1) {
        return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "Columns not found. Expected: " + data.rowIdColumn + " and " + data.columnName}))
            .setMimeType(ContentService.MimeType.JSON);
      }
      
      var rowIndex = -1;
      // Loop through rows to find the matching ID (username or no)
      for (var r = 1; r < values.length; r++) {
        // Use loose equality to match numbers/strings
        if (values[r][rowIdColIndex] == data.rowId) {
          rowIndex = r;
          break;
        }
      }
      
      if (rowIndex !== -1) {
        // Update the cell. Arrays are 0-indexed, but getRange is 1-indexed.
        // So row is rowIndex + 1, col is updateColIndex + 1
        sheet.getRange(rowIndex + 1, updateColIndex + 1).setValue(data.newValue);
        return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
            .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "Row ID not found: " + data.rowId}))
            .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "Invalid action"}))
        .setMimeType(ContentService.MimeType.JSON);
        
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
        .setMimeType(ContentService.MimeType.JSON);
  }
}
