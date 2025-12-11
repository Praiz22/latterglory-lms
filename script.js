/**
 * LATTER GLORY ACADEMY RESULT SYSTEM
 * FINAL PRODUCTION VERSION: Integrated with students.json, Class Modal, and new Reg No format (LGA/YY/CLASS_ABBR/XXX)
 */

// 1. CONFIGURATION
const CONFIG = {
    adminKey: "latter25",
    resumptionDate: "2025-01-13", // Date for next term resumption
    currentTerm: "1st Term 2024/2025",
    maxSubjects: 18,
    sampleSubjects: [
        "English Language", "Mathematics", "N.V", "P.V.S", "B.S.T",
        "History", "Yoruba", "CRS", "C.C.A", "Chemistry", "Biology",
        "Physics", "Business-Studies", "Geography", "Computer-Practical",
        "Literature", "Government", "Civic Education", "Agric"
    ]
};

// 2. APP CONTROLLER (Data Loading and UI Management)
const app = {
    studentsDB: [], // This will hold the data from your students.json file
    selectedClass: null,

    init: async () => {
        app.setResumptionDate();
        app.setupEventListeners();
        scoreManager.init();
        
        // Update placeholder while loading
        document.getElementById('classSelectInput').innerHTML = '<option value="">-- Loading Classes... --</option>';
        document.getElementById('loadClassBtn').disabled = true;

        // --- CORE CHANGE: Load your students.json from GitHub/Local Folder ---
        try {
            const response = await fetch('students.json');
            if(response.ok) {
                app.studentsDB = await response.json();
                console.log(`[DB] Successfully loaded ${app.studentsDB.length} students from students.json.`);
                app.populateClassSelectModal(); // <--- DYNAMICALLY POPULATE CLASSES
            } else {
                console.warn("[DB] students.json not found or failed to load. Proceeding with manual entry option only.");
                document.getElementById('classSelectInput').innerHTML = '<option value="">-- Error: DB not loaded --</option>';
            }
        } catch (e) {
            console.error("[DB ERROR] Failed to fetch students.json:", e);
            document.getElementById('classSelectInput').innerHTML = '<option value="">-- Error: DB not loaded --</option>';
        }
        
        // Add initial subjects for a fresh result sheet
        scoreManager.addSubject('English Language');
        scoreManager.addSubject('Mathematics');
        
        // Pre-populate dropdowns for quick access
        app.populateCommentDropdowns();
    },

    verifyAdmin: () => {
        const key = document.getElementById("adminKeyInput").value.trim();
        if (key === CONFIG.adminKey) {
            document.getElementById("authModal").classList.add("d-none"); // Hide auth modal
            document.getElementById("classSelectModal").classList.remove("d-none"); // Show class modal
            app.setupClassModalEvents();
        } else {
            const err = document.getElementById("authError");
            err.classList.remove("d-none");
            setTimeout(() => err.classList.add("d-none"), 3000);
        }
    },
    
    // --- NEW FUNCTION: DYNAMICALLY POPULATE CLASS SELECT MODAL ---
    populateClassSelectModal: () => {
        const classSelect = document.getElementById('classSelectInput');
        
        // 1. Extract unique class names (JSS1, SSS3) from the database
        const uniqueClasses = [...new Set(app.studentsDB.map(s => s.class))];
        
        // 2. Sort them correctly (JSS1 < JSS2 < SSS1, etc.)
        const sortedClasses = uniqueClasses.sort((a, b) => {
             const getSortValue = (c) => {
                const parts = c.match(/([A-Z]+)(\d)/);
                if (parts) {
                    const type = parts[1]; 
                    const num = parseInt(parts[2]); 
                    const typeValue = type === 'JSS' ? 100 : 200; // JSS sorts before SSS
                    return typeValue + num;
                }
                return 999; 
            };
            return getSortValue(a) - getSortValue(b);
        });

        // 3. Populate the dropdown
        classSelect.innerHTML = '<option value="">-- Select Class --</option>';
        
        sortedClasses.forEach(classId => {
            // Convert 'JSS1' back to 'JSS 1' for display in the dropdown
            const displayClass = classId.replace(/(\w{3})(\d)/, '$1 $2');
            classSelect.add(new Option(displayClass, classId));
        });
        
        // Enable the load button if classes are available
        document.getElementById('loadClassBtn').disabled = sortedClasses.length === 0;
    },
    
    setupClassModalEvents: () => {
        const classSelect = document.getElementById('classSelectInput');
        const loadBtn = document.getElementById('loadClassBtn');
        
        classSelect.addEventListener('change', () => {
            loadBtn.disabled = classSelect.value === "";
        });
    },

    loadClassData: () => {
        const selectedClassValue = document.getElementById('classSelectInput').value;
        if (!selectedClassValue) return;

        // The stored format is JSS1, SSS3
        app.selectedClass = selectedClassValue; 
        
        // The displayed format is JSS 1, SSS 3
        const displayClass = selectedClassValue.replace(/(\w{3})(\d)/, '$1 $2');
        
        // Update the main form's class field
        document.getElementById('studentClass').value = displayClass;
        
        document.getElementById("classSelectModal").classList.add("d-none");
        document.getElementById("mainContent").classList.remove("d-none");
        
        // Filter DB and populate the dropdown
        app.populateRegNumberDropdown(app.selectedClass);
    },

    populateRegNumberDropdown: (className) => {
        const regSelect = document.getElementById('regNumberSelect');
        regSelect.innerHTML = '<option value="">Select Reg No...</option>';
        regSelect.disabled = true;

        // --- FILTER DATABASE BY SELECTED CLASS ---
        const filteredStudents = app.studentsDB.filter(s => s.class === className);
        
        if (filteredStudents.length > 0) {
            filteredStudents.sort((a, b) => a.regNumber.localeCompare(b.regNumber)); // Sort by Reg No
            filteredStudents.forEach(student => {
                const option = document.createElement('option');
                option.value = student.regNumber;
                option.textContent = `${student.regNumber} - ${student.name}`;
                regSelect.appendChild(option);
            });
            regSelect.disabled = false;
        } else {
            // Option for manual entry if no students exist in the DB for that class
            const option = document.createElement('option');
            option.value = "new_entry";
            option.textContent = `No students found for ${className.replace(/(\w{3})(\d)/, '$1 $2')}. Select for Manual Entry.`;
            regSelect.appendChild(option);
            regSelect.disabled = false;
            app.clearStudentData();
        }

        regSelect.removeEventListener('change', app.handleRegNumberChange);
        regSelect.addEventListener('change', app.handleRegNumberChange);
    },

    handleRegNumberChange: (e) => {
        const regNumber = e.target.value;
        if (regNumber === "" || regNumber === "new_entry") {
             app.clearStudentData();
             return;
        }
        
        // Find student based on regNumber selected from the dropdown
        const student = app.studentsDB.find(s => s.regNumber === regNumber);
        if (student) {
            app.fillStudentData(student);
        }
    },

    fillStudentData: (student) => {
        // Class name from the JSON is like 'JSS1', but we display 'JSS 1'
        const displayClass = student.class.replace(/(\w{3})(\d)/, '$1 $2');
        
        document.getElementById('studentClass').value = displayClass;
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentGender').value = student.gender;
        
        // Set photo source from the 'photo' field in the JSON
        if(student.photo) {
            // Assumes photo is in the 'student_images' folder
            document.getElementById('photoPreview').src = `student_images/${student.photo}`; 
        } else {
            // Placeholder for students without a photo path
            document.getElementById('photoPreview').src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; 
        }
        
        // Clear scores table for new student
        document.getElementById('subjectsBody').innerHTML = '';
        scoreManager.addSubject('English Language');
        scoreManager.addSubject('Mathematics');
    },

    clearStudentData: () => {
        document.getElementById('studentName').value = '';
        document.getElementById('studentGender').value = 'Male';
        
        // Class remains the selected class
        document.getElementById('studentClass').value = app.selectedClass.replace(/(\w{3})(\d)/, '$1 $2'); 
        
        document.getElementById('photoPreview').src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; 
        
        // Clear scores table for new entry
        document.getElementById('subjectsBody').innerHTML = '';
        scoreManager.addSubject('English Language');
        scoreManager.addSubject('Mathematics');
    },
    
    setResumptionDate: () => {
        const d = new Date(CONFIG.resumptionDate);
        document.getElementById('resumptionDateValue').textContent = d.toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
    },

    populateCommentDropdowns: () => {
        const teachers = document.getElementById('classTeacherComment');
        const principals = document.getElementById('principalComment');
        
        const tOptions = ["Excellent result. Keep it up!", "Good performance. Room for improvement.", "He is a good boy but plays too much.", "Needs to sit up and focus.", "An obedient student, with satisfactory results."];
        const pOptions = ["Outstanding performance. Promoted to next class.", "Promoted to next class.", "Advised to repeat the class.", "Good result.", "Satisfactory performance."];

        tOptions.forEach(o => teachers.add(new Option(o, o)));
        pOptions.forEach(o => principals.add(new Option(o, o)));
    },

    setupEventListeners: () => {
        document.getElementById('studentPhoto').addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => document.getElementById('photoPreview').src = e.target.result;
                reader.readAsDataURL(this.files[0]);
            }
        });

        document.getElementById('generateReportBtn').addEventListener('click', pdfGenerator.generatePreview);
        document.getElementById('savePdfBtn').addEventListener('click', pdfGenerator.savePDF);
    }
};

// 3. SCORE MANAGER (Handles all score calculations and grade assignments)
const scoreManager = {
    init: () => {},

    addSubject: (defaultName = '') => {
        const tbody = document.getElementById('subjectsBody');
        if (tbody.children.length >= CONFIG.maxSubjects) {
            alert("Maximum subjects reached!"); return;
        }

        const tr = document.createElement('tr');
        tr.className = "subject-row fade-in";
        tr.innerHTML = `
            <td>
                <select class="form-select form-select-sm subject-select custom-input">
                    <option value="">Select...</option>
                    ${CONFIG.sampleSubjects.map(s => `<option value="${s}" ${s === defaultName ? 'selected' : ''}>${s}</option>`).join('')}
                    <option value="other">Type Subject...</option>
                </select>
                <input type="text" class="form-control form-control-sm mt-1 d-none custom-subject" placeholder="Subject Name">
            </td>
            <td><input type="number" class="form-control form-control-sm ca-score custom-input" min="0" max="40"></td>
            <td><input type="number" class="form-control form-control-sm exam-score custom-input" min="0" max="60"></td>
            <td class="text-center fw-bold total-score">-</td>
            <td class="text-center fw-bold grade">-</td>
            <td class="text-center">
                <i class="fas fa-trash-alt text-danger" style="cursor:pointer" onclick="this.closest('tr').remove(); pdfGenerator.updateMetrics()"></i>
            </td>
        `;
        tbody.appendChild(tr);
        scoreManager.attachEvents(tr);
    },

    attachEvents: (row) => {
        const select = row.querySelector('.subject-select');
        const customInput = row.querySelector('.custom-subject');
        const inputs = row.querySelectorAll('input[type="number"]');

        select.addEventListener('change', () => {
            if(select.value === 'other') customInput.classList.remove('d-none');
            else customInput.classList.add('d-none');
            scoreManager.calculate(row);
        });
        customInput.addEventListener('input', () => scoreManager.calculate(row));
        inputs.forEach(inp => inp.addEventListener('input', () => scoreManager.calculate(row)));
    },

    calculate: (row) => {
        const ca = parseFloat(row.querySelector('.ca-score').value) || 0;
        const exam = parseFloat(row.querySelector('.exam-score').value) || 0;
        
        let total = ca + exam;
        if(total > 100) total = 100;

        let grade = 'F';
        if (total >= 75) grade = 'A';
        else if (total >= 65) grade = 'B';
        else if (total >= 50) grade = 'C';
        else if (total >= 40) grade = 'D';

        row.querySelector('.total-score').innerText = total;
        row.querySelector('.grade').innerText = grade;
        
        // Recalculate metrics when any score changes
        pdfGenerator.updateMetrics();
    }
};

// 4. PDF GENERATOR (Handles PDF creation and UI metrics)
const pdfGenerator = {
    // Helper function for aspect ratio scaling (ensures photo looks good)
    drawImageProp: (doc, img, x, y, w, h) => {
        if (!img || !img.width || !img.height) return;

        const imgRatio = img.width / img.height;
        const boxRatio = w / h;
        
        let newW, newH;

        if (imgRatio > boxRatio) {
            newW = w;
            newH = w / imgRatio;
        } else {
            newH = h;
            newW = h * imgRatio;
        }

        const offsetX = x + (w - newW) / 2;
        const offsetY = y + (h - newH) / 2;

        if (newW > 0 && newH > 0) {
            doc.addImage(img, 'JPEG', offsetX, offsetY, newW, newH);
        }
    },

    // Function to calculate metrics from score table (used for the PDF)
    calculateMetrics: () => {
        const rows = document.querySelectorAll('.subject-row');
        let totalScore = 0;
        let subjectsTaken = 0;
        let subjectsPassed = 0; 
        let subjectsFailed = 0; 
        let distinctions = 0;   

        rows.forEach(row => {
            const total = row.querySelector('.total-score').innerText;
            const grade = row.querySelector('.grade').innerText;

            if (total !== '-') {
                const numTotal = parseInt(total);
                totalScore += numTotal;
                subjectsTaken++;
                
                if (grade === 'A') {
                    distinctions++;
                    subjectsPassed++;
                } else if (['B', 'C', 'D'].includes(grade)) {
                    subjectsPassed++;
                } else if (grade === 'F') {
                    subjectsFailed++;
                }
            }
        });
        
        const average = subjectsTaken > 0 ? (totalScore / subjectsTaken).toFixed(1) : "0.0";

        return { totalScore, subjectsTaken, subjectsPassed, subjectsFailed, distinctions, average };
    },

    // Placeholder for metric update (not strictly needed for this file but good practice)
    updateMetrics: () => {
        // Recalculates metrics but doesn't update a separate UI element.
        // It's mainly used to trigger calculation before PDF generation.
    },

    createPDF: async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const red = [183, 28, 28]; // Brand Color
        const metrics = pdfGenerator.calculateMetrics();
        
        // --- 1. HEADER (Logo and school details) ---
        try {
            const logoImg = await pdfGenerator.loadImage('latter-glory logo.png');
            if(logoImg) {
                pdfGenerator.drawImageProp(doc, logoImg, 15, 10, 25, 25);
            }
        } catch(e) { console.warn("Logo file not accessible."); }

        doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...red);
        doc.text("LATTER GLORY ACADEMY", 45, 20);
        
        doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(0, 0, 0);
        doc.text("The Academy For Geniuses", 45, 26);
        doc.text("Tel: (+234) 8162873036 | Web: latter-glory.web.app", 45, 31);
        
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 40, 195, 40);

        // --- 2. STUDENT INFO (Bio Data) ---
        doc.setFillColor(248, 248, 248);
        doc.rect(15, 45, 180, 35, 'F');

        // Student Photo
        const photoEl = document.getElementById('photoPreview');
        if(photoEl.src && !photoEl.src.includes('base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=')) {
            try {
                const tempImg = await pdfGenerator.loadImage(photoEl.src);
                if(tempImg) {
                    pdfGenerator.drawImageProp(doc, tempImg, 160, 47.5, 30, 30);
                }
            } catch(e) {}
        }

        const name = document.getElementById('studentName').value.toUpperCase();
        const sClass = document.getElementById('studentClass').value;
        const reg = document.getElementById('regNumberSelect').value;
        const gender = document.getElementById('studentGender').value;

        doc.setFontSize(10).setFont("helvetica", "bold");
        doc.text("NAME:", 20, 55); doc.setFont("helvetica", "normal").text(name, 50, 55);
        doc.setFont("helvetica", "bold").text("CLASS:", 20, 62); doc.setFont("helvetica", "normal").text(sClass, 50, 62);
        doc.setFont("helvetica", "bold").text("GENDER:", 20, 69); doc.setFont("helvetica", "normal").text(gender, 50, 69);
        doc.setFont("helvetica", "bold").text("REG NO:", 90, 62); doc.setFont("helvetica", "normal").text(reg, 110, 62); 
        
        doc.setFont("helvetica", "bold").text("TERM:", 90, 69); 
        doc.setFont("helvetica", "normal").text(CONFIG.currentTerm, 110, 69);

        // --- 3. ACADEMIC TABLE & METRICS ---
        let y = 90;
        doc.setFillColor(...red);
        doc.rect(15, y, 180, 8, 'F');
        doc.setTextColor(255, 255, 255).setFont("helvetica", "bold");
        doc.text("SUBJECT", 20, y+5);
        doc.text("CA", 110, y+5);
        doc.text("EXAM", 130, y+5);
        doc.text("TOTAL", 150, y+5);
        doc.text("GRADE", 170, y+5);

        y += 8;
        doc.setTextColor(0, 0, 0).setFont("helvetica", "normal");
        
        const rows = document.querySelectorAll('.subject-row');
        

        rows.forEach((row, i) => {
            
            const select = row.querySelector('.subject-select');
            const customInput = row.querySelector('.custom-subject');
            let subName = select.value;

            if(select.value === 'other') {
                subName = customInput.value;
            }
            
            const ca = row.querySelector('.ca-score').value;
            const exam = row.querySelector('.exam-score').value;
            const total = row.querySelector('.total-score').innerText;
            const grade = row.querySelector('.grade').innerText;

            if(subName && total !== '-') {
                if(i % 2 !== 0) { doc.setFillColor(245, 245, 245); doc.rect(15, y, 180, 7, 'F'); }
                
                doc.text(subName, 20, y+5);
                doc.text(ca, 110, y+5);
                doc.text(exam, 130, y+5);
                doc.text(total, 150, y+5);
                doc.text(grade, 175, y+5);
                
                y += 7;
            }
        });

        // --- 4. PERFORMANCE METRICS GRID ---
        y += 5;
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(255, 255, 255);
        
        const boxY = y;
        const boxH = 15;
        const boxW = 35; 
        const startX = 20;
        const gap = 5;

        const drawMetric = (label, value, xPos, color = [0,0,0]) => {
            doc.setDrawColor(220, 220, 220);
            doc.setFillColor(250, 250, 250);
            doc.rect(xPos, boxY, boxW, boxH, 'FD');
            
            doc.setFontSize(7).setFont("helvetica", "bold").setTextColor(100, 100, 100);
            doc.text(label, xPos + boxW/2, boxY + 5, {align: 'center'});
            
            doc.setFontSize(11).setTextColor(...color);
            doc.text(String(value), xPos + boxW/2, boxY + 11, {align: 'center'});
        };

        drawMetric("TOTAL SUBJECTS", metrics.subjectsTaken, startX);
        drawMetric("PASSED (D & Above)", metrics.subjectsPassed, startX + boxW + gap, [0, 128, 0]); 
        drawMetric("FAILED (F)", metrics.subjectsFailed, startX + (boxW + gap)*2, [200, 0, 0]); 
        drawMetric("DISTINCTIONS (A)", metrics.distinctions, startX + (boxW + gap)*3, [0, 0, 200]); 
        drawMetric("AVG SCORE", metrics.average, startX + (boxW + gap)*4);

        y += 25; 

        // --- 5. REMARKS & SIGNATURES ---
        doc.setTextColor(0, 0, 0).setFontSize(10);
        
        doc.setFont("helvetica", "bold");
        doc.text("CLASS TEACHER'S REMARK:", 15, y);
        doc.setFont("helvetica", "normal");
        doc.text(document.getElementById('classTeacherComment').value, 80, y);
        
        y += 8;
        doc.setFont("helvetica", "bold");
        doc.text("PRINCIPAL'S REMARK:", 15, y);
        doc.setFont("helvetica", "normal");
        doc.text(document.getElementById('principalComment').value, 80, y);

        y += 8;
        doc.setFont("helvetica", "bold");
        doc.text("NEXT TERM BEGINS:", 15, y);
        doc.setFont("helvetica", "normal");
        doc.text(document.getElementById('resumptionDateValue').textContent, 80, y);

        // Signatures
        y += 25;
        doc.setDrawColor(0,0,0);
        doc.line(20, y, 70, y); doc.text("Teacher's Signature", 25, y+5);
        doc.line(130, y, 180, y); doc.text("Principal's Signature", 135, y+5);

        // Footer
        doc.setFontSize(8).setTextColor(150, 150, 150);
        doc.text("Generated by Latter Glory Academy Result System", 105, 290, {align: 'center'});

        return doc;
    },

    generatePreview: async () => {
        const btn = document.getElementById('generateReportBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        btn.disabled = true;
        
        try {
            const doc = await pdfGenerator.createPDF();
            const pdfData = doc.output('datauristring');
            const container = document.getElementById('reportPreview');
            container.classList.remove('d-none');
            container.innerHTML = `<iframe src="${pdfData}" width="100%" height="600px" style="border:none; border-radius: 8px;"></iframe>`;
        } catch (error) {
            console.error(error);
            alert("Error generating PDF. Check console.");
        }
        btn.innerHTML = originalText;
        btn.disabled = false;
    },

    savePDF: async () => {
        const btn = document.getElementById('savePdfBtn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;
        
        try {
            const doc = await pdfGenerator.createPDF();
            const name = document.getElementById('studentName').value || 'Student';
            doc.save(`${name.replace(/ /g, '_')}_Result.pdf`);
        } catch (error) {
            console.error(error);
            alert("Error saving PDF. Check console.");
        }
        
        btn.innerHTML = '<i class="fas fa-file-pdf me-2"></i> Save as PDF';
        btn.disabled = false;
    },

    loadImage: (url) => {
        return new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', app.init);
