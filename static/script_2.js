// Function to filter courses based on their half-semester type
function filterCoursesByHalf(selectedData, halfType) {
    return selectedData.filter(course => {
        const courseName = course["Course Name"];
        if (courseName.includes("First Half") && halfType === "First Half") {
            return true;
        }
        if (courseName.includes("Second Half") && halfType === "Second Half") {
            return true;
        }
        // Include non-half-semester courses in both halves
        return !courseName.includes("First Half") && !courseName.includes("Second Half");
    });
}

function mapCoursesToSlots(selectedData) {
    const slotMapping = {};

    selectedData.forEach(course => {
        ["Lecture", "Tutorial", "Lab"].forEach(type => {
            const slotsWithVenue = course[type]?.split("\n") || [];

            for (let i = 0; i < slotsWithVenue.length; i++) {
                const slotLine = slotsWithVenue[i].trim();
                const venueLine = slotsWithVenue[i + 1]?.trim();

                // Check if the next line is a venue (matches parenthesis pattern)
                const venueMatch = venueLine?.match(/^\((.*?)\)$/);
                const venue = venueMatch ? venueMatch[1].trim() : "No Venue";

                // Extract slots
                const slotMatch = slotLine.match(/[A-Z]\d+(?:,[A-Z]\d+)*/g);
                const slots = slotMatch
                    ? slotMatch[0].split(",").map(slot => slot.trim())
                    : [];

                if (slots.length > 0) {
                    // If a valid venue was found, skip the next line in the loop
                    if (venueMatch) i++;

                    // Map slots to courses
                    slots.forEach(slot => {
                        if (!slotMapping[slot]) {
                            slotMapping[slot] = [];
                        }
                        const courseName = course["Course Name"].replace(/\s*\(.*?\)\s*/g, "").trim();
                        slotMapping[slot].push(`${courseName} (${venue})`);
                    });
                }
            }
        });
    });

    console.log(slotMapping);
    return slotMapping;
}



// Function to render the table with conflict handling
function renderTableWithConflicts(data, slotMapping) {
    if (!Array.isArray(data) || !slotMapping) {
        console.warn("Invalid data or slot mapping!");
        return;
    }

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tr = document.createElement("tr");

        ["Slot", "M", "T", "W", "Th", "F"].forEach(key => {
            const td = document.createElement("td");
            const slot = row[key]?.trim();
           
            if (slot && slotMapping[slot]) {
                const courses = slotMapping[slot];

                if (courses.length > 1) {
                    console.log(courses)
                    td.innerHTML = courses
                        .map(course => `<div class="conflict-course">${course}</div>`)
                        .join("");
                    td.classList.add("conflict-cell");
                } else {
                    td.textContent = courses[0];
                }
            } else {
                td.textContent = row[key] || "";
            }

            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
}

// Ensure DOM is loaded before rendering
document.addEventListener("DOMContentLoaded", () => {
    if (typeof selectedData !== "undefined" && typeof timeSlotsData !== "undefined") {
        const firstHalfData = filterCoursesByHalf(selectedData, "First Half");
        const secondHalfData = filterCoursesByHalf(selectedData, "Second Half");

        const firstHalfSlotMapping = mapCoursesToSlots(firstHalfData);
        const secondHalfSlotMapping = mapCoursesToSlots(secondHalfData);

        // Default view is the first half
        renderTableWithConflicts(timeSlotsData, firstHalfSlotMapping);

        // Add buttons for switching
        const firstHalfButton = document.getElementById("firstHalfButton");
        const secondHalfButton = document.getElementById("secondHalfButton");

        firstHalfButton.addEventListener("click", () => {
            renderTableWithConflicts(timeSlotsData, firstHalfSlotMapping);
        });

        secondHalfButton.addEventListener("click", () => {
            renderTableWithConflicts(timeSlotsData, secondHalfSlotMapping);
        });
    } else {
        console.warn("Data not loaded!");
    }
});
