// Initialize variable
let myData = "";
const form = document.getElementById('formTable');
const newBtn = document.getElementById('new');
const average = document.getElementById('average');
const hml = document.getElementById('hml');
const getFifty = document.getElementById('getFifty');
const yorkuGPA = document.getElementById('yorkuGPA');
const yorkuletter = document.getElementById('yorkuletter');
const targety = document.getElementById('targety');
const targetInput = document.getElementById('targetInput');







form.addEventListener('input', calculating);
targetInput.addEventListener('input', calculating);

newBtn.addEventListener('click', () => {
    // We create 4 new inputs programmatically
    const classes = ['title', 'percentage', 'weight'];
    const types = ['text', 'number', 'number'];
    const placeholders = ['Assignment', '100', '0'];

    classes.forEach((cls, index) => {
        const input = document.createElement('input');
        input.type = types[index];
        input.classList.add('elementInput', cls);
        input.placeholder = placeholders[index];
        input.autocomplete = "off";
        
        // Add to the grid container
        form.appendChild(input);
    });
});

function calculating() {
    // Get all inputs of specific types
    const percentageInputs = document.querySelectorAll('.percentage');
    const weightInputs = document.querySelectorAll('.weight');

    let totalScore = 0;
    let totalWeight = 0;

    // Loop through all rows
    for (let i = 0; i < percentageInputs.length; i++) {
        let highestWeight = 0;
        let mostEffective = "";
        const p = parseFloat(percentageInputs[i].value);
        const w = parseFloat(weightInputs[i].value);

        // Only calculate if we have valid numbers
        if (!isNaN(p) && !isNaN(w)) {
            totalScore += p*w;
            totalWeight += w;
        }
    }

    // Calculate final result
    // If totalWeight is 0 (to avoid divide by zero), show 0
    let finalAverage = 0;
    if (totalWeight > 0) {
        // Calculate weighted average relative to weights entered so far
        finalAverage = (totalScore / totalWeight);
    }

    let targetValue = targetInput.value;
    // Update Display
    average.textContent = finalAverage.toFixed(2) + '%';
    hml.textContent = 100-totalWeight.toFixed(2) + '%';
    getFifty.textContent = ((5000-finalAverage*totalWeight)/(100-totalWeight)).toFixed(2) + '%';
    targety.textContent = ((targetValue*100-finalAverage*totalWeight)/(100-totalWeight)).toFixed(2) + '%';

    if (finalAverage < 50) {
        yorkuGPA.textContent = 0;
        yorkuletter.textContent = "F";
    }
    else if (finalAverage >= 50 && finalAverage < 55) {
        yorkuGPA.textContent = (2+((finalAverage-50)/5)).toFixed(2);
        yorkuletter.textContent = "D";
    }
    else if (finalAverage >= 55 && finalAverage < 60) {
        yorkuGPA.textContent = (3+((finalAverage-55)/5)).toFixed(2);
        yorkuletter.textContent = "D+";
    }
    else if (finalAverage >= 60 && finalAverage < 65) {
        yorkuGPA.textContent = (4+((finalAverage-60)/5)).toFixed(2);
        yorkuletter.textContent = "C";
    }
    else if (finalAverage >= 65 && finalAverage < 70) {
        yorkuGPA.textContent = (5+((finalAverage-65)/5)).toFixed(2);
        yorkuletter.textContent = "C+";
    }
    else if (finalAverage >= 70 && finalAverage < 75) {
        yorkuGPA.textContent = (6+((finalAverage-70)/5)).toFixed(2);
        yorkuletter.textContent = "B";
    }
    else if (finalAverage >= 75 && finalAverage < 80) {
        yorkuGPA.textContent = (7+((finalAverage-75)/5)).toFixed(2);
        yorkuletter.textContent = "B+";
    }
    else if (finalAverage >= 80 && finalAverage < 90) {
        yorkuGPA.textContent = (8+((finalAverage-80)/10)).toFixed(2);
        yorkuletter.textContent = "A";
    }
    else if (finalAverage >= 90) {
        yorkuGPA.textContent = 9; //(9+((finalAverage-90)/10)).toFixed(2) if can go above 9
        yorkuletter.textContent = "A+";
    }
}



const pTop = document.getElementById('pTopContainer');
const newPercentage = document.getElementById('newPercentage');

pTop.addEventListener('input', () => {
    const points = document.getElementById('points').value;
    const from = document.getElementById('from').value;
    if (!isNaN(points) && !isNaN(from) && from > 0) {
        newPercentage.textContent = ((points/from)*100).toFixed(2) + '%';
    }
});