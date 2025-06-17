import time
import psycopg2
import re
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from datetime import datetime
from selenium.common.exceptions import TimeoutException, ElementNotInteractableException
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Define default utilities mapping
default_utilities = {
    "60021": "ComEd", "62634": "Ameren", "01746": "Eversource - NSTAR", "01035": "Eversource - WMECO",
    "44052": "Ohio Edison", "45255": "Duke Energy", "43771": "AEP - Ohio Power",
    "45710": "AEP Columbus", "43609": "Toledo Edison",
    "44026": "The Illuminating Company", "17017": "PPL Electric", "17329": "Met-Ed",
    "19122": "PECO Energy", "16637": "Penelec", "08001": "Atlantic City Electric",
    "07083": "Public Service Electric & Gas (PSEG)", "07885": "JCPL", "01069": "Nat Grid - MA",
}

def get_db_connection():
    """Get database connection using environment variables"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'db.apermcjpipcaffwbykll.supabase.co'),
        port=os.getenv('DB_PORT', '5432'),
        database=os.getenv('DB_NAME', 'postgres'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'tey5aYqyxGRnctPB')
    )

def scrape_zip(zip_code, driver, wait, cursor, conn, progress_callback=None):
    """Scrape a single ZIP code from PowerSetter.com"""
    homepage = "https://www.powersetter.com/"
    driver.get(homepage)
    print(f"Processing ZIP {zip_code} on powersetter.com")

    try:
        # Open ZIP modal
        zip_link = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, 'header-selector')]//div[@data-modal='#zipFormModal']")))
        driver.execute_script("arguments[0].click();", zip_link)

        # Wait for modal and enter ZIP
        modal = wait.until(EC.visibility_of_element_located((By.ID, "zipFormModal")))
        time.sleep(1)

        zip_input = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[@id='zipFormModal']//input[@id='zip']")))
        zip_input.clear()
        zip_input.send_keys(zip_code)

        # Click Compare Rates
        compare_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[@id='zipFormModal']//button[contains(text(), 'Compare Rates')]")))
        compare_btn.click()

        # Wait for results
        wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@id, 'ratesTable')]")))
        time.sleep(2)

        # Capture page source
        html = driver.page_source
        soup = BeautifulSoup(html, "html.parser")

        # Get utility name from default_utilities
        utility_value = default_utilities.get(zip_code, "Unknown Utility")

        # Find rates table
        product_rows = soup.find("div", {"class": "rates-table"})
        if not product_rows:
            print(f"Zip {zip_code}: Rates table not found")
            return []

        cards = product_rows.find_all("div", class_="card")
        if not cards:
            print(f"Zip {zip_code}: No cards found in rates table")
            return []

        scraped_records = []
        visible_count = 0
        
        for card in cards[:5]:
            # Extract price_per_kwh
            rate = None
            rate_el = card.find("p", class_="price")
            if rate_el:
                rate_text = rate_el.get_text(strip=True)
                rate_match = re.search(r"(\d+\.\d+)¢", rate_text)
                if rate_match:
                    rate = float(rate_match.group(1))

            if not rate:
                continue

            # Extract fee (keep as text)
            fee = card.get("data-fee", "0")
            if fee and fee != "0":
                fee = f"${fee}"
            else:
                fee = ""

            # Extract savings
            savings_el = card.find("span", class_="persent")
            savings = savings_el.get_text(strip=True) if savings_el and savings_el.get("style") != "display: none" else ""

            # Extract plan_length (terms)
            plan_length_el = card.find("p", class_="term")
            plan_length = plan_length_el.get_text(strip=True) if plan_length_el else ""

            # Extract summary (info)
            summary = ""
            info_btn = card.find("button", class_="more-info-button")
            if info_btn and info_btn.has_attr("data-encoded-contents"):
                summary = info_btn["data-encoded-contents"]

            # Extract green status
            green_el = card.find("p", class_="green")
            green = green_el.get_text(strip=True) if green_el else "N"

            # Extract supplier logo URL and convert to absolute URL
            logo_container = card.find("p", class_="logo").find("img") if card.find("p", class_="logo") else None
            supplier_logo_url = ""
            if logo_container and logo_container.has_attr("src"):
                relative_url = logo_container["src"]
                # Ensure it's an absolute URL by prepending the base URL if it's relative
                if relative_url.startswith('/'):
                    supplier_logo_url = f"https://www.powersetter.com{relative_url}"
                elif not relative_url.startswith('http'):
                    supplier_logo_url = f"https://www.powersetter.com/{relative_url}"
                else:
                    supplier_logo_url = relative_url  # Keep as is if it's already an absolute URL

            # Extract signup URL
            signup_btn = card.find("button", class_="button-redirect")
            signup_url = signup_btn["data-redirect"] if signup_btn and signup_btn.has_attr("data-redirect") else ""

            # Timestamp
            scraped_at = datetime.now()

            # Create record object
            record = {
                'zip_code': zip_code,
                'price_per_kwh': rate,
                'savings': savings,
                'terms': plan_length,
                'info': summary,
                'green': green,
                'supplier_logo_url': supplier_logo_url,
                'signup_url': signup_url,
                'utility': utility_value,
                'fee': fee,
                'scraped_at': scraped_at
            }
            
            scraped_records.append(record)

            # Insert into database
            insert_sql = """
                INSERT INTO powersetter (
                    zip_code, price_per_kwh, savings, terms, info, green,
                    supplier_logo_url, signup_url, utility, fee, scraped_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_sql, (
                zip_code, rate, savings, plan_length, summary, green,
                supplier_logo_url, signup_url, utility_value, fee, scraped_at
            ))
            conn.commit()

            visible_count += 1
            if visible_count >= 5:
                break

        print(f"Successfully scraped {len(scraped_records)} records for ZIP {zip_code}")
        return scraped_records

    except Exception as e:
        print(f"Error for ZIP {zip_code}: {e}")
        driver.save_screenshot(f"error_{zip_code}.png")
        return []

@app.route('/api/scrape', methods=['POST'])
def scrape_powersetter():
    """API endpoint to start PowerSetter scraping"""
    try:
        data = request.get_json()
        zip_codes = data.get('zipCodes', [])
        delay_between_requests = data.get('delayBetweenRequests', 5000)
        headless = data.get('headless', True)
        
        if not zip_codes:
            return jsonify({'success': False, 'error': 'No ZIP codes provided'}), 400

        print(f"Starting scraping for {len(zip_codes)} ZIP codes")
        
        # Setup database connection
        conn = get_db_connection()
        cursor = conn.cursor()

        # Setup Chrome driver
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        
        driver = webdriver.Chrome(options=options)
        wait = WebDriverWait(driver, 30)

        all_records = []
        
        try:
            for i, zip_code in enumerate(zip_codes):
                print(f"Processing ZIP {zip_code} ({i+1}/{len(zip_codes)})")
                
                records = scrape_zip(zip_code, driver, wait, cursor, conn)
                all_records.extend(records)
                
                # Add delay between requests (convert from ms to seconds)
                if i < len(zip_codes) - 1:
                    time.sleep(delay_between_requests / 1000)
                    
        finally:
            driver.quit()
            cursor.close()
            conn.close()

        return jsonify({
            'success': True,
            'message': f'Successfully scraped {len(all_records)} records from {len(zip_codes)} ZIP codes',
            'recordCount': len(all_records),
            'zipCodes': zip_codes
        })

    except Exception as e:
        print(f"Scraping error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'PowerSetter scraper API is running'})

if __name__ == '__main__':
    # Ensure the powersetter table exists
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        create_table_sql = """
            CREATE TABLE IF NOT EXISTS powersetter (
                id SERIAL PRIMARY KEY,
                zip_code TEXT,
                price_per_kwh NUMERIC(10, 4),
                savings TEXT,
                terms TEXT,
                info TEXT,
                green TEXT,
                supplier_logo_url TEXT,
                signup_url TEXT,
                utility TEXT,
                fee TEXT,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
        cursor.execute(create_table_sql)
        conn.commit()
        cursor.close()
        conn.close()
        print("Database table verified/created successfully")
        
    except Exception as e:
        print(f"Database setup error: {e}")
    
    app.run(host='0.0.0.0', port=5000, debug=True)