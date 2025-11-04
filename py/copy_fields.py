import pandas as pd
import json
import os
from openpyxl import load_workbook
from openpyxl.utils.dataframe import dataframe_to_rows

def copy_fields_from_json_to_excel():
    """
    Copy all fields from infotable.json to InfoTableDataFromGedcon.xlsx for matching names.
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
        
        # Standardize Excel column names to lowercase with underscores
        original_excel_columns = df_excel.columns.tolist()
        df_excel.columns = df_excel.columns.str.lower().str.replace(' ', '_').str.replace('.', '_')
        
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
        for idx, excel_row in df_excel.iterrows():
            excel_name = excel_row.get('name')  # Excel file has 'name' column after standardization
            
            if excel_name and excel_name in json_name_mapping:
                # Update the Excel row with data from JSON
                json_record = json_name_mapping[excel_name]
                
                # Update each field in the Excel row from the JSON record
                for field, value in json_record.items():
                    # Skip the 'id' field as it may cause conflicts
                    if field == 'id':
                        continue
                        
                    # Convert field name to match Excel format (from JSON lowercase with underscores to Excel format)
                    excel_field = field.replace('_', ' ')  # Convert underscores to spaces
                    excel_field = ' '.join(word.capitalize() for word in excel_field.split(' '))  # Title case
                    
                    # Try to find the closest matching column in the original Excel file
                    excel_col_name = None
                    for orig_col in original_excel_columns:
                        if orig_col.lower().replace(' ', '_').replace('.', '_') == field.lower():
                            excel_col_name = orig_col
                            break
                    
                    if excel_col_name and excel_col_name in df_excel.columns:
                        # Update the Excel dataframe with the value from JSON
                        df_excel.at[idx, excel_col_name.lower().replace(' ', '_').replace('.', '_')] = value
                    elif field in df_excel.columns:
                        # If the field exists in the standardized column names
                        df_excel.at[idx, field] = value
                    elif field == 'name':  # Already exists, skip
                        continue
                    else:
                        # Add new column if it doesn't exist
                        standardized_field = field.lower().replace(' ', '_').replace('.', '_')
                        df_excel[standardized_field] = df_excel.get(standardized_field, pd.NA)
                        df_excel.at[idx, standardized_field] = value
        
                updated_count += 1
                if updated_count <= 5:  # Only print first 5 updates for demonstration
                    print(f"Updated record for: {excel_name}")
        
        print(f"Updated {updated_count} records in Excel data")
        
        # Write the updated data back to the Excel file
        # Since we're using standardized column names, we need to convert back to original format
        output_df = df_excel.copy()
        
        # Rename columns back to original format
        column_mapping = {}
        for orig_col in original_excel_columns:
            standardized = orig_col.lower().replace(' ', '_').replace('.', '_')
            if standardized in output_df.columns:
                column_mapping[standardized] = orig_col
        
        output_df.rename(columns=column_mapping, inplace=True)
        
        # Save the updated Excel file
        output_file = 'data/InfoTableDataFromGedcon_Updated.xlsx'
        output_df.to_excel(output_file, index=False)
        print(f"Updated Excel file saved as: {output_file}")
        
    except Exception as e:
        print(f"Error occurred during field copy: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    copy_fields_from_json_to_excel()