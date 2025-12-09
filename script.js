/**
 * LATTER GLORY ACADEMY RESULT SYSTEM
 * Modularized Architecture
 */

// 1. CONFIGURATION
const CONFIG = {
    adminKey: "latter25",
    resumptionDate: "2025-09-15",
    maxSubjects: 18,
    sampleSubjects: [
        "English Language", "Mathematics", "N.V", "P.V.S", "B.S.T",
        "History", "Yoruba", "CRS", "C.C.A", "Chemistry", "Biology",
        "Physics", "Business-Studies", "Geography", "Computer-Practical",
        "Literature", "Government", "Civic Education", "Agric"
    ]
};

// 2. APP CONTROLLER
const app = {
    studentsDB: [],

    init: async () => {
        app.setResumptionDate();
        app.setupEventListeners();
        scoreManager.init();
        
        // Load Archive Database
        try {
            const response = await fetch('students.json');
            if(response.ok) {
                app.studentsDB = await response.json();
                app.populateArchiveDropdown();
            } else {
                console.warn("students.json not found.");
            }
        } catch (e) {
            console.log("Running in static mode without database server.");
        }
        
        // Add default subjects
        scoreManager.addSubject('English Language');
        scoreManager.addSubject('Mathematics');
    },

    verifyAdmin: () => {
        const key = document.getElementById("adminKeyInput").value.trim();
        if (key === CONFIG.adminKey) {
            document.getElementById("authModal").style.display = "none";
            document.getElementById("mainContent").classList.remove("d-none");
        } else {
            const err = document.getElementById("authError");
            err.classList.remove("d-none");
            setTimeout(() => err.classList.add("d-none"), 3000);
        }
    },

    setResumptionDate: () => {
        const d = new Date(CONFIG.resumptionDate);
        document.getElementById('resumptionDateValue').textContent = d.toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
    },

    populateArchiveDropdown: () => {
        const select = document.getElementById('archiveSelect');
        app.studentsDB.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.class})`;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            const id = e.target.value;
            if(id) app.loadStudentProfile(id);
        });
    },

    loadStudentProfile: (id) => {
        const student = app.studentsDB.find(s => s.id == id);
        if(!student) return;

        document.getElementById('studentName').value = student.name;
        document.getElementById('studentClass').value = student.class;
        document.getElementById('studentGender').value = student.gender;
        document.getElementById('regNumber').value = student.regNumber;
        
        // Load Image from Folder
        if(student.photo) {
            document.getElementById('photoPreview').src = `student_images/${student.photo}`;
        }
    },

    setupEventListeners: () => {
        // Photo Upload Preview
        document.getElementById('studentPhoto').addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => document.getElementById('photoPreview').src = e.target.result;
                reader.readAsDataURL(this.files[0]);
            }
        });

        // Populate Comments
        const teachers = document.getElementById('classTeacherComment');
        const principals = document.getElementById('principalComment');
        
        const tOptions = ["Excellent result.", "Good performance.", "Can do better.", "Needs to sit up."];
        const pOptions = ["Outstanding performance.", "Promoted to next class.", "Advised to repeat.", "Good result."];

        tOptions.forEach(o => teachers.add(new Option(o, o)));
        pOptions.forEach(o => principals.add(new Option(o, o)));

        // PDF Buttons
        document.getElementById('generateReportBtn').addEventListener('click', pdfGenerator.generatePreview);
        document.getElementById('savePdfBtn').addEventListener('click', pdfGenerator.savePDF);
    }
};

// 3. SCORE MANAGER
const scoreManager = {
    init: () => {
        // any specific score init
    },

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
                <i class="fas fa-trash-alt text-danger" style="cursor:pointer" onclick="this.closest('tr').remove()"></i>
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
        });

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
    }
};

// 4. PDF GENERATOR
const pdfGenerator = {
    createPDF: async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const red = [183, 28, 28]; // #b71c1c
        
        // --- Header ---
        // Logo
        try {
            const logoImg = await pdfGenerator.loadImage('latter-glory logo.png');
            if(logoImg) doc.addImage(logoImg, 'PNG', 15, 10, 25, 25);
        } catch(e) { console.log("Logo not found"); }

        // School Text
        doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...red);
        doc.text("LATTER GLORY ACADEMY", 45, 20);
        
        doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(0, 0, 0);
        doc.text("The Academy For Geniuses", 45, 26);
        doc.text("Tel: (+234) 8162873036 | Web: latter-glory.web.app", 45, 31);
        
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 40, 195, 40);

        // --- Bio Data & Photo ---
        // Box Background
        doc.setFillColor(248, 248, 248);
        doc.rect(15, 45, 180, 35, 'F');

        // Student Photo
        const photoEl = document.getElementById('photoPreview');
        if(photoEl.src && !photoEl.src.includes('base64,R0lGODlh')) {
            try {
                // If local file path, we need to convert to canvas first to avoid CORS in some PDF viewers
                // But since we are likely on local/netlify, we try direct add
                doc.addImage(photoEl.src, 'JPEG', 160, 47, 30, 31); 
            } catch(e) {
                 // Fallback: If it's an external URL (GitHub) it might fail without proxy
                 // Just continue without image
            }
        }

        const name = document.getElementById('studentName').value.toUpperCase();
        const sClass = document.getElementById('studentClass').value;
        const reg = document.getElementById('regNumber').value;
        const gender = document.getElementById('studentGender').value;

        doc.setFontSize(10).setFont("helvetica", "bold");
        doc.text("NAME:", 20, 55); doc.setFont("helvetica", "normal").text(name, 50, 55);
        doc.setFont("helvetica", "bold").text("CLASS:", 20, 62); doc.setFont("helvetica", "normal").text(sClass, 50, 62);
        doc.setFont("helvetica", "bold").text("GENDER:", 20, 69); doc.setFont("helvetica", "normal").text(gender, 50, 69);
        doc.setFont("helvetica", "bold").text("REG NO:", 90, 62); doc.setFont("helvetica", "normal").text(reg, 110, 62);
        doc.setFont("helvetica", "bold").text("TERM:", 90, 69); doc.setFont("helvetica", "normal").text("3RD TERM 2024/25", 110, 69);

        // --- Table ---
        let y = 90;
        // Table Header
        doc.setFillColor(...red);
        doc.rect(15, y, 180, 8, 'F');
        doc.setTextColor(255, 255, 255).setFont("helvetica", "bold");
        doc.text("SUBJECT", 20, y+5);
        doc.text("CA", 110, y+5);
        doc.text("EXAM", 130, y+5);
        doc.text("TOTAL", 150, y+5);
        doc.text("GRADE", 170, y+5);

        // Table Rows
        y += 8;
        doc.setTextColor(0, 0, 0).setFont("helvetica", "normal");
        
        const rows = document.querySelectorAll('.subject-row');
        let totalScore = 0;
        let subjectCount = 0;

        rows.forEach((row, i) => {
            if(i % 2 !== 0) { doc.setFillColor(245, 245, 245); doc.rect(15, y, 180, 7, 'F'); }
            
            const select = row.querySelector('.subject-select');
            const subName = select.value === 'other' ? row.querySelector('.custom-subject').value : select.value;
            const ca = row.querySelector('.ca-score').value;
            const exam = row.querySelector('.exam-score').value;
            const total = row.querySelector('.total-score').innerText;
            const grade = row.querySelector('.grade').innerText;

            if(subName && total !== '-') {
                doc.text(subName, 20, y+5);
                doc.text(ca, 110, y+5);
                doc.text(exam, 130, y+5);
                doc.text(total, 150, y+5);
                doc.text(grade, 175, y+5); // Adjusted X for center alignment visually
                y += 7;
                totalScore += parseInt(total);
                subjectCount++;
            }
        });

        // --- Summary & Remarks ---
        y += 10;
        doc.setDrawColor(200, 200, 200).setLineWidth(0.1);
        doc.line(15, y, 195, y);
        y += 10;

        const average = subjectCount > 0 ? (totalScore / subjectCount).toFixed(2) : "0.00";
        
        doc.setFont("helvetica", "bold");
        doc.text(`NO. OF SUBJECTS: ${subjectCount}`, 15, y);
        doc.text(`AVERAGE SCORE: ${average}`, 80, y);
        
        y += 10;
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
    },

    savePDF: async () => {
        const btn = document.getElementById('savePdfBtn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        const doc = await pdfGenerator.createPDF();
        const name = document.getElementById('studentName').value || 'Student';
        doc.save(`${name.replace(/ /g, '_')}_Result.pdf`);
        btn.innerHTML = '<i class="fas fa-file-pdf me-2"></i>Download PDF';
    },

    loadImage: (url) => {
        return new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = "Anonymous"; // Crucial for external/local images
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', app.init);
