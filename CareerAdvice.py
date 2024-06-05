from openai import AzureOpenAI
import requests
from bs4 import BeautifulSoup
from fuzzywuzzy import process, fuzz
import logging
import json
from flask import Flask, request, render_template_string
import os

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Load configuration
with open('config.json', 'r') as config_file:
    config = json.load(config_file)

api_key = config.get('azure_openai_api_key')
azure_endpoint = config.get('azure_endpoint')
api_version = config.get('api_version')

if not api_key:
    raise ValueError("API key not found in configuration file.")

client = AzureOpenAI(
    azure_endpoint=azure_endpoint,
    api_key=api_key,
    api_version=api_version
)


# Fetch the list of programs from the university's academic page
def fetch_programs():
    try:
        logging.debug("Fetching programs from Appalachian State University website.")
        url = "https://www.appstate.edu/academics/all/"
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')

        programs = {}
        table = soup.find('table', id='programs-table')
        if table:
            rows = table.find_all('tr')
            for row in rows:
                cell = row.find('td')
                if cell:
                    program_div = cell.find('div', class_='program-name')
                    if program_div:
                        program_link = program_div.find('a')
                        if program_link:
                            program_name = program_link.get_text(strip=True).lower()
                            program_url = program_link['href']
                            if program_url.startswith('http'):
                                full_url = program_url
                            else:
                                full_url = f"https://www.appstate.edu{program_url}"
                            programs[program_name] = full_url
                            logging.debug(f"Found program: {program_name} -> {full_url}")

        if not programs:
            logging.warning("No programs were fetched from the website. Please check the URL and parsing logic.")
        else:
            logging.debug(f"Programs fetched: {programs}")

        return programs

    except Exception as e:
        logging.error(f"Error occurred while fetching programs: {str(e)}")
        return {}


programs = fetch_programs()
program_names = list(programs.keys())
ai_response_cache = {}


def infer_program_url(profession, programs):
    profession_lower = profession.lower()
    logging.debug(f"Matching profession: {profession_lower}")

    if profession_lower in ai_response_cache:
        ai_suggested_program = ai_response_cache[profession_lower]
    else:
        messages = [
            {"role": "system", "content": "You are an expert in matching professions to academic programs."},
            {"role": "user",
             "content": f"Given the profession '{profession}', which of the following academic programs would be most "
                        f"relevant based on the name and description?\n\n{chr(10).join(program_names)}\n\nPlease "
                        f"provide only the exact name of the most relevant program, without any additional "
                        f"explanation."}
        ]

        response = client.chat.completions.create(
            model="IndFind_Test",
            messages=messages,
            max_tokens=100,
            temperature=0.7
        )

        ai_suggested_program = response.choices[0].message.content.strip().lower()
        logging.debug(f"AI-suggested relevant program: {ai_suggested_program}")
        ai_response_cache[profession_lower] = ai_suggested_program

    closest_match = process.extractOne(ai_suggested_program, program_names, scorer=fuzz.token_set_ratio)
    logging.debug(f"Closest match found: {closest_match[0]} with score {closest_match[1]}")

    if closest_match and closest_match[1] >= 80:
        program_url = programs[closest_match[0]]
        logging.debug(f"Best match found: {program_url}")
        return program_url

    logging.debug("No relevant match found, defaulting to main academics page.")
    return "https://www.appstate.edu/academics/all/"


app = Flask(__name__)


@app.route('/')
def home():
    return render_template_string('''
        <form action="/generate_advice" method="post">
            <label for="major">Major:</label>
            <input type="text" id="major" name="major"><br><br>
            <label for="interests">Interests:</label>
            <input type="text" id="interests" name="interests"><br><br>
            <input type="submit" value="Generate Advice">
        </form>
    ''')


@app.route('/generate_advice', methods=['POST'])
def generate_advice():
    major = request.form['major']
    interests = request.form['interests']
    advice = generate_career_advice(major, interests)
    return render_template_string('<h1>Career Advice</h1><pre>{{ advice }}</pre>', advice=advice)


def generate_career_advice(major, interests):
    messages = [
        {"role": "system",
         "content": "You are an expert in giving career advice and work within the Appalachian State University "
                    "Career Development Center."},
        {"role": "user",
         "content": f"I am a student majoring in {major} with interests in {interests}. What career paths would you "
                    f"recommend for me and why? Please provide a brief description for each career path, and start "
                    f"each career path with a number followed by a period and the profession name, like this: '1. "
                    f"Profession Name: Description'."}
    ]

    response = client.chat.completions.create(
        model="IndFind_Test",
        messages=messages,
        max_tokens=600,
        temperature=0.7
    )

    return response.choices[0].message.content.strip()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host='0.0.0.0', port=port)
