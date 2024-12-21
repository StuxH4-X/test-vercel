const tableBody = document.getElementById("tableBody");
const proceedButton = document.getElementById("proceedButton");
const summarySection = document.getElementById("summarySection");

// Table Headers
const headers = [
    "E", "Course Name", "L", "T", "P", "C",
    "Name of the Instructors and Tutors", "Lecture", "Tutorial", "Lab", "HSS/BS elective"
];

function sortData() {
    tableData.sort((a, b) => {
        if (a.priority === -1 && b.priority !== -1) return 1; // `a` moves to the bottom
        if (b.priority === -1 && a.priority !== -1) return -1; // `b` moves to the bottom
        if (a.priority !== b.priority) return a.priority - b.priority; // Ascending priority
        if (b.searched !== a.searched) return b.searched - a.searched; // Searched rows (1 at top)
        return a.index - b.index; // Default index order
    });
}

// Function to toggle row selection
function toggleSelection(row) {
    if (row.priority > -1) {
        row.priority = -1; // Deselect row
    } else {
        const maxPriority = Math.max(...tableData.map(r => (r.priority > -1 ? r.priority : 0)));
        row.priority = maxPriority + 1; // Assign next priority
    }
    renderTable();
}

// Function to extract time slots (Lecture, Tutorial, Lab) from the JSON
function extractSlotsFromJSON(courseData) {
    const slotColumns = ["Lecture", "Tutorial", "Lab"];
    const slots = [];

    slotColumns.forEach(colName => {
        const cellContent = courseData[colName]?.trim();
        if (cellContent) {
            const slotMatch = cellContent.match(/[A-Z]\d+/g); // Regex to match time slots
            if (slotMatch) slots.push(...slotMatch);
        }
    });

    return slots;
}

// Function to render the table
function renderTable(isSummary = false) {
    sortData();

    const occupiedSlots = tableData
        .filter(row => row.priority > -1)
        .flatMap(row => extractSlotsFromJSON(row));

    tableBody.innerHTML = "";

    tableData.forEach(row => {
        if (isSummary && row.priority === -1) return; // Skip unselected rows in summary view

        const tr = document.createElement("tr");

        // Row click for selection (only for non-summary view)
        if (!isSummary) {
            tr.addEventListener("click", event => {
                if (event.target.type !== "checkbox") toggleSelection(row);
            });
        }

        // Render columns
        headers.forEach(key => {
            const td = document.createElement("td");

            if (isSummary && ["Lecture", "Tutorial", "Lab"].includes(key)) {
                // Make cells editable for specific columns
                td.contentEditable = true;
                td.textContent = row[key];
                td.addEventListener("blur", () => {
                    row[key] = td.textContent.trim(); // Update the data when editing is done
                    renderClashSummary(getOccupiedSlots()); // Recalculate clashes after editing
                });
            } else {
                td.textContent = row[key];
            }

            tr.appendChild(td);
        });

        // Visual feedback
        if (!isSummary && row.priority > -1) {
            tr.classList.add("highlight2");
        } else {
            tr.classList.remove("highlight2");
        }

        if (!isSummary && row.searched === 1) {
            tr.classList.add("highlight");
        } else {
            tr.classList.remove("highlight");
        }

        // Strike-through for conflicting rows
        const rowSlots = extractSlotsFromJSON(row);
        const hasClash = rowSlots.some(slot => occupiedSlots.includes(slot));
        if (hasClash && row.priority === -1 && !isSummary) {
            tr.classList.add("strike-through");
        } else {
            tr.classList.remove("strike-through");
        }

        tableBody.appendChild(tr);
    });

    if (isSummary) renderClashSummary(occupiedSlots);
}

function getOccupiedSlots() {
    return tableData
        .filter(row => row.priority > -1)
        .flatMap(row => extractSlotsFromJSON(row));
}

function renderClashSummary(occupiedSlots) {
    const selectedCourses = tableData.filter(row => row.priority > -1); // Only selected courses
    const clashes = [];

    // Compare each pair of selected courses to find clashes
    for (let i = 0; i < selectedCourses.length; i++) {
        for (let j = i + 1; j < selectedCourses.length; j++) {
            const course1 = selectedCourses[i];
            const course2 = selectedCourses[j];
            const slots1 = extractSlotsFromJSON(course1);
            const slots2 = extractSlotsFromJSON(course2);

            // Find intersecting slots
            const intersectingSlots = slots1.filter(slot => slots2.includes(slot));

            if (intersectingSlots.length > 0) {
                clashes.push({
                    course1: course1["Course Name"],
                    course2: course2["Course Name"],
                    slots: intersectingSlots
                });
            }
        }
    }

    // Render clash summary
    summarySection.innerHTML = `
        <h3>Clash Summary</h3>
        ${clashes.length > 0
            ? `<ul>${clashes.map(clash => `
                <li>
                    <strong>${clash.course1}</strong> clashes with <strong>${clash.course2}</strong> due to slots: 
                    <em>${clash.slots.join(", ")}</em>
                </li>
            `).join("")}</ul>`
            : "<p>No clashes detected among selected courses.</p>"
        }
    `;
}



// Function to handle search
function searchTable(query) {
    const lowerQuery = query.toLowerCase();

    tableData.forEach(row => {
        if (!query.trim()) {
            row.searched = 0;
        } else {
            const searchColumns = ["E", "Course Name", "Name of the Instructors and Tutors"];
            const isRelevant = searchColumns.some(key => {
                const cellValue = row[key];
                return typeof cellValue === "string" && cellValue.toLowerCase().includes(lowerQuery);
            });
            row.searched = isRelevant ? 1 : 0;
        }
    });

    renderTable();
}

// Reset search
function resetSearch() {
    document.getElementById("searchBar").value = "";
    tableData.forEach(row => (row.searched = 0));
    renderTable();
}

// Function to extract selected courses in JSON format
function extractSelectedCoursesAsJSON() {
    const selectedCourses = tableData
        .filter(row => row.priority > -1) // Filter for selected courses
        .map(row => {
            const selectedData = {}; // Object to store relevant course data
            headers.forEach(header => {
                selectedData[header] = row[header];
            });
            return selectedData;
        });

    return JSON.stringify(selectedCourses, null, 2); // Convert to JSON string
}

document.getElementById("exportButton").addEventListener("click", () => {
    const selectedCoursesJSON = extractSelectedCoursesAsJSON(); // Get selected courses JSON

    // Send data to the server
    fetch("/save_selected_courses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: selectedCoursesJSON,
    })
        .then(response => {
            if (response.ok) {
                window.location.href = "/timetable"; // Redirect to /timetable
            }
        })
        .catch(err => {
            console.error("Error saving courses:", err);
        });
});


// Proceed button click
proceedButton.addEventListener("click", () => {
    document.getElementById("searchSection").style.display = "none"; // Hide search bar
    document.getElementById("proceedButton").style.display = "none"; // Hide proceed button
    document.getElementById("summarySection").style.display = "block";
    document.getElementById("exportButton").style.display = "block";

    renderTable(true); // Render summary view
});

renderTable();


