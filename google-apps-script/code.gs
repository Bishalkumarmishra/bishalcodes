/**
 * Bishal Codes Portfolio Automatic Mail System - Google Apps Script
 * Deploy this script on https://script.google.com/home under bishalmishra9000@gmail.com
 * 
 * Deployment Instructions:
 * 1. Go to script.google.com and create a new project.
 * 2. Paste this code into the editor, renaming the file to 'Code.gs'.
 * 3. Save the project (Ctrl + S).
 * 4. Click 'Deploy' (top-right) > 'New deployment'.
 * 5. Under 'Select type', choose 'Web app'.
 * 6. Set 'Execute as' to: "Me (bishalmishra9000@gmail.com)".
 * 7. Set 'Who has access' to: "Anyone" (essential so that your Next.js server can POST to it).
 * 8. Click 'Deploy'. Grant permissions if requested.
 * 9. Copy the generated Web App URL and add it to your '.env.local' file as:
 *    GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: "Empty or invalid post body" });
    }
    
    var payload = JSON.parse(e.postData.contents);
    var subject = payload.subject || "New Lead from Portfolio";
    var htmlBody = payload.body || "";
    var textBody = payload.textContent || "";
    
    // The recipient is bishalmishra9000@gmail.com
    var recipient = "bishalmishra9000@gmail.com";
    
    // Send email using MailApp
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody
    });
    
    return createJsonResponse({ success: true });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
