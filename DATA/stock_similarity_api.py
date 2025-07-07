from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import json
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# JSON 파일 로드
with open("stocks_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)
df = pd.DataFrame(data)

feature_cols = [
    'eps_std', 'per_std', 'forward_eps_std', 'forward_per_std',
    'bps_std', 'pbr_std', 'dividend_per_share_std', 'dividend_yield_std',
    'market_cap_std', 'beta', 'return_1y_percent', 'return_volatility'
]
X = df[feature_cols].values
cos_sim = cosine_similarity(X)

@app.route("/recommend", methods=["GET"])
def recommend():
    stock_name = request.args.get("stock_name")
    if stock_name not in df['stock_name'].values:
        return jsonify({"error": "Stock not found"}), 404

    target_index = df[df['stock_name'] == stock_name].index[0]
    target_industry = df.loc[target_index, 'industry_type']

    raw_scores = cos_sim[target_index]
    adjusted_scores = []
    for i, score in enumerate(raw_scores):
        if i == target_index: continue
        weight = 1.0 if df.loc[i, 'industry_type'] == target_industry else 0.8
        adjusted_scores.append((i, score * weight))

    top_indices = sorted(adjusted_scores, key=lambda x: x[1], reverse=True)[:5]
    recommendations = [
        {
            "name": df.loc[i, 'stock_name'],
            "ticker": df.loc[i, 'stock_id'],
            "similarity": round(score, 5),
            "industry": df.loc[i, 'industry_type']
        }
        for i, score in top_indices
    ]
    return jsonify(recommendations)

if __name__ == "__main__":
    app.run(port=5001)
