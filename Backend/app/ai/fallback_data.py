"""
A small curated "job title -> recommended skills" dataset. Used as a
graceful fallback when no ANTHROPIC_API_KEY is configured (or if the AI
call fails for any reason), so the career advisor feature always works
out of the box, without requiring an API key just to try the app.

Matching is a simple keyword/substring lookup against the job title,
which is deliberately forgiving (e.g. "senior software engineer",
"software developer", and "backend engineer" should all reasonably match
something useful) rather than an exact-match dictionary.
"""


def _s(name, category, reason, priority):
    return {"name": name, "category": category, "reason": reason, "priority": priority}


JOB_SKILL_LIBRARY = {
    "software engineer": {
        "summary": "Software engineers build and maintain applications. A strong "
        "foundation in a programming language, data structures, and collaborative "
        "development practices goes a long way.",
        "skills": [
            _s("Python", "Technology", "A versatile, widely-used language for backend, scripting, and data work.", "high"),
            _s("JavaScript", "Technology", "Essential for web development, both frontend and backend (Node.js).", "high"),
            _s("Data Structures & Algorithms", "Technology", "Core to technical interviews and writing efficient code.", "high"),
            _s("Git", "Technology", "Version control is a baseline expectation on every engineering team.", "medium"),
            _s("SQL", "Technology", "Most applications need to read and write structured data.", "medium"),
            _s("System Design", "Technology", "Needed to design scalable services as you grow into senior roles.", "medium"),
        ],
    },
    "data scientist": {
        "summary": "Data scientists turn raw data into decisions. Statistics and "
        "programming are the foundation; communicating findings clearly is what "
        "makes the work actually useful.",
        "skills": [
            _s("Python", "Technology", "The standard language for data analysis and machine learning.", "high"),
            _s("Statistics", "Academics", "Underpins every valid conclusion you draw from data.", "high"),
            _s("Machine Learning", "Technology", "Core modeling techniques for prediction and classification.", "high"),
            _s("SQL", "Technology", "Most real-world data lives in databases you need to query.", "medium"),
            _s("Data Visualization", "Technology", "Communicating insights is as important as finding them.", "medium"),
        ],
    },
    "data analyst": {
        "summary": "Data analysts explore data to answer business questions. Spreadsheet "
        "and SQL fluency plus clear communication matter more than deep ML knowledge here.",
        "skills": [
            _s("Excel", "Business", "Still the most common tool for quick analysis in most companies.", "high"),
            _s("SQL", "Technology", "The standard way to pull and shape data from databases.", "high"),
            _s("Data Visualization", "Technology", "Dashboards and charts are how insights reach decision-makers.", "high"),
            _s("Statistics", "Academics", "Helps you avoid drawing the wrong conclusions from data.", "medium"),
            _s("Python", "Technology", "Useful once analysis needs go beyond spreadsheets.", "low"),
        ],
    },
    "product manager": {
        "summary": "Product managers sit between users, business goals, and engineering. "
        "The role leans heavily on communication, prioritization, and data-informed judgment.",
        "skills": [
            _s("Product Strategy", "Business", "Defining what to build and why is the core of the job.", "high"),
            _s("Communication", "Business", "You will spend most of your time aligning stakeholders.", "high"),
            _s("Data Analysis", "Business", "Prioritization decisions should be backed by evidence.", "medium"),
            _s("Agile/Scrum", "Business", "The most common framework for running product development.", "medium"),
            _s("UX Research", "Business", "Understanding user needs shapes good product decisions.", "medium"),
        ],
    },
    "ux designer": {
        "summary": "UX/UI designers shape how products feel to use. Research and "
        "prototyping skills matter as much as visual craft.",
        "skills": [
            _s("Figma", "Art", "The industry-standard tool for interface design and prototyping.", "high"),
            _s("User Research", "Art", "Good design starts with understanding real user needs.", "high"),
            _s("Wireframing", "Art", "The fastest way to explore and communicate layout ideas.", "medium"),
            _s("Visual Design", "Art", "Typography, color, and layout make interfaces usable and pleasant.", "medium"),
            _s("Prototyping", "Art", "Interactive prototypes let you test ideas before writing code.", "medium"),
        ],
    },
    "digital marketer": {
        "summary": "Digital marketers grow audiences and revenue online. A mix of "
        "analytical and creative skills covers most of what the role needs.",
        "skills": [
            _s("SEO", "Business", "Organic search is one of the highest-ROI acquisition channels.", "high"),
            _s("Content Marketing", "Business", "Content is the foundation of most digital marketing strategies.", "high"),
            _s("Google Analytics", "Business", "You cannot improve what you do not measure.", "medium"),
            _s("Social Media Marketing", "Business", "Where most audiences discover and engage with brands today.", "medium"),
            _s("Copywriting", "Business", "Persuasive writing underpins ads, emails, and landing pages.", "medium"),
        ],
    },
    "graphic designer": {
        "summary": "Graphic designers communicate visually. Strong fundamentals in "
        "layout, color, and typography transfer across print and digital work.",
        "skills": [
            _s("Adobe Photoshop", "Art", "The standard tool for image editing and composition.", "high"),
            _s("Adobe Illustrator", "Art", "Essential for vector graphics, logos, and print-ready artwork.", "high"),
            _s("Typography", "Art", "Type choices make or break a design's readability and tone.", "medium"),
            _s("Branding", "Art", "Understanding brand systems helps you design consistently.", "medium"),
            _s("Color Theory", "Art", "Color drives mood and hierarchy in every visual design.", "low"),
        ],
    },
    "financial analyst": {
        "summary": "Financial analysts evaluate numbers to guide business and investment "
        "decisions. Spreadsheet fluency and modeling are the core toolkit.",
        "skills": [
            _s("Excel", "Business", "The primary tool for financial modeling in most firms.", "high"),
            _s("Financial Modeling", "Business", "Forecasting and valuation are central to the role.", "high"),
            _s("Accounting Fundamentals", "Business", "You need to read financial statements fluently.", "medium"),
            _s("SQL", "Technology", "Increasingly used to pull data directly instead of relying on exports.", "low"),
        ],
    },
    "project manager": {
        "summary": "Project managers keep work on track, on budget, and aligned across "
        "teams. Organization and communication matter more than any single tool.",
        "skills": [
            _s("Agile/Scrum", "Business", "The most widely used framework for managing iterative work.", "high"),
            _s("Communication", "Business", "Most of the job is keeping people aligned and informed.", "high"),
            _s("Risk Management", "Business", "Anticipating what could go wrong keeps projects on track.", "medium"),
            _s("Budgeting", "Business", "Projects live and die by whether they stay within budget.", "medium"),
        ],
    },
    "mobile app developer": {
        "summary": "Mobile developers build apps for iOS and Android. Pick one native "
        "stack or a cross-platform framework and go deep.",
        "skills": [
            _s("Swift", "Technology", "The native language for iOS development.", "high"),
            _s("Kotlin", "Technology", "The modern native language for Android development.", "high"),
            _s("React Native", "Technology", "A popular way to build for both platforms from one codebase.", "medium"),
            _s("API Integration", "Technology", "Almost every app talks to a backend over REST or GraphQL.", "medium"),
            _s("Git", "Technology", "Version control is a baseline expectation on any dev team.", "low"),
        ],
    },
    "machine learning engineer": {
        "summary": "ML engineers take models from notebook to production. This blends "
        "data science with solid software engineering practices.",
        "skills": [
            _s("Python", "Technology", "The dominant language across the ML ecosystem.", "high"),
            _s("Machine Learning", "Technology", "You need to understand the models you are deploying.", "high"),
            _s("Statistics", "Academics", "The mathematical foundation behind every ML model.", "medium"),
            _s("MLOps", "Technology", "Deploying and monitoring models reliably is half the job.", "medium"),
            _s("Data Engineering", "Technology", "Models are only as good as the pipelines feeding them.", "medium"),
        ],
    },
    "cloud engineer": {
        "summary": "Cloud engineers design and run infrastructure on platforms like AWS, "
        "Azure, or GCP. Containers and networking fundamentals come up constantly.",
        "skills": [
            _s("AWS", "Technology", "The most widely used cloud platform in the industry.", "high"),
            _s("Docker", "Technology", "Containerization is the standard way to package modern applications.", "high"),
            _s("Kubernetes", "Technology", "The standard for orchestrating containers at scale.", "medium"),
            _s("Linux", "Technology", "Most cloud infrastructure runs on Linux under the hood.", "medium"),
            _s("Networking Fundamentals", "Technology", "Cloud architecture is built on core networking concepts.", "medium"),
        ],
    },
    "content writer": {
        "summary": "Content writers create the words that inform, persuade, and rank. "
        "Clear writing plus a bit of SEO know-how covers most of the role.",
        "skills": [
            _s("Copywriting", "Business", "Persuasive, concise writing is the core craft of the role.", "high"),
            _s("SEO Writing", "Business", "Most content is written to be found via search.", "high"),
            _s("Research", "Academics", "Credible content requires solid research skills.", "medium"),
            _s("Editing", "Business", "Good writing is rewriting, and editing is a learnable skill.", "medium"),
        ],
    },
    "business analyst": {
        "summary": "Business analysts bridge business needs and technical solutions. "
        "Structured thinking and stakeholder communication are key.",
        "skills": [
            _s("Requirements Gathering", "Business", "Translating business needs into clear specs is the core skill.", "high"),
            _s("SQL", "Technology", "Often needed to validate data and answer stakeholder questions.", "medium"),
            _s("Process Mapping", "Business", "Visualizing workflows helps identify inefficiencies.", "medium"),
            _s("Excel", "Business", "Still the everyday tool for quick analysis in most orgs.", "medium"),
        ],
    },
    "cybersecurity analyst": {
        "summary": "Cybersecurity analysts protect systems and data from threats. A mix "
        "of technical depth and careful, methodical thinking is essential.",
        "skills": [
            _s("Network Security", "Technology", "Understanding how networks are attacked is foundational.", "high"),
            _s("Risk Assessment", "Technology", "Prioritizing what to protect first is a core daily task.", "high"),
            _s("Ethical Hacking", "Technology", "Thinking like an attacker helps you defend more effectively.", "medium"),
            _s("Incident Response", "Technology", "Knowing how to react when something goes wrong is critical.", "medium"),
        ],
    },
}

GENERIC_FALLBACK_SKILLS = [
    _s("Communication", "Business", "Clear communication helps in virtually every career path.", "medium"),
    _s("Critical Thinking", "Academics", "A transferable skill valued across almost any role.", "medium"),
    _s("Time Management", "Business", "Staying organized and prioritizing well pays off everywhere.", "low"),
    _s("Basic Computer Literacy", "Technology", "A baseline for nearly all modern jobs.", "low"),
]

KEYWORD_MAP = {
    "software engineer": ["developer", "programmer", "engineer", "backend", "frontend", "full stack", "fullstack"],
    "data scientist": ["data science", "ml scientist"],
    "data analyst": ["data analytics", "reporting analyst"],
    "product manager": ["product owner", "product management"],
    "ux designer": ["ui designer", "product designer", "ux/ui"],
    "digital marketer": ["marketing", "growth marketer", "seo specialist"],
    "graphic designer": ["visual designer", "illustrator"],
    "financial analyst": ["finance analyst", "investment analyst"],
    "project manager": ["program manager", "delivery manager"],
    "mobile app developer": ["ios developer", "android developer", "app developer"],
    "machine learning engineer": ["ml engineer", "ai engineer"],
    "cloud engineer": ["devops engineer", "site reliability", "infrastructure engineer"],
    "content writer": ["copywriter", "blog writer", "technical writer"],
    "business analyst": ["systems analyst"],
    "cybersecurity analyst": ["security analyst", "infosec analyst", "security engineer"],
}


def find_fallback_recommendation(job_title):
    """Keyword-match the job title against the curated library.
    Returns (summary, skills, matched); matched is False when the generic
    skill list was used instead."""
    normalized = job_title.strip().lower()

    for key, entry in JOB_SKILL_LIBRARY.items():
        if key in normalized or normalized in key:
            return entry["summary"], entry["skills"], True

    for key, keywords in KEYWORD_MAP.items():
        if any(kw in normalized for kw in keywords):
            entry = JOB_SKILL_LIBRARY[key]
            return entry["summary"], entry["skills"], True

    return (
        f'We don\'t have a tailored skill path for "{job_title}" yet, so here are some '
        "broadly useful professional skills. Connect an AI API key on the backend for "
        "fully tailored recommendations for any job title.",
        GENERIC_FALLBACK_SKILLS,
        False,
    )
