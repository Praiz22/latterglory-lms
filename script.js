// DOM Elements
const studentPhotoInput = document.getElementById('studentPhoto');
const photoPreview = document.getElementById('photoPreview');
const subjectsBody = document.getElementById('subjectsBody');
const reportPreview = document.getElementById('reportPreview'); // This is the div where the iframe will go
const generateReportBtn = document.getElementById('generateReportBtn');
const classTeacherCommentSelect = document.getElementById('classTeacherComment');
const principalCommentSelect = document.getElementById('principalComment');
const savePdfBtn = document.getElementById('savePdfBtn'); // Get the save PDF button
const resumptionDateDisplay = document.getElementById('resumptionDateValue'); // New element for fixed date

// Sample data
const sampleSubjects = [
    "English Language", "Mathematics", "N.V", "P.V.S", "B.S.T",
    "History", "Yoruba", "CRS", "C.C.A", "Chemistry", "Biology", "Physics",
    "Business-Studies", "Geography", "Computer-Practical", "Literature", "Government",
    "Civic Education", "Agric", "Animal Husbandry",
];
const classTeacherComments = [
    { value: "Excellent performance. Keep it up!", text: "Excellent performance. Keep it up!" },
    { value: "Good effort, but there's room for improvement.", text: "Good effort, but there's room for improvement." },
    { value: "Needs to pay more attention in class.", text: "Needs to pay more attention in class." },
    { value: "Showed great progress this term.", text: "Showed great progress this term." },
    { value: "He is a good boy but he plays too much", text: "He is a good boy but he plays too much" }
];
const principalComments = [
    { value: "Outstanding results! Congratulations.", text: "Outstanding results! Congratulations." },
    { value: "A satisfactory performance. Strive for excellence.", text: "A satisfactory performance. Strive for excellence." },
    { value: "More dedication is required for better grades.", text: "More dedication is required for better grades." },
    { value: "Commendable progress, keep aiming high.", text: "Commendable progress, keep aiming high." },
    { value: "Fair result, you can definitely do better than that!", text: "Fair result, you can definitely do better than that!" }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    populateDropdown(classTeacherCommentSelect, classTeacherComments, "He is a good boy but he plays too much");
    populateDropdown(principalCommentSelect, principalComments, "Fair result, you can definitely do better than that!");
    addSubject('English Language', 20, 20);
    addSubject('Mathematics', 21, 23);
    addSubject('N.V', 16, 34);
    addSubject('P.V.S', 14, 9);
    addSubject('B.S.T', 21, 43);
    addSubject('History', 11, 35);
    addSubject('Yoruba', 15, 28);
    addSubject('CRS', 17, 33);
    addSubject('C.C.A', 20, 26);
    addSubject('Computer Practical', 20, 24);
    addSubject('Business-Studies', 15, 35);

    // Set the fixed resumption date to 15th September 2025
    const fixedResumptionDateString = "2025-09-15"; // YYYY-MM-DD format
    resumptionDateDisplay.textContent = new Date(fixedResumptionDateString).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    studentPhotoInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.src = e.target.result;
                photoPreview.classList.add('fade-in');
                setTimeout(() => photoPreview.classList.remove('fade-in'), 300);
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Attach event listeners to buttons
    generateReportBtn.addEventListener('click', generateReport);
    savePdfBtn.addEventListener('click', saveAsPDF);

    // Initial check for jsPDF library
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        console.error("jsPDF library not loaded. Ensure the script tag for jspdf.umd.min.js is correct and accessible.");
        showAlert("Error: jsPDF library not loaded. Check browser console for details.", "danger");
    }
});

function populateDropdown(selectElement, options, defaultValue) {
    options.forEach(optionData => {
        const option = document.createElement('option');
        option.value = optionData.value;
        option.textContent = optionData.text;
        if (optionData.value === defaultValue) option.selected = true;
        selectElement.appendChild(option);
    });
}

function addSubject(subject = '', ca = '', exam = '') {
    const maxSubjects = 16;
    if (subjectsBody.querySelectorAll('tr').length >= maxSubjects) {
        showAlert('Only 16 subjects can fit on an A4 page!', 'danger');
        return;
    }
    const row = document.createElement('tr');
    row.className = 'subject-row';
    row.innerHTML = `
        <td>
            <select class="subject-select form-select">
                <option value="">Select Subject</option>
                ${sampleSubjects.map(sub => `<option value="${sub}" ${sub === subject ? 'selected' : ''}>${sub}</option>`).join('')}
                <option value="other">Other...</option>
            </select>
            <input type="text" class="custom-subject form-control mt-1 ${subject && !sampleSubjects.includes(subject) ? '' : 'd-none'}" placeholder="Enter subject name">
        </td>
        <td><input type="number" min="0" max="40" class="ca-score form-control" value="${ca}"></td>
        <td><input type="number" min="0" max="60" class="exam-score form-control" value="${exam}"></td>
        <td class="total-score text-center">-</td>
        <td class="grade text-center">-</td>
        <td class="remark text-center">-</td>
        <td class="text-center">
            <button onclick="removeSubject(this)" class="btn btn-sm btn-outline-danger">Remove</button>
        </td>
    `;
    subjectsBody.appendChild(row);

    const subjectSelect = row.querySelector('.subject-select');
    const customInput = row.querySelector('.custom-subject');
    if (subjectSelect.value === 'other') {
        customInput.classList.remove('d-none');
        customInput.value = subject;
    } else if (subject && !sampleSubjects.includes(subject)) {
        subjectSelect.value = 'other';
        customInput.classList.remove('d-none');
        customInput.value = subject;
    }
    subjectSelect.addEventListener('change', function() {
        if (this.value === 'other') {
            customInput.classList.remove('d-none');
        } else {
            customInput.classList.add('d-none');
            customInput.value = '';
        }
    });

    const caInput = row.querySelector('.ca-score');
    const examInput = row.querySelector('.exam-score');
    const calculateScores = () => {
        const ca = parseFloat(caInput.value) || 0;
        const exam = parseFloat(examInput.value) || 0;
        let total = ca + exam;
        if (total > 100) total = 100;
        const totalCell = row.querySelector('.total-score');
        const gradeCell = row.querySelector('.grade');
        const remarkCell = row.querySelector('.remark');
        totalCell.textContent = total;
        let grade = '', remark = '';
        if (total >= 75) { grade = 'A'; remark = 'Excellent'; }
        else if (total >= 65) { grade = 'B'; remark = 'Very Good'; }
        else if (total >= 50) { grade = 'C'; remark = 'Good'; }
        else if (total >= 40) { grade = 'D'; remark = 'Pass'; }
        else { grade = 'F'; remark = 'Fail'; }
        // Update the HTML cells with the calculated values
        totalCell.textContent = total;
        gradeCell.textContent = grade;
        remarkCell.textContent = remark;

        if (caInput.value === '' && examInput.value === '') {
            totalCell.textContent = '-'; grade = '-'; remark = '-';
        } else if (isNaN(ca) || isNaN(exam)) {
            grade = '-'; remark = '-';
        }
    };
    caInput.addEventListener('input', calculateScores);
    examInput.addEventListener('input', calculateScores);
    calculateScores();
}

function removeSubject(button) {
    const row = button.closest('tr');
    if (subjectsBody.querySelectorAll('tr').length > 1) {
        row.remove();
        showAlert('Subject removed.', 'info');
    } else {
        showAlert('You must have at least one subject!', 'danger');
    }
}

// Function to handle generating the report (and displaying preview)
async function generateReport() {
    if (!validateForm()) return;

    const originalBtnText = generateReportBtn.innerHTML;
    generateReportBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Generating Preview...';
    generateReportBtn.disabled = true;

    try {
        const pdf = await generatePdfObject(); // Get the jsPDF object
        const pdfDataUri = pdf.output('datauristring'); // Get Data URI

        // Display PDF in an iframe
        reportPreview.innerHTML = `
            <iframe src="${pdfDataUri}" style="width: 100%; height: 800px; border: 1px solid #ddd; border-radius: 5px;"></iframe>
        `;
        reportPreview.classList.remove('d-none');
        showAlert('Report preview generated successfully!', 'success');

    } catch (error) {
        console.error('Error generating report preview:', error);
        showAlert('Error generating report preview. Please check console for details.', "danger");
    } finally {
        generateReportBtn.innerHTML = originalBtnText;
        generateReportBtn.disabled = false;
    }
}

function getGradeColorClass(grade) {
    switch(grade) {
        case 'A': return 'text-success';
        case 'B': return 'text-green-500';
        case 'C': return 'text-primary';
        case 'D': return 'text-warning';
        case 'E': return 'text-orange-500';
        case 'F': return 'text-danger';
        default: return '';
    }
}
function getRemarkColorClass(remark) {
    switch(remark) {
        case 'Excellent': return 'text-success';
        case 'Very Good': return 'text-green-500';
        case 'Good': return 'text-primary';
        case 'Pass': return 'text-warning';
        case 'Below Average': return 'text-orange-500';
        case 'Fail': return 'text-danger';
        default: return '';
    }
}

function validateForm() {
    const studentName = document.getElementById('studentName').value;
    const studentClass = document.getElementById('studentClass').value;
    const studentGender = document.getElementById('studentGender').value;
    const regNumber = document.getElementById('regNumber').value;
    const classTeacherComment = classTeacherCommentSelect.value;
    const principalComment = principalCommentSelect.value;
    // The resumption date is now fixed and doesn't need input validation
    if (!studentName || !studentClass || !studentGender || !regNumber || !classTeacherComment || !principalComment) {
        showAlert('Please fill in all student information and comment selections!', 'danger');
        return false;
    }
    if (photoPreview.src === 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=') {
        showAlert('Please upload a student passport photograph!', 'danger');
        return false;
    }
    let valid = true;
    const subjectRows = subjectsBody.querySelectorAll('tr');
    if (subjectRows.length === 0) {
        showAlert('Please add at least one subject!', 'danger');
        return false;
    }
    for (const row of subjectRows) {
        const subjectSelect = row.querySelector('.subject-select');
        const customSubject = row.querySelector('.custom-subject');
        const subjectName = subjectSelect.value === 'other' ? customSubject.value : subjectSelect.value;
        // Get values directly from the input fields and text content for calculated fields
        const caScore = parseFloat(row.querySelector('.ca-score').value);
        const examScore = parseFloat(row.querySelector('.exam-score').value);
        const total = parseFloat(row.querySelector('.total-score').textContent);
        const grade = row.querySelector('.grade').textContent;
        const remark = row.querySelector('.remark').textContent;

        if (!subjectName) { showAlert('Please select or enter a subject name for all subjects!', 'danger'); valid = false; break; }
        if (isNaN(caScore) || caScore < 0 || caScore > 40) { showAlert(`C.A score for ${subjectName} must be between 0 and 40!`, 'danger'); valid = false; break; }
        if (isNaN(examScore) || examScore < 0 || examScore > 60) { showAlert(`Exam score for ${subjectName} must be between 0 and 60!`, 'danger'); valid = false; break; }
        // Ensure total, grade, and remark are not just '-'
        if (total === '-' || grade === '-' || remark === '-') {
            showAlert(`Please ensure all scores are entered for ${subjectName} so total, grade, and remark can be calculated!`, 'danger'); valid = false; break;
        }
    }
    return valid;
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert alert-${type} d-flex align-items-center`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `<div>${message}</div>`;
    document.body.appendChild(alertDiv);
    setTimeout(() => { alertDiv.classList.add('show'); }, 10);
    setTimeout(() => { alertDiv.classList.remove('show'); setTimeout(() => alertDiv.remove(), 500); }, 4000);
}

// === HELPER: Get image size to fit maxW x maxH while keeping aspect ratio ===
function getImageDimensions(dataUrl, maxW, maxH) {
    return new Promise(resolve => {
        const img = new window.Image();
        img.onload = function() {
            let w = img.width, h = img.height;
            if (w > maxW || h > maxH) {
                const wr = maxW / w, hr = maxH / h, scale = Math.min(wr, hr);
                w = w * scale; h = h * scale;
            }
            resolve({w, h});
        };
        img.onerror = function(e) {
            console.error("Error loading image for dimensions:", dataUrl, e);
            resolve({w: 0, h: 0}); // Return 0 to prevent addImage from being called with invalid dimensions
        };
        img.src = dataUrl;
    });
}

// === HELPER: Load image as DataURL (for logo file in same folder) ===
function loadImageAsDataURL(url) {
    return new Promise(resolve => {
        const img = new window.Image();
        img.crossOrigin = 'Anonymous'; // Required for images from different origins, might help with local
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function(e) {
            console.error(`Failed to load image: ${url}. Check path and CORS.`, e);
            resolve(null);
        };
        img.src = url;
    });
}

// === PDF GENERATION: Function to generate the jsPDF object (reusable for preview and save) ===
async function generatePdfObject() {
    console.log("Starting PDF generation...");

    // === Collect form data ===
    const studentName = document.getElementById('studentName').value;
    const studentClass = document.getElementById('studentClass').value;
    const studentGender = document.getElementById('studentGender').value;
    const regNumber = document.getElementById('regNumber').value;
    const classTeacherComment = classTeacherCommentSelect.value;
    const principalComment = principalCommentSelect.value;
    const resumptionDate = "2025-09-15"; // Fixed resumption date (UPDATED YEAR)
    const formattedResumptionDate = new Date(resumptionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const generationDateTime = new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    // Subjects
    const subjects = [];
    let totalPassed = 0, totalFailed = 0, totalOverallScore = 0;
    document.querySelectorAll('.subject-row').forEach(row => {
        const subjectSelect = row.querySelector('.subject-select');
        const customSubject = row.querySelector('.custom-subject');
        const subjectName = subjectSelect.value === 'other' ? customSubject.value : subjectSelect.value;
        // Get values directly from the input fields and text content for calculated fields
        const caScore = parseFloat(row.querySelector('.ca-score').value);
        const examScore = parseFloat(row.querySelector('.exam-score').value);
        const total = parseFloat(row.querySelector('.total-score').textContent);
        const grade = row.querySelector('.grade').textContent;
        const remark = row.querySelector('.remark').textContent;

        if (subjectName && !isNaN(total) && total !== 0) { // Ensure total is a valid number and not 0
            subjects.push({ subjectName, caScore, examScore, total, grade, remark });
            totalOverallScore += total;
            if (grade === 'A' || grade === 'B' || grade === 'C' || grade === 'D') totalPassed++;
            else if (grade === 'E' || grade === 'F') totalFailed++;
        }
    });
    const averageScore = subjects.length > 0 ? (totalOverallScore / subjects.length).toFixed(2) : '0.00';
    const percentagePassed = subjects.length > 0 ? ((totalPassed / subjects.length) * 100).toFixed(2) : '0.00';

    // === PDF Layout Parameters ===
    const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidth = 210, pageHeight = 297;
    const margin = 15;
    let y = margin; // Starting Y position

    // === Colors (Monochrome conversion) ===
    const COLOR_BLACK = [0, 0, 0];
    const COLOR_DARK_GRAY = [60, 60, 60]; // Used for main text, section titles
    const COLOR_MID_GRAY = [120, 120, 120]; // Used for lines, table borders
    const COLOR_LIGHT_GRAY = [230, 230, 230]; // Used for background fills (e.g., info box, alternating table rows)
    const COLOR_WHITE = [255, 255, 255];

    // --- HEADER ---
    const logoImgUrl = 'latter-glory logo.png';
    const logoMaxW = 35;
    const logoMaxH = 20;
    let logoBottomY = y;

    console.log("Attempting to load logo image:", logoImgUrl);
    const logoImgData = await loadImageAsDataURL(logoImgUrl);
    if (logoImgData) {
        const {w: lw, h: lh} = await getImageDimensions(logoImgData, logoMaxW, logoMaxH);
        console.log(`Logo loaded. Dimensions: ${lw}x${lh}`);
        if (lw > 0 && lh > 0) { // Only add if dimensions are valid
            pdf.addImage(logoImgData, 'PNG', margin, y, lw, lh);
            logoBottomY = y + lh + 3;
        } else {
            console.warn("Logo image dimensions were invalid after loading, skipping addImage.");
        }
    } else {
        console.warn("School Logo data is null. Ensure 'latter-glory logo.png' is in the correct directory and accessible.");
    }

    const textStartX = logoImgData ? margin + logoMaxW + 5 : pageWidth / 2;
    const textAlignment = logoImgData ? 'left' : 'center';

    pdf.setFont('helvetica', 'bold').setFontSize(15).setTextColor(...COLOR_BLACK);
    pdf.text('LATTER GLORY ACADEMY', textStartX, y + 5, { align: textAlignment });
    let currentHeaderY = y + 12;

    pdf.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...COLOR_DARK_GRAY);
    pdf.text('The Academy For Geniuses', textStartX, currentHeaderY, { align: textAlignment });
    currentHeaderY += 4.5;

    pdf.setFontSize(8.5);
    // Updated line to include website
    pdf.text('Phone: (+234) 8162873036 | Email: thelattergloryacademy@gmail.com | Website: latter-glory.web.app', textStartX, currentHeaderY, { align: textAlignment });
    currentHeaderY += 7; // Adjusted space

    y = Math.max(logoBottomY, currentHeaderY + 7);

    // Divider
    pdf.setDrawColor(...COLOR_MID_GRAY).setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 7; // Increased space here

    // Report title and term
    pdf.setFont('helvetica','bold').setFontSize(11.5).setTextColor(...COLOR_DARK_GRAY);
    pdf.text('Student Result Report', pageWidth/2, y, { align: 'center' });
    y += 6;
    pdf.setFont('helvetica','normal').setFontSize(9.5).setTextColor(...COLOR_BLACK);
    pdf.text('Term: Second Term 2024/2025 Academic Session', pageWidth/2, y, { align: 'center' });
    y += 7;

    // --- STUDENT INFO BOX ---
    const infoBoxH = 30;
    const infoBoxW = pageWidth - 2 * margin;
    pdf.setFillColor(...COLOR_LIGHT_GRAY).setDrawColor(...COLOR_MID_GRAY);
    pdf.roundedRect(margin, y, infoBoxW, infoBoxH, 2, 2, 'FD');

    // Passport photo - slightly larger max dimensions
    const photoImgData = photoPreview.src;
    const photoMaxW = 35; // Increased
    const photoMaxH = infoBoxH - 5; // Increased (30 - 5 = 25)
    const photoOffsetFromRightEdge = 5;

    const photoYAnchor = y;
    const photoXAnchor = margin + infoBoxW;

    console.log("Attempting to load passport photo. Current src:", photoImgData.substring(0, 50) + "...");
    if (photoImgData && !photoImgData.includes('AQABAAD')) {
        const {w: pw, h: ph} = await getImageDimensions(photoImgData, photoMaxW, photoMaxH);
        console.log(`Passport photo dimensions: ${pw}x${ph}`);
        if (pw > 0 && ph > 0) { // Only add if dimensions are valid
            const photoX = photoXAnchor - pw - photoOffsetFromRightEdge;
            const photoY = photoYAnchor + (infoBoxH - ph) / 2;
            pdf.addImage(photoImgData, 'PNG', photoX, photoY, pw, ph);

            pdf.setDrawColor(...COLOR_MID_GRAY).setLineWidth(0.3);
            pdf.rect(photoX, photoY, pw, ph, 'S');
        } else {
            console.warn("Passport photo dimensions were invalid after loading, skipping addImage.");
        }
    } else {
        console.warn("Student photo not found or is default placeholder. It will not be included in the PDF.");
    }

    // Info text
    pdf.setFont('helvetica','bold').setFontSize(9.5);
    let infoY = y + 5;
    let infoX = margin + 5;
    const labelWidth = 25;
    const valueX = infoX + labelWidth;

    pdf.text('Name:', infoX, infoY); pdf.setFont('helvetica','normal'); pdf.text(studentName, valueX, infoY);
    infoY += 6;
    pdf.setFont('helvetica','bold'); pdf.text('Class:', infoX, infoY); pdf.setFont('helvetica','normal'); pdf.text(studentClass, valueX, infoY);
    infoY += 6;
    pdf.setFont('helvetica','bold'); pdf.text('Gender:', infoX, infoY); pdf.setFont('helvetica','normal'); pdf.text(studentGender, valueX, infoY);
    infoY += 6;
    pdf.setFont('helvetica','bold'); pdf.text('Reg. Number:', infoX, infoY); pdf.setFont('helvetica','normal'); pdf.text(regNumber, valueX, infoY);

    y += infoBoxH + 8; // Space after info box

    // --- ACADEMIC PERFORMANCE TABLE ---
    pdf.setFont('helvetica','bold').setFontSize(11.5).setTextColor(...COLOR_DARK_GRAY);
    pdf.text('ACADEMIC PERFORMANCE', pageWidth/2, y, { align: 'center' });
    y += 6;

    // Table parameters
    const tableX = margin;
    const colHeights = 7.5;
    const colWidths = [50, 20, 20, 20, 18, 52];
    const colTitles = ['Subject', 'C.A (40)', 'Exam (60)', 'Total (100)', 'Grade', 'Remark'];
    let currentColX;
    const cellPadding = 2;

    // Table Headers
    currentColX = tableX;
    pdf.setDrawColor(...COLOR_BLACK).setLineWidth(0.38).setFontSize(9);
    for (let i=0; i<colTitles.length; ++i) {
        pdf.setFillColor(...COLOR_BLACK).setTextColor(...COLOR_WHITE); // Changed text color back to white
        pdf.rect(currentColX, y, colWidths[i], colHeights, 'FD');
        pdf.text(colTitles[i], currentColX + colWidths[i]/2, y + colHeights/2 + 1, { align: 'center' });
        currentColX += colWidths[i];
    }
    y += colHeights;
    pdf.setFont('helvetica','normal').setTextColor(...COLOR_BLACK).setFontSize(8.5);

    // Table Rows
    for (const [i,subj] of subjects.entries()) {
        currentColX = tableX;
        if (i % 2 === 1) {
            pdf.setFillColor(...COLOR_LIGHT_GRAY);
            pdf.rect(currentColX, y, colWidths.reduce((a,b)=>a+b,0), colHeights, 'F');
        }
        pdf.setDrawColor(...COLOR_MID_GRAY);

        for (let j=0; j<colTitles.length; ++j) {
            pdf.rect(currentColX, y, colWidths[j], colHeights, 'S');
            currentColX += colWidths[j];
        }

        currentColX = tableX;
        pdf.setTextColor(...COLOR_BLACK); // Ensure color is black for subject name
        const subjectTextLines = pdf.splitTextToSize(subj.subjectName, colWidths[0] - 2 * cellPadding);
        pdf.text(subjectTextLines, currentColX + cellPadding, y + colHeights/2 + 1 - (subjectTextLines.length-1)*2.2);
        currentColX += colWidths[0];

        // C.A Score (right-aligned)
        pdf.setTextColor(...COLOR_BLACK); // Ensure color
        pdf.text(String(subj.caScore), currentColX + colWidths[1] - cellPadding, y + colHeights/2 + 1, { align:'right' });
        currentColX += colWidths[1];

        // Exam Score (right-aligned)
        pdf.setTextColor(...COLOR_BLACK); // Ensure color
        pdf.text(String(subj.examScore), currentColX + colWidths[2] - cellPadding, y + colHeights/2 + 1, { align:'right' });
        currentColX += colWidths[2];

        // Total (right-aligned)
        pdf.setTextColor(...COLOR_BLACK); // Ensure color
        pdf.text(String(subj.total), currentColX + colWidths[3] - cellPadding, y + colHeights/2 + 1, { align:'right' });
        currentColX += colWidths[3];

        // Grade (centered, bold)
        pdf.setFont('helvetica','bold').setTextColor(...COLOR_BLACK); // Ensure color and bold
        pdf.text(subj.grade, currentColX + colWidths[4]/2, y + colHeights/2 + 1, {align:'center'});
        pdf.setFont('helvetica','normal'); // Reset font style
        currentColX += colWidths[4];

        // Remark (left-aligned, with padding and wrapping)
        pdf.setTextColor(...COLOR_BLACK); // Ensure color
        const remarkTextLines = pdf.splitTextToSize(subj.remark, colWidths[5] - 2 * cellPadding);
        pdf.text(remarkTextLines, currentColX + cellPadding, y + colHeights/2 + 1 - (remarkTextLines.length-1)*2.2);

        y += colHeights;

        if (y > pageHeight - margin - 70) {
            pdf.addPage();
            y = margin + 14;
            currentColX = tableX;
            pdf.setDrawColor(...COLOR_BLACK).setLineWidth(0.38).setFontSize(9);
            for (let i=0; i<colTitles.length; ++i) {
                pdf.setFillColor(...COLOR_BLACK).setTextColor(...COLOR_WHITE); // Changed text color back to white on new page
                pdf.rect(currentColX, y, colWidths[i], colHeights, 'FD');
                pdf.text(colTitles[i], currentColX + colWidths[i]/2, y + colHeights/2 + 1, { align: 'center' });
                currentColX += colWidths[i];
            }
            y += colHeights;
            pdf.setFont('helvetica','normal').setTextColor(...COLOR_BLACK).setFontSize(8.5);
        }
    }

    y += 8; // Space after table

    // --- PERFORMANCE SUMMARY AND COMMENTS (side by side boxes) ---
    const boxGap = 5;
    const perfBoxW = (pageWidth - 2 * margin - boxGap) / 2;
    const perfBoxH = 45;

    pdf.setDrawColor(...COLOR_MID_GRAY).setFillColor(...COLOR_LIGHT_GRAY);
    pdf.roundedRect(margin, y, perfBoxW, perfBoxH, 2, 2, 'FD');
    pdf.roundedRect(margin + perfBoxW + boxGap, y, perfBoxW, perfBoxH, 2, 2, 'FD');

    // Performance Summary content
    pdf.setFont('helvetica','bold').setTextColor(...COLOR_BLACK).setFontSize(8.7);
    pdf.text('PERFORMANCE SUMMARY', margin + 4, y + 5.5);
    pdf.setFont('helvetica','normal').setFontSize(8);
    let summaryTextY = y + 11.5;
    let summaryX = margin + 4;
    pdf.text(`Total Subjects: ${subjects.length}`, summaryX, summaryTextY);
    summaryTextY += 5;
    pdf.text(`Subjects Passed: ${totalPassed}`, summaryX, summaryTextY);
    summaryTextY += 5;
    pdf.text(`Subjects Failed: ${totalFailed}`, summaryX, summaryTextY);
    summaryTextY += 5;
    pdf.text(`Average Score: ${averageScore}`, summaryX, summaryTextY);
    summaryTextY += 5;
    pdf.text(`Percentage Passed: ${percentagePassed}%`, summaryX, summaryTextY);

    // Comments content
    pdf.setFont('helvetica','bold').setTextColor(...COLOR_BLACK).setFontSize(8.7);
    pdf.text('COMMENTS', margin + perfBoxW + boxGap + 4, y + 5.5);
    pdf.setFont('helvetica','normal').setFontSize(8);
    let commentsTextY = y + 11.5;
    let commentsX = margin + perfBoxW + boxGap + 4;
    const commentMaxWidth = perfBoxW - 8;

    // Differentiate Class Teacher's Comment
    pdf.setFont('helvetica','bold').setTextColor(...COLOR_DARK_GRAY);
    pdf.text("Class Teacher's Comment:", commentsX, commentsTextY);
    commentsTextY += 4.5;
    pdf.setFont('helvetica','normal').setTextColor(...COLOR_BLACK);
    const ctCommentLines = pdf.splitTextToSize(classTeacherComment, commentMaxWidth);
    pdf.text(ctCommentLines, commentsX, commentsTextY);
    commentsTextY += ctCommentLines.length * 4.5;
    commentsTextY += 2;

    // Differentiate Principal's Comment
    pdf.setFont('helvetica','bold').setTextColor(...COLOR_DARK_GRAY);
    pdf.text("Principal's Comment:", commentsX, commentsTextY);
    commentsTextY += 4.5;
    pdf.setFont('helvetica','normal').setTextColor(...COLOR_BLACK);
    const principalCommentLines = pdf.splitTextToSize(principalComment, commentMaxWidth);
    pdf.text(principalCommentLines, commentsX, commentsTextY);
    commentsTextY += principalCommentLines.length * 4.5;

    commentsTextY += 2;
    pdf.setFont('helvetica','bold').setTextColor(...COLOR_DARK_GRAY);
    pdf.text("Next Term Resumes:", commentsX, commentsTextY);
    commentsTextY += 4.5;
    pdf.setFont('helvetica','normal').setTextColor(...COLOR_BLACK);
    pdf.text(formattedResumptionDate, commentsX, commentsTextY);

    y += perfBoxH + 10;

    // --- SIGNATURE LINES ---
    const signatureLineY = y + 10;
    const signatureTextY = signatureLineY + 5;
    const signatureLineWidth = 50;
    const signatureOffset = 18;

    pdf.setDrawColor(...COLOR_MID_GRAY).setLineWidth(0.32);
    pdf.line(margin + signatureOffset, signatureLineY, margin + signatureOffset + signatureLineWidth, signatureLineY);
    pdf.line(pageWidth - margin - signatureOffset - signatureLineWidth, signatureLineY, pageWidth - margin - signatureOffset, signatureLineY);

    pdf.setFontSize(8).setTextColor(...COLOR_DARK_GRAY);
    pdf.text("Class Teacher's Signature", margin + signatureOffset + signatureLineWidth/2, signatureTextY, { align: 'center' });
    pdf.text("Principal's Signature", pageWidth - margin - signatureOffset - signatureLineWidth/2, signatureTextY, { align: 'center' });

    y = signatureTextY + 5; // Current Y after signatures

    // --- FOOTER ---
    y += 3; // Add extra space before footer starts to prevent overlap

    pdf.setFont('helvetica','normal').setFontSize(8).setTextColor(...COLOR_MID_GRAY);
    pdf.text(`Date Generated: ${generationDateTime}`, pageWidth/2, y, { align: 'center' });
    y += 5;
    pdf.setFont('helvetica','italic');
    pdf.text('This is a computer generated report. Any alteration renders it Invalid!', pageWidth/2, y, { align: 'center' });
    y += 5;
    pdf.setFont('helvetica','normal');
    pdf.text('Powered by PraixTech', pageWidth/2, y, { align: 'center' });

    return pdf; // Return the pdf object for preview or saving
}
function verifyAdminKey() {
  const input = document.getElementById("adminKeyInput").value.trim();
  if (input === "latter25") {
    document.getElementById("authModal").style.display = "none";
    document.getElementById("mainContent").classList.remove("d-none");
  } else {
    document.getElementById("authError").classList.remove("d-none");
  }
}


// Function to save the PDF (calls generatePdfObject)
async function saveAsPDF() {
    const originalBtnText = savePdfBtn.innerHTML;
    savePdfBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Generating PDF...';
    savePdfBtn.disabled = true;

    try {
        const pdf = await generatePdfObject();
        const studentName = document.getElementById('studentName').value;
        pdf.save(`${studentName.replace(/\s/g, '_')}_Result.pdf`);
        showAlert('PDF generated successfully!', 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showAlert('Error generating PDF. Please ensure all fields are correctly filled and photo is loaded. Check console for details.', 'danger');
    } finally {
        savePdfBtn.innerHTML = originalBtnText;
        savePdfBtn.disabled = false;
    }
}
