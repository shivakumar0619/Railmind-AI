from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        pages_to_test = [
            ("Dashboard", "http://frontend:80/"),
            ("Digital Twin", "http://frontend:80/digital-twin"),
            ("Route Planner", "http://frontend:80/route-planner"),
            ("Trains", "http://frontend:80/trains"),
            ("Stations", "http://frontend:80/stations"),
            ("Signals", "http://frontend:80/signals"),
            ("Routes", "http://frontend:80/routes"),
            ("Alerts", "http://frontend:80/alerts"),
            ("Maintenance", "http://frontend:80/maintenance"),
            ("Analytics", "http://frontend:80/analytics"),
            ("AI Insights", "http://frontend:80/ai-insights"),
        ]
        
        for name, url in pages_to_test:
            print(f"Testing {name} at {url}...")
            try:
                # wait until network is idle so we get fully loaded data
                page.goto(url, wait_until='networkidle', timeout=30000)
                page.wait_for_timeout(3000) # give 3 seconds for react query to fetch and render
                file_name = f"/tmp/{name.replace(' ', '_')}.png"
                page.screenshot(path=file_name)
                print(f"Saved {file_name}")
            except Exception as e:
                print(f"Error on {name}: {e}")
                
        browser.close()

if __name__ == "__main__":
    run()
