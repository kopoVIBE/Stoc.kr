#!/bin/bash

echo "📄 stocks.csv 파일을 ec2-setup 폴더로 복사합니다..."

# 현재 디렉토리가 ec2-setup인지 확인
if [ ! -f "../stocks.csv" ]; then
    echo "❌ 상위 디렉토리에서 stocks.csv 파일을 찾을 수 없습니다."
    echo "현재 위치: $(pwd)"
    echo "stocks.csv 파일이 BE/crawler/ 폴더에 있는지 확인해주세요."
    exit 1
fi

# stocks.csv 파일 복사
cp ../stocks.csv .

if [ -f "stocks.csv" ]; then
    echo "✅ stocks.csv 파일이 성공적으로 복사되었습니다."
    echo "파일 크기: $(ls -lh stocks.csv | awk '{print $5}')"
    echo "줄 수: $(wc -l < stocks.csv)"
else
    echo "❌ stocks.csv 파일 복사에 실패했습니다."
    exit 1
fi 