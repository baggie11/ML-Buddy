chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarizeContent') {
        summarizeViaFlask(request.data)
            .then(sendResponse)
            .catch(error => {
                console.error("Summarize error:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }

    if (request.action === 'explainConcept') {
        explainWithGemini('concept', request.data)
            .then(sendResponse)
            .catch(error => {
                console.error("Explain concept error:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }

    if (request.action === 'explainCode') {
        explainWithGemini('code', request.data)
            .then(sendResponse)
            .catch(error => {
                console.error("Explain code error:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
});

async function summarizeViaFlask({ input }) {
    const payload = isValidUrl(input)
        ? { url: input }
        : { text: input };

    console.log("Sending to Flask:", payload);

    const response = await fetch('http://localhost:5000/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Flask server error');

    return {
        success: true,
        summary: data.summary,
        prerequisites: data.prerequisites || 'None specified'
    };
}

async function explainWithGemini(type, { concept, code}) {
    const key = 'GEMINI-API-KEY'; // Replace this
    const prompt =
    type === 'concept'
        ? `You are a friendly and knowledgeable Machine Learning assistant.

        Please explain the concept: "${concept}" to ML learners.

        Structure your response as follows:

        1. <h2>Definition</h2> — Provide a concise explanation.
        2. <h2>Key Uses</h2> — List key applications or use-cases.
        3. <h2>Seminal Papers</h2> — Mention important papers or references.
        4. <h2>Common Pitfalls</h2> — Warn about common mistakes or misunderstandings.
        5. <h2>References</h2> — List relevant papers, articles, or resources. 
        For each reference, provide proper clickable links using full valid URLs in standard HTML anchor tags, like: <a href="https://example.com" target="_blank">Paper Title</a>.

        Format the entire response in clean HTML. Do not include any unnecessary preamble, only output pure HTML content.`
                : `You are a friendly and knowledgeable Machine Learning assistant.

        Please analyze and explain the following ML code:

        ${code}

        Structure your response as follows:

        1. <h2>Code Purpose</h2> — Briefly describe the goal of the code.
        2. <h2>Step-by-Step Explanation</h2> — Break down the logic in bullet points.
        3. <h2>Key Concepts</h2> — Mention relevant ML concepts or algorithms used.
        4. <h2>References</h2> — List helpful papers, articles, or resources.
        For each reference, provide proper clickable links using full valid URLs in standard HTML anchor tags, like: <a href="https://example.com" target="_blank">Paper Title</a>.

        Format the entire response in clean HTML. Only output pure HTML without any additional text.`;


    console.log("Sending prompt to Gemini:", prompt);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048
            }
        })
    });

    const data = await response.json();
    console.log("Gemini response:", data);

    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!explanation) throw new Error('No explanation returned');

    return { success: true, explanation };
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}
