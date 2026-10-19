"""Shared filters for NLP extraction and presentation of existing results."""

STOPWORD_NOUNS = {
        # Procedural/parliamentary terms
        "herr", "frau", "dame", "kollege", "kollegin",
        "präsident", "präsidentin", "vizepräsident", "vizepräsidentin",
        "abgeordnete", "abgeordneter", "abg",
        "antrag", "drucksache", "nummer", "prozent",
        "beifall", "zuruf", "zwischenfrage", "dank", "danke", "dankeschön", "bitteschön",
        # Parliamentary greeting formulas (often misclassified as nouns)
        "verehrten", "geehrten", "verehrte",
        # Time words
        "jahr", "jahre", "jahren", "monat", "tag", "zeit", "woche",
        # Generic terms
        "frage", "antwort", "rede", "debatte",
        "punkt", "stelle", "bereich", "rahmen", "grund",
        "art", "weise", "form", "teil", "seite",
        "beispiel", "fall", "sache", "ding", "thema",
        # Party names (analyzed separately)
        "spd", "cdu", "csu", "cdu/csu", "fdp", "afd", "grüne", "grünen",
        "linke", "bsw", "bündnis", "fraktion",
        # Names/titles
        "dr.", "prof.", "dr", "prof",
    }

STOPWORD_GENERIC = {
        # Common verbs and auxiliaries
        'dass', 'wird', 'werden', 'haben', 'sind', 'sein', 'eine', 'einer',
        'einem', 'einen', 'auch', 'aber', 'oder', 'wenn', 'noch', 'mehr',
        'schon', 'kann', 'muss', 'hier', 'diese', 'dieser', 'diesem',
        'dieses', 'sehr', 'denn', 'weil', 'nach', 'über', 'unter', 'nicht',
        'sich', 'für', 'mit', 'von', 'bei', 'auf', 'aus', 'zum', 'zur',
        'das', 'der', 'die', 'und', 'ist', 'ich', 'sie', 'wir', 'uns', 'ihnen',
        'meine', 'damen', 'herren', 'kolleginnen', 'kollegen', 'frau',
        'herr', 'präsidentin', 'präsident', 'liebe', 'lieber',
        'geehrte', 'geehrter', 'geehrten', 'verehrte', 'verehrten', 'verehrter',
        'vielen', 'dank', 'danke', 'dankeschön', 'bitteschön', 'also', 'gibt', 'möchte', 'möchten',
        # Past participles and verb conjugations (not meaningful as signature words)
        'wurde', 'wurden', 'gesagt', 'gemacht', 'gegeben', 'genommen', 'gesehen',
        'gekommen', 'gegangen', 'gebracht', 'gehalten', 'gestellt', 'gefunden',
        'erhält', 'erhält', 'bleibt', 'liegt', 'steht', 'gilt',
        'ganz', 'heute', 'jetzt', 'dann', 'dort', 'immer', 'wieder',
        'wollen', 'sagen', 'müssen', 'können', 'sollen', 'brauchen',
        'macht', 'machen', 'geht', 'gehen', 'kommen', 'nehmen', 'stellen',
        # Possessive pronouns (all cases)
        'unsere', 'unserer', 'unseren', 'unserem', 'unseres', 'unser',
        'ihre', 'ihrer', 'ihren', 'ihrem', 'ihres', 'euer', 'eure',
        'meiner', 'meinen', 'meinem', 'meines',
        # Common conjunctions and adverbs
        'sondern', 'sowie', 'doch', 'etwa', 'dabei', 'deshalb', 'daher',
        'darum', 'deswegen', 'dadurch', 'dafür', 'dagegen', 'davon', 'dazu',
        'darauf', 'darüber', 'daran', 'darunter', 'daneben', 'darin', 'damit',
        'natürlich', 'tatsächlich', 'wirklich', 'eigentlich', 'überhaupt',
        'genau', 'gerade', 'eben', 'einmal', 'bereits', 'vielleicht',
        'nämlich', 'insbesondere', 'sogar', 'leider', 'will',
        # Other pronouns
        'andere', 'anderen', 'anderem', 'anderer', 'anderes',
        'viele', 'vieler', 'vieles', 'einige', 'einiger', 'einigen',
        'welche', 'welcher', 'welchen', 'welchem', 'welches',
        'solche', 'solcher', 'solchen', 'solchem', 'solches',
        'jede', 'jeder', 'jeden', 'jedem', 'jedes', 'alle', 'allen', 'allem',
        'keine', 'keiner', 'keinen', 'keinem', 'keines', 'kein',
        'nichts', 'alles', 'etwas', 'selbst', 'mich', 'mir', 'dir', 'dich',
        # Common prepositions and particles
        'durch', 'ohne', 'gegen', 'während', 'trotz', 'außer', 'seit',
        'zwischen', 'wegen', 'statt', 'entlang', 'binnen', 'dank',
        # Common nouns in parliamentary speech (low semantic value)
        'weise', 'punkt', 'frage', 'stelle', 'seite', 'teil', 'grund',
        'ende', 'endes', 'anfang', 'rahmen', 'bereich', 'blick',
        'dinge', 'dingen', 'sache', 'sachen', 'thema', 'themen',
        # Quantitative terms (low semantic value)
        'prozent', 'million', 'millionen', 'milliarde', 'milliarden',
        'euro', 'viel', 'antrag',
    }

def is_content_word(word: str, word_type: str = "nouns") -> bool:
    """Exclude generic terms case-insensitively without changing display spelling."""
    normalized = word.strip().casefold()
    return bool(normalized) and normalized not in STOPWORD_GENERIC and (
        word_type != "nouns" or normalized not in STOPWORD_NOUNS
    )

