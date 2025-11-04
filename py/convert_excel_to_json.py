import pandas as pd
import json
import os

excel_file_path = "data/InfoTableDataFromGedcon.xlsx"
json_file_path = "data/infoTableData.json"

def convert_excel_to_json(excel_file_path, json_file_path):
    """
    Convert Excel file to JSON format similar to infotable.json
    """
    try:
        # Read the Excel file
        df = pd.read_excel(excel_file_path)
        
        # Print the columns to understand the structure
        print("Columns in the Excel file:")
        print(df.columns.tolist())
        
        # Standardize column names to lowercase and replace spaces with underscores
        df.columns = df.columns.str.lower().str.replace(' ', '_').str.replace('.', '_')
        
        # Print sample of the data
        print("\nSample of the data:")
        print(df.head())
        
        # Convert DataFrame to a list of dictionaries (records)
        records = df.to_dict(orient='records')
        
        # Process each record to match the infotable.json format
        processed_records = []
        for idx, record in enumerate(records):
            processed_record = {}
            
            for key, value in record.items():
                # Convert NaN values to None (which becomes null in JSON)
                if pd.isna(value):
                    processed_record[key] = None
                else:
                    # Try to convert to appropriate type
                    if isinstance(value, float) and value.is_integer():
                        processed_record[key] = int(value)
                    else:
                        processed_record[key] = value
            
            # Add an id field if it doesn't exist - using the index as a fallback
            if 'id' not in processed_record and 'info_id' not in processed_record:
                processed_record['id'] = idx + 1
                
            processed_records.append(processed_record)
        
        # Write the processed records to a JSON file
        with open(json_file_path, 'w', encoding='utf-8') as json_file:
            json.dump(processed_records, json_file, indent=2, ensure_ascii=False)
        
        print(f"\nSuccessfully converted {excel_file_path} to {json_file_path}")
        print(f"Total records processed: {len(processed_records)}")
        
    except Exception as e:
        print(f"Error occurred during conversion: {str(e)}")


def main():
    # Define file paths
    excel_file = "data/InfoTableDataFromGedcon.xlsx"
    json_file = "data/infoTableData.json"
    
    # Check if the Excel file exists
    if not os.path.exists(excel_file):
        print(f"Excel file not found: {excel_file}")
        print("Available files in data directory:")
        try:
            print(os.listdir("data"))
        except:
            print("Could not access data directory")
        return
    
    # Perform the conversion
    convert_excel_to_json(excel_file, json_file)


if __name__ == "__main__":
    main()