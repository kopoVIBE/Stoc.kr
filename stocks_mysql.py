import csv
import pymysql
from datetime import datetime

# DB �묒냽 �뺣낫
DB_CONFIG = {
    'host': 'localhost',
    'port': 13306,
    'user': 'stockr',
    'password': 'stockr123!',
    'database': 'stockr',
    'charset': 'utf8mb4'
}

# Java �뷀떚�곗뿉 留욎텣 INSERT 援щЦ
INSERT_SQL = """
INSERT INTO stocks (
    stock_id, stock_name, close_price, price_diff, fluctuation_rate,
    eps, per, forward_eps, forward_per, bps, pbr,
    dividend_per_share, dividend_yield, market_type,
    industry_type, market_cap
) VALUES (
    %s, %s, %s, %s, %s,
    %s, %s, %s, %s, %s, %s,
    %s, %s, %s,
    %s, %s
)
"""

# float �뚯떛 (�덉쇅 泥섎━ �ы븿)
def parse_float(val, default=0.0):
    try:
        return float(val)
    except:
        return default

# int �뚯떛 (怨쇳븰�� �쒓린 ����)
def parse_int(val, default=0):
    try:
        return int(float(val))
    except:
        return default

def main():
    db = pymysql.connect(**DB_CONFIG)
    cursor = db.cursor()

    # 湲곗〈 �곗씠�� ��젣 (珥덇린�붿슜)
    cursor.execute("DELETE FROM stocks")

    with open('stocks.csv', newline='', encoding='cp949') as csvfile:
        reader = csv.DictReader(csvfile)
        inserted = 0
        for row in reader:
            try:
                values = (
                    row['stock_id'],
                    row['stock_name'],
                    parse_int(row['close_price']),
                    parse_float(row['price_diff']),
                    parse_float(row['fluctuation_rate']),
                    parse_float(row['eps']),
                    parse_float(row['per']),
                    parse_float(row['forward_eps']),
                    parse_float(row['forward_per']),
                    parse_float(row['bps']),
                    parse_float(row['pbr']),
                    parse_float(row['dividend_per_share']),
                    parse_float(row['dividend_yield']),
                    row['market_type'],
                    row['industry_type'],
                    parse_int(row['market_cap'])
                )
                cursor.execute(INSERT_SQL, values)
                inserted += 1
            except Exception as e:
                print(f"�� �ㅻ쪟 諛쒖깮: {e}\n  �몛 row: {row}")

    db.commit()
    cursor.close()
    db.close()

    print(f"�� 珥� {inserted}媛� 醫낅ぉ �쎌엯 �꾨즺")

if __name__ == '__main__':
    main()