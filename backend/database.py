"""
database.py — All database initialization, schema, and seed data.
This is the single source of truth for the DB structure.
"""
import os
import sqlite3

# Always resolve the DB path relative to THIS file, not the CWD
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "kindleread.db")


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")   # safe concurrent writes
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()

    # ── Users ──────────────────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT    UNIQUE NOT NULL,
            email         TEXT    UNIQUE NOT NULL,
            password_hash TEXT    NOT NULL,
            created_at    TEXT    DEFAULT (datetime('now'))
        )
    """)

    # ── Books ──────────────────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS books (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            author      TEXT    NOT NULL,
            cover_color TEXT    NOT NULL DEFAULT '#E8A87C',
            content     TEXT    NOT NULL DEFAULT '',
            total_words INTEGER NOT NULL DEFAULT 0,
            source      TEXT    NOT NULL DEFAULT 'seeded',  -- 'seeded' | 'ai_generated'
            created_at  TEXT    DEFAULT (datetime('now'))
        )
    """)

    # ── Reading Progress ───────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reading_progress (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            book_id          INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
            scroll_position  REAL    NOT NULL DEFAULT 0,
            percent_complete REAL    NOT NULL DEFAULT 0,
            last_read        TEXT    DEFAULT (datetime('now')),
            UNIQUE(user_id, book_id)
        )
    """)

    # ── Migration: add cover_url if it doesn't exist yet ──────────────────
    cur.execute("PRAGMA table_info(books)")
    columns = [row["name"] for row in cur.fetchall()]
    if "cover_url" not in columns:
        cur.execute("ALTER TABLE books ADD COLUMN cover_url TEXT NOT NULL DEFAULT ''")
        # Backfill cover URLs for the 5 seeded books by title
        for title, url in SEEDED_COVER_URLS.items():
            cur.execute("UPDATE books SET cover_url = ? WHERE lower(title) = lower(?)", (url, title))

    # Seed classic books only on first run
    cur.execute("SELECT COUNT(*) FROM books")
    if cur.fetchone()[0] == 0:
        _seed_books(cur)

    conn.commit()
    conn.close()


# ── Seed data ──────────────────────────────────────────────────────────────

COVER_COLORS = ["#E8A87C", "#85C1E9", "#82E0AA", "#F1948A", "#BB8FCE"]

# Open Library cover URLs keyed by book title (lowercase match)
SEEDED_COVER_URLS = {
    "Pride and Prejudice":    "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
    "Moby-Dick":              "https://covers.openlibrary.org/b/isbn/9780142437247-L.jpg",
    "The Great Gatsby":       "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
    "Nineteen Eighty-Four":   "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
    "The Alchemist":          "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
}

SEED_BOOKS = [
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "color": "#E8A87C",
        "content": """Pride and Prejudice by Jane Austen is one of the most beloved novels in the English language. First published in 1813, the story follows the Bennet family — particularly the second daughter, Elizabeth Bennet — as she navigates issues of manners, morality, education, and marriage in the landed gentry of early 19th-century England.

The story begins at Longbourn estate in Hertfordshire, where the Bennet family resides. Mrs. Bennet is anxious to see all five of her daughters married well. When the wealthy Mr. Charles Bingley arrives at nearby Netherfield Park, Mrs. Bennet sees an opportunity for her eldest daughter, Jane.

At the local assembly ball, Bingley dances with Jane and is clearly captivated by her. His friend Mr. Fitzwilliam Darcy, however, refuses to dance with anyone outside his party, declaring that there is no woman in the room handsome enough to tempt him — a remark overheard by Elizabeth.

Darcy quickly finds himself drawn to Elizabeth's wit and intelligence, though his pride prevents him from admitting this attraction. Elizabeth, for her part, forms a strong dislike of Darcy based on his initial haughtiness and later on accusations made against him by the charming militia officer Mr. Wickham.

Wickham tells Elizabeth that Darcy deprived him of a living promised by Darcy's late father. Elizabeth believes Wickham entirely, her prejudice against Darcy growing. Meanwhile, the pompous Mr. Collins arrives to visit the Bennets. As the heir to Longbourn, he has come to choose a wife among the sisters, but after Elizabeth refuses him, he proposes to her friend Charlotte Lucas, who accepts.

Jane visits Netherfield and falls ill. Elizabeth walks three miles through muddy fields to nurse her sister back to health, much to the amusement of Bingley's snobbish sisters. During this visit, Darcy struggles increasingly with his feelings for Elizabeth — a woman of inferior social standing.

When Bingley's sisters and Darcy leave for London, they persuade Bingley to follow, effectively separating him from Jane. Jane is heartbroken. Elizabeth visits Charlotte and her new husband Mr. Collins at their parsonage in Kent, where she encounters Lady Catherine de Bourgh, Darcy's imperious aunt.

Darcy, who is visiting his aunt, seeks Elizabeth out frequently. He finally declares his love in an arrogant proposal, acknowledging that she is beneath him socially. Elizabeth refuses him with spirit, citing his interference with Jane and Bingley's relationship, and Wickham's account of his cruelty.

Stung, Darcy writes Elizabeth a letter explaining himself. He reveals that Wickham is a liar who had attempted to elope with Darcy's fifteen-year-old sister Georgiana to get her fortune. He also confirms that he separated Bingley and Jane because he believed Jane indifferent to Bingley.

Elizabeth reads and rereads the letter. She is forced to acknowledge Darcy's honesty and her own prejudice. She is ashamed of herself. Her view of Darcy begins its slow transformation.

During the summer, Elizabeth accompanies her aunt and uncle Gardiner on a tour that takes them near Darcy's estate, Pemberley. Believing Darcy to be absent, Elizabeth agrees to visit. The housekeeper describes Darcy as generous and kind. Elizabeth sees his portrait and feels a fresh stir of admiration.

Unexpectedly, Darcy returns early. He is remarkably warm to Elizabeth and her relatives, and invites his sister to meet her. Elizabeth increasingly appreciates his true character. But urgent news arrives: her youngest sister Lydia has eloped with Wickham.

Elizabeth is distraught, knowing Wickham's true character. Darcy witnesses her anguish. The elopement would ruin the reputation of the entire Bennet family. Elizabeth rushes home. The family is in crisis — an unmarried elopement means social ruin.

Unknown to anyone, Darcy traces Wickham and bribes him to marry Lydia, paying off his debts and providing him a military commission. The matter is hushed up. Elizabeth learns of Darcy's intervention through her aunt, and is deeply moved — he did it for her, knowing she might never love him.

Bingley returns to Netherfield with Darcy and proposes to Jane, who joyfully accepts. Shortly after, Lady Catherine arrives at Longbourn, demanding Elizabeth promise never to marry Darcy. Elizabeth refuses pointedly. When Darcy learns of this confrontation, he understands Elizabeth's feelings have changed.

Darcy proposes again — this time humbly, with uncertainty. Elizabeth accepts with warmth and gratitude, telling him that her feelings had changed so gradually she cannot name when she began to love him. Mr. Bennet gives his blessing with characteristic dry wit, telling Darcy he could not have chosen better.

The novel ends with both couples happily married. Elizabeth and Darcy settle at Pemberley. Jane and Bingley move to a nearby estate. The triumph of the story is love earned through honest self-examination and growth on both sides.""",
    },
    {
        "title": "Moby-Dick",
        "author": "Herman Melville",
        "color": "#85C1E9",
        "content": """Moby-Dick; or, The Whale is a novel by American writer Herman Melville, published in 1851. The story follows the voyage of the whaling ship Pequod, commanded by Captain Ahab, who is obsessed with hunting a white sperm whale named Moby Dick.

Call me Ishmael. So begins one of American literature's most famous narrators. Ishmael, a young man from Manhattan, seeks adventure at sea. He arrives in New Bedford, Massachusetts, and stays at the Spouter-Inn, where he meets Queequeg, a tattooed Polynesian harpooner. The two become fast friends despite their very different backgrounds.

Together they travel to Nantucket and sign aboard the Pequod, a whaling ship decorated with the bones and teeth of sperm whales. The ship's owners, Peleg and Bildad, warn Ishmael about the unusual captain — Ahab, who lost his leg to the great white whale Moby Dick on a previous voyage.

The Pequod sets sail on Christmas Day. Ahab remains below decks for many days. When he finally emerges, the crew sees that his prosthetic leg is carved from a whale's jawbone. He is a formidable, scarred man, marked by the sea and by obsession.

Ahab nails a gold doubloon to the mainmast and announces that it will go to the first man who spots Moby Dick. He reveals his true purpose: not commercial whaling, but revenge against the white whale that took his leg. The first mate Starbuck, a principled Quaker from Nantucket, is troubled by this personal vendetta.

As the Pequod sails south, Ahab reveals a secret crew of shadowy men he brought aboard — led by Fedallah, a mysterious Parsee harpooner. This private crew will man the captain's whaleboat in the hunt for Moby Dick, fueling Starbuck's unease.

The ship passes through the Atlantic and rounds the Cape of Good Hope into the Indian Ocean. Along the way, the Pequod encounters other whaling ships, and Ahab interrogates each crew about Moby Dick's whereabouts. The encounters grow increasingly ominous.

Ishmael narrates long chapters on the science of whales, the mechanics of whaling, and the culture of the sea. These digressions reveal his philosophical mind. The whale becomes a symbol of the inscrutable universe, and the hunt a meditation on obsession and fate.

In the Pacific, a typhoon strikes the Pequod. The compasses are reversed by lightning. Ahab fashions a new compass from a lance and needle, demonstrating his defiance of nature. Starbuck considers killing Ahab to save the crew but cannot bring himself to act.

On the first day of the chase, Ahab spots Moby Dick. The boats are lowered. The great white whale turns on Ahab's boat and destroys it. Ahab survives to continue the chase the next day.

On the second day, the whale smashes two more boats. More men are lost. Still Ahab pursues. Fedallah is lost, tangled in the harpoon lines.

On the third day, Ahab throws his harpoon into Moby Dick, but the line fouls and Ahab is caught in it — drawn under the sea to his death. The whale turns and rams the Pequod. The ship sinks.

Only Ishmael survives, clinging to Queequeg's coffin. The Rachel, still searching for her lost children, finds Ishmael and rescues him. Melville's masterwork explores obsession, free will, fate, and the indifferent power of nature.""",
    },
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "color": "#82E0AA",
        "content": """The Great Gatsby, published in 1925 by F. Scott Fitzgerald, is the defining novel of the Jazz Age. Set in 1922 on Long Island's North Shore and in New York City, it examines themes of wealth, class, love, idealism, and the corrupting influence of the American Dream.

The narrator, Nick Carraway, moves from the Midwest to West Egg, Long Island, to work as a bond trader. His modest home sits next to the lavish mansion of Jay Gatsby, who throws enormous parties every Saturday night. The parties are legendary — full of glamour, music, and mysterious guests.

Across the bay in the more fashionable East Egg live Nick's cousin Daisy Buchanan and her husband Tom, an arrogant former athlete from old money. Tom has a crude power about him; he is having an affair with Myrtle Wilson, wife of a garage owner in the Valley of Ashes — a grey industrial wasteland between the Eggs and New York.

Nick attends one of Gatsby's parties and finally meets his host — a composed, charismatic man of uncertain origins who calls everyone "old sport." Gatsby takes a peculiar interest in Nick when he learns of his connection to Daisy. Jordan Baker reveals Gatsby's secret: he was in love with Daisy five years ago, before the war separated them.

Gatsby has reinvented himself entirely — his fortune, his mansion, his parties — all for one purpose: to recreate the past with Daisy. The green light at the end of Daisy's dock across the water is the symbol of his yearning.

Nick arranges a reunion between Gatsby and Daisy. Gatsby is overwhelmed — the real Daisy cannot match five years of idealized longing. Yet they begin an affair. Daisy is dazzled by Gatsby's wealth and devotion, though Tom senses something is happening.

Tom investigates Gatsby's background and discovers he is a bootlegger who has made his fortune through illegal means. Tom is contemptuous of Gatsby as "Mr. Nobody from Nowhere."

The tension comes to a head at the Plaza Hotel. Tom confronts Gatsby about his affair with Daisy. Gatsby insists Daisy never loved Tom, but Daisy cannot fully say it. The dream begins to crack.

Driving back from the city, Daisy is behind the wheel of Gatsby's car. She strikes Myrtle Wilson and kills her. She does not stop. Gatsby covers for her but she does not come to him.

Tom tells Myrtle's husband George that the yellow car belongs to Gatsby. George finds Gatsby floating in his pool and shoots him dead before killing himself.

Nick is left to arrange Gatsby's funeral. Almost no one comes. Daisy and Tom have retreated into their careless money, leaving destruction behind without guilt.

The novel ends with Nick's famous meditation: we beat on, boats against the current, borne back ceaselessly into the past. Fitzgerald renders the American Dream as beautiful, cruel, and ultimately hollow.""",
    },
    {
        "title": "Nineteen Eighty-Four",
        "author": "George Orwell",
        "color": "#F1948A",
        "content": """Nineteen Eighty-Four is a dystopian novel by George Orwell, published in 1949. Set in a totalitarian future society called Oceania, the story follows Winston Smith as he secretly rebels against the oppressive Party led by the mysterious figurehead Big Brother.

Winston Smith works at the Ministry of Truth in Airstrip One, formerly known as Great Britain. His job is to rewrite historical records so that the past always conforms to the Party's current version of events. The Party's three slogans are carved everywhere: WAR IS PEACE. FREEDOM IS SLAVERY. IGNORANCE IS STRENGTH.

Telescreens monitor citizens constantly. The Thought Police arrest anyone who commits thoughtcrime — unauthorized thought against the Party. Winston privately harbors doubts and resentments. He begins a secret diary, which is itself an act of rebellion punishable by death.

Winston is fascinated by the proles — the working class who make up 85% of Oceania's population but are largely ignored by the Party. He believes that if there is hope, it lies in the proles.

A young woman named Julia passes Winston a note that simply says: I love you. They begin a clandestine love affair, meeting in a room above an antique shop run by Mr. Charrington. The room has no telescreen — a precious, illusory freedom.

O'Brien contacts Winston and invites him to his apartment, confirming Winston's intuition that he is part of a secret Brotherhood opposing the Party. Winston and Julia receive a copy of the forbidden book by Emmanuel Goldstein — the Party's chief enemy.

Winston reads from the book in the rented room. He and Julia fall asleep together. Then, suddenly, a voice speaks from behind a picture on the wall. A telescreen has been hidden there the whole time. The Thought Police break down the door. Mr. Charrington reveals himself as a Thought Police agent. Winston and Julia are arrested.

In the Ministry of Love, Winston is tortured systematically. The goal is not to extract information but to reshape his mind — to make him genuinely love Big Brother. O'Brien is his torturer and teacher.

Winston is forced to accept that 2 + 2 = 5 if the Party says so. O'Brien explains that the Party seeks power for its own sake — not for any human good, but for domination itself.

Winston is taken to Room 101, where prisoners face their worst fear. Winston's is rats. When O'Brien threatens to put a cage of rats on his face, Winston screams for Julia to be given to them instead. His final human connection is severed.

The novel ends with Winston staring at a poster of Big Brother. He loves Big Brother. The machinery of totalitarian control has succeeded absolutely. Orwell's nightmare vision remains a warning about the fragility of truth and the danger of concentrated power.""",
    },
    {
        "title": "The Alchemist",
        "author": "Paulo Coelho",
        "color": "#BB8FCE",
        "content": """The Alchemist is a philosophical novel by Brazilian author Paulo Coelho, first published in Portuguese in 1988. It tells the mystical story of a young Andalusian shepherd named Santiago who travels from Spain to Egypt in search of treasure, guided by omens and a recurring dream.

Santiago is a shepherd boy in the fields of Andalusia. He sleeps beneath the stars, reads a worn book, and dreams of a treasure buried near the Egyptian pyramids. He visits a gypsy woman who interprets his dream and tells him to follow the omens to find his Personal Legend — the thing he was always meant to do.

At the plaza in Tarifa, Santiago meets a mysterious old man named Melchizedek who claims to be the King of Salem. The old man introduces the concept of the Soul of the World — a universal spirit that conspires to help those pursuing their Personal Legend. He gives Santiago two stones, Urim and Thummim, to read omens, and tells him to follow the dream.

Santiago sells his sheep and crosses into North Africa, landing in Tangier. He is immediately robbed by a stranger who promises to guide him. Left penniless in a foreign city where he doesn't speak the language, Santiago feels his dream shattered.

He takes a job with a crystal merchant. The merchant has long dreamed of making a pilgrimage to Mecca but fears that once he achieves his dream, he will have nothing left to live for. Santiago challenges this thinking, helps modernize the shop, and doubles its revenue over a year.

But something has changed in Santiago. He chooses to continue to Egypt. He joins a caravan crossing the Sahara, guided by an Englishman who is searching for an alchemist at the Al-Fayoum oasis. Santiago and the Englishman discuss their different approaches to wisdom — books versus observation of the world.

At the oasis, Santiago meets Fatima, a desert woman who immediately captures his heart. He also encounters the alchemist, an ancient mystic who possesses the secret of turning metal to gold. The alchemist tests Santiago — not with puzzles, but by sensing whether his heart is truly committed to his Personal Legend.

The alchemist agrees to guide Santiago across the final stretch of desert. He teaches Santiago to listen to his heart, to speak the language of the world, and to trust that the Soul of the World will protect him.

In one of the novel's most celebrated moments, the alchemist makes Santiago turn himself into the wind — a test of whether he has truly learned to communicate with the Soul of the World.

At the pyramids, Santiago begins to dig and is attacked by thieves who beat him and rob him. One of the thieves mocks him: I had a dream about treasure buried in Spain, under a sycamore tree near a ruined church. Santiago understands immediately — the treasure was in Spain all along.

Santiago returns to Spain and digs beneath the old sycamore tree. He finds a chest of gold coins and jewels. He laughs — the journey itself was the real discovery. He plans to return to Fatima. The Alchemist concludes that the simple journey toward a dream transforms the dreamer — the treasure is not only at the end but in every step along the way.""",
    },
]


def _seed_books(cur: sqlite3.Cursor):
    for book in SEED_BOOKS:
        word_count = len(book["content"].split())
        cover_url = SEEDED_COVER_URLS.get(book["title"], "")
        cur.execute(
            "INSERT INTO books (title, author, cover_color, content, total_words, source, cover_url) VALUES (?, ?, ?, ?, ?, 'seeded', ?)",
            (book["title"], book["author"], book["color"], book["content"], word_count, cover_url),
        )
