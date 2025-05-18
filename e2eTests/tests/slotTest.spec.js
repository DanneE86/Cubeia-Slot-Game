const { test, expect } = require("@playwright/test");

async function refillBalanceIfLow(page, minimum = 100, refillAmount = 10000) {
  const balanceNow = parseInt(await page.locator("#coins").textContent());
  if (balanceNow < minimum) {
    await page.evaluate((amount) => {
      balance = amount;
      updateBalanceDisplay();
    }, refillAmount);
  }
}

test.describe("Slot Game Tests", () => {
  test.beforeEach(async ({ page }) => {
  
    await page.goto("http://127.0.0.1:8000");

    await page.waitForSelector("#spinBtn");
  });

  test("Jacpott", async ({ page }) => {
    const betAmount = 50;
    // Mock the random symbol function to force matches
    await page.evaluate(() => {
      window.getRandomSymbol = () => "⭐";
    });
   
    await page.fill("#bet", String(betAmount));
    
    const bet = parseInt(await page.locator("#bet").inputValue());
    const expectedWin = betAmount * 10;
  
    await page.click("#spinBtn");
    
    await page.waitForSelector("#spinBtn:not([disabled])");
  
    // Check for jackpot message and correct win amount
    await expect(page.locator("#message")).toContainText("JACKPOT");
    await expect(page.locator("#message")).toContainText(`+${expectedWin} coins!`);
  
    // Check that all reels have the highlight class
    await expect(page.locator("#reel1")).toHaveClass(/highlight/);
    await expect(page.locator("#reel2")).toHaveClass(/highlight/);
    await expect(page.locator("#reel3")).toHaveClass(/highlight/);
  });

  test("No match", async ({ page }) => {
    const betAmount = 50;
   
    await page.fill("#bet", String(betAmount));

    // Run a loop until the correct message appears
    let match = false;
    while (!match) {
      // Check balance before spin
      const balanceBeforeSpin = parseInt(await page.locator("#coins").textContent());
      
      await page.click("#spinBtn");
      await page.waitForSelector("#spinBtn:not([disabled])");
      
      const msg = await page.locator("#message").textContent();
      if (msg && msg.includes("No match, try again")) {
        match = true;
        // Verify balance decreased after getting a match
        const balanceAfterSpin = parseInt(await page.locator("#coins").textContent());
        expect(balanceAfterSpin).toBeLessThan(balanceBeforeSpin);
      }
    }
    expect(match).toBeTruthy();
  });

  test("Nice match (two alike)", async ({ page }) => {
    const betAmount = 50;
  
    await page.fill("#bet", String(betAmount));
    const bet = parseInt(await page.locator("#bet").inputValue());
    const expectedWin = betAmount * 2;
  
    // Run a loop until the correct message appears
    let match = false;
    while (!match) {
      await refillBalanceIfLow(page);
      // Check balance before spin
      const balanceBeforeSpin = parseInt(await page.locator("#coins").textContent());
      
      await page.click("#spinBtn");
      await page.waitForSelector("#spinBtn:not([disabled])");
      
      const msg = await page.locator("#message").textContent();
      if (msg && msg.includes("Nice match")) {
        match = true;
        // Verify balance increased after getting a match
        const balanceAfterSpin = parseInt(await page.locator("#coins").textContent());
        expect(balanceAfterSpin).toBeGreaterThan(balanceBeforeSpin);
      }
    }
    expect(match).toBeTruthy();
    await expect(page.locator("#message")).toContainText(`+${expectedWin} coins.`);
  });


  test("Bet more than balance shows alert", async ({ page }) => {
    // Set the balance to 10 coins
    await page.evaluate(() => {
      balance = 10;
      updateBalanceDisplay();
    });

    // Set the bet to 100 (more than the balance)
    await page.fill("#bet", "100");

    // Listen for alert
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain("Not enough coins!");
      await dialog.dismiss();
    });

    
    await page.click("#spinBtn");

    // Check that the balance is unchanged
    const coins = await page.locator("#coins").textContent();
    expect(parseInt(coins)).toBe(10);
  });
});
