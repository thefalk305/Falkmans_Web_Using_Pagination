import pandas as pd
import json

def update_infotable_with_bios():
    """
    Update infotable.json by copying the 'bio' field from InfoTableDataFromGedcon.xlsx
    for matching names.
    """
    try:
        # Load the spreadsheet
        df = pd.read_excel('data/InfoTableDataFromGedcon.xlsx')
        
        # Standardize column names to lowercase and replace spaces with underscores
        df.columns = df.columns.str.lower().str.replace(' ', '_').str.replace('.', '_')
        
        # Create a mapping dictionary from the spreadsheet: name -> bio
        name_to_bio = {}
        for _, row in df.iterrows():
            name = row.get('name')
            bio = row.get('bio')
            
            # Only add to mapping if both name and bio exist
            if pd.notna(name) and pd.notna(bio):
                name_to_bio[str(name)] = str(bio)
        
        print(f"Created mapping for {len(name_to_bio)} names from the spreadsheet")
        
        # Load the infotable.json
        with open('data/infotable.json', 'r', encoding='utf-8') as f:
            infotable_data = json.load(f)
        
        print(f"Loaded {len(infotable_data)} records from infotable.json")
        
        # Update the bio field in infotable for matching names
        updated_count = 0
        for record in infotable_data:
            name = record.get('name')
            
            if name and name in name_to_bio:
                # Update the bio field with the value from the spreadsheet
                old_bio = record.get('bio')
                new_bio = name_to_bio[name]
                
                if old_bio != new_bio:
                    record['bio'] = new_bio
                    updated_count += 1
                    print(f"Updated bio for {name}: {old_bio} -> {new_bio}")
                else:
                    # Bio is the same, no need to update
                    pass
        
        print(f"Updated {updated_count} records in infotable.json")
        
        # Write the updated data back to infotable.json
        with open('data/infotable.json', 'w', encoding='utf-8') as f:
            json.dump(infotable_data, f, indent=2, ensure_ascii=False)
        
        print("Successfully updated infotable.json with bio data from the spreadsheet")
        
    except Exception as e:
        print(f"Error occurred during update: {str(e)}")


if __name__ == "__main__":
    update_infotable_with_bios()