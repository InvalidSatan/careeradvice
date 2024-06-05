from openai import AzureOpenAI
import customtkinter as ctk
import webbrowser
import requests
from bs4 import BeautifulSoup
from fuzzywuzzy import process, fuzz
import logging
import json

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

# Dictionary mapping professions to App State program URLs
base_profession_to_url = {
    "Actuary": "https://www.appstate.edu/academics/id/mathematics/",
    "Data Analyst": "https://www.appstate.edu/academics/id/computer-science/",
    "Agricultural Economist": "https://www.appstate.edu/academics/id/agriculture-education/",
    "Agricultural Statistician": "https://www.appstate.edu/academics/id/statistics/",
    "Livestock Geneticist": "https://www.appstate.edu/academics/id/animal-science/",
    "Communication Studies": "https://www.appstate.edu/academics/id/communication/",
    "Environmental Scientist": "https://www.appstate.edu/academics/id/environmental-science/",
    "Health Care Management": "https://www.appstate.edu/academics/id/health-care-management/",
    "Public Health": "https://www.appstate.edu/academics/id/public-health/",
    "Economics": "https://www.appstate.edu/academics/id/economics/",
    "Marketing": "https://www.appstate.edu/academics/id/marketing/",
    "Physics": "https://www.appstate.edu/academics/id/physics/",
    "Sustainable Technology": "https://www.appstate.edu/academics/id/sustainable-technology/",
    "Music": "https://www.appstate.edu/academics/id/music/",
    "Business Administration": "https://www.appstate.edu/academics/id/business-administration/",
    "Criminal Justice": "https://www.appstate.edu/academics/id/criminal-justice/",
    "English (Creative Writing)": "https://www.appstate.edu/academics/id/english/",
    "Geology": "https://www.appstate.edu/academics/id/geology/",
    "Graphic Design": "https://www.appstate.edu/academics/id/graphic-design/",
    "History": "https://www.appstate.edu/academics/id/history/",
    "Hospitality and Tourism Management": "https://www.appstate.edu/academics/id/hospitality-and-tourism-management/",
    "Industrial Design": "https://www.appstate.edu/academics/id/industrial-design/",
    "International Business": "https://www.appstate.edu/academics/id/international-business/",
    "Languages, Literatures, and Cultures (French)": "https://www.appstate.edu/academics/id/languages-literatures-and-cultures/",
    "Languages, Literatures, and Cultures (Spanish)": "https://www.appstate.edu/academics/id/languages-literatures-and-cultures/",
    "Management": "https://www.appstate.edu/academics/id/management/",
    "Mathematics": "https://www.appstate.edu/academics/id/mathematics/",
    "Middle Grades Education": "https://www.appstate.edu/academics/id/middle-grades-education/",
    "Music Education": "https://www.appstate.edu/academics/id/music-education/",
    "Nursing": "https://www.appstate.edu/academics/id/nursing/",
    "Political Science": "https://www.appstate.edu/academics/id/political-science/",
    "Psychology": "https://www.appstate.edu/academics/id/psychology/",
    "Sociology": "https://www.appstate.edu/academics/id/sociology/",
    "Special Education": "https://www.appstate.edu/academics/id/special-education/",
    "Sustainable Development": "https://www.appstate.edu/academics/id/sustainable-development/",
    "Theatre Arts": "https://www.appstate.edu/academics/id/theatre-arts/",
    "Anthropology": "https://www.appstate.edu/academics/id/anthropology/",
    "Biology": "https://www.appstate.edu/academics/id/biology/",
    "Chemistry": "https://www.appstate.edu/academics/id/chemistry/",
    "Computer Science": "https://www.appstate.edu/academics/id/computer-science/",
    "Environmental Science": "https://www.appstate.edu/academics/id/environmental-science/",
    "Exercise Science": "https://www.appstate.edu/academics/id/exercise-science/",
    "Interior Design": "https://www.appstate.edu/academics/id/interior-design/",
    "Mathematics (Statistics)": "https://www.appstate.edu/academics/id/mathematics/",
    "Nutrition and Foods": "https://www.appstate.edu/academics/id/nutrition-and-foods/",
    "Philosophy": "https://www.appstate.edu/academics/id/philosophy/",
    "Physics and Astronomy": "https://www.appstate.edu/academics/id/physics-and-astronomy/",
    "Recreation Management": "https://www.appstate.edu/academics/id/recreation-management/",
    "Religious Studies": "https://www.appstate.edu/academics/id/religious-studies/",
    "Social Work": "https://www.appstate.edu/academics/id/social-work/",
    "Technology": "https://www.appstate.edu/academics/id/technology/",
    "Women's Studies": "https://www.appstate.edu/academics/id/womens-studies/"
}

# Initialize a list to keep track of tab names
tab_names = []


# Function to generate career advice
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


# Integrate the updated logic into the main application
def on_generate_click():
    major = major_entry.get()
    interests = interests_entry.get()
    advice = generate_career_advice(major, interests)

    # Clear existing tabs
    global tab_names
    for tab in tab_names:
        notebook.delete(tab)
    tab_names = []

    # Fetch the latest programs
    programs = fetch_programs()

    # Extract professions and their descriptions from the advice
    professions = {}
    current_profession = None
    for line in advice.split("\n"):
        if line.startswith(("1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.")):
            profession_name = line.split(":")[0].split(".", 1)[1].strip()
            current_profession = profession_name
            professions[current_profession] = line.split(":", 1)[1].strip() + "\n"
        elif current_profession:
            professions[current_profession] += line.strip() + "\n"

    # Create tabs for each profession and display the description and more info link
    for profession, description in professions.items():
        tab = notebook.add(profession)
        tab_names.append(profession)

        # Create a Google search URL for more info
        info_url = f"https://www.google.com/search?q=What+does+a+{profession.replace(' ', '+')}+do?"

        # Get the relevant App State program URL using the improved infer function
        program_url = infer_program_url(profession, programs)

        # Display profession description and more info link in the tab
        description_text = ctk.CTkTextbox(tab, width=400, height=150, wrap="word")
        description_text.insert("0.0", description.strip())
        description_text.pack(padx=5, pady=5)

        more_info_button = ctk.CTkButton(tab, text="More Info", command=lambda url=info_url: open_website(url),
                                         fg_color="#FFCC00", hover_color="#666666", text_color="#003366")
        more_info_button.pack(padx=5, pady=5)

        program_button = ctk.CTkButton(tab, text="Relevant Program", command=lambda url=program_url: open_website(url),
                                       fg_color="#FFCC00", hover_color="#666666", text_color="#003366")
        program_button.pack(padx=5, pady=5)

    # Resize the window based on the tab content
    window.update_idletasks()
    window.geometry(f"{window.winfo_reqwidth()}x{window.winfo_reqheight()}")


# Function to open a website
def open_website(url):
    webbrowser.open_new(url)


# Create the main window
ctk.set_appearance_mode("dark")  # Set dark mode
window = ctk.CTk()
window.title("Career Advice Generator")
window.geometry("800x600")

# Create a frame for navigation links
links_frame = ctk.CTkFrame(window, fg_color="#333333")
links_frame.pack(pady=5, fill="x")


def create_link(label, url):
    link = ctk.CTkLabel(links_frame, text=label, text_color="#FFCC00", cursor="hand2", font=("Arial", 12, "bold"))
    link.pack(side="left", padx=10, pady=5)
    link.bind("<Button-1>", lambda e: open_website(url))


# Fetch the list of programs from the university's academic page
# Cache for AI responses
ai_response_cache = {}


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


# Preprocess and clean program names once
programs = fetch_programs()
program_names = list(programs.keys())


def infer_program_url(profession, programs):
    profession_lower = profession.lower()
    logging.debug(f"Matching profession: {profession_lower}")

    # Check the cache first
    if profession_lower in ai_response_cache:
        ai_suggested_program = ai_response_cache[profession_lower]
    else:
        # Make an API call to the AI model to determine the most relevant program
        messages = [
            {"role": "system", "content": "You are an expert in matching professions to academic programs."},
            {"role": "user",
             "content": f"Given the profession '{profession}', which of the following academic programs would be most relevant based on the name and description?\n\n{chr(10).join(program_names)}\n\nPlease provide only the exact name of the most relevant program, without any additional explanation."}
        ]

        response = client.chat.completions.create(
            model="IndFind_Test",
            messages=messages,
            max_tokens=100,
            temperature=0.7
        )

        ai_suggested_program = response.choices[0].message.content.strip().lower()
        logging.debug(f"AI-suggested relevant program: {ai_suggested_program}")

        # Cache the response
        ai_response_cache[profession_lower] = ai_suggested_program

    # Use fuzzy matching to find the closest match
    closest_match = process.extractOne(ai_suggested_program, program_names, scorer=fuzz.token_set_ratio)
    logging.debug(f"Closest match found: {closest_match[0]} with score {closest_match[1]}")

    if closest_match and closest_match[1] >= 80:  # Use a threshold to ensure good matches
        program_url = programs[closest_match[0]]
        logging.debug(f"Best match found: {program_url}")
        return program_url

    logging.debug("No relevant match found, defaulting to main academics page.")
    # Default URL if no match found
    return "https://www.appstate.edu/academics/all/"


create_link("Career Center", "https://careers.appstate.edu/")
create_link("Handshake", "https://appstate.joinhandshake.com/")
create_link("LinkedIn Learning", "https://www.linkedin.com/learning/")

# Create and position the labels, entries, and button with accessible colors
input_frame = ctk.CTkFrame(window, fg_color="#333333")
input_frame.pack(pady=5, fill="x", expand=True)

major_label = ctk.CTkLabel(input_frame, text="Major:", text_color="#FFFFFF")
major_label.pack(pady=5)
major_entry = ctk.CTkEntry(input_frame, width=400, fg_color="#333333", border_color="#FFFFFF", text_color="#FFFFFF")
major_entry.pack(pady=5)

interests_label = ctk.CTkLabel(input_frame, text="Interests:", text_color="#FFFFFF")
interests_label.pack(pady=5)
interests_entry = ctk.CTkEntry(input_frame, width=400, fg_color="#333333", border_color="#FFFFFF", text_color="#FFFFFF")
interests_entry.pack(pady=5)

generate_button = ctk.CTkButton(input_frame, text="Generate Advice", command=on_generate_click,
                                fg_color="#FFCC00", hover_color="#666666", text_color="#003366")
generate_button.pack(pady=10)

# Create and position the notebook widget for tabs
notebook = ctk.CTkTabview(window, width=400, fg_color="#333333", text_color="#FFFFFF", border_color="#FFFFFF")
notebook.pack(pady=10, fill="both", expand=True)

# Start the main event loop
window.mainloop()

