import pandas as pd
import json

def analyze_excel(file_path):
    try:
        df_dict = pd.read_excel(file_path, sheet_name=None)
        analysis = {}
        for sheet_name, df in df_dict.items():
            analysis[sheet_name] = {
                "columns": list(df.columns),
                "num_rows": len(df),
                "sample_data": df.head(5).to_dict(orient='records')
            }
        
        def json_serial(obj):
            if isinstance(obj, (pd.Timestamp, pd.datetime, datetime.date, datetime.datetime)):
                return obj.isoformat()
            raise TypeError ("Type %s not serializable" % type(obj))

        with open('excel_analysis.json', 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=4, ensure_ascii=False, default=str)
        print("Analysis completed and saved to excel_analysis.json")
    except Exception as e:
        print(f"Error during analysis: {e}")

if __name__ == "__main__":
    analyze_excel('presupuesto.xlsx')
