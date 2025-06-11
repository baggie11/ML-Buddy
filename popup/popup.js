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
})

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

//gemini API call function
async function callGeminiAPI(prompt){
    const GEMINI_API_KEY = 'YOUR_API_KEY';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,{
        method : 'POST',
        headers : {'Content-Type' : 'application/json'},
        body : JSON.stringify({
            contents : [{
                parts : [{text:prompt}]
            }]
        })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

//explain code with focused prompt
document.getElementById('explain-code-btn')?.addEventListener('click',async () => {
    const code = document.getElementById('code-input').value.trim();
    const prompt = `
            Explain this ${userLevel}-level machine learning code concisely:
            1. Stick strictly to the code's functionality
            2. Break down key components in bullet points
            3. Suggest 1-2 relevant research papers/articles if applicable
            4. Keep technical depth appropriate for ${userLevel} level
            
            Code: ${code}
        `;
    try {
            const explanation = await callGeminiAPI(prompt);
            document.getElementById('code-explanation').innerHTML = explanation;
        } catch (error) {
            console.error("Gemini API error:", error);
            alert("Error getting explanation. Please try again.");
        }
})

document.getElementById('explain-concept-btn')?.addEventListener('click', async () => {
        const concept = document.getElementById('concept-input').value.trim();
        if (!concept) return alert('Please enter a concept');
        
        const prompt = `
            Explain "${concept}" for ${userLevel} ML learners:
            1. Provide a concise 3-sentence definition
            2. List 3 key characteristics/use cases
            3. Include 1-2 seminal papers if applicable
            4. Common pitfalls to avoid
            5. Keep explanation focused and practical
            
            Format as HTML with headings and bullet points
        `;
        
        // Show loading, make API call, display result
        // ... (existing loading UI code)
        
        try {
            const explanation = await callGeminiAPI(prompt);
            document.getElementById('concept-explanation').innerHTML = explanation;
        } catch (error) {
            console.error("Gemini API error:", error);
            alert("Error getting explanation. Please try again.");
        }
    });
