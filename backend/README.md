# PowerSetter Python Scraper Backend

This backend service runs your Python scraping script and provides an API for the React frontend to trigger real PowerSetter.com scraping.

## Setup Instructions

### 1. Navigate to Backend Folder
```bash
cd /home/project/backend
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Install Chrome and ChromeDriver

**On Ubuntu/Debian:**
```bash
# Update package list
sudo apt-get update

# Install Google Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Install ChromeDriver
CHROME_VERSION=$(google-chrome --version | grep -oP '\d+\.\d+\.\d+')
CHROMEDRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION%%.*}")
wget -O /tmp/chromedriver.zip "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip"
sudo unzip /tmp/chromedriver.zip -d /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver
rm /tmp/chromedriver.zip
```

**On macOS:**
```bash
# Install Chrome
brew install --cask google-chrome

# Install ChromeDriver
brew install chromedriver
```

**On Windows:**
1. Download Chrome from https://www.google.com/chrome/
2. Download ChromeDriver from https://chromedriver.chromium.org/
3. Add ChromeDriver to your PATH

### 4. Configure Environment (Optional)
```bash
cp .env.example .env
# Edit .env if you need to customize database settings
```

### 5. Run the Backend
```bash
python powersetter_api.py
```

You should see:
```
Database table verified/created successfully
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://[your-ip]:5000
```

### 6. Test the Backend
Open another terminal and test:
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{"status": "healthy", "message": "PowerSetter scraper API is running"}
```

## Usage

1. **Start the Backend**: Run `python powersetter_api.py` in the backend folder
2. **Use the React App**: Go to the PowerSetter tab in your React app
3. **Start Scraping**: Click "Start PowerSetter Scraping" - it will now use real data!

## API Endpoints

- `POST /api/scrape` - Start PowerSetter scraping with real Selenium
- `GET /api/health` - Health check endpoint

## Troubleshooting

### Chrome/ChromeDriver Issues
- Make sure Chrome and ChromeDriver versions are compatible
- Try running with `headless=False` to see what's happening
- Check ChromeDriver is in your PATH: `which chromedriver`

### Database Connection Issues
- Verify your Supabase credentials in the script
- Check if the database is accessible from your machine

### Permission Issues
- Make sure ChromeDriver is executable: `chmod +x /usr/local/bin/chromedriver`
- Run with `sudo` if needed for installation steps

### Port Already in Use
- If port 5000 is busy, change the port in `powersetter_api.py` and update the React app accordingly

## Real Data Flow

1. React app sends ZIP codes to Python backend
2. Python backend uses Selenium to scrape PowerSetter.com
3. Real data is extracted and stored in your Supabase database
4. React app shows the real scraped data in the Results tab

This gives you actual, up-to-date energy rate data from PowerSetter.com!