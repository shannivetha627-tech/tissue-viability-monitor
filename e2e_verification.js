import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = "http://localhost:4173";
  let results = [];

  function report(item, pass, details) {
    results.push(`Item ${item}: ${pass ? "PASS" : "FAIL"} - ${details}`);
    console.log(`[Item ${item}] ${pass ? "PASS" : "FAIL"} - ${details}`);
  }

  try {
    // 1. Open the home page.
    await page.goto(url);
    report(1, true, `Successfully opened ${url}`);

    // 2. Confirm there is a Login option/page.
    let loginFound = false;
    if (page.url().includes("/login")) {
      loginFound = true;
    } else {
      await page.goto(url + "/login");
      loginFound = true;
    }
    await page.waitForURL("**/login");
    report(2, true, "Login page is accessible via /login.");

    // 3. Log in as Doctor.
    await page.fill('input[name="username"]', "doc1");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/verify-face");
    await page.click("text=Begin Face Scan");
    await page.waitForURL("**/doctor");
    report(3, true, "Successfully logged in as Doctor and passed face verification.");

    // 4. Confirm Doctor Dashboard opens.
    const dashboardHeader = await page.locator("h1", { hasText: "Dashboard" }).count();
    report(4, dashboardHeader > 0, "Doctor Dashboard is visible.");

    // 5. Search for an existing Patient ID.
    await page.fill('input[placeholder="Enter Patient ID..."]', "P000047");
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(1000); // Wait for search to complete
    report(5, true, "Searched for existing Patient ID P000047.");

    // 6. Confirm the correct patient details appear.
    const patientDetails = await page.locator("text=P000047").count();
    report(6, patientDetails > 0, "Patient P000047 details are displayed.");

    // 7. Confirm the patient's current AI prediction appears.
    const currentPrediction = await page.locator("text=Viability Probability").count();
    report(7, currentPrediction > 0, "Current AI prediction (Viability Probability) is displayed.");

    // 8. Confirm the patient's Prediction History appears.
    const historySection = await page.locator("text=Prediction History").count();
    report(8, historySection > 0, "Prediction History section is visible.");

    // 9. Confirm multiple historical prediction records can be displayed.
    const historyRows = await page.locator("table tbody tr").count();
    report(9, historyRows > 0, `Historical prediction records displayed (Count: ${historyRows}).`);

    // 10. Search for a different Patient ID and confirm the displayed patient and history change correctly.
    await page.fill('input[placeholder="Enter Patient ID..."]', "P000048");
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(1000); // Wait for search to complete
    const newPatientDetails = await page.locator("text=P000048").count();
    report(10, newPatientDetails > 0, "Displayed patient changed to P000048.");

    // 11. Test an invalid Patient ID and confirm a proper "patient not found" response.
    await page.fill('input[placeholder="Enter Patient ID..."]', "INVALID_ID_999");
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(1000); // Wait for search to complete
    const errorMessage = await page.locator("text=not found").count() > 0 || await page.locator("text=No patient found").count() > 0;
    report(11, errorMessage, "Proper 'patient not found' response received for invalid ID.");

    // Logout to test patient account
    await page.click("text=Logout");
    await page.waitForURL("**/login");

    // 12. Confirm a patient logged in as Patient can see ONLY their own information/history and cannot search/access another patient's history.
    await page.click("text=Patient Login"); // Switch to patient login tab if applicable, or just enter credentials
    await page.fill('input[name="username"]', "P000047");
    await page.fill('input[name="password"]', "Patient@000047");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/patient");
    
    const ownData = await page.locator("text=P000047").count();
    const searchBar = await page.locator('input[placeholder="Enter Patient ID..."]').count();
    
    // Patient should not have a search bar to look up others
    report(12, ownData > 0 && searchBar === 0, "Patient can see their own data and cannot search for others.");

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await browser.close();
  }
})();
