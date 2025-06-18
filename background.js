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

async function explainWithGemini(type, { concept, code }) {
    const payload = { type, concept, code };

    try {
        const response = await fetch('http://localhost:5000/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Flask Gemini response:", data);

        if (!data.success) throw new Error(data.error || 'Explanation failed');

        return { success: true, explanation: data.explanation };

    } catch (error) {
        console.error("Error from Flask /explain route:", error);
        return { success: false, error: error.message };
    }
}


function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}
