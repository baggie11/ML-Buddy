from flask import Flask, request, jsonify
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.document_loaders import WebBaseLoader
from langchain.chains import StuffDocumentsChain
from langchain.chains.llm import LLMChain
from langchain.prompts import PromptTemplate
from langchain.schema import Document
from dotenv import load_dotenv
import requests
import os

# Load environment variables
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise EnvironmentError("GOOGLE_API_KEY not found in environment variables.")

# Initialize Flask app
app = Flask(__name__)

# Shared Gemini model instance
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GOOGLE_API_KEY)

# Prompt templates
SUMMARY_PROMPT = PromptTemplate.from_template("""
You are a helpful and precise machine learning assistant that outputs valid HTML only.

Task: Write a clear and concise summary of the following content.

Content:
\"\"\"{text}\"\"\"

Instructions:
- Only return pure HTML.
- Do not include any explanation, preamble, or notes.
- Use appropriate HTML tags such as <p>, <h2>, and <ul> if needed.
- Ensure the HTML is properly formatted and valid.

Output:
""")

PREREQ_PROMPT = PromptTemplate.from_template("""
You are a helpful and precise machine learning assistant that outputs valid HTML only.

Task: Based on the following content, suggest key machine learning topics that a reader should be familiar with before reading it.

Content:
\"\"\"{text}\"\"\"

Instructions:
- Return only the list of topics.
- Format the list as a clean HTML unordered list: <ul><li>Topic 1</li><li>Topic 2</li>...</ul>
- Do not include any additional explanation, preamble, or extra text.
- Only return valid HTML code.

Output:
""")

summary_chain = LLMChain(llm=llm, prompt=SUMMARY_PROMPT)
stuff_chain = StuffDocumentsChain(llm_chain=summary_chain, document_variable_name="text")
prereq_chain = LLMChain(llm=llm, prompt=PREREQ_PROMPT)


@app.route('/summarize', methods=['POST'])
def summarize_blog():
    try:
        data = request.get_json()
        url, text = data.get("url"), data.get("text")

        if not url and not text:
            return jsonify({"error": "Provide either 'url' or 'text'."}), 400

        docs = WebBaseLoader(url).load() if url else [Document(page_content=text)]

        summary = stuff_chain.invoke(docs)["output_text"]
        prerequisites = prereq_chain.invoke({"text": "\n".join(doc.page_content for doc in docs)})["text"]

        return jsonify({
            "summary": summary,
            "prerequisites": prerequisites.strip()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/explain', methods=['POST'])
def explain():
    try:
        data = request.get_json()
        explain_type = data.get('type')
        concept, code = data.get('concept'), data.get('code')

        if explain_type not in ['concept', 'code']:
            return jsonify({'error': 'Invalid type'}), 400

        if explain_type == 'concept' and not concept:
            return jsonify({'error': 'Missing concept'}), 400
        if explain_type == 'code' and not code:
            return jsonify({'error': 'Missing code'}), 400

        content = concept if explain_type == 'concept' else code

        prompt = generate_explanation_prompt(explain_type, content)

        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GOOGLE_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 2048
                }
            }
        )

        result = response.json()
        explanation = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text")

        if not explanation:
            return jsonify({"error": "No explanation returned"}), 500

        return jsonify({"success": True, "explanation": explanation})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def generate_explanation_prompt(explain_type, content):
    if explain_type == 'concept':
        return f"""
You are a friendly and knowledgeable Machine Learning assistant.

Please explain the concept: "{content}" to ML learners.

Structure your response as follows:

1. <h2>Definition</h2> — Provide a concise explanation.
2. <h2>Key Uses</h2> — List key applications or use-cases.
3. <h2>Seminal Papers</h2> — Mention important papers or references.
4. <h2>Common Pitfalls</h2> — Warn about common mistakes or misunderstandings.
5. <h2>References</h2> — List relevant papers, articles, or resources. 
Use proper clickable links: <a href="https://example.com" target="_blank">Paper Title</a>.

Only return valid HTML.
"""
    else:
        return f"""
You are a friendly and knowledgeable Machine Learning assistant.

Please analyze and explain the following ML code:

{content}

Structure your response as follows:

1. <h2>Code Purpose</h2> — Briefly describe the goal of the code.
2. <h2>Step-by-Step Explanation</h2> — Break down the logic in bullet points.
3. <h2>Key Concepts</h2> — Mention relevant ML concepts or algorithms used.
4. <h2>References</h2> — List helpful papers, articles, or resources.
Use proper clickable links: <a href="https://example.com" target="_blank">Paper Title</a>.

Only return valid HTML.
"""


if __name__ == '__main__':
    app.run(debug=True)
