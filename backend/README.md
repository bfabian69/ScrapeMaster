# PowerSetter Python Scraper Backend

This backend service runs your Python scraping script and provides an API for the React frontend to trigger real PowerSetter.com scraping.

## Setup

1. **Install Python Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Install Chrome and ChromeDriver**
   ```bash
   # On Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install -y google-chrome-stable
   
   # Install ChromeDriver
   wget -O /tmp/chromedriver.zip https://chromedriver.storage.googleapis.com/LATEST_RELEASE/chromedriver_linux64.zip
   sudo unzip /tmp/chromedriver.zip -d /usr/local/bin/
   sudo chmod +x /usr/local/bin/chromedriver
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run the Backend**
   ```bash
   python powersetter_api.py
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

- `POST /api/scrape` - Start PowerSetter scraping
- `GET /api/health` - Health check

## Usage

The React frontend will call this API when you click "Start PowerSetter Scraping".