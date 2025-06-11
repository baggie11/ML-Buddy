document.addEventListener("DOMContentLoaded", () => {
    console.log("ML Buddy extension loaded"); // Debug log
    
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    console.log("Found tabs:", tabs.length); // Debug log
    console.log("Found tab contents:", tabContents.length); // Debug log

    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            console.log("Tab clicked:", tab.getAttribute("data-tab")); // Debug log
            
            const target = tab.getAttribute("data-tab");

            // Remove 'active' class from all tabs and contents
            tabs.forEach(t => t.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));

            // Add 'active' class to selected tab and its content
            tab.classList.add("active");
            const targetContent = document.getElementById(target);
            if (targetContent) {
                targetContent.classList.add("active");
                console.log("Activated tab:", target); // Debug log
            } else {
                console.error("Target content not found:", target); // Debug log
            }
        });
    });

    //clear buttons functionality
document.getElementById('clear-code-btn')?.addEventListener('click',() => {
    document.getElementById('code-input').value = '';
    document.getElementById('code-result').style.display = 'none'
})

document.getElementById("clear-concept-btn")?.addEventListener('click',() => {
    document.getElementById('concept-input').value = '';
    document.getElementById('concept-result').style.display = 'none'
});

document.getElementById('clear-content-btn')?.addEventListener("click",() => {
    document.getElementById('content-input').value = '';
    document.getElementById('summary-result').style.display = 'none'
})

//user level selection
const userLevelSelect = document.getElementById('user-level');
let userLevel = userLevelSelect.value; //initialize with default value

//update when selection changes
userLevelSelect.addEventListener('change',(e) => {
    userLevel = e.target.value;
})

})

document.getElementById('summarize-btn').addEventListener('click', async () => {
    const input = document.getElementById('content-input').value.trim();
    const loadingIndicator = document.getElementById('summary-loading');
    const resultContainer = document.getElementById('summary-result');
    const resultContent = document.getElementById('summary-content');

    if (!input) {
        alert("Please enter a URL or discussion text.");
        return;
    }

    loadingIndicator.style.display = 'block';
    resultContainer.style.display = 'none';

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'summarizeContent',
            data: {
                input: input,
            }
        });

        if (response.success) {
            resultContent.innerHTML = `
                <div class="summary-section">
                    <h3>📄 Summary</h3>
                    ${response.summary}
                </div>
                <div class="prereq-section">
                    <h3>🧠 Suggested Prerequisites</h3>
                    ${response.prerequisites}
                </div>
            `;
        } else {
            throw new Error(response.error || 'Unknown error');
        }
    } catch (error) {
        resultContent.textContent = "❌ Error: " + error.message;
    } finally {
        loadingIndicator.style.display = 'none';
        resultContainer.style.display = 'block';
    }
});


document.getElementById('explain-concept-btn')?.addEventListener('click', async () => {
    const concept = document.getElementById('concept-input').value.trim();
    if (!concept) {
        alert('Please enter a concept');
        return;
    }

    // Show loading spinner
    document.getElementById('concept-loading').style.display = 'block';
    // Hide previous result title and explanation while loading
    document.getElementById('concept-explanation').innerHTML = '';
    document.querySelector('#concept-result .result-title').style.display = 'none';

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'explainConcept',
            data: {
                concept
            }
        });

        // Hide loading spinner
        document.getElementById('concept-loading').style.display = 'none';

        // Display result title and explanation
        document.querySelector('#concept-result .result-title').style.display = 'block';
        document.getElementById('concept-explanation').innerHTML = response.explanation;

    } catch (error) {
        console.error("Concept explanation error:", error);
        alert(error);
        document.getElementById('concept-loading').style.display = 'none';
    }
});

document.getElementById('explain-code-btn')?.addEventListener('click', async () => {
    const code = document.getElementById('code-input').value.trim();
    if (!code) return alert('Please paste some code');

    // Show loading spinner
    document.getElementById('code-loading').style.display = 'block';
    // Hide previous result title and explanation while loading
    document.getElementById('code-explanation').innerHTML = '';
    document.querySelector('#code-result .result-title').style.display = 'none';

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'explainCode',
            data: {
                code
            }
        });

        // Hide loading spinner
        document.getElementById('code-loading').style.display = 'none';

        // Display result title and explanation
        document.querySelector('#code-result .result-title').style.display = 'block';
         document.getElementById('code-explanation').innerHTML = response.explanation;

    } catch (error) {
        console.error("Concept explanation error:", error);
        alert(error);
        document.getElementById('code-loading').style.display = 'none';
    }
});

