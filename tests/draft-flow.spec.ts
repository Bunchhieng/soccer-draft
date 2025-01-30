import { test, expect } from './setup';

test.describe('Soccer Draft Flow', () => {
  test('complete draft flow', async ({ page }) => {
    // 1. Add 4 teams with captains and colors
    const teams = [
      { name: 'Team Red', captain: 'John', color: '#e53e3e' },
      { name: 'Team Blue', captain: 'Mike', color: '#3182ce' },
      { name: 'Team Green', captain: 'Sarah', color: '#38a169' },
      { name: 'Team Yellow', captain: 'Lisa', color: '#d69e2e' }
    ];

    for (const team of teams) {
      // Wait for elements to be ready before each interaction
      await page.waitForSelector('#teamName');
      await page.fill('#teamName', team.name);
      
      await page.waitForSelector('#captain');
      await page.fill('#captain', team.captain);
      
      await page.waitForSelector(`.color-option[data-color="${team.color}"]`);
      await page.click(`.color-option[data-color="${team.color}"]`);
      
      await page.waitForSelector('button:has-text("⚽ Add Team")');
      await page.click('button:has-text("⚽ Add Team")');
      
      // Wait for the team to be added before continuing
      await page.waitForTimeout(500); // Small delay to ensure UI updates
    }

    // 2. Input 28 players
    const players = Array.from({ length: 28 }, (_, i) => `Player${i + 1}`).join(', ');
    await page.waitForSelector('#players');
    await page.fill('#players', players);

    // 3. Verify draft order list is populated
    await page.waitForSelector('#draftOrderList');
    const draftOrderList = await page.locator('#draftOrderList');
    await expect(draftOrderList.locator('.draft-order-item')).toHaveCount(4);

    // 4. Start the draft
    await page.waitForSelector('button:has-text("⚽ Start Draft")');
    await page.click('button:has-text("⚽ Start Draft")');

    // Wait for draft interface to be visible first
    await page.waitForSelector('#draftInterface', { state: 'visible' });
    
    // Wait for the draft interface to be fully initialized
    await page.waitForTimeout(1000);

    // Check if current pick indicator exists and has content
    const currentTurnElement = page.locator('#current-pick-indicator');
    await expect(currentTurnElement).toBeVisible();
    
    const initialTurn = await currentTurnElement.textContent();
    console.log(`Initial turn: ${initialTurn}`);
    expect(initialTurn).toBeTruthy();
    expect(initialTurn?.trim()).not.toBe('');

    // 5. Pick all players
    await page.waitForSelector('#availablePlayers');
    let totalPicks = 0;
    
    // Log initial count
    const initialCount = await page.locator('#availablePlayers .player-card').count();
    console.log(`Initial player count: ${initialCount}`);
    
    while (await page.locator('#availablePlayers .player-card').count() > 0) {
      const currentCount = await page.locator('#availablePlayers .player-card').count();
      console.log(`Remaining players: ${currentCount}`);
      
      // Verify current turn is still displayed and changes
      const currentTurn = await page.locator('#currentTurn').textContent();
      console.log(`Current turn: ${currentTurn}`);
      expect(currentTurn).toBeTruthy();
      expect(currentTurn).not.toBe('');
      
      // Get the first player's name for logging
      const playerName = await page.locator('#availablePlayers .player-card').first().textContent();
      console.log(`Picking player: ${playerName}`);
      
      await page.click('#availablePlayers .player-card >> nth=0');
      await page.waitForTimeout(500); // Increased delay between picks
      
      // Verify turn changed after pick (except for last pick)
      if (currentCount > 1) {
        const nextTurn = await page.locator('#currentTurn').textContent();
        expect(nextTurn).not.toBe(currentTurn);
        console.log(`Turn changed to: ${nextTurn}`);
      }
      
      totalPicks++;
      
      // Safety check to prevent infinite loops
      if (totalPicks > 28) {
        throw new Error('Draft exceeded expected number of picks');
      }
    }
    
    console.log(`Total players picked: ${totalPicks}`);
    
    // Verify we picked exactly 28 players
    expect(totalPicks).toBe(28);

    // 6. Verify draft completion and confetti
    // Wait for all players to be drafted and trigger goal animation
    await page.waitForFunction(() => {
      const availablePlayers = document.querySelector('#availablePlayers');
      return availablePlayers && availablePlayers.children.length === 0;
    });
    
    // Verify goal animation class is added
    await expect(page.locator('.goal-animation.show')).toBeVisible({ timeout: 10000 });
    
    // Verify draft interface is no longer visible
    await expect(page.locator('#availablePlayers')).not.toBeVisible();
    
    // Verify teams list is visible
    await expect(page.locator('#teamsList')).toBeVisible();

    // 7. Validate equal team sizes
    await page.waitForSelector('.team-grid');
    const teamGrids = await page.locator('.team-grid');
    for (let i = 0; i < 4; i++) {
      const playerCount = await teamGrids.nth(i).locator('.player-card').count();
      expect(playerCount).toBe(7); // 28 players / 4 teams = 7 players per team
    }

    // 8. Validate buttons are displayed
    await expect(page.locator('button:has-text("🔄 New Draft")')).toBeVisible();
    await expect(page.locator('button:has-text("📸 Save as Image")')).toBeVisible();
    await expect(page.locator('button:has-text("🎯 Load Test Data")')).toBeVisible();

    // 9. Test New Draft functionality
    await page.click('button:has-text("🔄 New Draft")');
    await page.waitForSelector('#customAlert');
    await expect(page.locator('#customAlert')).toBeVisible();
    
    await page.click('button:has-text("⚽ Start New Draft")');

    // Verify localStorage is cleared
    const localStorage = await page.evaluate(() => window.localStorage.getItem('draftState'));
    expect(localStorage).toBeNull();

    // Verify UI is reset
    await expect(page.locator('#teamsList')).not.toBeVisible();
    await expect(page.locator('#draftInterface')).not.toBeVisible();
    await expect(page.locator('.team-setup')).toBeVisible();
  });
}); 