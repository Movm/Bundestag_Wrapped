"""Topic lexicons (Scheme F) - Thematic policy area categorization.

Maps nouns to political/policy topics for content analysis.
"""

from enum import Enum

from .categories import CategoryInfo


class TopicCategory(Enum):
    """Thematic policy topic categories for noun analysis (Scheme F)."""
    MIGRATION = "migration"
    KLIMA = "klima"
    WIRTSCHAFT = "wirtschaft"
    SOZIALES = "soziales"
    SICHERHEIT = "sicherheit"
    GESUNDHEIT = "gesundheit"
    EUROPA = "europa"
    DIGITAL = "digital"
    BILDUNG = "bildung"
    FINANZEN = "finanzen"
    JUSTIZ = "justiz"
    ARBEIT = "arbeit"
    MOBILITAET = "mobilitaet"


TOPIC_CATEGORY_INFO: dict[TopicCategory, CategoryInfo] = {
    TopicCategory.MIGRATION: CategoryInfo(
        name="Migration",
        description="Flucht, Asyl, Einwanderung",
        emoji="🌍",
        color="#f59e0b"  # amber
    ),
    TopicCategory.KLIMA: CategoryInfo(
        name="Klima & Umwelt",
        description="Klimaschutz, Energie, Nachhaltigkeit",
        emoji="🌱",
        color="#22c55e"  # green
    ),
    TopicCategory.WIRTSCHAFT: CategoryInfo(
        name="Wirtschaft",
        description="Unternehmen, Industrie, Handel",
        emoji="📈",
        color="#3b82f6"  # blue
    ),
    TopicCategory.SOZIALES: CategoryInfo(
        name="Soziales",
        description="Rente, Familie, Armut",
        emoji="🤝",
        color="#ec4899"  # pink
    ),
    TopicCategory.SICHERHEIT: CategoryInfo(
        name="Sicherheit",
        description="Polizei, Verteidigung, Terrorismus",
        emoji="🛡️",
        color="#6366f1"  # indigo
    ),
    TopicCategory.GESUNDHEIT: CategoryInfo(
        name="Gesundheit",
        description="Krankenhaus, Pflege, Medizin",
        emoji="🏥",
        color="#14b8a6"  # teal
    ),
    TopicCategory.EUROPA: CategoryInfo(
        name="Europa/Außen",
        description="EU, Außenpolitik, Ukraine",
        emoji="🇪🇺",
        color="#8b5cf6"  # violet
    ),
    TopicCategory.DIGITAL: CategoryInfo(
        name="Digitales & Medien",
        description="Internet, Daten, Technologie, Presse",
        emoji="💻",
        color="#06b6d4"  # cyan
    ),
    TopicCategory.BILDUNG: CategoryInfo(
        name="Bildung",
        description="Schule, Universität, Forschung",
        emoji="🎓",
        color="#f97316"  # orange
    ),
    TopicCategory.FINANZEN: CategoryInfo(
        name="Finanzen",
        description="Steuern, Haushalt, Schulden",
        emoji="💰",
        color="#eab308"  # yellow
    ),
    TopicCategory.JUSTIZ: CategoryInfo(
        name="Justiz/Recht",
        description="Gerichte, Gesetze, Verfassung",
        emoji="⚖️",
        color="#78716c"  # stone
    ),
    TopicCategory.ARBEIT: CategoryInfo(
        name="Arbeit",
        description="Lohn, Gewerkschaft, Beschäftigung",
        emoji="👷",
        color="#84cc16"  # lime
    ),
    TopicCategory.MOBILITAET: CategoryInfo(
        name="Mobilität",
        description="Verkehr, Bahn, Auto, ÖPNV",
        emoji="🚆",
        color="#0ea5e9"  # sky blue
    ),
}


TOPIC_LEXICONS: dict[TopicCategory, set[str]] = {
    TopicCategory.MIGRATION: {
        # Core terms
        "migration", "migrant", "migranten", "asyl", "asylbewerber",
        "flüchtling", "flüchtlinge", "einwanderung", "einwanderer",
        "zuwanderung", "zuwanderer", "abschiebung", "rückführung",
        "geflüchtete", "schutzsuchende", "asylsuchende",
        # Institutional
        # NOTE: "bundesamt" removed - too generic (any federal agency)
        "bamf", "asylverfahren", "aufenthaltstitel",
        "aufenthaltsstatus", "duldung", "abschiebehaft", "aufnahmelager",
        "erstaufnahme", "ankerzentrum", "ankerzentren",
        # Policy terms
        "grenze", "grenzschutz", "grenzkontrollen", "frontex", "obergrenze",
        "familiennachzug", "integrationsgesetz", "dublin", "schengen",
        "asylrecht", "asylgesetz", "aufenthaltsgesetz", "einwanderungsgesetz",
        "migrationsabkommen", "rücknahmeabkommen", "drittstaaten",
        # Groups and routes
        "kriegsflüchtlinge", "bootsflüchtlinge", "mittelmeer",
        "balkanroute", "schlepper", "schleuser", "menschenschmuggel",
        # Integration
        "integration", "integrationskurs", "sprachkurs", "deutschkurs",
        "einbürgerung", "staatsangehörigkeit", "aufenthaltserlaubnis",
        # Status types
        "schutzstatus", "subsidiär", "asylantrag", "asylbescheid",
        "bleiberecht", "abschiebeverbot", "sichere-herkunftsstaaten",
        # Places/organizations
        "ausländerbehörde", "flüchtlingsheim", "flüchtlingsunterkunft",
        "asylunterkunft", "sammelunterkunft", "gemeinschaftsunterkunft",
    },

    TopicCategory.KLIMA: {
        # Climate core
        "klimaschutz", "klimawandel", "klimakrise", "klimaziel",
        "klimaneutral", "klimaneutralität", "emissionen", "emission",
        "co2", "treibhausgas", "treibhausgase", "erderwärmung",
        "klimaabkommen", "pariser-abkommen", "klimakonferenz",
        "klimapolitik", "klimaanpassung", "klimaschutzgesetz",
        "emissionshandel", "co2-preis", "extremwetter",
        # Energy transition
        "energie", "energiewende", "erneuerbar", "erneuerbare",
        "windkraft", "windenergie", "windrad", "windpark",
        "solarenergie", "photovoltaik", "solaranlage", "solarpanel",
        "wasserstoff", "wasserstoffstrategie", "grüner-wasserstoff",
        "energieeffizienz", "netzausbau", "geothermie", "biomasse",
        # Fossil fuels
        "kohle", "kohleausstieg", "kohlekraftwerk", "braunkohle",
        "steinkohle", "atomkraft", "kernenergie", "atomausstieg",
        "kernkraftwerk", "akw", "erdgas", "lng", "fracking", "erdöl",
        # Environment
        "umwelt", "umweltschutz", "naturschutz", "biodiversität",
        "artensterben", "artenschutz", "ökosystem", "ökologie",
        "nachhaltigkeit", "nachhaltig", "wald", "wälder",
        "waldsterben", "regenwälder", "moor", "moore",
        "umweltpolitik", "gewässerschutz", "bodenschutz",
        # Infrastructure (energy-related, mobility moved to MOBILITAET)
        "wärmepumpe", "fernwärme", "dämmung", "gebäudesanierung",
        "stromnetz", "stromtrasse", "offshore", "onshore",
        # Pollution
        "luftverschmutzung", "feinstaub", "stickoxid", "abgas",
        "müll", "plastikmüll", "recycling", "kreislaufwirtschaft",
        "mikroplastik", "pestizide",
    },

    TopicCategory.WIRTSCHAFT: {
        # Business
        "unternehmen", "firma", "firmen", "betrieb", "betriebe",
        "konzern", "konzerne", "mittelstand", "handwerk",
        "selbstständige", "freiberufler", "gründer", "startup",
        "startups", "existenzgründung", "unternehmertum",
        # Industry
        "industrie", "industriestandort", "produktion", "fertigung",
        "fabrik", "werk", "werke", "maschinenbau", "automobilindustrie",
        "chemieindustrie", "stahlindustrie", "pharmaindustrie",
        # Competition
        "wettbewerb", "wettbewerbsfähigkeit", "konkurrenz", "markt",
        "märkte", "marktanteil", "marktwirtschaft", "monopol",
        "kartell", "wettbewerbsrecht", "fusionskontrolle",
        # Trade
        "export", "exporte", "import", "importe", "außenhandel",
        "handel", "handelsabkommen", "freihandel", "zoll", "zölle",
        "handelspartner", "handelsbeziehungen", "lieferkette",
        # Economy
        "wirtschaft", "volkswirtschaft", "betriebswirtschaft",
        "konjunktur", "rezession", "wachstum", "wirtschaftswachstum",
        "bruttoinlandsprodukt", "bip", "inflation", "deflation",
        "wirtschaftskrise", "wirtschaftspolitik", "standort",
        # Jobs
        "arbeitsplatz", "arbeitsplätze", "beschäftigung",
        "fachkräftemangel", "fachkräfte", "arbeitskräfte",
        "qualifikation", "insolvenz", "insolvenzen", "pleite",
        # Investment
        "investition", "investitionen", "kapital", "anlage",
        "finanzierung", "kredit", "kredite", "zinsen", "subvention",
    },

    TopicCategory.SOZIALES: {
        # Pensions
        "rente", "renten", "rentner", "rentnerin", "altersarmut",
        "rentenversicherung", "rentenanspruch", "rentenniveau",
        "grundrente", "riester", "betriebsrente", "altersvorsorge",
        # Poverty
        "armut", "kinderarmut", "existenzminimum", "grundsicherung",
        "bürgergeld", "hartz", "arbeitslosengeld", "sozialhilfe",
        "bedürftige", "obdachlose", "obdachlosigkeit", "tafel",
        # Family
        "familie", "familien", "eltern", "kinder", "kind",
        "alleinerziehende", "kinderbetreuung", "kindergeld",
        "kinderzuschlag", "elterngeld", "elternzeit", "mutterschutz",
        # Social services
        "sozialleistung", "sozialleistungen", "sozialstaat",
        "sozialsystem", "sozialpolitik", "umverteilung",
        "transferleistung", "wohlfahrt", "fürsorge",
        # Housing
        "wohnung", "wohnungen", "miete", "mieten", "mietpreis",
        "wohnungsnot", "wohnungsmarkt", "mietpreisbremse",
        "sozialwohnung", "sozialer-wohnungsbau", "wohngeld",
        # Care
        "behinderung", "behinderte", "inklusion", "barrierefreiheit",
        "pflegeheim", "altenpflege", "seniorenheim", "altershilfe",
        # Youth
        "jugend", "jugendliche", "jugendarbeit", "jugendhilfe",
        "jugendamt", "kita", "kindergarten", "kinderkrippe",
        # Social justice
        "gerechtigkeit", "soziale-gerechtigkeit", "verteilungsgerechtigkeit",
        "chancengleichheit", "chancengerechtigkeit",
    },

    TopicCategory.SICHERHEIT: {
        # Police
        "polizei", "polizist", "polizisten", "polizeibehörde",
        "bundespolizei", "landespolizei", "kriminalpolizei",
        "polizeieinsatz", "polizeigewalt", "polizeipräsenz",
        # Crime
        # NOTE: "opfer" removed - too broad (used in many non-security contexts)
        "kriminalität", "verbrechen", "straftat", "straftaten",
        "straftäter", "täter", "gewalt", "gewalttat",
        "mord", "totschlag", "raub", "diebstahl", "einbruch",
        "betrug", "korruption", "geldwäsche", "organisierte-kriminalität",
        # Terrorism
        "terrorismus", "terror", "terrorist", "terroristen",
        "terroranschlag", "anschlag", "angriff", "attentat", "extremismus",
        "radikalisierung", "gefährder", "islamismus", "dschihadismus",
        # Defense
        "bundeswehr", "soldat", "soldaten", "soldatin", "streitkräfte",
        "verteidigung", "verteidigungsetat", "militär", "armee",
        "rüstung", "waffen", "waffenlieferung", "panzer", "kampfjet",
        "nato", "bündnisfall", "abschreckung", "verteidigungsfähigkeit",
        # Intelligence
        "geheimdienst", "verfassungsschutz", "bnd", "nachrichtendienst",
        "überwachung", "spionage", "cyberangriff", "cyberattacke",
        # Security measures
        "sicherheitsbehörde", "innere-sicherheit", "grenzschutz",
        "videoüberwachung", "prävention", "deradikalisierung",
    },

    TopicCategory.GESUNDHEIT: {
        # Healthcare system
        "krankenhaus", "krankenhäuser", "klinik", "kliniken",
        "krankenkasse", "krankenkassen", "krankenversicherung",
        "gesundheitssystem", "gesundheitswesen", "gesundheitspolitik",
        # Medical
        "arzt", "ärzte", "ärztin", "medizin", "mediziner",
        "facharzt", "hausarzt", "kranke", "krankheit",
        "behandlung", "therapie", "operation", "notaufnahme",
        "notfall", "rettungsdienst", "krankenstand",
        # Medications
        "medikament", "medikamente", "arzneimittel", "impfung",
        "impfstoff", "impfpflicht", "impfquote", "vakzin",
        "apotheke", "rezept", "pharma", "pharmaindustrie",
        # Care
        "pflege", "pflegekraft", "pflegekräfte", "pflegepersonal",
        "pflegeheim", "altenpflege", "krankenpflege", "pflegenotstand",
        "pflegeversicherung", "pflegegrad", "pflegegeld",
        # Mental health
        "psyche", "psychisch", "psychiatrie", "psychotherapie",
        "depression", "burnout", "sucht", "suchtberatung",
        # Public health
        "prävention", "vorsorge", "gesundheitsamt", "epidemie",
        "pandemie", "corona", "covid", "infektion", "infektionsschutz",
        "quarantäne", "rki", "fallzahl", "inzidenz",
        # Reform
        "krankenhausreform", "gesundheitsreform", "fallpauschale",
        "zusatzbeitrag", "leistungskatalog",
        # NOTE: "beiträge" removed - too generic (used for many contribution types)
    },

    TopicCategory.EUROPA: {
        # EU institutions
        # NOTE: "kommission" removed - ambiguous (could be any parliamentary committee)
        "europa", "europäisch", "europäische-union", "brüssel",
        "eu-kommission", "eu-parlament", "europarat",
        "europäischer-rat", "ezb", "eurozone", "schengen",
        # EU policy
        "mitgliedsstaat", "mitgliedsstaaten", "eu-beitritt",
        "eu-austritt", "brexit", "binnenmarkt", "freizügigkeit",
        "eu-recht", "eu-richtlinie", "eu-verordnung",
        # Foreign policy
        # NOTE: "botschaft" removed - ambiguous (embassy vs message)
        "außenpolitik", "außenminister", "diplomatie", "diplomat",
        "botschafter", "sanktion", "sanktionen",
        "embargo", "völkerrecht", "menschenrechte",
        # Ukraine/Russia
        "ukraine", "ukrainer", "ukrainisch", "kiew", "selensky",
        "russland", "russisch", "putin", "kreml", "moskau",
        "krieg", "angriffskrieg", "kriegsverbrechen",
        "waffenlieferungen", "wiederaufbau",
        # Other countries
        "china", "chinesisch", "usa", "amerika", "amerikanisch",
        "israel", "nahost", "iran", "türkei", "afrika",
        # International orgs
        "uno", "vereinte-nationen", "g7", "g20", "weltbank",
        "iwf", "wto", "osze", "nato",
        # Diplomacy
        "gipfel", "gipfeltreffen", "abkommen", "vertrag",
        "partnerschaft", "bündnis", "allianz", "kooperation",
        "frieden", "friedensprozess", "waffenstillstand",
    },

    TopicCategory.DIGITAL: {
        # Internet
        "digital", "digitalisierung", "internet", "online",
        "netz", "netzwerk", "breitband", "glasfaser",
        "mobilfunk", "5g", "netzausbau", "funkloch",
        # Data
        "daten", "datenschutz", "dsgvo", "datensicherheit",
        "datensouveränität", "algorithmus", "algorithmen",
        "big-data", "datenverarbeitung", "datenbank",
        # Technology
        "technologie", "künstliche-intelligenz", "ki",
        "maschinelles-lernen", "automatisierung", "roboter",
        "software", "hardware", "computer", "chip", "halbleiter",
        # Digital services
        "plattform", "plattformen", "social-media", "e-commerce",
        "onlinehandel", "streaming", "cloud", "server",
        "rechenzentrum", "digitalwirtschaft",
        # E-government
        "e-government", "onlinezugangsgesetz", "bürgerportal",
        "digitale-verwaltung", "registermodernisierung",
        "elektronische-patientenakte", "e-rezept",
        # Startups
        # NOTE: "innovation" removed - too broad (wirtschaftliche Innovation, etc.)
        "startup", "startups", "gründerszene",
        "forschung-und-entwicklung", "venture-capital",
        # Cybersecurity
        "cybersicherheit", "cyberangriff", "hacker", "hackerangriff",
        "it-sicherheit", "verschlüsselung", "malware",
        # Media - NOTE: "medien" removed - too broad (often means press/journalism, not digital)
        "öffentlich-rechtlich", "rundfunk", "pressefreiheit",
        "desinformation", "fake-news", "medienkompetenz",
    },

    TopicCategory.BILDUNG: {
        # Core
        "bildung", "bildungspolitik", "bildungssystem",
        # Schools
        "schule", "schulen", "schüler", "schülerin", "schülerinnen",
        "grundschule", "gymnasium", "realschule", "hauptschule",
        "gesamtschule", "berufsschule", "schulpflicht", "schulabschluss",
        "abitur", "mittlere-reife", "schulreform",
        # Teaching
        "lehrer", "lehrerin", "lehrkraft", "lehrkräfte",
        "lehrermangel", "unterricht", "lehrplan", "bildungsplan",
        "klassenzimmer", "schulklasse", "digitaler-unterricht",
        # Universities
        "universität", "universitäten", "hochschule", "hochschulen",
        "studium", "student", "studenten", "studentin",
        "studierende", "professor", "professorin", "dozent",
        "bafög", "studiengebühren", "semesterbeitrag",
        "bachelor", "master", "promotion", "doktorand",
        # Research
        "forschung", "wissenschaft", "wissenschaftler",
        "wissenschaftlerin", "wissenschaftsfreiheit",
        "grundlagenforschung", "forschungsförderung",
        "exzellenzinitiative", "drittmittel", "dfg",
        # Vocational
        "ausbildung", "azubi", "auszubildende", "berufsausbildung",
        "duale-ausbildung", "lehrling", "meister", "meisterbrief",
        "ausbildungsplatz", "ausbildungsplätze", "betriebliche-ausbildung",
        # Early childhood
        "kita", "kindergarten", "kinderbetreuung", "krippe",
        "vorschule", "erzieher", "erzieherin", "frühkindliche-bildung",
        # Lifelong learning
        "weiterbildung", "fortbildung", "qualifizierung",
        "erwachsenenbildung", "volkshochschule", "umschulung",
    },

    TopicCategory.FINANZEN: {
        # Taxes
        "steuer", "steuern", "steuerzahler", "steuersenkung",
        "steuererhöhung", "einkommensteuer", "mehrwertsteuer",
        "unternehmenssteuer", "körperschaftsteuer", "gewerbesteuer",
        "erbschaftsteuer", "vermögensteuer", "steuerpolitik",
        "steuergerechtigkeit", "steuerhinterziehung", "steuerflucht",
        # Budget
        "haushalt", "bundeshaushalt", "haushaltsentwurf",
        "haushaltsplan", "etat", "finanzplan", "haushaltsausschuss",
        "haushaltssperre", "haushaltsdefizit", "finanzierung",
        # Debt
        "schulden", "staatsschulden", "verschuldung", "neuverschuldung",
        "schuldenbremse", "tilgung", "schuldenstand",
        "maastricht-kriterien", "defizit", "überschuss",
        # Investment
        "investition", "investitionen", "öffentliche-investitionen",
        "infrastrukturinvestition", "sondervermögen",
        "konjunkturpaket", "konjunkturprogramm",
        # Financial system
        "bank", "banken", "sparkasse", "finanzmarkt",
        "börse", "aktie", "aktien", "zinsen", "leitzins",
        "inflation", "geldpolitik", "währung",
        # NOTE: "euro" removed - too common as currency unit ("X Mio Euro")
        # Subsidies & Relief
        "subvention", "subventionen", "fördermittel",
        "zuschuss", "finanzhilfe", "staatshilfe", "rettungspaket",
        "entlastung", "steuerentlastung", "kosten",
        # NOTE: "förderung" removed - too broad (Forschungsförderung, Kulturförderung...)
        # Institutions
        "finanzminister", "finanzministerium", "bundesbank",
        "rechnungshof", "bundesrechnungshof", "finanzamt",
    },

    TopicCategory.JUSTIZ: {
        # Courts
        "gericht", "gerichte", "richter", "richterin",
        "bundesverfassungsgericht", "bundesgerichtshof",
        "verwaltungsgericht", "amtsgericht", "landgericht",
        "oberlandesgericht", "europäischer-gerichtshof",
        # Law - NOTE: removed "gesetz", "gesetze", "gesetzentwurf" - too common in all debates
        "gesetzgebung", "gesetzesänderung", "novelle", "verordnung", "vorschrift",
        "rechtsprechung", "urteil", "urteile", "beschluss",
        # Constitution
        "grundgesetz", "verfassung", "verfassungsrecht",
        "grundrechte", "menschenrechte", "rechtsstaatlichkeit",
        "rechtsstaat", "verfassungswidrig", "verfassungskonform",
        # Criminal law
        "strafe", "strafen", "strafrecht", "straftat", "straftaten",
        "strafverfolgung", "staatsanwaltschaft", "staatsanwalt",
        "anklage", "angeklagte", "verurteilung", "freispruch",
        "haft", "gefängnis", "bewährung", "strafmaß",
        # Civil law
        "zivilrecht", "klage", "kläger", "beklagte",
        "schadenersatz", "haftung", "vertragsrecht", "mietrecht",
        # Legal profession
        "anwalt", "anwälte", "rechtsanwalt", "verteidiger",
        "justizminister", "justizministerium", "justizreform",
        # Rights - NOTE: removed "recht", "rechte", "schutz", "pflicht" - too generic
        "datenschutz", "verbraucherschutz",
        "diskriminierung", "gleichstellung", "gleichberechtigung",
    },

    TopicCategory.ARBEIT: {
        # Workers
        "arbeitnehmer", "arbeitnehmerin", "arbeitnehmerinnen",
        "beschäftigte", "belegschaft", "angestellte", "arbeiter",
        "arbeiterin", "arbeitskraft", "arbeitskräfte",
        # Wages
        "lohn", "löhne", "gehalt", "gehälter", "einkommen",
        "mindestlohn", "tariflohn", "lohnerhöhung", "lohndumping",
        "lohnfortzahlung", "lohngerechtigkeit", "niedriglohn",
        # Unions
        "gewerkschaft", "gewerkschaften", "tarifvertrag",
        "tarifverhandlung", "tarifkonflikt", "arbeitskampf",
        "streik", "warnstreik", "betriebsrat", "mitbestimmung",
        "arbeitgeberverband", "sozialpartner", "tarifbindung",
        # Employment
        "arbeitsplatz", "arbeitsplätze", "beschäftigung",
        "vollzeit", "teilzeit", "minijob", "leiharbeit",
        "zeitarbeit", "befristung", "unbefristet", "festanstellung",
        "arbeitsvertrag", "kündigung", "kündigungsschutz",
        # Unemployment
        "arbeitslosigkeit", "arbeitslose", "erwerbslose",
        "arbeitslosenquote", "langzeitarbeitslose", "jobcenter",
        "arbeitsagentur", "bundesagentur-für-arbeit",
        # Working conditions
        "arbeitszeit", "überstunden", "homeoffice", "telearbeit",
        "arbeitsschutz", "arbeitssicherheit", "gesundheitsschutz",
        "work-life-balance", "vereinbarkeit", "burnout",
        # Social security
        "sozialversicherung", "rentenversicherung", "arbeitslosenversicherung",
        "unfallversicherung", "sozialabgaben", "beitragssatz",
    },

    TopicCategory.MOBILITAET: {
        # Public transport
        "öpnv", "nahverkehr", "fernverkehr", "personenverkehr",
        "bahnhof", "haltestelle", "busverkehr", "straßenbahn",
        "s-bahn", "u-bahn", "regionalbahn", "ice",
        # Rail
        "bahn", "deutsche-bahn", "schiene", "schienennetz",
        "gleise", "bahnstrecke", "zugverkehr", "schienenverkehr",
        "bahnverbindung", "zugverbindung", "pünktlichkeit",
        # Cars & Roads
        "auto", "autos", "pkw", "fahrzeug", "fahrzeuge",
        "autobahn", "straße", "straßen", "straßenverkehr",
        "verkehr", "stau", "tempolimit", "geschwindigkeitsbegrenzung",
        "führerschein", "fahrerlaubnis", "kfz",
        # Electric mobility
        "elektromobilität", "e-auto", "elektroauto", "elektrofahrzeug",
        "ladesäule", "ladeinfrastruktur", "ladepunkt", "wallbox",
        # Aviation
        "flughafen", "flugzeug", "flugverkehr", "luftverkehr",
        "fluglinie", "flug", "fliegen", "inlandsflüge",
        # Shipping
        "schiff", "schiffe", "schifffahrt", "hafen", "häfen",
        "binnenschifffahrt", "seeverkehr", "containerhafen",
        # Cycling & Walking
        "fahrrad", "fahrräder", "radverkehr", "radweg", "radwege",
        "fußverkehr", "fußgänger", "gehweg",
        # Policy
        "verkehrswende", "verkehrspolitik", "mobilitätswende",
        "infrastruktur", "verkehrsinfrastruktur", "verkehrsminister",
        "deutschlandticket", "49-euro-ticket",
    },
}


# Multi-label support for nouns that span multiple topics
TOPIC_MULTI_LABEL: dict[str, list[tuple[TopicCategory, float]]] = {
    # Care spans Health and Social
    "pflege": [(TopicCategory.GESUNDHEIT, 1.0), (TopicCategory.SOZIALES, 0.7)],
    "pflegekraft": [(TopicCategory.GESUNDHEIT, 1.0), (TopicCategory.ARBEIT, 0.5)],
    "pflegekräfte": [(TopicCategory.GESUNDHEIT, 1.0), (TopicCategory.ARBEIT, 0.5)],
    "pflegeheim": [(TopicCategory.GESUNDHEIT, 0.8), (TopicCategory.SOZIALES, 0.8)],
    "altenpflege": [(TopicCategory.GESUNDHEIT, 0.8), (TopicCategory.SOZIALES, 0.8)],

    # Pensions span Social and Finance
    "rente": [(TopicCategory.SOZIALES, 1.0), (TopicCategory.FINANZEN, 0.5)],
    "renten": [(TopicCategory.SOZIALES, 1.0), (TopicCategory.FINANZEN, 0.5)],
    "rentenversicherung": [(TopicCategory.SOZIALES, 0.8), (TopicCategory.FINANZEN, 0.8)],

    # Ukraine spans Europe and Security
    "ukraine": [(TopicCategory.EUROPA, 1.0), (TopicCategory.SICHERHEIT, 0.7)],
    "waffenlieferungen": [(TopicCategory.EUROPA, 0.7), (TopicCategory.SICHERHEIT, 1.0)],
    "waffenlieferung": [(TopicCategory.EUROPA, 0.7), (TopicCategory.SICHERHEIT, 1.0)],

    # NATO spans Europe and Security
    "nato": [(TopicCategory.EUROPA, 0.7), (TopicCategory.SICHERHEIT, 1.0)],
    "bündnisfall": [(TopicCategory.EUROPA, 0.7), (TopicCategory.SICHERHEIT, 1.0)],

    # Energy spans Climate and Economy
    "energie": [(TopicCategory.KLIMA, 1.0), (TopicCategory.WIRTSCHAFT, 0.5)],
    "energiewende": [(TopicCategory.KLIMA, 1.0), (TopicCategory.WIRTSCHAFT, 0.6)],
    "energiepreise": [(TopicCategory.KLIMA, 0.5), (TopicCategory.WIRTSCHAFT, 1.0)],

    # Workers span Work and Economy
    "fachkräftemangel": [(TopicCategory.ARBEIT, 1.0), (TopicCategory.WIRTSCHAFT, 0.7)],
    "fachkräfte": [(TopicCategory.ARBEIT, 1.0), (TopicCategory.WIRTSCHAFT, 0.6)],
    "arbeitskräfte": [(TopicCategory.ARBEIT, 1.0), (TopicCategory.WIRTSCHAFT, 0.5)],

    # Integration spans Migration and Social
    "integration": [(TopicCategory.MIGRATION, 1.0), (TopicCategory.SOZIALES, 0.5)],
    "integrationskurs": [(TopicCategory.MIGRATION, 1.0), (TopicCategory.BILDUNG, 0.5)],

    # Childcare spans Social and Education
    "kita": [(TopicCategory.SOZIALES, 0.8), (TopicCategory.BILDUNG, 0.8)],
    "kindergarten": [(TopicCategory.SOZIALES, 0.8), (TopicCategory.BILDUNG, 0.8)],
    "kinderbetreuung": [(TopicCategory.SOZIALES, 1.0), (TopicCategory.BILDUNG, 0.5)],

    # Digitalization in healthcare
    "e-rezept": [(TopicCategory.DIGITAL, 1.0), (TopicCategory.GESUNDHEIT, 0.7)],
    "elektronische-patientenakte": [(TopicCategory.DIGITAL, 1.0), (TopicCategory.GESUNDHEIT, 0.7)],

    # Cybersecurity spans Digital and Security
    "cyberangriff": [(TopicCategory.DIGITAL, 1.0), (TopicCategory.SICHERHEIT, 0.8)],
    "cyberattacke": [(TopicCategory.DIGITAL, 1.0), (TopicCategory.SICHERHEIT, 0.8)],
    "cybersicherheit": [(TopicCategory.DIGITAL, 1.0), (TopicCategory.SICHERHEIT, 0.8)],

    # Research spans Education and Economy
    "forschung": [(TopicCategory.BILDUNG, 1.0), (TopicCategory.WIRTSCHAFT, 0.4)],
    # NOTE: "innovation" removed from multi-label - too broad, removed from DIGITAL lexicon
}
