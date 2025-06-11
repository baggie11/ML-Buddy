from flask import Flask, request, jsonify
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.document_loaders import WebBaseLoader
from langchain.chains import StuffDocumentsChain
from langchain.chains.llm import LLMChain
from langchain.prompts import PromptTemplate
from langchain.schema import Document
import os

# Set your Gemini API key
os.environ["GOOGLE_API_KEY"] = "YOUR-API-KEY"

# Initialize Flask app
app = Flask(__name__)

# Initialize Gemini Flash 1.5 model
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")

# Prompt for summarization
summary_prompt = PromptTemplate.from_template(
    """
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
"""
)


summary_chain = LLMChain(llm=llm, prompt=summary_prompt)
stuff_chain = StuffDocumentsChain(llm_chain=summary_chain, document_variable_name="text")

# Prompt for prerequisite suggestions
prereq_prompt = PromptTemplate.from_template(
    """
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
"""
)


prereq_chain = LLMChain(llm=llm, prompt=prereq_prompt)

@app.route('/summarize', methods=['POST'])
def summarize_blog():
    data = request.get_json()
    url = data.get("url")
    text = data.get("text")

    if not url and not text:
        return jsonify({"error": "Please provide either 'url' or 'text' in the request."}), 400

    try:
        # Load document(s) from URL or plain text
        if url:
            loader = WebBaseLoader(url)
            docs = loader.load()
        else:
            docs = [Document(page_content=text)]

        # Get summary
        summary_response = stuff_chain.invoke(docs)
        summary = summary_response["output_text"]

        # Get recommended prerequisite topics
        joined_text = "\n".join(doc.page_content for doc in docs)
        prereq_response = prereq_chain.invoke({"text": joined_text})
        prerequisites = prereq_response["text"]

        return jsonify({
            "summary": summary,
            "prerequisites": prerequisites.strip()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run the Flask server
if __name__ == '__main__':
    app.run(debug=True)
