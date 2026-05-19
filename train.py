import pandas as pd
from catboost import CatBoostClassifier

print("Loading data from uploaded CSVs...")
# Use read_excel instead of read_csv, and use your actual file names
df1 = pd.read_excel("Test Data 2 1.xlsx", sheet_name="Sheet1")
df2 = pd.read_excel("Test Data 1.xlsx", sheet_name="Sheet1")

# Combine them into one large dataset
df = pd.concat([df1, df2], ignore_index=True)

print(f"Total records loaded: {len(df)}")

# 2. Define the Target Variable
# We are trying to predict if 'Status in 2024-25' will become 'Dropout'
# Dropouts = 1, Promoted/Repeating = 0
# We drop the 200 rows where status is totally empty
df = df.dropna(subset=['Status in 2024-25'])
y = (df['Status in 2024-25'] == 'Dropout').astype(int)

# 3. Rename columns to match what our FastAPI backend expects
df = df.rename(columns={
    'Attendance % in 2023-24': 'attendance',
    'Learning Score in % in 2023-24': 'learning_score'
})

# Extract just the raw features we are currently using
X_raw = df[['learning_score', 'attendance']].copy()

# 4. Apply the exact Feature Engineering pipeline from the backend
def engineer_features(data: pd.DataFrame) -> pd.DataFrame:
    engineered = pd.DataFrame()
    engineered['learning_score'] = data['learning_score']
    engineered['attendance'] = data['attendance']
    engineered['attendance_score_interaction'] = data['attendance'] * data['learning_score']
    
    # Handle the NaN values (Your data has ~22,000 missing learning scores)
    engineered.fillna({
        'learning_score': engineered['learning_score'].median(),
        'attendance': engineered['attendance'].median(),
        'attendance_score_interaction': 0
    }, inplace=True)
    
    return engineered

print("Engineering features and handling missing data...")
X_processed = engineer_features(X_raw)

# 5. Initialize and Train the CatBoost Model
print("Training CatBoost Model... (This might take a minute)")
model = CatBoostClassifier(
    iterations=500,
    learning_rate=0.05,
    depth=6,
    eval_metric='F1',       
    auto_class_weights='Balanced', # Crucial: Balances the 10k dropouts vs 60k promoted
    verbose=50
)

model.fit(X_processed, y)

# 6. Save the Model
model.save_model("dropout_model_catboost.cbm")
print("\nSuccess! Model trained on real data and saved as 'dropout_model_catboost.cbm'")