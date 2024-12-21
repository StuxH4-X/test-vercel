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

selected_courses = []  # Global variable to store selected courses

@app.route("/save_selected_courses", methods=["POST"])
def save_selected_courses():
    global selected_courses
    try:
        # Parse the JSON data from the request
        selected_courses = json.loads(request.data)
        return "Success", 200
    except Exception as e:
        return f"Error saving courses: {e}", 500

@app.route("/timetable", methods=["GET"])
def timetable_page():
    global selected_courses
    try:
        # Read the Excel file for time slots
        df = pd.read_excel(FILE_PATH, sheet_name="Time Slots", na_filter=False, skiprows=[0, 5])

        # Convert the dataframe to JSON for the frontend
        time_slots_data = df.to_dict(orient="records")

        # Pass both datasets to the HTML template
        return render_template(
            "index2.html", 
            selected_data=selected_courses, 
            time_slots_data=time_slots_data
        )
    except Exception as e:
        return f"Error loading timetable: {e}", 500
