FROM python:3.10

WORKDIR /app

# 🛠 cron 설치 포함
RUN apt-get update && apt-get install -y cron curl gnupg unzip \
    fonts-liberation libnss3 libxss1 libasound2 libatk-bridge2.0-0 \
    libgtk-3-0 libx11-xcb1 libdrm2 libgbm1 libxcomposite1 libxrandr2 \
    libxdamage1 libxext6 libxfixes3 libxinerama1 libglu1-mesa \
    libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libcairo2 xvfb

# 라이브러리 설치
RUN pip install playwright beautifulsoup4 requests pymongo && playwright install

COPY . .

# 크론 잡 등록
COPY cronjob /etc/cron.d/news-cron
RUN chmod 0644 /etc/cron.d/news-cron && crontab /etc/cron.d/news-cron

# 크론 데몬 실행
CMD ["cron", "-f"]
