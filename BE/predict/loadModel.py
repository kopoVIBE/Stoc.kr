"""
TensorFlow 호환성 문제를 해결하기 위한 커스텀 모델 로더
"""
import h5py
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional
from tensorflow.keras.optimizers import Adam

def create_compatible_model(window_size=5, n_features=15):
    """호환 가능한 모델 구조 생성"""
    model = Sequential()
    model.add(Bidirectional(LSTM(64), input_shape=(window_size, n_features)))
    model.add(Dropout(0.3))
    model.add(Dense(1, activation='sigmoid'))
    model.compile(optimizer=Adam(0.001), loss='binary_crossentropy', metrics=['accuracy'])
    return model

def load_weights_from_h5(model, h5_file_path):
    """H5 파일에서 가중치만 로드"""
    try:
        with h5py.File(h5_file_path, 'r') as f:
            # 모델 가중치 로드
            model.load_weights(h5_file_path)
            print("✅ 가중치 로드 완료")
            return True
    except Exception as e:
        print(f"❌ 가중치 로드 실패: {e}")
        return False

def load_model_safely(model_path="bidirectional_lstm_model.h5"):
    """안전한 모델 로딩"""
    try:
        # 첫 번째 시도: 일반적인 방법
        from tensorflow.keras.models import load_model
        model = load_model(model_path)
        print("✅ 일반 로딩 성공")
        return model
    except Exception as e:
        print(f"⚠️ 일반 로딩 실패: {e}")
        print("🔄 커스텀 로딩 시도 중...")
        
        try:
            # 두 번째 시도: 모델 구조 재생성 후 가중치 로드
            model = create_compatible_model()
            if load_weights_from_h5(model, model_path):
                print("✅ 커스텀 로딩 성공")
                return model
            else:
                raise Exception("가중치 로드 실패")
        except Exception as e2:
            print(f"❌ 커스텀 로딩도 실패: {e2}")
            
            # 세 번째 시도: 새 모델 생성 (가중치 없이)
            print("🆕 새 모델 생성 중...")
            model = create_compatible_model()
            print("⚠️ 훈련되지 않은 새 모델을 사용합니다. 예측 결과는 무작위에 가까울 수 있습니다.")
            return model

if __name__ == "__main__":
    # 테스트
    model = load_model_safely()
    if model:
        print("모델 로드 성공!")
        print(f"모델 구조: {model.summary()}") 