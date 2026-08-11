export interface QuestionAnswer {
  id: number;
  category: string;
  keywords: string[];
  question: string;
  answer: string;
}

export const KNOWLEDGE_BASE_100: QuestionAnswer[] = [
  // --- MATHEMATICS (1-10) ---
  {
    id: 1,
    category: "Mathematics",
    keywords: ["quadratic", "quadratic equation", "ax^2", "parabola"],
    question: "What is a quadratic equation?",
    answer: "A quadratic equation is a second-order polynomial equation of the form $ax^2 + bx + c = 0$, where $a \\neq 0$. Its solutions (roots) can be found using the quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$."
  },
  {
    id: 2,
    category: "Mathematics",
    keywords: ["pythagorean", "pythagoras", "a^2+b^2=c^2", "right triangle"],
    question: "What is the Pythagorean theorem?",
    answer: "The Pythagorean theorem states that in any right-angled triangle, the square of the length of the hypotenuse ($c$) is equal to the sum of the squares of the other two sides ($a$ and $b$): $a^2 + b^2 = c^2$."
  },
  {
    id: 3,
    category: "Mathematics",
    keywords: ["derivative", "calculus derivative", "rate of change", "differentiation"],
    question: "What is a derivative in calculus?",
    answer: "A derivative measures the instantaneous rate of change of a function with respect to a variable. Geometrically, it represents the slope of the tangent line to the function's curve at any given point ($f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$)."
  },
  {
    id: 4,
    category: "Mathematics",
    keywords: ["integral", "integration", "area under curve", "calculus integral"],
    question: "What is an integral in calculus?",
    answer: "An integral calculates the accumulated area bounded under a function's curve. Indefinite integrals find antiderivatives, while definite integrals evaluate the exact numerical area between two boundaries ($a$ and $b$)."
  },
  {
    id: 5,
    category: "Mathematics",
    keywords: ["area of circle", "pi r square", "pi r^2", "circle area"],
    question: "How do you find the area of a circle?",
    answer: "The area of a circle is calculated using the formula: $A = \\pi r^2$, where $r$ is the radius of the circle and $\\pi \\approx 3.14159$."
  },
  {
    id: 6,
    category: "Mathematics",
    keywords: ["prime number", "prime numbers", "divisible by 1"],
    question: "What is a prime number?",
    answer: "A prime number is a natural number greater than 1 that has exactly two positive divisors: 1 and itself (e.g., 2, 3, 5, 7, 11, 13, 17, 19)."
  },
  {
    id: 7,
    category: "Mathematics",
    keywords: ["mean median mode", "mean", "median", "mode", "statistics average"],
    question: "What is the difference between mean, median, and mode?",
    answer: "• **Mean**: The average sum of all values divided by count.\n• **Median**: The middle value when numbers are sorted in order.\n• **Mode**: The value that appears most frequently in a dataset."
  },
  {
    id: 8,
    category: "Mathematics",
    keywords: ["fraction", "fractions", "simplify fraction", "numerator denominator"],
    question: "What is a fraction and how do you simplify it?",
    answer: "A fraction represents a part of a whole expressed as $\\frac{\\text{numerator}}{\\text{denominator}}$. To simplify a fraction, divide both the numerator and denominator by their Greatest Common Divisor (GCD)."
  },
  {
    id: 9,
    category: "Mathematics",
    keywords: ["trigonometry", "sin cos tan", "sine cosine tangent", "soh cah toa"],
    question: "What is sin, cos, and tan in trigonometry?",
    answer: "In a right-angled triangle:\n• $\\sin(\\theta) = \\frac{\\text{Opposite}}{\\text{Hypotenuse}}$\n• $\\cos(\\theta) = \\frac{\\text{Adjacent}}{\\text{Hypotenuse}}$\n• $\\tan(\\theta) = \\frac{\\text{Opposite}}{\\text{Adjacent}}$"
  },
  {
    id: 10,
    category: "Mathematics",
    keywords: ["linear equation", "slope intercept", "y=mx+b", "straight line"],
    question: "What is a linear equation?",
    answer: "A linear equation represents a straight line on a graph, written in slope-intercept form as $y = mx + b$, where $m$ is the slope (gradient) and $b$ is the y-intercept."
  },

  // --- PHYSICS (11-20) ---
  {
    id: 11,
    category: "Physics",
    keywords: ["newton first law", "law of inertia", "inertia"],
    question: "What is Newton's First Law of Motion?",
    answer: "Newton's First Law (Law of Inertia) states that an object at rest stays at rest, and an object in motion stays in motion at a constant velocity, unless acted upon by an external net force."
  },
  {
    id: 12,
    category: "Physics",
    keywords: ["newton second law", "f=ma", "force equals mass acceleration"],
    question: "What is Newton's Second Law of Motion?",
    answer: "Newton's Second Law states that force equals mass times acceleration ($F = ma$). The acceleration of an object is directly proportional to the net force and inversely proportional to its mass."
  },
  {
    id: 13,
    category: "Physics",
    keywords: ["newton third law", "action reaction", "equal opposite reaction"],
    question: "What is Newton's Third Law of Motion?",
    answer: "Newton's Third Law states that for every action, there is an equal and opposite reaction. Whenever one object exerts a force on a second object, the second object exerts an equal force in the opposite direction."
  },
  {
    id: 14,
    category: "Physics",
    keywords: ["gravity", "gravitational force", "9.8 m/s", "gravitation"],
    question: "What is gravity?",
    answer: "Gravity is a fundamental force of attraction between objects with mass. Near Earth's surface, gravity accelerates falling objects at approximately $9.8 \\text{ m/s}^2$."
  },
  {
    id: 15,
    category: "Physics",
    keywords: ["ohm's law", "ohms law", "v=ir", "voltage current resistance"],
    question: "What is Ohm's Law?",
    answer: "Ohm's Law states that electric current ($I$) flowing through a conductor is directly proportional to potential difference ($V$) and inversely proportional to resistance ($R$): $V = I \\times R$."
  },
  {
    id: 16,
    category: "Physics",
    keywords: ["kinetic energy", "potential energy", "1/2mv^2", "mgh"],
    question: "What is kinetic energy and potential energy?",
    answer: "• **Kinetic Energy ($KE = \\frac{1}{2}mv^2$)**: Energy of an object due to its motion.\n• **Potential Energy ($PE = mgh$)**: Stored energy possessed by an object due to its height or position."
  },
  {
    id: 17,
    category: "Physics",
    keywords: ["speed of light", "velocity of light", "3x10^8", "speed light"],
    question: "What is the speed of light?",
    answer: "The speed of light in a vacuum is a universal physical constant denoted by $c$, approximately equal to $3 \\times 10^8 \\text{ m/s}$ (or $299,792,458 \\text{ m/s}$)."
  },
  {
    id: 18,
    category: "Physics",
    keywords: ["thermodynamics", "first law of thermodynamics", "conservation of energy"],
    question: "What is thermodynamics and its first law?",
    answer: "Thermodynamics is the branch of physics dealing with heat, work, and energy. The First Law states that energy cannot be created or destroyed, only transformed from one form to another."
  },
  {
    id: 19,
    category: "Physics",
    keywords: ["refraction", "refraction of light", "bending of light", "snell's law"],
    question: "What is refraction of light?",
    answer: "Refraction is the bending of light waves as they pass from one medium into another of different optical density (e.g., from air into water or glass), due to a change in the wave's speed."
  },
  {
    id: 20,
    category: "Physics",
    keywords: ["electric current", "voltage", "amperes", "volts"],
    question: "What is electric current and voltage?",
    answer: "• **Electric Current ($I$)**: The rate of flow of electric charge (electrons) measured in Amperes ($A$).\n• **Voltage ($V$)**: The electrical potential difference or push driving electrons measured in Volts ($V$)."
  },

  // --- CHEMISTRY (21-30) ---
  {
    id: 21,
    category: "Chemistry",
    keywords: ["atom", "proton neutron electron", "atomic structure"],
    question: "What is an atom and what are its parts?",
    answer: "An atom is the basic unit of matter. It consists of a dense central nucleus containing **protons** (positive charge) and **neutrons** (neutral), surrounded by an electron cloud of **electrons** (negative charge)."
  },
  {
    id: 22,
    category: "Chemistry",
    keywords: ["periodic table", "atomic number", "elements table"],
    question: "What is the periodic table?",
    answer: "The periodic table is a tabular arrangement of chemical elements organized by increasing atomic number, electron configuration, and recurring chemical properties into periods (rows) and groups (columns)."
  },
  {
    id: 23,
    category: "Chemistry",
    keywords: ["chemical reaction", "reactants products", "reaction"],
    question: "What is a chemical reaction?",
    answer: "A chemical reaction is a process in which one or more substances (reactants) undergo molecular restructuring to form new substances (products) with distinct chemical properties."
  },
  {
    id: 24,
    category: "Chemistry",
    keywords: ["acid base", "acid and base", "h+ oh-", "acidic basic"],
    question: "What is the difference between an acid and a base?",
    answer: "• **Acids**: Release hydrogen ions ($H^+$) in solution, have a sour taste, and pH $< 7$.\n• **Bases (Alkalis)**: Release hydroxide ions ($OH^-$), feel slippery, taste bitter, and have pH $> 7$."
  },
  {
    id: 25,
    category: "Chemistry",
    keywords: ["ph scale", "ph value", "neutral ph"],
    question: "What is the pH scale?",
    answer: "The pH scale measures acidity or alkalinity from 0 to 14. pH 7 is neutral (pure water), values $< 7$ are acidic, and values $> 7$ are alkaline (basic)."
  },
  {
    id: 26,
    category: "Chemistry",
    keywords: ["covalent bond", "ionic bond", "chemical bonding", "sharing electrons"],
    question: "What is a covalent bond vs ionic bond?",
    answer: "• **Covalent Bond**: Formed when two non-metal atoms **share** one or more pairs of electrons.\n• **Ionic Bond**: Formed when electrons are **transferred** from a metal to a non-metal, creating oppositely charged ions."
  },
  {
    id: 27,
    category: "Chemistry",
    keywords: ["mole concept", "avogadro number", "6.022x10^23"],
    question: "What is the mole concept in chemistry?",
    answer: "A mole is a fundamental unit measuring amount of substance. 1 mole contains exactly $6.022 \\times 10^{23}$ elementary entities (Avogadro's number)."
  },
  {
    id: 28,
    category: "Chemistry",
    keywords: ["balancing equation", "chemical balancing", "stoichiometry"],
    question: "What is balancing a chemical equation?",
    answer: "Balancing a chemical equation ensures the Law of Conservation of Mass is satisfied, so that the number of atoms of each element is equal on both the reactant and product sides."
  },
  {
    id: 29,
    category: "Chemistry",
    keywords: ["redox", "oxidation reduction", "oil rig", "oxidation state"],
    question: "What is oxidation and reduction (Redox)?",
    answer: "• **Oxidation**: Loss of electrons (or increase in oxidation state).\n• **Reduction**: Gain of electrons (or decrease in oxidation state).\n*(Remember: **OIL RIG** - Oxidation Is Loss, Reduction Is Gain).* "
  },
  {
    id: 30,
    category: "Chemistry",
    keywords: ["water formula", "h2o", "composition of water"],
    question: "What is water made of (H2O)?",
    answer: "Water ($H_2O$) is a chemical compound consisting of 2 Hydrogen atoms covalently bonded to 1 Oxygen atom."
  },

  // --- BIOLOGY (31-40) ---
  {
    id: 31,
    category: "Biology",
    keywords: ["cell components", "cell organelle", "nucleus cytoplasm"],
    question: "What is a cell and its main components?",
    answer: "A cell is the basic structural unit of living organisms. Key components include the **Cell Membrane** (boundary), **Nucleus** (contains DNA), **Mitochondria** (powerhouse), and **Cytoplasm** (gel-like fluid)."
  },
  {
    id: 32,
    category: "Biology",
    keywords: ["dna rna", "dna", "rna", "genetic code", "double helix"],
    question: "What is DNA and RNA?",
    answer: "• **DNA (Deoxyribonucleic Acid)**: Double-stranded molecule storing long-term genetic instructions.\n• **RNA (Ribonucleic Acid)**: Single-stranded molecule carrying code from DNA to synthesize proteins."
  },
  {
    id: 33,
    category: "Biology",
    keywords: ["photosynthesis", "sunlight glucose", "chlorophyll"],
    question: "What is photosynthesis?",
    answer: "Photosynthesis is the biological process by which green plants use sunlight, carbon dioxide ($CO_2$), and water ($H_2O$) in chlorophyll to produce glucose ($C_6H_{12}O_6$) and oxygen ($O_2$): $6CO_2 + 6H_2O + \\text{light} \\rightarrow C_6H_{12}O_6 + 6O_2$."
  },
  {
    id: 34,
    category: "Biology",
    keywords: ["cellular respiration", "atp energy", "mitochondria respiration"],
    question: "What is cellular respiration?",
    answer: "Cellular respiration is the metabolic process in which cells break down glucose with oxygen to produce cellular energy in the form of ATP (Adenosine Triphosphate), releasing $CO_2$ and $H_2O$ as byproducts."
  },
  {
    id: 35,
    category: "Biology",
    keywords: ["mitosis meiosis", "mitosis", "meiosis", "cell division"],
    question: "What is mitosis vs meiosis?",
    answer: "• **Mitosis**: Cell division resulting in 2 identical diploid daughter cells for growth and repair.\n• **Meiosis**: Special cell division resulting in 4 genetically unique haploid gamete cells (sperm/egg) for reproduction."
  },
  {
    id: 36,
    category: "Biology",
    keywords: ["ecosystem", "food chain", "producers consumers"],
    question: "What is an ecosystem and food chain?",
    answer: "An ecosystem is a community of living organisms interacting with non-living environments. A food chain illustrates the flow of energy from primary producers (plants) to consumers (herbivores/carnivores) and decomposers."
  },
  {
    id: 37,
    category: "Biology",
    keywords: ["human heart", "heart circulation", "atrium ventricle"],
    question: "How does the human heart work?",
    answer: "The human heart is a 4-chambered muscular pump. Deoxygenated blood enters the Right Atrium/Ventricle and goes to the lungs; oxygen-rich blood returns to the Left Atrium/Ventricle and is pumped throughout the body."
  },
  {
    id: 38,
    category: "Biology",
    keywords: ["enzyme", "enzymes", "biological catalyst", "substrate"],
    question: "What are enzymes and their functions?",
    answer: "Enzymes are biological protein catalysts that speed up chemical reactions in organisms by lowering the activation energy required, acting on specific substrate molecules at an active site."
  },
  {
    id: 39,
    category: "Biology",
    keywords: ["natural selection", "evolution", "darwin", "survival of fittest"],
    question: "What is natural selection and evolution?",
    answer: "Natural selection (proposed by Charles Darwin) is the mechanism of evolution where organisms with traits better adapted to their environment tend to survive, reproduce, and pass those favorable traits to offspring."
  },
  {
    id: 40,
    category: "Biology",
    keywords: ["immune system", "white blood cells", "antibodies", "pathogen"],
    question: "What is the immune system?",
    answer: "The immune system is a complex network of cells (like white blood cells), tissues, and organs that defends the body against infectious pathogens (viruses, bacteria, and parasites) by producing antibodies."
  },

  // --- COMPUTER SCIENCE (41-50) ---
  {
    id: 41,
    category: "Computer Science",
    keywords: ["algorithm", "algorithms", "step by step instructions"],
    question: "What is an algorithm?",
    answer: "An algorithm is a finite, step-by-step set of clear instructions or logical rules designed to solve a specific problem or perform a task in computer science."
  },
  {
    id: 42,
    category: "Computer Science",
    keywords: ["variable", "variables", "data storage programming"],
    question: "What is a variable in programming?",
    answer: "A variable is a named storage location in memory that holds a data value (such as numbers, text strings, or booleans) which can be accessed and modified during program execution."
  },
  {
    id: 43,
    category: "Computer Science",
    keywords: ["ram rom", "ram vs rom", "random access memory"],
    question: "What is the difference between RAM and ROM?",
    answer: "• **RAM (Random Access Memory)**: Volatile, high-speed temporary memory used while running programs (cleared when powered off).\n• **ROM (Read-Only Memory)**: Non-volatile permanent memory holding core boot instructions (BIOS)."
  },
  {
    id: 44,
    category: "Computer Science",
    keywords: ["operating system", "os", "windows linux macos"],
    question: "What is an operating system?",
    answer: "An Operating System (OS) is system software (e.g., Windows, macOS, Linux, Android) that manages hardware resources, files, memory, and provides execution environments for application programs."
  },
  {
    id: 45,
    category: "Computer Science",
    keywords: ["html css javascript", "web development", "frontend tech"],
    question: "What is HTML, CSS, and JavaScript?",
    answer: "• **HTML**: Defines page structure and markup content.\n• **CSS**: Handles visual layout, styling, colors, and fonts.\n• **JavaScript**: Adds dynamic interactivity, logic, and network requests."
  },
  {
    id: 46,
    category: "Computer Science",
    keywords: ["ip address", "ip", "internet protocol"],
    question: "What is an IP address?",
    answer: "An IP (Internet Protocol) address is a unique numerical label assigned to every device connected to a computer network, allowing devices to identify and communicate with each other (e.g., IPv4: 192.168.1.1)."
  },
  {
    id: 47,
    category: "Computer Science",
    keywords: ["database sql", "relational database", "sql queries"],
    question: "What is a database and SQL?",
    answer: "A database is an organized collection of structured data. **SQL (Structured Query Language)** is the standardized query language used to create, read, update, and delete data in relational databases."
  },
  {
    id: 48,
    category: "Computer Science",
    keywords: ["binary code", "binary 0 and 1", "bits bytes"],
    question: "What is binary code?",
    answer: "Binary code is a base-2 positional system that represents text, computer processor instructions, or any other data using only two digits: **0** (off) and **1** (on)."
  },
  {
    id: 49,
    category: "Computer Science",
    keywords: ["cpu gpu", "central processing unit", "processor"],
    question: "What is CPU and GPU?",
    answer: "• **CPU (Central Processing Unit)**: Primary brain of the computer handling general-purpose sequential logic.\n• **GPU (Graphics Processing Unit)**: Specialized processor designed for parallel computation, 3D graphics rendering, and AI matrix math."
  },
  {
    id: 50,
    category: "Computer Science",
    keywords: ["cloud computing", "cloud storage", "aws azure google cloud"],
    question: "What is cloud computing?",
    answer: "Cloud computing is the on-demand delivery of computing services—including servers, storage, databases, networking, and software—over the Internet ('the cloud') with pay-as-you-go pricing."
  },

  // --- ENGLISH & GRAMMAR (51-60) ---
  {
    id: 51,
    category: "English",
    keywords: ["noun verb adjective", "parts of speech"],
    question: "What is a noun, verb, and adjective?",
    answer: "• **Noun**: A word identifying a person, place, thing, or idea (e.g., teacher, city, book).\n• **Verb**: An action or state of being word (e.g., run, write, is).\n• **Adjective**: A word that describes or modifies a noun (e.g., bright, quick, blue)."
  },
  {
    id: 52,
    category: "English",
    keywords: ["metaphor simile", "metaphor vs simile", "literary device"],
    question: "What is a metaphor vs simile?",
    answer: "• **Simile**: Compares two distinct things using 'like' or 'as' (*'He was as brave as a lion'*).\n• **Metaphor**: Directly states that one thing is another without using 'like' or 'as' (*'Time is money'*)."
  },
  {
    id: 53,
    category: "English",
    keywords: ["subject verb agreement", "singular plural verb"],
    question: "What is subject-verb agreement?",
    answer: "Subject-verb agreement requires a subject and its verb to match in number. Singular subjects require singular verbs (*'The dog barks'*), and plural subjects require plural verbs (*'The dogs bark'*)."
  },
  {
    id: 54,
    category: "English",
    keywords: ["active passive voice", "passive voice", "active voice"],
    question: "What is active voice vs passive voice?",
    answer: "• **Active Voice**: The subject performs the action (*'The cat chased the mouse'*).\n• **Passive Voice**: The subject receives the action (*'The mouse was chased by the cat'*)."
  },
  {
    id: 55,
    category: "English",
    keywords: ["synonym antonym", "synonyms and antonyms"],
    question: "What is a synonym and antonym?",
    answer: "• **Synonym**: A word having the same or nearly the same meaning as another (e.g., *happy / joyful*).\n• **Antonym**: A word having the opposite meaning of another (e.g., *hot / cold*)."
  },
  {
    id: 56,
    category: "English",
    keywords: ["compound sentence", "fanboys", "conjunctions"],
    question: "What is a compound sentence?",
    answer: "A compound sentence contains at least two independent clauses joined by a coordinating conjunction (FANBOYS: For, And, Nor, But, Or, Yet, So) or a semicolon (*'I wanted to study, so I opened my textbook'*)."
  },
  {
    id: 57,
    category: "English",
    keywords: ["essay structure", "introduction body conclusion"],
    question: "What is an essay structure?",
    answer: "Standard academic essay structure consists of 3 main parts:\n1. **Introduction**: Hook, background context, and thesis statement.\n2. **Body Paragraphs**: Topic sentences, supporting evidence, analysis.\n3. **Conclusion**: Restated thesis, summary of points, final concluding thought."
  },
  {
    id: 58,
    category: "English",
    keywords: ["tone mood", "tone vs mood in literature"],
    question: "What is tone and mood in literature?",
    answer: "• **Tone**: The author's attitude toward the subject or audience (e.g., sarcastic, serious, hopeful).\n• **Mood**: The emotional atmosphere felt by the reader created by setting and word choice (e.g., eerie, cheerful)."
  },
  {
    id: 59,
    category: "English",
    keywords: ["punctuation", "comma apostrophe period"],
    question: "What is punctuation and its main rules?",
    answer: "Punctuation marks structure written language. Key rules: Use **Periods** to end statements; **Commas** for lists or clauses; **Apostrophes** for possession (*student's*) or contractions (*don't*)."
  },
  {
    id: 60,
    category: "English",
    keywords: ["thesis statement", "thesis"],
    question: "What is a thesis statement?",
    answer: "A thesis statement is a concise 1-2 sentence statement located at the end of an introduction that summarizes the main argument or central point of an essay."
  },

  // --- HISTORY (61-70) ---
  {
    id: 61,
    category: "History",
    keywords: ["world war 1", "ww1", "causes of ww1", "archduke franz ferdinand"],
    question: "What caused World War 1?",
    answer: "World War 1 (1914–1918) was triggered by the assassination of Archduke Franz Ferdinand of Austria. Root causes are remembered as **M-A-I-N**: Militarism, Alliances, Imperialism, and Nationalism."
  },
  {
    id: 62,
    category: "History",
    keywords: ["world war 2", "ww2", "causes of ww2", "axis allies"],
    question: "What caused World War 2?",
    answer: "World War 2 (1939–1945) was caused by aggressive expansionism by Fascist Axis powers (Germany, Japan, Italy), harsh conditions from the Treaty of Versailles, and Germany's invasion of Poland in 1939."
  },
  {
    id: 63,
    category: "History",
    keywords: ["industrial revolution", "steam engine", "factory system"],
    question: "What was the Industrial Revolution?",
    answer: "The Industrial Revolution (18th-19th century) was a major historical transition from agrarian, handcraft economies to machine manufacturing, powered by steam engines and factory systems."
  },
  {
    id: 64,
    category: "History",
    keywords: ["united nations", "un", "international peacekeeping"],
    question: "What is the United Nations (UN)?",
    answer: "The United Nations (UN) is an international organization founded in 1945 after WWII to maintain international peace and security, foster friendly relations among nations, and promote human rights."
  },
  {
    id: 65,
    category: "History",
    keywords: ["renaissance", "rebirth of art", "leonardo da vinci"],
    question: "What was the Renaissance?",
    answer: "The Renaissance (14th–17th century) was a period of European cultural, artistic, political, and scientific 'rebirth' marking the transition from the Middle Ages to modernity."
  },
  {
    id: 66,
    category: "History",
    keywords: ["democracy monarchy", "democracy vs monarchy", "government systems"],
    question: "What is a democracy vs monarchy?",
    answer: "• **Democracy**: Government power is held by the people who elect representatives through free elections.\n• **Monarchy**: Government supreme power is held by a monarch (king or queen) who inherits the position."
  },
  {
    id: 67,
    category: "History",
    keywords: ["cold war", "us vs ussr", "nuclear standoff"],
    question: "What was the Cold War?",
    answer: "The Cold War (1947–1991) was a state of geopolitical tension and ideological conflict between the United States (capitalism) and the Soviet Union (communism) without direct military combat between the superpowers."
  },
  {
    id: 68,
    category: "History",
    keywords: ["french revolution", "bastille", "liberty equality fraternity"],
    question: "What was the French Revolution?",
    answer: "The French Revolution (1789–1799) was a period of radical social upheaval in France that overthrew the absolute monarchy, established republican ideals, and spread modern democratic principles across Europe."
  },
  {
    id: 69,
    category: "History",
    keywords: ["constitution", "supreme law", "rights framework"],
    question: "What is a constitution?",
    answer: "A constitution is the supreme set of fundamental principles, laws, and legal precedents according to which a nation state or organization is governed, outlining citizen rights and government powers."
  },
  {
    id: 70,
    category: "History",
    keywords: ["ancient civilization", "egypt mesopotamia", "pyramids"],
    question: "What is ancient civilization (Egypt/Mesopotamia)?",
    answer: "Ancient civilizations like Mesopotamia (cradle of writing/agriculture) and Ancient Egypt (pyramids, pharaohs, Nile irrigation) laid the foundations for urban society, law codes, mathematics, and architectural engineering."
  },

  // --- GEOGRAPHY & EARTH SCIENCE (71-80) ---
  {
    id: 71,
    category: "Geography",
    keywords: ["continents oceans", "7 continents", "5 oceans"],
    question: "What are the 7 continents and 5 oceans?",
    answer: "• **7 Continents**: Asia, Africa, North America, South America, Antarctica, Europe, Australia.\n• **5 Oceans**: Pacific, Atlantic, Indian, Southern (Antarctic), Arctic."
  },
  {
    id: 72,
    category: "Geography",
    keywords: ["earthquakes", "plate tectonics", "fault lines", "seismic"],
    question: "What causes earthquakes and plate tectonics?",
    answer: "Earthquakes are caused by sudden releases of energy along fault lines in the Earth's crust when tectonic plates slide past, collide with, or submerge under one another."
  },
  {
    id: 73,
    category: "Geography",
    keywords: ["water cycle", "evaporation condensation precipitation"],
    question: "What is the water cycle?",
    answer: "The water cycle describes the continuous movement of water on Earth through **Evaporation** (liquid to vapor), **Condensation** (clouds), **Precipitation** (rain/snow), and **Collection** (rivers/oceans)."
  },
  {
    id: 74,
    category: "Geography",
    keywords: ["global warming", "climate change", "greenhouse gases"],
    question: "What is global warming and climate change?",
    answer: "Global warming is the long-term heating of Earth's climate system due to human activities (combustion of fossil fuels), which increases atmospheric greenhouse gas concentrations ($CO_2$, methane)."
  },
  {
    id: 75,
    category: "Geography",
    keywords: ["atmosphere layers", "troposphere stratosphere", "ozone layer"],
    question: "What is the atmosphere and its layers?",
    answer: "The atmosphere is the layer of gases surrounding Earth. Main layers from ground up: **Troposphere** (weather occurs here), **Stratosphere** (contains Ozone layer), **Mesosphere**, **Thermosphere**, and **Exosphere**."
  },
  {
    id: 76,
    category: "Geography",
    keywords: ["latitude longitude", "equator meridian"],
    question: "What is latitude and longitude?",
    answer: "• **Latitude**: Horizontal geographic lines measuring distance North or South of the Equator ($0^\\circ$).\n• **Longitude**: Vertical lines measuring distance East or West of the Prime Meridian ($0^\\circ$)."
  },
  {
    id: 77,
    category: "Geography",
    keywords: ["volcano", "magma lava", "volcanic eruption"],
    question: "What is a volcano?",
    answer: "A volcano is an opening or rupture in Earth's crust that allows hot molten rock (magma), volcanic ash, and gases to escape to the surface as lava during an eruption."
  },
  {
    id: 78,
    category: "Geography",
    keywords: ["seasons", "earth tilt", "weather changes"],
    question: "What causes weather changes and seasons?",
    answer: "Seasons are caused by Earth's $23.5^\\circ$ axial tilt as it orbits the Sun, causing different hemispheres to receive varying intensities of sunlight throughout the year."
  },
  {
    id: 79,
    category: "Geography",
    keywords: ["deforestation", "cutting trees", "forest destruction"],
    question: "What is deforestation and its effects?",
    answer: "Deforestation is the purposeful clearing of forested land by humans. Effects include loss of biodiversity habitat, soil erosion, disruption of water cycles, and accelerated global climate change."
  },
  {
    id: 80,
    category: "Geography",
    keywords: ["renewable energy", "solar wind hydro", "clean energy"],
    question: "What is renewable energy?",
    answer: "Renewable energy comes from natural sources that replenish faster than they are consumed, such as solar, wind, hydroelectric, geothermal, and biomass energy."
  },

  // --- GENERAL SCIENCE & ASTRONOMY (81-90) ---
  {
    id: 81,
    category: "Astronomy",
    keywords: ["solar system", "planets in solar system", "mercury venus earth mars"],
    question: "What is the Solar System and name the planets?",
    answer: "The Solar System consists of our Sun and everything bound to it by gravity. The 8 major planets in order from the Sun are: **Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune**."
  },
  {
    id: 82,
    category: "Astronomy",
    keywords: ["galaxy", "milky way", "stars systems"],
    question: "What is a galaxy and the Milky Way?",
    answer: "A galaxy is a massive gravitationally bound system of billions of stars, stellar remnants, gas, and dark matter. Our solar system resides in the **Milky Way** galaxy."
  },
  {
    id: 83,
    category: "Astronomy",
    keywords: ["black hole", "event horizon", "extreme gravity"],
    question: "What is a black hole?",
    answer: "A black hole is a region in spacetime where gravity is so intense that nothing—not even light—can escape its gravitational pull past its boundary called the event horizon."
  },
  {
    id: 84,
    category: "General Science",
    keywords: ["why sky blue", "blue sky", "rayleigh scattering"],
    question: "Why is the sky blue?",
    answer: "The sky appears blue because Earth's atmospheric gas molecules scatter shorter blue wavelengths of sunlight in all directions much more than red light (Rayleigh scattering)."
  },
  {
    id: 85,
    category: "Astronomy",
    keywords: ["eclipse", "solar eclipse", "lunar eclipse"],
    question: "What causes eclipses (solar and lunar)?",
    answer: "• **Solar Eclipse**: The Moon passes directly between the Sun and Earth, blocking sunlight.\n• **Lunar Eclipse**: Earth passes directly between the Sun and Moon, casting Earth's shadow on the Moon."
  },
  {
    id: 86,
    category: "Physics",
    keywords: ["sound wave", "sound travel", "vibration wave"],
    question: "What is sound wave and how does sound travel?",
    answer: "Sound is a mechanical longitudinal wave produced by vibrating objects. It travels through media (solids, liquids, gases) by compressing and expanding particles, but cannot travel in a vacuum."
  },
  {
    id: 87,
    category: "Chemistry",
    keywords: ["states of matter", "solid liquid gas", "plasma"],
    question: "What is state of matter (solid, liquid, gas, plasma)?",
    answer: "States of matter represent distinct physical forms:\n• **Solid**: Fixed shape and volume.\n• **Liquid**: Fixed volume, takes container shape.\n• **Gas**: Expands to fill volume and shape.\n• **Plasma**: High-energy ionized gas."
  },
  {
    id: 88,
    category: "Physics",
    keywords: ["gravity on moon", "moon gravity vs earth"],
    question: "What is gravity on Moon vs Earth?",
    answer: "The Moon's surface gravity is about $\\frac{1}{6}\\text{th}$ (16.6%) of Earth's gravity (approx $1.62 \\text{ m/s}^2$ vs Earth's $9.8 \\text{ m/s}^2$), because the Moon has significantly less mass."
  },
  {
    id: 89,
    category: "Physics",
    keywords: ["rainbow", "light spectrum", "dispersion of light"],
    question: "What is light spectrum and rainbow?",
    answer: "A rainbow is an optical phenomenon caused by refraction, internal reflection, and dispersion of light in water droplets, separating white sunlight into its spectrum colors: Red, Orange, Yellow, Green, Blue, Indigo, Violet (ROYGBIV)."
  },
  {
    id: 90,
    category: "Astronomy",
    keywords: ["big bang", "big bang theory", "origin of universe"],
    question: "What is the Big Bang theory?",
    answer: "The Big Bang theory is the prevailing cosmological model explaining that the universe expanded from an extremely hot, dense singularity approximately 13.8 billion years ago."
  },

  // --- STUDY STRATEGIES & LEARNING (91-100) ---
  {
    id: 91,
    category: "Study Tips",
    keywords: ["memory", "improve memory", "exam revision tips"],
    question: "How can I improve my memory for exams?",
    answer: "To improve exam retention: Use **active recall** (testing yourself without looking), **spaced repetition** (reviewing intervals over days), creating mind maps, and getting at least 7-8 hours of sleep."
  },
  {
    id: 92,
    category: "Study Tips",
    keywords: ["pomodoro", "pomodoro technique", "25 minute study"],
    question: "What is the Pomodoro technique?",
    answer: "The Pomodoro Technique is a time-management method: Study with full concentration for 25 minutes, followed by a 5-minute break. Repeat 4 times, then take a longer 15-30 minute break."
  },
  {
    id: 93,
    category: "Study Tips",
    keywords: ["study notes", "efficient notes", "cornell note taking"],
    question: "How do I make efficient study notes?",
    answer: "Use structured systems like the **Cornell Note Method** (divide pages into main notes, cues/questions, and summaries), use bullet points, highlight key formulas, and rewrite concepts in your own words."
  },
  {
    id: 94,
    category: "Study Tips",
    keywords: ["time management", "study schedule", "manage study time"],
    question: "How to manage time effectively during studies?",
    answer: "Create a weekly study planner, prioritize difficult subjects during your peak energy hours, eliminate phone distractions, break big assignments into small sub-tasks, and stick to consistent study blocks."
  },
  {
    id: 95,
    category: "Study Tips",
    keywords: ["prepare math test", "math test tips", "practice math"],
    question: "How to prepare for a math test?",
    answer: "Math is learned by doing! Don't just read solved examples—work out practice problems by hand, maintain a formula sheet, redo past test errors, and understand *why* each step is taken."
  },
  {
    id: 96,
    category: "Study Tips",
    keywords: ["exam stress", "reduce anxiety", "test anxiety"],
    question: "How to overcome exam stress and anxiety?",
    answer: "Practice deep breathing exercises, maintain regular physical exercise, avoid last-minute cramming, eat balanced meals, and focus on steady preparation rather than perfection."
  },
  {
    id: 97,
    category: "Study Tips",
    keywords: ["active recall", "spaced repetition", "flashcards"],
    question: "What is active recall and spaced repetition?",
    answer: "• **Active Recall**: Actively stimulating memory by quizzing yourself instead of passively re-reading.\n• **Spaced Repetition**: Reviewing material at increasing time intervals (e.g., Day 1, Day 3, Day 7) to lock concepts into long-term memory."
  },
  {
    id: 98,
    category: "Study Tips",
    keywords: ["how many hours study", "study hours per day"],
    question: "How many hours should I study daily?",
    answer: "Quality beats quantity! Aim for 2 to 4 hours of focused, distraction-free study daily with regular breaks, adjusting based on exam schedules and personal workload."
  },
  {
    id: 99,
    category: "Study Tips",
    keywords: ["stay focused", "concentration study", "avoid distraction"],
    question: "How to stay focused while studying?",
    answer: "Set up a clean, quiet study environment, keep your phone in another room or on 'Do Not Disturb', set clear goals for each 30-minute block, and stay hydrated."
  },
  {
    id: 100,
    category: "Study Tips",
    keywords: ["analyze mistakes", "learn from errors", "practice quiz review"],
    question: "How to analyze mistakes after a practice quiz?",
    answer: "Keep an 'Error Logbook'. Write down: 1) What question was missed, 2) Why you missed it (concept gap vs. calculation error), and 3) The correct solution step. Review this logbook before your final exam."
  }
];

/**
 * Searches the 100 built-in knowledge base entries for a matching question.
 * Returns the exact answer if matched, or a friendly scope boundary message if not found.
 */
export function findAnswerInKnowledgeBase(userMessage: string): string {
  const query = userMessage.toLowerCase().trim();

  if (!query) {
    return "Hello! I am your PLIS AI Tutor. Ask me any question from our 100 built-in core curriculum topics (Math, Physics, Chemistry, Biology, CS, History, English, Geography)!";
  }

  // Handle common greetings
  if (query === 'hi' || query === 'hello' || query === 'hey') {
    return "Hi there! 👋 I am your PLIS AI Subject Tutor. I am trained to answer **100 built-in core curriculum questions** across Math, Physics, Chemistry, Biology, CS, History, Geography, and Study Strategies! Ask me a question to get started.";
  }

  // 1. Direct or keyword match search across the 100 built-in Q&A entries
  for (const item of KNOWLEDGE_BASE_100) {
    const questionLower = item.question.toLowerCase();
    
    // Check keyword match or title match
    const isKeywordMatch = item.keywords.some(keyword => query.includes(keyword.toLowerCase()));
    const isTitleMatch = query.includes(questionLower) || questionLower.includes(query);

    if (isKeywordMatch || isTitleMatch) {
      return `📚 **[${item.category}] Question ${item.id}/100: ${item.question}**\n\n${item.answer}`;
    }
  }

  // 2. If question is outside the 100 built-in scope, enforce strict boundary
  const sampleTopics = [
    "• What is a quadratic equation?",
    "• What is Newton's Second Law of Motion?",
    "• What is photosynthesis?",
    "• What is the Pythagorean theorem?",
    "• What is Ohm's Law?",
    "• What is an atom and its parts?",
    "• What is an algorithm in Computer Science?",
    "• What caused World War 1?",
    "• What is active recall and spaced repetition?"
  ].join("\n");

  return `ℹ️ **PLIS Knowledge Base Notice**\n\nI am configured to answer questions exclusively from our **100 built-in educational curriculum topics**. Your question ("*${userMessage}*") is outside these 100 built-in questions.\n\nPlease ask one of our supported core curriculum questions, for example:\n${sampleTopics}\n\n*Feel free to ask any of the 100 built-in questions in Math, Physics, Chemistry, Biology, CS, History, Geography, or Study Tips!*`;
}
