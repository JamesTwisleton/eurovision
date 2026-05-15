import asyncio
from playwright.async_api import async_playwright
import os

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Set viewport to a mobile-like size to check mobile layout
        context = await browser.new_context(
            viewport={'width': 375, 'height': 812},
            is_mobile=True,
            record_video_dir="/home/jules/verification/videos"
        )
        page = await context.new_page()

        try:
            print("Navigating to home page...")
            await page.goto("http://localhost:3000")
            await asyncio.sleep(1)
            await page.screenshot(path="/home/jules/verification/screenshots/home.png")

            # 1. Verify Global Scoreboard Stats and "Pos"
            print("Checking Global Scoreboard...")
            await page.get_by_role("link", name="Global Scoreboard").click()
            await asyncio.sleep(1)
            # Check "Pos" instead of "Rank"
            pos_header = page.locator("th:has-text('Pos')")
            await pos_header.wait_for(state="visible")
            await page.screenshot(path="/home/jules/verification/screenshots/global_scoreboard.png")

            # 2. Create a Watch Party to check Scorecard "Order" and Mobile Layout
            print("Creating a Watch Party...")
            await page.goto("http://localhost:3000")
            await page.get_by_role("button", name="Create a Watch Party").click()
            await asyncio.sleep(0.5)
            await page.get_by_placeholder("e.g. Eurovision Night at the Twisletons").fill("Jules Verification Party")
            await page.get_by_placeholder("e.g. James").fill("Jules")
            await page.get_by_placeholder("e.g. London").fill("Paris")
            await page.get_by_role("button", name="Create Watch Party").click()
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(1)

            # Now on Scorecard
            print("Checking Scorecard...")
            order_header = page.locator("th:has-text('Order')")
            await order_header.wait_for(state="visible")
            await page.screenshot(path="/home/jules/verification/screenshots/scorecard_mobile.png")

            # 3. Check Party Scoreboard "Pos"
            print("Checking Party Scoreboard...")
            # Find the Scoreboard link in Header (trophy icon or text)
            await page.get_by_role("link", name="Scoreboard").first.click()
            await asyncio.sleep(1)
            pos_header_party = page.locator("th:has-text('Pos')")
            await pos_header_party.wait_for(state="visible")
            await page.screenshot(path="/home/jules/verification/screenshots/party_scoreboard.png")

            # 4. Check Manage Party page (Host features)
            print("Checking Manage Party page...")
            # Use force click or go directly to URL to avoid interception
            manage_url = await page.locator("a[href*='/members']").get_attribute("href")
            await page.goto(f"http://localhost:3000{manage_url}")
            await asyncio.sleep(1)

            # Check Rename Party input
            rename_input = page.locator("input[value='Jules Verification Party']")
            await rename_input.wait_for(state="visible")

            # Check Member management list
            member_row = page.locator("tr:has-text('Jules')")
            await member_row.wait_for(state="visible")

            await page.screenshot(path="/home/jules/verification/screenshots/manage_party.png")
            print("Verification steps complete.")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="/home/jules/verification/screenshots/error.png")
        finally:
            await context.close()
            await browser.close()

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    asyncio.run(run_verification())
