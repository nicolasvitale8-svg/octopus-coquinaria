import pandas as pd
import json

try:
    df = pd.read_excel('presupuesto.xlsx')
    # Print the first few rows to understand structure
    print("Excel Structure:")
    print(df.head(20).to_string())
    
    # Try to find sheets
    xl = pd.ExcelFile('presupuesto.xlsx')
    print("\nSheet names:", xl.sheet_names)
    
except Exception as e:
    print(f"Error reading Excel: {e}")
