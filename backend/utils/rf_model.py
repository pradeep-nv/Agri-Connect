import sys
import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import os

def train_and_predict(input_data):
    # Path to your CSV
    base_path = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_path, '../../data_core.csv')
    
    if not os.path.exists(csv_path):
        return {"error": f"CSV file not found at {csv_path}"}

    try:
        # Load data
        df = pd.read_csv(csv_path)
        
        # Features: Nitrogen, Phosphorous, Potassium, Temparature, Humidity, Moisture
        features = ['Nitrogen', 'Phosphorous', 'Potassium', 'Temparature', 'Humidity', 'Moisture']
        
        # Filter only necessary columns and drop rows with missing values in them
        df = df[features + ['Crop Type', 'Fertilizer Name']].dropna()
        
        # Encode targets
        le_crop = LabelEncoder()
        le_fert = LabelEncoder()
        
        df['CropEncoded'] = le_crop.fit_transform(df['Crop Type'])
        df['FertEncoded'] = le_fert.fit_transform(df['Fertilizer Name'])
        
        X = df[features]
        y_crop = df['CropEncoded']
        y_fert = df['FertEncoded']
        
        # Initialize Random Forest models
        model_crop = RandomForestClassifier(n_estimators=100, random_state=42)
        model_fert = RandomForestClassifier(n_estimators=100, random_state=42)
        
        # Training
        model_crop.fit(X, y_crop)
        model_fert.fit(X, y_fert)
        
        # Prepare input
        test_df = pd.DataFrame([{
            'Nitrogen': float(input_data.get('N', 0)),
            'Phosphorous': float(input_data.get('P', 0)),
            'Potassium': float(input_data.get('K', 0)),
            'Temparature': float(input_data.get('temp', 0)),
            'Humidity': float(input_data.get('humi', 0)),
            'Moisture': float(input_data.get('moist', 0))
        }])
        
        # Predict
        crop_pred = model_crop.predict(test_df)
        fert_pred = model_fert.predict(test_df)
        
        # Decode results
        return {
            "crop": le_crop.inverse_transform(crop_pred)[0],
            "fertilizer": le_fert.inverse_transform(fert_pred)[0]
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    try:
        # Read from stdin
        input_data = json.load(sys.stdin)
        result = train_and_predict(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Main execution error: {str(e)}"}))
