import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch()
        # Use mobile viewport
        context = await browser.new_context(
            viewport={'width': 375, 'height': 812},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
        )
        page = await context.new_page()

        # Step 1: Login/Join to get a session
        print("Joining party...")
        await page.goto("http://localhost:3000/party/comparative-orange-asp")
        await page.fill('input[placeholder="e.g. Rebecca"]', "jules")
        await page.fill('input[placeholder="e.g. Manchester"]', "paris")
        await page.click('button:has-text("Join Watch Party")')

        # Wait for scorecard to load
        await page.wait_for_selector('text=Order')
        print("At Scorecard.")
        await page.screenshot(path="verification/screenshots/scorecard_mobile_final.png")

        # Step 2: Go to Manage Party (Host should see the cog)
        print("Navigating to Manage Party...")
        # Since I am a host (first member of seeded party), I should see the cog.
        # It's an <a> tag with href containing /members
        await page.click('a[href$="/members"]')
        await page.wait_for_selector('text=Manage Watch Party')
        print("At Manage Party page.")
        await page.screenshot(path="verification/screenshots/manage_party_mobile.png")

        # Step 3: Go to Scoreboard
        print("Navigating to Scoreboard...")
        await page.goto("http://localhost:3000/party/comparative-orange-asp/scoreboard")
        await page.wait_for_selector('text=Pos')
        print("At Party Scoreboard.")
        await page.screenshot(path="verification/screenshots/party_scoreboard_mobile.png")

        # Step 4: Go to Global Scoreboard
        print("Navigating to Global Scoreboard...")
        await page.goto("http://localhost:3000/scoreboard")
        await page.wait_for_selector('text=users left to finalise')
        print("At Global Scoreboard.")
        await page.screenshot(path="verification/screenshots/global_scoreboard_mobile_final.png")

        await browser.close()

if __name__ == "__main__":
    os.makedirs("verification/screenshots", exist_ok=True)
    asyncio.run(verify())
