import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

SUPABASE_DB_URI = os.getenv("SUPABASE_DB_URI")
if not SUPABASE_DB_URI:
    print("Error: SUPABASE_DB_URI environment variable must be set.")
    sys.exit(1)

# Create engine
engine = create_engine(SUPABASE_DB_URI)

def clear_tables():
    print("Clearing existing data...")
    with engine.connect() as conn:
        with conn.begin():
            # Clear in correct order to respect foreign keys (if any)
            conn.execute(text("TRUNCATE TABLE villages CASCADE;"))
            conn.execute(text("TRUNCATE TABLE districts CASCADE;"))
            conn.execute(text("TRUNCATE TABLE fertilizer_types CASCADE;"))
            conn.execute(text("TRUNCATE TABLE crop_types CASCADE;"))
            conn.execute(text("TRUNCATE TABLE soil_types CASCADE;"))
    print("Data cleared.")

def seed_from_single_csv():
    print("Reading single CSV file...")
    try:
        df = pd.read_csv("final_soil_health_data.csv", usecols=['state', 'district', 'village', 'lat', 'long', 'n', 'p', 'k', 'ph'])
    except FileNotFoundError:
        print("Warning: final_soil_health_data.csv not found. Skipping seeding.")
        return
        
    print("Extracting and seeding unique districts...")
    # Extract unique state + district
    districts_df = df[['state', 'district']].drop_duplicates()
    districts_df = districts_df.rename(columns={
        "state": "state_name",
        "district": "district_name"
    })
    
    # Fill default values
    districts_df['default_n'] = 0.0
    districts_df['default_p'] = 0.0
    districts_df['default_k'] = 0.0
    districts_df['default_ph'] = 7.0
    
    districts_df.to_sql("districts", engine, if_exists="append", index=False, method="multi")
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, state_name, district_name FROM districts")).mappings()
        district_map = {(row['state_name'], row['district_name']): row['id'] for row in result}
        
    print("Seeding villages...")
    df['district_id'] = df.apply(
        lambda row: district_map.get((row['state'], row['district'])), axis=1
    )
    
    df = df.dropna(subset=['district_id'])
    
    villages_df = df[['district_id', 'state', 'village', 'lat', 'long', 'n', 'p', 'k', 'ph']].copy()
    villages_df = villages_df.rename(columns={
        "state": "state_name",
        "village": "village_name",
        "lat": "latitude",
        "long": "longitude"
    })
    villages_df['district_id'] = villages_df['district_id'].astype(int)
    
    chunk_size = 10000
    for i in range(0, len(villages_df), chunk_size):
        chunk = villages_df.iloc[i:i + chunk_size]
        chunk.to_sql("villages", engine, if_exists="append", index=False, method="multi")
        print(f"Processed chunk {i//chunk_size + 1}")
    print("Villages seeded successfully.")

def seed_fertilizer_types():
    print("Seeding fertilizer types...")
    fertilizers = [
        {"fertilizer_name": "Urea"},
        {"fertilizer_name": "DAP"},
        {"fertilizer_name": "28-28"},
        {"fertilizer_name": "14-35-14"},
        {"fertilizer_name": "20-20"},
        {"fertilizer_name": "17-17-17"},
        {"fertilizer_name": "10-26-26"}
    ]
    pd.DataFrame(fertilizers).to_sql("fertilizer_types", engine, if_exists="append", index=False, method="multi")
    print(f"Added {len(fertilizers)} fertilizer types.")

def seed_crop_and_soil_types():
    print("Seeding soil types...")
    soils = [
        {"id": 1, "soil_name": "Alluvial Soil"},
        {"id": 2, "soil_name": "Black Soil"},
        {"id": 3, "soil_name": "Red Soil"},
        {"id": 4, "soil_name": "Laterite Soil"},
        {"id": 5, "soil_name": "Desert Soil"},
        {"id": 6, "soil_name": "Mountain/Forest Soil"},
        {"id": 7, "soil_name": "Saline and Alkaline Soil"},
        {"id": 8, "soil_name": "Peaty and Marshy Soil"}
    ]
    pd.DataFrame(soils).to_sql("soil_types", engine, if_exists="append", index=False, method="multi")
    
    print("Seeding crop types...")
    crops = [
        {"id": 1, "crop_name": "Wheat"}, {"id": 2, "crop_name": "Rice"},
        {"id": 3, "crop_name": "Maize"}, {"id": 4, "crop_name": "Bajra"},
        {"id": 5, "crop_name": "Jowar"}, {"id": 6, "crop_name": "Barley"},
        {"id": 7, "crop_name": "Cotton"}, {"id": 8, "crop_name": "Sugarcane"},
        {"id": 9, "crop_name": "Soybean"}, {"id": 10, "crop_name": "Groundnut"},
        {"id": 11, "crop_name": "Mustard"}, {"id": 12, "crop_name": "Chickpea"},
        {"id": 13, "crop_name": "Pigeon Pea"}, {"id": 14, "crop_name": "Lentil"},
        {"id": 15, "crop_name": "Potato"}, {"id": 16, "crop_name": "Tomato"},
        {"id": 17, "crop_name": "Onion"}, {"id": 18, "crop_name": "Turmeric"},
        {"id": 19, "crop_name": "Chilli"}, {"id": 20, "crop_name": "Banana"}
    ]
    pd.DataFrame(crops).to_sql("crop_types", engine, if_exists="append", index=False, method="multi")
    print("Added soil and crop types.")

def main():
    clear_tables()
    seed_from_single_csv()
    seed_fertilizer_types()
    seed_crop_and_soil_types()

if __name__ == "__main__":
    main()
