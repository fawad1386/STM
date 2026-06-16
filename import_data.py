import requests
import pandas as pd
import json
from glob import glob
import os

# Configuration
API_URL = 'http://localhost:5000/api'
DATA_DIRECTORY = './data'  # Your analyzed CSV files directory

def import_single_dealership(csv_file):
    """Import a single dealership with all its reviews"""
    
    try:
        # Load CSV
        df = pd.read_csv(csv_file, encoding='unicode_escape')
        
        # Extract dealership name from filename
        dealership_name = os.path.basename(csv_file).replace('_analyzed.csv', '').replace('.csv', '')
        dealership_name = dealership_name.replace('_', ' ')
        
        print(f"\nProcessing: {dealership_name}")
        print(f"Total reviews: {len(df)}")
        
        # Calculate statistics
        if 'predicted_sentiment' in df.columns and 'predicted_label' in df.columns:
            trust_score = df['predicted_sentiment'].mean()
            positive_count = int(sum(df['predicted_label'] == 1))
            negative_count = int(sum(df['predicted_label'] == 0))
        else:
            print(f"Warning: No prediction columns found in {csv_file}")
            trust_score = 0.5
            positive_count = 0
            negative_count = 0
        
        # Prepare dealership data
        dealership_data = {
            'name': dealership_name,
            'location': 'Lahore, Pakistan',
            'totalReviews': len(df),
            'overallTrustScore': float(trust_score),
            'positiveCount': positive_count,
            'negativeCount': negative_count,
            'aspects': {}
        }
        
        # Create dealership
        response = requests.post(
            f'{API_URL}/admin/bulk-import',
            json={'dealerships': [dealership_data]},
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Created dealership: {dealership_name}")
            print(f"  Trust Score: {trust_score:.3f}")
            print(f"  Positive: {positive_count}, Negative: {negative_count}")
            
            # Get dealership ID
            dealership_id = result.get('data', {}).get('_id')
            
            if dealership_id:
                # Import reviews
                import_reviews(dealership_id, dealership_name, df)
            
            return True
        else:
            print(f"✗ Error creating dealership: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Error processing {csv_file}: {str(e)}")
        return False

def import_reviews(dealership_id, dealership_name, df):
    """Import reviews for a dealership"""
    
    text_column = 'wiI7pd' if 'wiI7pd' in df.columns else 'review_text'
    
    if text_column not in df.columns:
        print("  Warning: No review text column found")
        return
    
    reviews_imported = 0
    
    for idx, row in df.iterrows():
        try:
            review_text = str(row[text_column])
            
            if pd.isna(review_text) or len(review_text) < 10:
                continue
            
            review_data = {
                'dealershipId': dealership_id,
                'dealershipName': dealership_name,
                'reviewText': review_text,
                'predictedSentiment': float(row.get('predicted_sentiment', 0.5)),
                'predictedLabel': int(row.get('predicted_label', 0)),
                'userSubmitted': False
            }
            
            response = requests.post(
                f'{API_URL}/feedback',
                json=review_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                reviews_imported += 1
            
            # Progress indicator
            if (idx + 1) % 50 == 0:
                print(f"  Imported {idx + 1}/{len(df)} reviews...")
                
        except Exception as e:
            continue
    
    print(f"  ✓ Imported {reviews_imported} reviews")

def import_all_dealerships():
    """Import all dealership CSV files"""
    
    print("="*70)
    print("SMART TRUST METER - DATA IMPORT")
    print("="*70)
    
    # Find all analyzed CSV files
    csv_files = glob(os.path.join(DATA_DIRECTORY, '*_analyzed.csv'))
    
    if not csv_files:
        csv_files = glob(os.path.join(DATA_DIRECTORY, '*.csv'))
    
    if not csv_files:
        print(f"\nNo CSV files found in {DATA_DIRECTORY}")
        print("Please ensure your analyzed CSV files are in the data directory")
        return
    
    print(f"\nFound {len(csv_files)} CSV files")
    
    # Test API connection
    try:
        response = requests.get(f'{API_URL}/health')
        if response.status_code != 200:
            print("\n✗ Error: Backend API is not responding")
            print("Please make sure the backend server is running on http://localhost:5000")
            return
    except:
        print("\n✗ Error: Cannot connect to backend API")
        print("Please start the backend server first:")
        print("  cd backend && npm start")
        return
    
    print("✓ Backend API connected")
    
    # Import each dealership
    success_count = 0
    
    for csv_file in csv_files:
        if import_single_dealership(csv_file):
            success_count += 1
    
    # Summary
    print("\n" + "="*70)
    print("IMPORT COMPLETE")
    print("="*70)
    print(f"Successfully imported: {success_count}/{len(csv_files)} dealerships")
    
    if success_count > 0:
        print("\nYou can now view the imported data in the Smart Trust Meter dashboard.")