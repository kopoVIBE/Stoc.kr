#!/bin/bash

echo "🚀 EC2 뉴스 크롤러 환경 설정 시작..."

# Python 3.9 이상 설치 확인
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3가 설치되어 있지 않습니다. 설치를 진행합니다..."
    sudo yum update -y
    sudo yum install -y python3 python3-pip
else
    echo "✅ Python3가 이미 설치되어 있습니다."
fi

# pip 업그레이드
echo "📦 pip 업그레이드 중..."
python3 -m pip install --upgrade pip

# 필요한 패키지 설치
echo "📚 필요한 Python 패키지 설치 중..."
pip3 install -r requirements.txt

# Playwright 브라우저 설치
echo "🌐 Playwright 브라우저 설치 중..."
python3 -m playwright install chromium

# stocks.csv 파일 복사
echo "📄 stocks.csv 파일 복사 중..."
cp ../stocks.csv .

echo "✅ EC2 환경 설정 완료!"
echo "이제 Spring Boot 애플리케이션에서 크롤러를 실행할 수 있습니다." 