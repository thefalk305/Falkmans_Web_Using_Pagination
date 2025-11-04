import pandas as pd
import json
import os
from openpyxl import load_workbook
from openpyxl.utils.dataframe import dataframe_to_rows

def copy_fields_from_json_to_excel():
    """
    Copy all fields from infotable.json to InfoTableDataFromGedcon(_Updated).xlsx for matching names.
    """
    try:
        # Load the Excel file
        excel_file = 'data/InfoTableDataFromGedcon.xlsx'
        if not os.path.exists(excel_file):
            print(f"Excel file not found: {excel_file}")
            return

        # Load the JSON file
        json_file = 'data/infotable.json'
        if not os.path.exists(json_file):
            print(f"JSON file not found: {json_file}")
            return

        # Read the Excel file
        df_excel = pd.read_excel(excel_file)
        
        # Store original column names and create a standardized version for processing
        original_columns = df_excel.columns.tolist()
        standardized_columns = [col.lower().replace(' ', '_').replace('.', '_') for col in original_columns]
        
        # Update dataframe columns to standardized names for easier processing
        df_excel.columns = standardized_columns
        
        print(f"Excel file loaded with columns: {list(df_excel.columns)}")
        print(f"Excel records count: {len(df_excel)}")
        
        # Read the JSON file
        with open(json_file, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        
        print(f"JSON file loaded with records count: {len(json_data)}")
        
        # Create a mapping from JSON data by name
        json_name_mapping = {}
        for record in json_data:
            name = record.get('name')
            if name:
                json_name_mapping[name] = record
        
        print(f"Created name mapping for {len(json_name_mapping)} names from JSON")
        
        # For each record in the Excel file, update with matching JSON data
        updated_count = 0
        
        # Get all unique keys from JSON records to identify all possible fields
        all_json_fields = set()
        for record in json_data:
            all_json_fields.update(record.keys())
        
        # Add any new columns to the Excel dataframe if they don't exist
        for field in all_json_fields:
            standardized_field = field.lower().replace(' ', '_').replace('.', '_')
            if standardized_field not in df_excel.columns:
                df_excel[standardized_field] = pd.NA
                print(f"Added new column: {field}")
        
        # Update the data
        for idx, excel_row in df_excel.iterrows():
            excel_name = excel_row.get('name')  # Assuming 'name' column exists after standardization
            
            if excel_name and excel_name in json_name_mapping:
                # Update the Excel row with data from JSON
                json_record = json_name_mapping[excel_name]
                
                # Update each field in the Excel row from the JSON record
                for field, value in json_record.items():
                    standardized_field = field.lower().replace(' ', '_').replace('.', '_')
                    
                    if standardized_field in df_excel.columns:
                        # Update the specific cell
                        df_excel.at[idx, standardized_field] = value
                
                updated_count += 1
                if updated_count <= 5:  # Only print first 5 updates for demonstration
                    print(f"Updated record for: {excel_name}")
        
        print(f"Updated {updated_count} records in Excel data")
        
        # Rename columns back to original format where possible
        reverse_mapping = {}
        for orig, std in zip(original_columns, standardized_columns):
            reverse_mapping[std] = orig
        
        # Preserve original names where possible, but use standardized for new columns
        final_columns = []
        for col in df_excel.columns:
            if col in reverse_mapping:
                final_columns.append(reverse_mapping[col])
            else:
                final_columns.append(col)  # Keep new column names as standardized
        
        df_excel.columns = final_columns
        
        # Save the updated Excel file
        output_file = 'data/InfoTableDataFromGedcon_Updated.xlsx'
        df_excel.to_excel(output_file, index=False)
        print(f"Updated Excel file saved as: {output_file}")
        
    except Exception as e:
        print(f"Error occurred during field copy: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    copy_fields_from_json_to_excel()