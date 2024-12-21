from flask import Flask, render_template
import pandas as pd

app = Flask(__name__)

# Path to the Excel file
FILE_PATH = "Timetable 2024-25, Sem-II.xlsx"

@app.route("/", methods=["GET"])
def index():
    try:
        # Read the Excel file
        df = pd.read_excel(FILE_PATH, sheet_name="Time table",na_filter=False)

        # Select specific columns
        selected_columns = [
            "E", "Course Name", "L", "T", "P", "C", 
            "Name of the Instructors and Tutors", "Lecture", "Tutorial", "Lab", "HSS/BS elective"
        ]
        df = df[selected_columns]

        # Remove rows with missing data
        df = df[df['Name of the Instructors and Tutors']!='' ]
        df['priority'] = -1
        df['searched'] = 0
        # Convert the dataframe to JSON for the frontend
        table_data = df.reset_index().to_dict(orient="records")

        return render_template("index.html", table_data=table_data)
    except Exception as e:
        return f"Error loading file: {e}", 500

