const subjectCredits = {
  Physics: 4, Mathematics: 3, CPPS: 4, ECE: 3, EGDT: 3,
  Biology: 2, CTS: 3, Chemistry: 4, "Mechanical Engineering": 3,
  "Electrical Engineering": 3, Mechanics: 2, "Technical English": 2
};
const specialTotalOnly = ["Biology", "CTS", "Technical English"];
const specialFinal60 = ["EGDT"];

let subjects = JSON.parse(localStorage.getItem("subjects")) || [];
let savedSemesters = JSON.parse(localStorage.getItem("savedSemesters")) || [];

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.body.classList.add("dark");
}
document.getElementById("toggleDarkMode").onclick = () =>
  document.body.classList.toggle("dark");

function handleSubjectChange() {
  const subject = document.getElementById("subjectDropdown").value;
  const isTotalOnly = specialTotalOnly.includes(subject);
  const isFinal60 = specialFinal60.includes(subject);

  document.getElementById("internalGroup").style.display = isTotalOnly ? "none" : "block";
  document.getElementById("finalGroup").style.display = isTotalOnly ? "none" : "block";
  document.getElementById("totalGroup").style.display = isTotalOnly ? "block" : "none";

  document.getElementById("finalLabel").innerText =
    isFinal60 ? "Final Exam (out of 60)" : "Final Exam (out of 100)";
  document.getElementById("finalMarks").max = isFinal60 ? 60 : 100;
}

function getGradePoint(score) {
  return score >= 90 ? 10 :
         score >= 80 ? 9 :
         score >= 70 ? 8 :
         score >= 60 ? 7 :
         score >= 50 ? 6 :
         score >= 40 ? 5 : 0;
}

function addSubject() {
  const subj = document.getElementById("subjectDropdown").value;
  if (!subj) return alert("Select a subject.");

  let totalScore;
  if (specialTotalOnly.includes(subj)) {
    const total = +document.getElementById("totalMarks").value;
    if (isNaN(total) || total < 0 || total > 100)
      return alert("Enter valid total marks.");
    totalScore = total;
  } else {
    const internal = +document.getElementById("internalMarks").value;
    const final = +document.getElementById("finalMarks").value;
    if (isNaN(internal) || isNaN(final))
      return alert("Enter all marks correctly.");
    if (internal < 0 || internal > 60 ||
        final < 0 || final > (specialFinal60.includes(subj) ? 60 : 100))
      return alert("Marks out of bounds.");

    const scaledFinal = specialFinal60.includes(subj)
      ? (final / 60) * 40
      : (final / 100) * 40;

    totalScore = +(internal + scaledFinal).toFixed(2);
  }

  
  const credits = subjectCredits[subj];
  const gp = getGradePoint(totalScore);
  subjects.push({ subj, credits, totalScore, gp });
  updateStorage();
  renderTable();
  resetForm();

  if (subjects.length > 0) {
     document.getElementById("calcBtn").style.display = "inline-block";
    }

}

function renderTable() {
  const tbody = document.querySelector("#subjectsTable tbody");
  tbody.innerHTML = "";
  subjects.forEach((s, i) => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${s.subj}</td>
      <td>${s.credits}</td>
      <td>${s.totalScore}</td>
      <td>${s.gp}</td>
      <td>
        <button class="edit-btn" onclick="editSubject(${i})">
          <i class='bx bx-edit'></i>
        </button>
        <button class="delete-btn" onclick="deleteSubject(${i})">
          <i class='bx bx-trash'></i>
        </button>
      </td>`;
  });
  document.getElementById("subjectsTable").style.display = subjects.length ? "table" : "none";
}

function editSubject(i) {
  const s = subjects[i];
  document.getElementById("subjectDropdown").value = s.subj;
  handleSubjectChange();
  if (specialTotalOnly.includes(s.subj)) {
    document.getElementById("totalMarks").value = s.totalScore;
  } else {
    // Cannot perfectly reverse internal/final from totalScore; skip
    document.getElementById("internalMarks").value = "";
    document.getElementById("finalMarks").value = "";
  }
  subjects.splice(i, 1);
  updateStorage();
  renderTable();
}

function deleteSubject(i) {
  subjects.splice(i, 1);
  updateStorage();
  renderTable();
}

function calculateSGPA() {
  if (!subjects.length) return alert("Add subjects first.");
  let totalCredits = 0, totalPoints = 0;
  subjects.forEach(s => {
    totalCredits += s.credits;
    totalPoints += s.credits * s.gp;
  });
  document.getElementById("sgpaResult").innerText = `This Semester SGPA: ${(totalPoints / totalCredits).toFixed(2)}`;
  document.getElementById("saveBtn").style.display = "inline-block";
  document.getElementById("exportGroup").style.display = "flex";

}

function saveSemester() {
  if (!subjects.length) return alert("Add subjects first.");
  let totalCredits = 0, totalPoints = 0;
  subjects.forEach(s => {
    totalCredits += s.credits;
    totalPoints += s.credits * s.gp;
  });
  const semName = prompt("Label this semester:", "Semester " + (savedSemesters.length + 1));
  savedSemesters.push({ name: semName, sgpa: totalPoints / totalCredits, credits: totalCredits });
  subjects = [];
  updateStorage();
  renderTable();
  document.getElementById("sgpaResult").innerText = "";
  updateCGPA();
}

function updateCGPA() {
  if (!savedSemesters.length) return;
  let totalCredits = 0, totalPoints = 0;
  savedSemesters.forEach(s => {
    totalCredits += s.credits;
    totalPoints += s.credits * s.sgpa;
  });
  const cgpa = (totalPoints / totalCredits).toFixed(2);
  document.getElementById("cgpaResult").innerHTML =
    `Cumulative CGPA: ${cgpa}<br>` +
    savedSemesters.map(s => `${s.name}: ${s.sgpa.toFixed(2)}`).join("<br>");
}

function exportTable(type) {
  if (!subjects.length) return alert("Add subjects first.");

  let totalCredits = 0, totalPoints = 0;
  subjects.forEach(s => {
    totalCredits += s.credits;
    totalPoints += s.credits * s.gp;
  });
  const sgpa = (totalPoints / totalCredits).toFixed(2);

  let cgpa = "";
  if (savedSemesters.length) {
    let allCredits = 0, allPoints = 0;
    savedSemesters.forEach(s => {
      allCredits += s.credits;
      allPoints += s.credits * s.sgpa;
    });
    cgpa = (allPoints / allCredits).toFixed(2);
  }

  if (type === "pdf") {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("SGPA Report", 20, 20);

    const tableBody = subjects.map(s => [
      s.subj, s.credits, s.totalScore, s.gp
    ]);

    tableBody.push(["", "", "SGPA", sgpa]);
    if (cgpa) tableBody.push(["", "", "CGPA", cgpa]);

    doc.autoTable({
      head: [["Subject", "Credits", "Total Marks", "Grade Point"]],
      body: tableBody,
      startY: 30
    });

    doc.save("SGPA_Report.pdf");
  }

  else if (type === "excel") {
    const tempTable = document.createElement("table");
    const head = document.querySelector("#subjectsTable thead").cloneNode(true);
    const body = document.querySelector("#subjectsTable tbody").cloneNode(true);
    tempTable.appendChild(head);
    tempTable.appendChild(body);

    [...tempTable.querySelectorAll("tr")].forEach(row => {
      row.removeChild(row.children[4]);
    });

    const sgpaRow = tempTable.insertRow();
    sgpaRow.insertCell(0).innerText = "";
    sgpaRow.insertCell(1).innerText = "";
    sgpaRow.insertCell(2).innerText = "SGPA";
    sgpaRow.insertCell(3).innerText = sgpa;

    if (cgpa) {
      const cgpaRow = tempTable.insertRow();
      cgpaRow.insertCell(0).innerText = "";
      cgpaRow.insertCell(1).innerText = "";
      cgpaRow.insertCell(2).innerText = "CGPA";
      cgpaRow.insertCell(3).innerText = cgpa;
    }

    const wb = XLSX.utils.table_to_book(tempTable);
    XLSX.writeFile(wb, "SGPA_Report.xlsx");
  }
}

function clearAllData() {
  if (confirm("Clear all data?")) {
    subjects = [];
    savedSemesters = [];
    updateStorage();
    renderTable();
    document.getElementById("sgpaResult").innerText = "";
    document.getElementById("cgpaResult").innerText = "";
    location.reload(); // refresh the page after clearing data
  }
}

function exportDataJSON() {
  const data = { subjects, savedSemesters };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sgpa_data.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importDataJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const { subjects: subj, savedSemesters: sems } = JSON.parse(e.target.result);
      subjects = subj || [];
      savedSemesters = sems || [];
      updateStorage();
      renderTable();
      updateCGPA();
    } catch {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function updateStorage() {
  localStorage.setItem("subjects", JSON.stringify(subjects));
  localStorage.setItem("savedSemesters", JSON.stringify(savedSemesters));
}

function resetForm() {
  document.getElementById("subjectDropdown").selectedIndex = 0;
  document.getElementById("internalMarks").value = "";
  document.getElementById("finalMarks").value = "";
  document.getElementById("totalMarks").value = "";
  handleSubjectChange();
}

window.onload = () => {
  renderTable();
  updateCGPA();
};

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}
function toggleDarkMode() {
  document.body.classList.toggle("dark");
}
