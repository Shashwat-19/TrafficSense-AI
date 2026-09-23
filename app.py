import streamlit as st
import boto3
import json
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from html import escape


# ============================================================
# PAGE CONFIGURATION
# ============================================================

st.set_page_config(
    page_title="Traffic Sense AI",
    page_icon="🚦",
    layout="wide"
)


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_ID = "amazon.nova-lite-v1:0"
REGION = "us-east-1"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CHAT_FILE = os.path.join(
    BASE_DIR,
    "chat_history.json"
)

PDF_FILE = os.path.join(
    BASE_DIR,
    "traffic_sense_chat_export.pdf"
)


# ============================================================
# AWS BEDROCK CONNECTION
# ============================================================

bedrock = boto3.client(
    "bedrock-runtime",
    region_name=REGION
)


# ============================================================
# TRAFFIC SENSE AI CONTEXT
# ============================================================

TRAFFIC_CONTEXT = """
You are Traffic Sense AI, an intelligent traffic and road-safety assistant.

Your main purpose is to help users with:

- Traffic rules
- Road safety
- Traffic signs
- Traffic signals
- Safe driving practices
- Defensive driving
- Lane discipline
- Speed awareness
- Overtaking safety
- Parking awareness
- Pedestrian safety
- Cyclist safety
- Two-wheeler safety
- Vehicle safety
- Accident safety
- Emergency road situations
- Traffic congestion
- Road awareness
- Public transportation
- Responsible road behaviour
- General transportation questions

Give answers in a clear, simple and practical manner.

IMPORTANT SAFETY RULES:

1. Never encourage dangerous or reckless driving.
2. Never encourage breaking traffic laws.
3. Never provide instructions for avoiding law enforcement.
4. Do not encourage speeding, drunk driving or distracted driving.
5. For serious accidents or emergencies, advise the user to contact the appropriate local emergency services.
6. Traffic laws may differ between countries, states and cities. When a question depends on a specific local law, tell the user to verify the current local regulation.
7. Do not claim to have live traffic information, live cameras or real-time traffic data unless such data has actually been provided.
8. If the question is unrelated to traffic, transportation, driving, vehicles, pedestrians or road safety, politely respond:

"Sorry, I can only help with traffic, transportation, driving, road safety, traffic signs, and related topics."

Always prioritize human safety.
"""


# ============================================================
# CHAT HISTORY
# ============================================================

def load_history():

    if os.path.exists(CHAT_FILE):

        try:

            with open(
                CHAT_FILE,
                "r",
                encoding="utf-8"
            ) as file:

                return json.load(file)

        except Exception:

            return []

    return []


def save_history(messages):

    with open(
        CHAT_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            messages,
            file,
            indent=2,
            ensure_ascii=False
        )


# ============================================================
# FAVORITES
# ============================================================

if "favorites" not in st.session_state:

    st.session_state.favorites = []


def save_favorite(text):

    if text not in st.session_state.favorites:

        st.session_state.favorites.append(text)


# ============================================================
# PDF EXPORT
# ============================================================

def generate_pdf(messages):

    document = SimpleDocTemplate(
        PDF_FILE,
        pagesize=letter
    )

    styles = getSampleStyleSheet()

    story = [
        Paragraph(
            "Traffic Sense AI - Chat Export",
            styles["Title"]
        ),
        Spacer(1, 12)
    ]

    for message in messages:

        if message["role"] == "user":

            role = "User"

        else:

            role = "Traffic Sense AI"

        content = escape(
            str(message["content"])
        )

        content = content.replace(
            "\n",
            "<br/>"
        )

        story.append(
            Paragraph(
                f"<b>{role}:</b> {content}",
                styles["Normal"]
            )
        )

        story.append(
            Spacer(1, 8)
        )

    document.build(story)

    return PDF_FILE


# ============================================================
# GREETING DETECTION
# ============================================================

def is_greeting(text):

    greetings = [
        "hi",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
        "thanks",
        "thank you",
        "bye"
    ]

    text_lower = text.lower().strip()

    for greeting in greetings:

        if (
            text_lower == greeting
            or text_lower.startswith(greeting + " ")
        ):

            return True

    return False


# ============================================================
# TRAFFIC DOMAIN FILTER
# ============================================================

def is_traffic_domain(text):

    keywords = [

        "traffic",
        "road",
        "driving",
        "driver",
        "vehicle",
        "car",
        "bike",
        "bicycle",
        "motorcycle",
        "scooter",
        "bus",
        "truck",

        "pedestrian",
        "cyclist",
        "crosswalk",
        "zebra crossing",

        "highway",
        "intersection",
        "junction",

        "signal",
        "traffic light",
        "red light",
        "green light",
        "yellow light",

        "road sign",
        "traffic sign",
        "sign",

        "speed",
        "speed limit",

        "lane",
        "lane discipline",

        "overtaking",
        "parking",

        "accident",
        "collision",

        "emergency",

        "helmet",
        "seat belt",
        "seatbelt",

        "congestion",
        "traffic jam",
        "jam",

        "license",
        "licence",
        "rto",

        "drunk driving",
        "drowsy driving",
        "defensive driving",

        "road safety",
        "traffic rule",
        "traffic rules",

        "transport",
        "transportation",

        "pollution",
        "emission"
    ]

    text_lower = text.lower()

    return any(
        keyword in text_lower
        for keyword in keywords
    )


# ============================================================
# ASK TRAFFIC SENSE AI
# ============================================================

def ask_traffic_ai(user_question):

    payload = {

        "messages": [

            {
                "role": "user",

                "content": [
                    {
                        "text": TRAFFIC_CONTEXT
                    }
                ]
            },

            {
                "role": "user",

                "content": [
                    {
                        "text": user_question
                    }
                ]
            }

        ]
    }

    response = bedrock.invoke_model(

        modelId=MODEL_ID,

        contentType="application/json",

        accept="application/json",

        body=json.dumps(payload)
    )

    data = json.loads(
        response["body"].read()
    )

    return data[
        "output"
    ][
        "message"
    ][
        "content"
    ][0]["text"]


# ============================================================
# ROAD SIGN DATABASE
# ============================================================

ROAD_SIGNS = {

    "🛑 Stop Sign": {

        "meaning":
            "Requires the driver to come to a complete stop before proceeding.",

        "safety":
            "Stop safely, check the surroundings, and proceed only when it is safe."
    },

    "🚫 No Entry": {

        "meaning":
            "Vehicles are not permitted to enter the road from that direction.",

        "safety":
            "Do not enter a road marked with a No Entry sign."
    },

    "⚠️ Warning Sign": {

        "meaning":
            "Warns drivers about a possible hazard or unusual road condition ahead.",

        "safety":
            "Reduce speed and stay alert for changing road conditions."
    },

    "🚸 Pedestrian Crossing": {

        "meaning":
            "Indicates an area where pedestrians may cross the road.",

        "safety":
            "Slow down and give pedestrians appropriate right of way."
    },

    "🏫 School Zone": {

        "meaning":
            "Indicates an area where children may be present.",

        "safety":
            "Drive slowly and be prepared for children crossing the road."
    },

    "⛔ No Overtaking": {

        "meaning":
            "Overtaking is prohibited in the indicated area.",

        "safety":
            "Maintain your lane and wait until overtaking is permitted."
    },

    "🅿️ Parking Sign": {

        "meaning":
            "Indicates a designated parking area or parking-related information.",

        "safety":
            "Follow the displayed parking restrictions and instructions."
    },

    "🚦 Traffic Signal": {

        "meaning":
            "Controls the movement of vehicles and pedestrians at an intersection.",

        "safety":
            "Follow the active traffic signal and stop when required."
    }
}


# ============================================================
# TRAFFIC SCENARIOS
# ============================================================

SCENARIOS = {

    "🚗 Heavy Traffic": (

        "Heavy traffic or congestion",

        "Vehicles are moving slowly and traffic is congested."
    ),

    "🚦 Red Signal": (

        "Approaching a red traffic signal",

        "The traffic signal is red."
    ),

    "🚸 Pedestrian Crossing": (

        "Approaching a pedestrian crossing",

        "Pedestrians may be crossing the road."
    ),

    "🌧️ Driving in Rain": (

        "Driving during heavy rain",

        "Rain can reduce visibility and road grip."
    ),

    "🌙 Night Driving": (

        "Driving at night",

        "Visibility may be reduced in low-light conditions."
    ),

    "🚑 Accident Nearby": (

        "Accident or collision nearby",

        "A road accident has occurred nearby."
    ),

    "🏍️ Two-Wheeler Safety": (

        "Two-wheeler safety",

        "The user wants safety guidance for motorcycle or scooter riding."
    )
}


def scenario_advice(scenario):

    title, description = SCENARIOS[scenario]

    prompt = f"""

Provide practical road-safety guidance for the following situation.

Situation:
{title}

Description:
{description}

Give the response in these sections:

1. Immediate Safe Actions
2. What to Avoid
3. Important Safety Precautions
4. Short Safety Reminder

Keep the answer concise, practical and easy to understand.

Do not provide dangerous or illegal driving instructions.
"""

    return ask_traffic_ai(prompt)


# ============================================================
# TRAFFIC SAFETY QUIZ
# ============================================================

QUIZ_QUESTIONS = [

    {

        "question":
            "What should you do when approaching a red traffic signal?",

        "options": [
            "Speed up",
            "Stop safely",
            "Overtake other vehicles",
            "Ignore the signal"
        ],

        "answer":
            "Stop safely"
    },

    {

        "question":
            "What is an important safety practice for two-wheeler riders?",

        "options": [
            "Wear a helmet",
            "Use a phone while riding",
            "Ride without lights at night",
            "Ignore lane markings"
        ],

        "answer":
            "Wear a helmet"
    },

    {

        "question":
            "What should drivers do near a pedestrian crossing?",

        "options": [
            "Increase speed",
            "Use the horn continuously",
            "Slow down and watch for pedestrians",
            "Overtake immediately"
        ],

        "answer":
            "Slow down and watch for pedestrians"
    },

    {

        "question":
            "What is a good practice during heavy rain?",

        "options": [
            "Drive faster",
            "Reduce speed and maintain safe distance",
            "Turn off headlights",
            "Follow vehicles very closely"
        ],

        "answer":
            "Reduce speed and maintain safe distance"
    },

    {

        "question":
            "What does a Stop sign require a driver to do?",

        "options": [
            "Slow down only",
            "Stop completely",
            "Overtake",
            "Change lanes immediately"
        ],

        "answer":
            "Stop completely"
    }
]


# ============================================================
# SESSION STATE
# ============================================================

if "messages" not in st.session_state:

    st.session_state.messages = load_history()


if "favorites" not in st.session_state:

    st.session_state.favorites = []


if "quiz_score" not in st.session_state:

    st.session_state.quiz_score = 0


if "quiz_submitted" not in st.session_state:

    st.session_state.quiz_submitted = False


# ============================================================
# SIDEBAR
# ============================================================

st.sidebar.title(
    "🚦 Traffic Sense AI"
)

st.sidebar.caption(
    "AI-powered traffic and road-safety assistant"
)

st.sidebar.markdown("---")


mode = st.sidebar.radio(

    "Choose Mode",

    [
        "💬 Traffic AI Chat",
        "🚗 Scenario Advisor",
        "🛑 Road Sign Guide",
        "🧠 Safety Quiz"
    ]
)


st.sidebar.markdown("---")


# ============================================================
# CLEAR CHAT
# ============================================================

if st.sidebar.button(
    "🗑️ Clear All Chats"
):

    st.session_state.messages = []

    save_history([])

    st.rerun()


# ============================================================
# CHAT HISTORY
# ============================================================

st.sidebar.markdown(
    "### 📜 Chat History"
)

user_messages = [

    message

    for message in st.session_state.messages

    if message["role"] == "user"
]


for i, message in enumerate(user_messages):

    cols = st.sidebar.columns(
        [6, 1]
    )

    cols[0].markdown(
        message["content"][:30] + "..."
    )

    if cols[1].button(
        "❌",
        key=f"delete_{i}"
    ):

        if message in st.session_state.messages:

            index = st.session_state.messages.index(
                message
            )

            st.session_state.messages.pop(
                index
            )

            if (
                index < len(
                    st.session_state.messages
                )
                and
                st.session_state.messages[index]["role"]
                == "assistant"
            ):

                st.session_state.messages.pop(
                    index
                )

        save_history(
            st.session_state.messages
        )

        st.rerun()


# ============================================================
# FAVORITES
# ============================================================

st.sidebar.markdown(
    "### ❤️ Saved Answers"
)


if st.session_state.favorites:

    for favorite in st.session_state.favorites:

        st.sidebar.markdown(
            "- " + favorite[:45] + "..."
        )

else:

    st.sidebar.caption(
        "No saved answers yet."
    )


# ============================================================
# PDF DOWNLOAD
# ============================================================

if st.session_state.messages:

    pdf_path = generate_pdf(
        st.session_state.messages
    )

    with open(
        pdf_path,
        "rb"
    ) as pdf_file:

        st.sidebar.download_button(

            "📄 Download Chat as PDF",

            pdf_file,

            "Traffic_Sense_AI_Chat.pdf",

            mime="application/pdf"
        )


# ============================================================
# MAIN HEADER
# ============================================================

st.markdown(

    """
    <h1 style="text-align:center;">
        🚦 Traffic Sense AI
    </h1>
    """,

    unsafe_allow_html=True
)


st.markdown(

    """
    <p style="text-align:center;">
        AI-Powered Traffic Awareness and Road Safety Assistant
    </p>
    """,

    unsafe_allow_html=True
)


st.markdown("---")


# ============================================================
# MODE 1: TRAFFIC AI CHAT
# ============================================================

if mode == "💬 Traffic AI Chat":

    st.subheader(
        "💬 Ask Traffic Sense AI"
    )

    st.info(

        "Ask questions about traffic rules, "
        "road signs, safe driving, pedestrian safety, "
        "traffic situations and road awareness."
    )


    # Display previous messages

    for i, message in enumerate(
        st.session_state.messages
    ):

        with st.chat_message(
            message["role"]
        ):

            st.markdown(
                message["content"]
            )

            if message["role"] == "assistant":

                if st.button(
                    "❤️ Save",
                    key=f"save_{i}"
                ):

                    save_favorite(
                        message["content"]
                    )

                    st.success(
                        "Answer saved!"
                    )


    user_input = st.chat_input(

        "Ask a traffic or road-safety question..."
    )


    if user_input:

        st.session_state.messages.append(

            {
                "role": "user",
                "content": user_input
            }
        )

        save_history(
            st.session_state.messages
        )


        try:

            if is_greeting(
                user_input
            ):

                reply = (

                    "Hello! 👋🚦 I am Traffic Sense AI. "
                    "Ask me about traffic rules, road signs, "
                    "safe driving, pedestrian safety, "
                    "or road-related situations."
                )


            elif not is_traffic_domain(
                user_input
            ):

                reply = (

                    "Sorry, I can only help with "
                    "traffic, transportation, driving, "
                    "road safety, traffic signs, "
                    "and related topics. 🚦"
                )


            else:

                reply = ask_traffic_ai(
                    user_input
                )


        except Exception as error:

            reply = (

                "⚠️ I couldn't connect to the AI service "
                "right now. Please check your AWS "
                "credentials, Amazon Bedrock access, "
                "region and model availability."
            )

            st.error(
                f"Technical error: {error}"
            )


        st.session_state.messages.append(

            {
                "role": "assistant",
                "content": reply
            }
        )

        save_history(
            st.session_state.messages
        )

        st.rerun()


# ============================================================
# MODE 2: SCENARIO ADVISOR
# ============================================================

elif mode == "🚗 Scenario Advisor":

    st.subheader(
        "🚗 Traffic Scenario Advisor"
    )

    st.write(

        "Select a traffic situation and let "
        "Traffic Sense AI provide safety guidance."
    )


    scenario = st.selectbox(

        "Select a traffic scenario",

        list(
            SCENARIOS.keys()
        )
    )


    st.markdown(
        f"### Selected Situation: {scenario}"
    )


    if st.button(

        "🤖 Get Safety Advice",

        use_container_width=True
    ):

        with st.spinner(
            "Traffic Sense AI is analysing the situation..."
        ):

            try:

                advice = scenario_advice(
                    scenario
                )

                st.success(
                    "Safety advice generated successfully."
                )

                st.markdown(
                    advice
                )

                if st.button(
                    "❤️ Save Advice",
                    key="save_advice"
                ):

                    save_favorite(
                        advice
                    )

                    st.success(
                        "Advice saved!"
                    )

            except Exception as error:

                st.error(
                    f"Unable to generate advice: {error}"
                )


# ============================================================
# MODE 3: ROAD SIGN GUIDE
# ============================================================

elif mode == "🛑 Road Sign Guide":

    st.subheader(
        "🛑 Road Sign Guide"
    )

    st.write(

        "Select a road sign to understand "
        "its meaning and recommended safety behaviour."
    )


    selected_sign = st.selectbox(

        "Select a road sign",

        list(
            ROAD_SIGNS.keys()
        )
    )


    sign = ROAD_SIGNS[
        selected_sign
    ]


    st.markdown(
        f"## {selected_sign}"
    )


    st.info(

        f"**Meaning:** {sign['meaning']}"
    )


    st.success(

        f"**Safety Advice:** {sign['safety']}"
    )


    st.markdown("---")


    st.markdown(
        "### 🚦 Remember"
    )


    st.write(

        "Always observe road signs, traffic signals "
        "and applicable local traffic regulations."
    )


# ============================================================
# MODE 4: SAFETY QUIZ
# ============================================================

elif mode == "🧠 Safety Quiz":

    st.subheader(
        "🧠 Traffic Safety Quiz"
    )

    st.write(

        "Test your knowledge of basic traffic "
        "and road-safety practices."
    )


    answers = []


    for i, question in enumerate(
        QUIZ_QUESTIONS
    ):

        st.markdown(
            f"### Question {i + 1}"
        )

        st.write(
            question["question"]
        )


        answer = st.radio(

            "Select your answer:",

            question["options"],

            key=f"question_{i}"
        )


        answers.append(
            answer
        )


    if st.button(

        "✅ Submit Quiz",

        use_container_width=True
    ):

        score = 0


        for i, question in enumerate(
            QUIZ_QUESTIONS
        ):

            if (
                answers[i]
                == question["answer"]
            ):

                score += 1


        st.session_state.quiz_score = score

        st.session_state.quiz_submitted = True


    if st.session_state.quiz_submitted:

        score = st.session_state.quiz_score

        total = len(
            QUIZ_QUESTIONS
        )


        st.markdown("---")


        st.success(

            f"🎉 Your Score: {score}/{total}"
        )


        percentage = (
            score / total
        ) * 100


        if percentage >= 80:

            st.info(

                "Excellent! You have a strong "
                "understanding of basic road-safety practices. 🚦"
            )


        elif percentage >= 60:

            st.info(

                "Good job! Keep improving your "
                "knowledge of traffic safety. 👍"
            )


        else:

            st.warning(

                "Keep learning! Understanding traffic "
                "rules helps make roads safer for everyone."
            )


        if st.button(
            "🔄 Retake Quiz"
        ):

            st.session_state.quiz_submitted = False

            st.session_state.quiz_score = 0

            st.rerun()


# ============================================================
# FOOTER
# ============================================================

st.markdown("---")

st.markdown(

    """
    <div style="text-align:center;">
        <small>
            🚦 Traffic Sense AI |
            AI-Powered Traffic Awareness & Road Safety
        </small>
    </div>
    """,

    unsafe_allow_html=True
)