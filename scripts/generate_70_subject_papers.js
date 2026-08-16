const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const targetDirs = [
  path.join(__dirname, '../frontend/public/question_papers'),
  path.join(__dirname, '../backend/uploads/question_papers'),
  path.join(__dirname, '../plis-v2/public/question_papers'),
];

targetDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Definition of 7 Subjects with 10 Papers each (Total 70 Papers)
const subjectDefinitions = [
  {
    subject: "Java Programming",
    shortCode: "Java",
    papers: [
      { num: 1, title: "Java OOP & Class Inheritance", count: 60, topic: "Object-Oriented Programming" },
      { num: 2, title: "Java Multithreading & Concurrency", count: 55, topic: "Threads & Executive Services" },
      { num: 3, title: "Java Collections Framework & Generics", count: 50, topic: "Lists, Sets, Maps & Generics" },
      { num: 4, title: "Java Exception Handling & Logging", count: 65, topic: "Try-Catch, Custom Exceptions" },
      { num: 5, title: "Java 8+ Streams & Lambda Expressions", count: 70, topic: "Functional Interfaces & Streams" },
      { num: 6, title: "Java JVM Architecture & Garbage Collection", count: 75, topic: "Heap, Stack, GC Tuning" },
      { num: 7, title: "Java I/O, NIO & File Processing", count: 60, topic: "File Streams & Serialization" },
      { num: 8, title: "Java Design Patterns & Solid Principles", count: 50, topic: "Factory, Singleton, Observer" },
      { num: 9, title: "Java Spring Boot & REST APIs", count: 55, topic: "Dependency Injection & Controllers" },
      { num: 10, title: "Java Database Connectivity (JDBC & JPA)", count: 65, topic: "Entities & ORM Mapping" },
    ]
  },
  {
    subject: "Python Data Science",
    shortCode: "Python",
    papers: [
      { num: 1, title: "Python Fundamentals & Data Structures", count: 60, topic: "Lists, Tuples & Dicts" },
      { num: 2, title: "NumPy Array Computation & Matrix Math", count: 55, topic: "NDArrays & Broadcasting" },
      { num: 3, title: "Pandas Data Cleaning & Aggregation", count: 50, topic: "DataFrames & Merging" },
      { num: 4, title: "Matplotlib & Seaborn Data Visualization", count: 65, topic: "Plotting & Chart Customization" },
      { num: 5, title: "Scikit-Learn Classification Algorithms", count: 70, topic: "Supervised Learning Models" },
      { num: 6, title: "Scikit-Learn Regression & Clustering", count: 75, topic: "Linear Regression & K-Means" },
      { num: 7, title: "TensorFlow & Keras Deep Learning", count: 60, topic: "Neural Networks & Backpropagation" },
      { num: 8, title: "Natural Language Processing with NLTK", count: 50, topic: "Tokenization & TF-IDF" },
      { num: 9, title: "Time Series Analysis & Forecasting", count: 55, topic: "ARIMA & Stationary Data" },
      { num: 10, title: "Feature Engineering & Model Selection", count: 65, topic: "Cross-Validation & Hyperparameters" },
    ]
  },
  {
    subject: "Physics",
    shortCode: "Physics",
    papers: [
      { num: 1, title: "Newtonian Mechanics & Dynamics", count: 60, topic: "Kinematics & Momentum" },
      { num: 2, title: "Work, Power & Energy Conservation", count: 55, topic: "Kinetic & Potential Energy" },
      { num: 3, title: "Thermodynamics & Heat Transfer", count: 50, topic: "Laws of Thermodynamics & Entropy" },
      { num: 4, title: "Electrostatics & Capacitance", count: 65, topic: "Coulomb's Law & Electric Fields" },
      { num: 5, title: "Current Electricity & Magnetism", count: 70, topic: "Ohm's Law & Lorentz Force" },
      { num: 6, title: "Electromagnetic Induction & AC Circuits", count: 75, topic: "Faraday's Law & Transformers" },
      { num: 7, title: "Optics & Light Diffraction", count: 60, topic: "Refraction, Lenses & Wave Optics" },
      { num: 8, title: "Quantum Physics & Photoelectric Effect", count: 50, topic: "Photon Energy & Wave-Particle Duality" },
      { num: 9, title: "Atomic & Nuclear Physics", count: 55, topic: "Radioactivity & Fission/Fusion" },
      { num: 10, title: "Special Relativity & Particle Physics", count: 65, topic: "Time Dilation & Mass-Energy" },
    ]
  },
  {
    subject: "Chemistry",
    shortCode: "Chemistry",
    papers: [
      { num: 1, title: "Organic Chemistry Reactions & Alkanes", count: 60, topic: "Hydrocarbons & Substitutions" },
      { num: 2, title: "Inorganic Chemistry & Periodic Table", count: 55, topic: "Transition Metals & Bonding" },
      { num: 3, title: "Physical Chemistry & Chemical Equilibrium", count: 50, topic: "Le Chatelier's Principle & Rates" },
      { num: 4, title: "Thermochemistry & Enthalpy", count: 65, topic: "Hess's Law & Heat Capacity" },
      { num: 5, title: "Electrochemistry & Redox Reactions", count: 70, topic: "Galvanic Cells & Nernst Equation" },
      { num: 6, title: "Acid-Base Chemistry & pH Buffers", count: 75, topic: "Titration & Dissociation" },
      { num: 7, title: "Analytical Chemistry & Spectroscopy", count: 60, topic: "NMR, IR & Mass Spectrometry" },
      { num: 8, title: "Biochemistry & Biomolecules", count: 50, topic: "Proteins, Enzymes & Lipids" },
      { num: 9, title: "Polymer Chemistry & Macromolecules", count: 55, topic: "Addition & Condensation Polymers" },
      { num: 10, title: "Environmental & Green Chemistry", count: 65, topic: "Pollution & Catalytic Synthesis" },
    ]
  },
  {
    subject: "Biology",
    shortCode: "Biology",
    papers: [
      { num: 1, title: "Cellular Biology & Organelles", count: 60, topic: "Mitochondria, Ribosomes & Membrane" },
      { num: 2, title: "Molecular Genetics & DNA Replication", count: 55, topic: "Transcription & Translation" },
      { num: 3, title: "Mendelian Genetics & Inheritance", count: 50, topic: "Punnett Squares & Alleles" },
      { num: 4, title: "Human Anatomy & Circulatory System", count: 65, topic: "Heart, Blood Vessels & Cardiac Cycle" },
      { num: 5, title: "Human Physiology & Nervous System", count: 70, topic: "Neurons, Synapses & Brain Regions" },
      { num: 6, title: "Botany & Plant Physiology", count: 75, topic: "Photosynthesis, Xylem & Stomata" },
      { num: 7, title: "Microbiology & Immunology", count: 60, topic: "Bacteria, Viruses & Antibodies" },
      { num: 8, title: "Evolutionary Biology & Speciation", count: 50, topic: "Natural Selection & Phylogenetics" },
      { num: 9, title: "Ecology & Ecosystem Dynamics", count: 55, topic: "Food Webs & Carbon Cycle" },
      { num: 10, title: "Biotechnology & Recombinant DNA", count: 65, topic: "PCR, CRISPR & Gene Cloning" },
    ]
  },
  {
    subject: "Mathematics",
    shortCode: "Mathematics",
    papers: [
      { num: 1, title: "Algebra & Polynomial Equations", count: 60, topic: "Quadratic Equations & Factoring" },
      { num: 2, title: "Differential Calculus & Derivatives", count: 55, topic: "Limits & Power Rule" },
      { num: 3, title: "Integral Calculus & Definite Integrals", count: 50, topic: "Integration Techniques & Area" },
      { num: 4, title: "Trigonometry & Polar Coordinates", count: 65, topic: "Trig Identities & Vectors" },
      { num: 5, title: "Linear Algebra & Matrix Operations", count: 70, topic: "Determinants & Eigenvalues" },
      { num: 6, title: "Differential Equations & Modeling", count: 75, topic: "First Order & Separation of Vars" },
      { num: 7, title: "Probability Theory & Combinatorics", count: 60, topic: "Permutations & Bayes Theorem" },
      { num: 8, title: "Statistics & Hypothesis Testing", count: 50, topic: "Z-Scores & Confidence Intervals" },
      { num: 9, title: "Discrete Mathematics & Logic", count: 55, topic: "Truth Tables & Graph Theory" },
      { num: 10, title: "Complex Analysis & Vector Calculus", count: 65, topic: "Gradient, Divergence & Curl" },
    ]
  },
  {
    subject: "Computer Science",
    shortCode: "CompSci",
    papers: [
      { num: 1, title: "Data Structures (Lists, Stacks, Queues)", count: 60, topic: "Linear Data Structures" },
      { num: 2, title: "Binary Search Trees & Graph Algorithms", count: 55, topic: "Dijkstra & BFS/DFS" },
      { num: 3, title: "Algorithm Analysis & Sorting Complexity", count: 50, topic: "Big-O Notation & QuickSort" },
      { num: 4, title: "Operating Systems & Process Management", count: 65, topic: "Threads, Deadlocks & Memory" },
      { num: 5, title: "Computer Networks & OSI Model", count: 70, topic: "TCP/IP, Routing & DNS" },
      { num: 6, title: "Database Systems & SQL Querying", count: 75, topic: "Normalization, Joins & Indexing" },
      { num: 7, title: "Software Engineering & Agile Lifecycle", count: 60, topic: "Design Patterns & SDLC" },
      { num: 8, title: "Cybersecurity & Cryptography Basics", count: 50, topic: "Encryption, Hashing & PKI" },
      { num: 9, title: "Compiler Design & Automata Theory", count: 55, topic: "DFA, NFA & Parsing" },
      { num: 10, title: "Cloud Computing & Distributed Systems", count: 65, topic: "Microservices & Docker/K8s" },
    ]
  }
];

// Helper to escape XML
const escapeXml = (str) => {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
};

// Questions generator
const generateSubjectQuestions = (subjName, paperTitle, count) => {
  const qList = [];
  const templates = [
    { text: `Which concept is fundamental to ${subjName}?`, opts: ["Core Abstraction", "Linear Memory", "Auxiliary Space", "Static Override"], ans: 0 },
    { text: `What is the primary objective when evaluating ${paperTitle}?`, opts: ["Optimize Execution Time", "Minimize Complexity", "Ensure Standard Protocol", "Constant Bound"], ans: 0 },
    { text: `Which statement accurately describes key principles of ${subjName}?`, opts: ["Structured Execution", "Random Memory Allocation", "Unbounded Re-evaluation", "None"], ans: 0 },
    { text: `When solving problems in ${paperTitle}, what is the recommended approach?`, opts: ["Step-by-step Isolation", "Immediate Approximation", "Bypass Validation", "Static Null Check"], ans: 0 },
    { text: `What is the expected outcome of applying standard rules in ${subjName}?`, opts: ["Determined Correct Value", "Variable Divergence", "Indefinite State", "Looping Error"], ans: 0 },
  ];

  for (let i = 1; i <= count; i++) {
    const tmpl = templates[(i - 1) % templates.length];
    qList.push({
      num: i,
      text: `${subjName} (Paper ${Math.ceil(i / 10)}) Q${i}: ${tmpl.text}`,
      opts: tmpl.opts,
      ans: tmpl.ans
    });
  }
  return qList;
};

let totalGeneratedCount = 0;

subjectDefinitions.forEach((subjDef) => {
  subjDef.papers.forEach((p) => {
    const questions = generateSubjectQuestions(subjDef.subject, p.title, p.count);

    const lineHeight = 58;
    const headerHeight = 160;
    const padding = 40;
    const imageWidth = 850;
    const imageHeight = headerHeight + questions.length * lineHeight + padding * 2;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}" viewBox="0 0 ${imageWidth} ${imageHeight}">
  <style>
    .bg { fill: #FFFFFF; }
    .header-title { font-family: serif; font-size: 20px; font-weight: bold; fill: #000000; text-anchor: middle; }
    .header-sub { font-family: sans-serif; font-size: 13px; fill: #333333; text-anchor: middle; }
    .divider { stroke: #000000; stroke-width: 1.5; }
    .q-text { font-family: serif; font-size: 15px; font-weight: bold; fill: #000000; }
    .opt-text { font-family: sans-serif; font-size: 13px; fill: #111111; }
  </style>
  <rect width="100%" height="100%" class="bg"/>

  <!-- Header Banner -->
  <text x="${imageWidth / 2}" y="45" class="header-title">DEPARTMENT OF ${escapeXml(subjDef.subject.toUpperCase())} EXAMINATIONS</text>
  <text x="${imageWidth / 2}" y="70" class="header-sub">QUESTION PAPER #${p.num} • ${escapeXml(p.title.toUpperCase())}</text>
  <text x="${imageWidth / 2}" y="90" class="header-sub">Subject: ${escapeXml(subjDef.subject)}  |  Topic: ${escapeXml(p.topic)}  |  Total MCQs: ${p.count}  |  Max Marks: 100</text>
  <line x1="40" y1="110" x2="${imageWidth - 40}" y2="110" class="divider"/>
  <line x1="40" y1="114" x2="${imageWidth - 40}" y2="114" class="divider"/>
`;

    questions.forEach((q, idx) => {
      const yPos = headerHeight + idx * lineHeight;
      const optY = yPos + 22;

      svgContent += `
  <!-- Q${q.num} -->
  <text x="45" y="${yPos}" class="q-text">Q${q.num}. ${escapeXml(q.text)}</text>
  <text x="65" y="${optY}" class="opt-text">a) ${escapeXml(q.opts[0])}</text>
  <text x="240" y="${optY}" class="opt-text">b) ${escapeXml(q.opts[1])}</text>
  <text x="420" y="${optY}" class="opt-text">c) ${escapeXml(q.opts[2])}</text>
  <text x="620" y="${optY}" class="opt-text">d) ${escapeXml(q.opts[3])}</text>
`;
    });

    svgContent += `\n</svg>`;

    const pNumFormatted = p.num < 10 ? '0' + p.num : p.num;
    const pngFileName = `${subjDef.shortCode}_Paper_${pNumFormatted}.png`;

    const resvg = new Resvg(svgContent, { fitTo: { mode: 'width', value: 900 } });
    const pngBuffer = resvg.render().asPng();

    targetDirs.forEach((dir) => {
      fs.writeFileSync(path.join(dir, pngFileName), pngBuffer);
    });

    totalGeneratedCount++;
    console.log(`Generated Paper #${totalGeneratedCount}: ${pngFileName} (${p.count} MCQs, ${(pngBuffer.length / 1024).toFixed(1)} KB)`);
  });
});

console.log(`🎉 Successfully generated all 70 PNG question paper images (10 Papers per Subject across 7 Subjects)!`);
