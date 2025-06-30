from flask import Flask, request, jsonify
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
df = pd.read_excel("similarity_data.xlsx") 

feature_cols = [
    'EPS_표준화', 'PER_표준화', '선행 EPS_표준화', '선행 PER_표준화',
    'BPS_표준화', 'PBR_표준화', '주당배당금_표준화', '배당수익률_표준화',
    '시가총액_표준화', 'Beta', '1년_수익률(%)', '수익률_변동성'
]
X = df[feature_cols].values
cos_sim = cosine_similarity(X)

@app.route("/recommend", methods=["GET"])
def recommend():
    stock_name = request.args.get("stock_name")
    if stock_name not in df['종목명'].values:
        return jsonify({"error": "종목 없음"}), 404

    target_index = df[df['종목명'] == stock_name].index[0]
    target_industry = df.loc[target_index, '업종명']

    raw_scores = cos_sim[target_index]
    adjusted_scores = []
    for i, score in enumerate(raw_scores):
        if i == target_index: continue
        weight = 1.0 if df.loc[i, '업종명'] == target_industry else 0.8 # 추후 조정해야할 것 같음 ?
        adjusted_scores.append((i, score * weight))

    top_indices = sorted(adjusted_scores, key=lambda x: x[1], reverse=True)[:5]
    recommendations = [
        {
            "종목명": df.loc[i, '종목명'],
            "유사도": round(score, 5),
            "업종명": df.loc[i, '업종명']
        }
        for i, score in top_indices
    ]
    return jsonify(recommendations)

if __name__ == "__main__":
    app.run(port=5001)
