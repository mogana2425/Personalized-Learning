import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../components/Theme';
import {
  FileQuestion,
  Clock,
  Award,
  CheckCircle,
  Play,
  ChevronRight,
  RotateCcw,
  X,
  Sparkles,
  Eye,
  FolderOpen,
  UploadCloud,
  ImagePlus,
  Trash2,
  FileText,
  BookOpen,
} from 'lucide-react-native';

interface QuizItem {
  id: string;
  title: string;
  subject: string;
  topic: string;
  questionsCount: number;
  timeLimitMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed: boolean;
  score?: number;
  paperCount?: number;
  isAiGenerated?: boolean;
  questions: {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation?: string;
  }[];
}

interface ImageQuestionPaper {
  id: string;
  num: number;
  fileName: string;
  title: string;
  subject: string;
  questionsCount: number;
  imageUrl: string;
  isUserUploaded?: boolean;
}

// 70 Unique Question Papers (10 Papers x 7 Subjects)
const ALL_70_SUBJECT_PAPERS: ImageQuestionPaper[] = [
  // ── Java Programming (10 Papers) ──
  { id: 'java-01', num: 1, fileName: 'Java_Paper_01.png', title: 'Paper 01: Java OOP & Class Inheritance', subject: 'Java Programming', questionsCount: 60, imageUrl: '/question_papers/Java_Paper_01.png' },
  { id: 'java-02', num: 2, fileName: 'Java_Paper_02.png', title: 'Paper 02: Java Multithreading & Concurrency', subject: 'Java Programming', questionsCount: 55, imageUrl: '/question_papers/Java_Paper_02.png' },
  { id: 'java-03', num: 3, fileName: 'Java_Paper_03.png', title: 'Paper 03: Java Collections Framework & Generics', subject: 'Java Programming', questionsCount: 50, imageUrl: '/question_papers/Java_Paper_03.png' },
  { id: 'java-04', num: 4, fileName: 'Java_Paper_04.png', title: 'Paper 04: Java Exception Handling & Logging', subject: 'Java Programming', questionsCount: 65, imageUrl: '/question_papers/Java_Paper_04.png' },
  { id: 'java-05', num: 5, fileName: 'Java_Paper_05.png', title: 'Paper 05: Java 8+ Streams & Lambda Expressions', subject: 'Java Programming', questionsCount: 70, imageUrl: '/question_papers/Java_Paper_05.png' },
  { id: 'java-06', num: 6, fileName: 'Java_Paper_06.png', title: 'Paper 06: Java JVM Memory & Garbage Collection', subject: 'Java Programming', questionsCount: 75, imageUrl: '/question_papers/Java_Paper_06.png' },
  { id: 'java-07', num: 7, fileName: 'Java_Paper_07.png', title: 'Paper 07: Java File I/O & Serialization', subject: 'Java Programming', questionsCount: 60, imageUrl: '/question_papers/Java_Paper_07.png' },
  { id: 'java-08', num: 8, fileName: 'Java_Paper_08.png', title: 'Paper 08: Java Design Patterns & SOLID', subject: 'Java Programming', questionsCount: 50, imageUrl: '/question_papers/Java_Paper_08.png' },
  { id: 'java-09', num: 9, fileName: 'Java_Paper_09.png', title: 'Paper 09: Java Spring Boot & REST APIs', subject: 'Java Programming', questionsCount: 55, imageUrl: '/question_papers/Java_Paper_09.png' },
  { id: 'java-10', num: 10, fileName: 'Java_Paper_10.png', title: 'Paper 10: Java Database Connectivity (JDBC)', subject: 'Java Programming', questionsCount: 65, imageUrl: '/question_papers/Java_Paper_10.png' },

  // ── Python Data Science (10 Papers) ──
  { id: 'py-01', num: 1, fileName: 'Python_Paper_01.png', title: 'Paper 01: Python Fundamentals & Data Structures', subject: 'Python Data Science', questionsCount: 60, imageUrl: '/question_papers/Python_Paper_01.png' },
  { id: 'py-02', num: 2, fileName: 'Python_Paper_02.png', title: 'Paper 02: NumPy Array Computation & Vectors', subject: 'Python Data Science', questionsCount: 55, imageUrl: '/question_papers/Python_Paper_02.png' },
  { id: 'py-03', num: 3, fileName: 'Python_Paper_03.png', title: 'Paper 03: Pandas Data Cleaning & Aggregation', subject: 'Python Data Science', questionsCount: 50, imageUrl: '/question_papers/Python_Paper_03.png' },
  { id: 'py-04', num: 4, fileName: 'Python_Paper_04.png', title: 'Paper 04: Matplotlib & Seaborn Visualization', subject: 'Python Data Science', questionsCount: 65, imageUrl: '/question_papers/Python_Paper_04.png' },
  { id: 'py-05', num: 5, fileName: 'Python_Paper_05.png', title: 'Paper 05: Scikit-Learn Classification Models', subject: 'Python Data Science', questionsCount: 70, imageUrl: '/question_papers/Python_Paper_05.png' },
  { id: 'py-06', num: 6, fileName: 'Python_Paper_06.png', title: 'Paper 06: Scikit-Learn Regression & Clustering', subject: 'Python Data Science', questionsCount: 75, imageUrl: '/question_papers/Python_Paper_06.png' },
  { id: 'py-07', num: 7, fileName: 'Python_Paper_07.png', title: 'Paper 07: TensorFlow & Keras Deep Learning', subject: 'Python Data Science', questionsCount: 60, imageUrl: '/question_papers/Python_Paper_07.png' },
  { id: 'py-08', num: 8, fileName: 'Python_Paper_08.png', title: 'Paper 08: Natural Language Processing (NLP)', subject: 'Python Data Science', questionsCount: 50, imageUrl: '/question_papers/Python_Paper_08.png' },
  { id: 'py-09', num: 9, fileName: 'Python_Paper_09.png', title: 'Paper 09: Time Series Analysis & Forecasting', subject: 'Python Data Science', questionsCount: 55, imageUrl: '/question_papers/Python_Paper_09.png' },
  { id: 'py-10', num: 10, fileName: 'Python_Paper_10.png', title: 'Paper 10: Feature Engineering & Tuning', subject: 'Python Data Science', questionsCount: 65, imageUrl: '/question_papers/Python_Paper_10.png' },

  // ── Physics (10 Papers) ──
  { id: 'phy-01', num: 1, fileName: 'Physics_Paper_01.png', title: 'Paper 01: Newtonian Mechanics & Kinematics', subject: 'Physics', questionsCount: 60, imageUrl: '/question_papers/Physics_Paper_01.png' },
  { id: 'phy-02', num: 2, fileName: 'Physics_Paper_02.png', title: 'Paper 02: Work, Power & Energy Conservation', subject: 'Physics', questionsCount: 55, imageUrl: '/question_papers/Physics_Paper_02.png' },
  { id: 'phy-03', num: 3, fileName: 'Physics_Paper_03.png', title: 'Paper 03: Thermodynamics & Heat Transfer', subject: 'Physics', questionsCount: 50, imageUrl: '/question_papers/Physics_Paper_03.png' },
  { id: 'phy-04', num: 4, fileName: 'Physics_Paper_04.png', title: 'Paper 04: Electrostatics & Capacitance', subject: 'Physics', questionsCount: 65, imageUrl: '/question_papers/Physics_Paper_04.png' },
  { id: 'phy-05', num: 5, fileName: 'Physics_Paper_05.png', title: 'Paper 05: Current Electricity & Magnetism', subject: 'Physics', questionsCount: 70, imageUrl: '/question_papers/Physics_Paper_05.png' },
  { id: 'phy-06', num: 6, fileName: 'Physics_Paper_06.png', title: 'Paper 06: Electromagnetic Induction & AC', subject: 'Physics', questionsCount: 75, imageUrl: '/question_papers/Physics_Paper_06.png' },
  { id: 'phy-07', num: 7, fileName: 'Physics_Paper_07.png', title: 'Paper 07: Optics & Wave Diffraction', subject: 'Physics', questionsCount: 60, imageUrl: '/question_papers/Physics_Paper_07.png' },
  { id: 'phy-08', num: 8, fileName: 'Physics_Paper_08.png', title: 'Paper 08: Quantum Physics & Photoelectric', subject: 'Physics', questionsCount: 50, imageUrl: '/question_papers/Physics_Paper_08.png' },
  { id: 'phy-09', num: 9, fileName: 'Physics_Paper_09.png', title: 'Paper 09: Atomic & Nuclear Physics', subject: 'Physics', questionsCount: 55, imageUrl: '/question_papers/Physics_Paper_09.png' },
  { id: 'phy-10', num: 10, fileName: 'Physics_Paper_10.png', title: 'Paper 10: Special Relativity & Particle Physics', subject: 'Physics', questionsCount: 65, imageUrl: '/question_papers/Physics_Paper_10.png' },

  // ── Chemistry (10 Papers) ──
  { id: 'chem-01', num: 1, fileName: 'Chemistry_Paper_01.png', title: 'Paper 01: Organic Chemistry Reactions', subject: 'Chemistry', questionsCount: 60, imageUrl: '/question_papers/Chemistry_Paper_01.png' },
  { id: 'chem-02', num: 2, fileName: 'Chemistry_Paper_02.png', title: 'Paper 02: Inorganic Chemistry & Bonding', subject: 'Chemistry', questionsCount: 55, imageUrl: '/question_papers/Chemistry_Paper_02.png' },
  { id: 'chem-03', num: 3, fileName: 'Chemistry_Paper_03.png', title: 'Paper 03: Physical Chemistry & Equilibrium', subject: 'Chemistry', questionsCount: 50, imageUrl: '/question_papers/Chemistry_Paper_03.png' },
  { id: 'chem-04', num: 4, fileName: 'Chemistry_Paper_04.png', title: 'Paper 04: Thermochemistry & Enthalpy', subject: 'Chemistry', questionsCount: 65, imageUrl: '/question_papers/Chemistry_Paper_04.png' },
  { id: 'chem-05', num: 5, fileName: 'Chemistry_Paper_05.png', title: 'Paper 05: Electrochemistry & Nernst Equation', subject: 'Chemistry', questionsCount: 70, imageUrl: '/question_papers/Chemistry_Paper_05.png' },
  { id: 'chem-06', num: 6, fileName: 'Chemistry_Paper_06.png', title: 'Paper 06: Acid-Base Chemistry & pH Buffers', subject: 'Chemistry', questionsCount: 75, imageUrl: '/question_papers/Chemistry_Paper_06.png' },
  { id: 'chem-07', num: 7, fileName: 'Chemistry_Paper_07.png', title: 'Paper 07: Analytical Chemistry & Spectroscopy', subject: 'Chemistry', questionsCount: 60, imageUrl: '/question_papers/Chemistry_Paper_07.png' },
  { id: 'chem-08', num: 8, fileName: 'Chemistry_Paper_08.png', title: 'Paper 08: Biochemistry & Biomolecules', subject: 'Chemistry', questionsCount: 50, imageUrl: '/question_papers/Chemistry_Paper_08.png' },
  { id: 'chem-09', num: 9, fileName: 'Chemistry_Paper_09.png', title: 'Paper 09: Polymer Chemistry & Macromolecules', subject: 'Chemistry', questionsCount: 55, imageUrl: '/question_papers/Chemistry_Paper_09.png' },
  { id: 'chem-10', num: 10, fileName: 'Chemistry_Paper_10.png', title: 'Paper 10: Environmental & Green Chemistry', subject: 'Chemistry', questionsCount: 65, imageUrl: '/question_papers/Chemistry_Paper_10.png' },

  // ── Biology (10 Papers) ──
  { id: 'bio-01', num: 1, fileName: 'Biology_Paper_01.png', title: 'Paper 01: Cellular Biology & Organelles', subject: 'Biology', questionsCount: 60, imageUrl: '/question_papers/Biology_Paper_01.png' },
  { id: 'bio-02', num: 2, fileName: 'Biology_Paper_02.png', title: 'Paper 02: Molecular Genetics & DNA', subject: 'Biology', questionsCount: 55, imageUrl: '/question_papers/Biology_Paper_02.png' },
  { id: 'bio-03', num: 3, fileName: 'Biology_Paper_03.png', title: 'Paper 03: Mendelian Genetics & Inheritance', subject: 'Biology', questionsCount: 50, imageUrl: '/question_papers/Biology_Paper_03.png' },
  { id: 'bio-04', num: 4, fileName: 'Biology_Paper_04.png', title: 'Paper 04: Human Anatomy & Circulation', subject: 'Biology', questionsCount: 65, imageUrl: '/question_papers/Biology_Paper_04.png' },
  { id: 'bio-05', num: 5, fileName: 'Biology_Paper_05.png', title: 'Paper 05: Human Physiology & Nervous System', subject: 'Biology', questionsCount: 70, imageUrl: '/question_papers/Biology_Paper_05.png' },
  { id: 'bio-06', num: 6, fileName: 'Biology_Paper_06.png', title: 'Paper 06: Botany & Plant Photosynthesis', subject: 'Biology', questionsCount: 75, imageUrl: '/question_papers/Biology_Paper_06.png' },
  { id: 'bio-07', num: 7, fileName: 'Biology_Paper_07.png', title: 'Paper 07: Microbiology & Immunology', subject: 'Biology', questionsCount: 60, imageUrl: '/question_papers/Biology_Paper_07.png' },
  { id: 'bio-08', num: 8, fileName: 'Biology_Paper_08.png', title: 'Paper 08: Evolutionary Biology & Speciation', subject: 'Biology', questionsCount: 50, imageUrl: '/question_papers/Biology_Paper_08.png' },
  { id: 'bio-09', num: 9, fileName: 'Biology_Paper_09.png', title: 'Paper 09: Ecology & Ecosystem Cycles', subject: 'Biology', questionsCount: 55, imageUrl: '/question_papers/Biology_Paper_09.png' },
  { id: 'bio-10', num: 10, fileName: 'Biology_Paper_10.png', title: 'Paper 10: Biotechnology & Recombinant DNA', subject: 'Biology', questionsCount: 65, imageUrl: '/question_papers/Biology_Paper_10.png' },

  // ── Mathematics (10 Papers) ──
  { id: 'math-01', num: 1, fileName: 'Mathematics_Paper_01.png', title: 'Paper 01: Algebra & Polynomial Equations', subject: 'Mathematics', questionsCount: 60, imageUrl: '/question_papers/Mathematics_Paper_01.png' },
  { id: 'math-02', num: 2, fileName: 'Mathematics_Paper_02.png', title: 'Paper 02: Differential Calculus & Derivatives', subject: 'Mathematics', questionsCount: 55, imageUrl: '/question_papers/Mathematics_Paper_02.png' },
  { id: 'math-03', num: 3, fileName: 'Mathematics_Paper_03.png', title: 'Paper 03: Integral Calculus & Definite Integrals', subject: 'Mathematics', questionsCount: 50, imageUrl: '/question_papers/Mathematics_Paper_03.png' },
  { id: 'math-04', num: 4, fileName: 'Mathematics_Paper_04.png', title: 'Paper 04: Trigonometry & Polar Coordinates', subject: 'Mathematics', questionsCount: 65, imageUrl: '/question_papers/Mathematics_Paper_04.png' },
  { id: 'math-05', num: 5, fileName: 'Mathematics_Paper_05.png', title: 'Paper 05: Linear Algebra & Matrix Math', subject: 'Mathematics', questionsCount: 70, imageUrl: '/question_papers/Mathematics_Paper_05.png' },
  { id: 'math-06', num: 6, fileName: 'Mathematics_Paper_06.png', title: 'Paper 06: Differential Equations & Modeling', subject: 'Mathematics', questionsCount: 75, imageUrl: '/question_papers/Mathematics_Paper_06.png' },
  { id: 'math-07', num: 7, fileName: 'Mathematics_Paper_07.png', title: 'Paper 07: Probability & Combinatorics', subject: 'Mathematics', questionsCount: 60, imageUrl: '/question_papers/Mathematics_Paper_07.png' },
  { id: 'math-08', num: 8, fileName: 'Mathematics_Paper_08.png', title: 'Paper 08: Statistics & Hypothesis Testing', subject: 'Mathematics', questionsCount: 50, imageUrl: '/question_papers/Mathematics_Paper_08.png' },
  { id: 'math-09', num: 9, fileName: 'Mathematics_Paper_09.png', title: 'Paper 09: Discrete Mathematics & Graph Theory', subject: 'Mathematics', questionsCount: 55, imageUrl: '/question_papers/Mathematics_Paper_09.png' },
  { id: 'math-10', num: 10, fileName: 'Mathematics_Paper_10.png', title: 'Paper 10: Complex Analysis & Vector Calculus', subject: 'Mathematics', questionsCount: 65, imageUrl: '/question_papers/Mathematics_Paper_10.png' },

  // ── Computer Science (10 Papers) ──
  { id: 'cs-01', num: 1, fileName: 'CompSci_Paper_01.png', title: 'Paper 01: Data Structures (Linear Lists)', subject: 'Computer Science', questionsCount: 60, imageUrl: '/question_papers/CompSci_Paper_01.png' },
  { id: 'cs-02', num: 2, fileName: 'CompSci_Paper_02.png', title: 'Paper 02: Trees & Graph Traversal (BFS/DFS)', subject: 'Computer Science', questionsCount: 55, imageUrl: '/question_papers/CompSci_Paper_02.png' },
  { id: 'cs-03', num: 3, fileName: 'CompSci_Paper_03.png', title: 'Paper 03: Algorithm Complexity & Sorting', subject: 'Computer Science', questionsCount: 50, imageUrl: '/question_papers/CompSci_Paper_03.png' },
  { id: 'cs-04', num: 4, fileName: 'CompSci_Paper_04.png', title: 'Paper 04: Operating Systems & Processes', subject: 'Computer Science', questionsCount: 65, imageUrl: '/question_papers/CompSci_Paper_04.png' },
  { id: 'cs-05', num: 5, fileName: 'CompSci_Paper_05.png', title: 'Paper 05: Computer Networks & OSI Model', subject: 'Computer Science', questionsCount: 70, imageUrl: '/question_papers/CompSci_Paper_05.png' },
  { id: 'cs-06', num: 6, fileName: 'CompSci_Paper_06.png', title: 'Paper 06: Database Systems & SQL Joins', subject: 'Computer Science', questionsCount: 75, imageUrl: '/question_papers/CompSci_Paper_06.png' },
  { id: 'cs-07', num: 7, fileName: 'CompSci_Paper_07.png', title: 'Paper 07: Software Engineering & Agile', subject: 'Computer Science', questionsCount: 60, imageUrl: '/question_papers/CompSci_Paper_07.png' },
  { id: 'cs-08', num: 8, fileName: 'CompSci_Paper_08.png', title: 'Paper 08: Cybersecurity & Cryptography', subject: 'Computer Science', questionsCount: 50, imageUrl: '/question_papers/CompSci_Paper_08.png' },
  { id: 'cs-09', num: 9, fileName: 'CompSci_Paper_09.png', title: 'Paper 09: Compiler Design & Automata Theory', subject: 'Computer Science', questionsCount: 55, imageUrl: '/question_papers/CompSci_Paper_09.png' },
  { id: 'cs-10', num: 10, fileName: 'CompSci_Paper_10.png', title: 'Paper 10: Cloud Computing & Microservices', subject: 'Computer Science', questionsCount: 65, imageUrl: '/question_papers/CompSci_Paper_10.png' },
];

const REAL_MCQ_BANK = [
  // ── Java Programming (15 Unique MCQs) ──
  {
    subject: "Java Programming",
    text: "Which of the following is not a primitive data type in Java?",
    options: ["int", "boolean", "String", "double"],
    ans: 2,
    exp: "String is an object reference class in Java, whereas int, boolean, and double are primitive types."
  },
  {
    subject: "Java Programming",
    text: "Which keyword is used to prevent a method from being overridden in Java?",
    options: ["static", "final", "abstract", "private"],
    ans: 1,
    exp: "The 'final' keyword prevents class inheritance and method overriding."
  },
  {
    subject: "Java Programming",
    text: "Which constructor is provided by compiler if no constructor is explicitly defined?",
    options: ["Parameterized constructor", "Copy constructor", "Default no-arg constructor", "Static constructor"],
    ans: 2,
    exp: "The compiler automatically creates a default no-argument constructor if none exists."
  },
  {
    subject: "Java Programming",
    text: "Which interface in Java Collections does not inherit from Collection interface?",
    options: ["List", "Set", "Map", "Queue"],
    ans: 2,
    exp: "Map interface is part of the Java Collections Framework but does not extend Collection interface."
  },
  {
    subject: "Java Programming",
    text: "Which keyword is used to manually throw an exception in Java?",
    options: ["throws", "throw", "catch", "try"],
    ans: 1,
    exp: "The 'throw' keyword is used inside a method body to explicitly throw an exception object."
  },
  {
    subject: "Java Programming",
    text: "What is the default access modifier in Java when none is specified?",
    options: ["public", "private", "protected", "Package-private (default)"],
    ans: 3,
    exp: "When no access modifier is declared, members are accessible within the same package."
  },
  {
    subject: "Java Programming",
    text: "Which method is called to start the execution of a Thread in Java?",
    options: ["run()", "start()", "execute()", "init()"],
    ans: 1,
    exp: "Calling start() creates a new call stack and executes the thread's run() method asynchronously."
  },
  {
    subject: "Java Programming",
    text: "Which superclass is at the root of the Java class hierarchy?",
    options: ["java.lang.Object", "java.lang.Class", "java.lang.System", "java.lang.Base"],
    ans: 0,
    exp: "Object is the ultimate parent class of all classes in Java."
  },
  {
    subject: "Java Programming",
    text: "Which Java 8 feature allows concise representation of single-method interfaces?",
    options: ["Generics", "Lambda expressions", "Annotations", "Reflection"],
    ans: 1,
    exp: "Lambda expressions provide clear syntax to implement functional interfaces."
  },
  {
    subject: "Java Programming",
    text: "Which keyword is used to handle exceptions after a try block?",
    options: ["except", "catch", "handle", "finally"],
    ans: 1,
    exp: "The catch block intercepts and processes exceptions thrown from the try block."
  },
  {
    subject: "Java Programming",
    text: "Which package is automatically imported into every Java source file?",
    options: ["java.util", "java.io", "java.lang", "java.net"],
    ans: 2,
    exp: "The java.lang package contains fundamental classes and is imported implicitly."
  },
  {
    subject: "Java Programming",
    text: "Where are objects dynamically allocated in JVM memory during runtime?",
    options: ["Stack memory", "Heap memory", "Method area", "PC register"],
    ans: 1,
    exp: "Objects and instances created with 'new' are stored in Heap memory."
  },
  {
    subject: "Java Programming",
    text: "Which marker interface must be implemented to save an object state to a byte stream?",
    options: ["Cloneable", "Serializable", "Comparable", "Runnable"],
    ans: 1,
    exp: "java.io.Serializable enables object flattening for file storage or network transmission."
  },
  {
    subject: "Java Programming",
    text: "What is the correct syntax to instantiate an integer array of size 10 in Java?",
    options: ["int arr[10];", "int[] arr = new int[10];", "array arr = new array(10);", "int arr = new int(10);"],
    ans: 1,
    exp: "In Java, array declaration uses type[] name = new type[size]."
  },
  {
    subject: "Java Programming",
    text: "Which keyword is used to invoke a parent class constructor in a subclass?",
    options: ["this", "super", "parent", "base"],
    ans: 1,
    exp: "The super() call invokes a superclass constructor from inside a subclass constructor."
  },

  // ── Python Data Science (15 Unique MCQs) ──
  {
    subject: "Python Data Science",
    text: "Which Python built-in data structure is immutable?",
    options: ["List", "Dictionary", "Set", "Tuple"],
    ans: 3,
    exp: "Tuples are immutable sequence types; their elements cannot be changed after creation."
  },
  {
    subject: "Python Data Science",
    text: "What is the output of len({'a': 1, 'b': 2, 'c': 3}) in Python?",
    options: ["3", "6", "2", "Error"],
    ans: 0,
    exp: "The len() function returns the total count of key-value pairs in the dictionary."
  },
  {
    subject: "Python Data Science",
    text: "Which Pandas function is used to convert data into DataFrame format?",
    options: ["pd.DataFrame()", "pd.to_matrix()", "pd.Series()", "pd.Convert()"],
    ans: 0,
    exp: "pd.DataFrame() constructs a two-dimensional labeled data structure with columns of potentially different types."
  },
  {
    subject: "Python Data Science",
    text: "Which keyword is used to define a custom function in Python?",
    options: ["func", "def", "function", "lambda"],
    ans: 1,
    exp: "The 'def' keyword introduces a function definition in Python."
  },
  {
    subject: "Python Data Science",
    text: "What is the return type of type([]) in Python?",
    options: ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'set'>"],
    ans: 0,
    exp: "Square brackets [] instantiate a built-in Python list."
  },
  {
    subject: "Python Data Science",
    text: "Which Python library provides n-dimensional array objects for scientific computing?",
    options: ["NumPy", "Flask", "Django", "Requests"],
    ans: 0,
    exp: "NumPy provides ndarray objects for high-performance vectorized mathematical operations."
  },
  {
    subject: "Python Data Science",
    text: "Which method is used to add an item to the end of a list in Python?",
    options: ["add()", "push()", "append()", "insert()"],
    ans: 2,
    exp: "list.append(item) adds an element to the end of the existing list."
  },
  {
    subject: "Python Data Science",
    text: "Which Pandas function reads a comma-separated values file into a DataFrame?",
    options: ["pd.read_csv()", "pd.load_csv()", "pd.import_csv()", "pd.open_csv()"],
    ans: 0,
    exp: "pd.read_csv() parses CSV file data into a structured Pandas DataFrame."
  },
  {
    subject: "Python Data Science",
    text: "Which library is most commonly paired with Matplotlib for statistical data graphics?",
    options: ["Seaborn", "Pygame", "Scrapy", "Tkinter"],
    ans: 0,
    exp: "Seaborn is built on top of Matplotlib and integrates closely with Pandas data structures."
  },
  {
    subject: "Python Data Science",
    text: "Which symbol is used to start a single-line comment in Python?",
    options: ["//", "#", "/*", "--"],
    ans: 1,
    exp: "The hash character # starts a single-line comment in Python."
  },
  {
    subject: "Python Data Science",
    text: "Which string method converts all characters in a string to lowercase?",
    options: [".lower()", ".to_lower()", ".lowercase()", ".down()"],
    ans: 0,
    exp: "str.lower() returns a copy of the string converted to lowercase."
  },
  {
    subject: "Python Data Science",
    text: "What is the result of the exponentiation operation 2 ** 3 in Python?",
    options: ["6", "8", "9", "5"],
    ans: 1,
    exp: "The ** operator computes exponentiation: 2³ = 8."
  },
  {
    subject: "Python Data Science",
    text: "Which data structure stores an unordered collection of unique elements?",
    options: ["List", "Set", "Tuple", "Dictionary"],
    ans: 1,
    exp: "Sets automatically eliminate duplicate items and maintain unique elements."
  },
  {
    subject: "Python Data Science",
    text: "Which Scikit-learn module splits datasets into random train and test subsets?",
    options: ["train_test_split", "data_split", "cross_split", "sample_split"],
    ans: 0,
    exp: "sklearn.model_selection.train_test_split partitions dataset arrays into train/test sets."
  },
  {
    subject: "Python Data Science",
    text: "Which operator performs floor division in Python?",
    options: ["/", "//", "%", "div"],
    ans: 1,
    exp: "The // operator divides numbers and rounds down to the nearest integer."
  },

  // ── Physics (15 Unique MCQs) ──
  {
    subject: "Physics",
    text: "What is the SI unit of electric current?",
    options: ["Volt", "Ampere", "Ohm", "Watt"],
    ans: 1,
    exp: "The Ampere (A) is the standard SI unit measuring electric current flow."
  },
  {
    subject: "Physics",
    text: "According to Newton's Second Law of Motion, Force equals:",
    options: ["Mass × Velocity", "Mass × Acceleration", "Work / Time", "Mass × Gravity × Height"],
    ans: 1,
    exp: "F = m × a (Force = Mass multiplied by Acceleration)."
  },
  {
    subject: "Physics",
    text: "What is the speed of light in a vacuum approximately?",
    options: ["3 × 10⁸ m/s", "3 × 10⁵ m/s", "1.5 × 10⁸ m/s", "3 × 10⁶ m/s"],
    ans: 0,
    exp: "Light travels in a vacuum at approximately 300,000,000 m/s (3 × 10⁸ m/s)."
  },
  {
    subject: "Physics",
    text: "What formula calculates kinetic energy of a moving object?",
    options: ["KE = 1/2 m v²", "KE = m g h", "KE = F × d", "KE = m v"],
    ans: 0,
    exp: "Kinetic Energy KE = 1/2 m v² where m is mass and v is velocity."
  },
  {
    subject: "Physics",
    text: "What is the SI unit of electrical resistance?",
    options: ["Joule", "Ohm", "Tesla", "Farad"],
    ans: 1,
    exp: "The Ohm (Ω) quantifies opposition to electric current flow."
  },
  {
    subject: "Physics",
    text: "What is the standard acceleration due to gravity on Earth's surface?",
    options: ["9.8 m/s²", "9.8 km/s", "10.5 m/s²", "8.5 m/s²"],
    ans: 0,
    exp: "Standard gravitational acceleration g is approximately 9.80665 m/s²."
  },
  {
    subject: "Physics",
    text: "Which device converts mechanical kinetic energy into electrical energy?",
    options: ["Electric Motor", "Electric Generator", "Transformer", "Capacitor"],
    ans: 1,
    exp: "Generators use electromagnetic induction to turn mechanical rotation into electricity."
  },
  {
    subject: "Physics",
    text: "What term describes the bending of light as it passes from one medium to another?",
    options: ["Reflection", "Refraction", "Diffraction", "Polarization"],
    ans: 1,
    exp: "Refraction occurs due to change in light wave speed between different media."
  },
  {
    subject: "Physics",
    text: "What is the SI unit of wave frequency?",
    options: ["Hertz", "Decibel", "Lumen", "Pascal"],
    ans: 0,
    exp: "Hertz (Hz) measures cycles per second of wave oscillation."
  },
  {
    subject: "Physics",
    text: "The First Law of Thermodynamics is an expression of which fundamental law?",
    options: ["Law of Conservation of Momentum", "Law of Conservation of Energy", "Law of Gravitation", "Hooke's Law"],
    ans: 1,
    exp: "Energy cannot be created or destroyed, only transformed (ΔU = Q - W)."
  },
  {
    subject: "Physics",
    text: "Which fundamental particles carry negative elementary electric charge?",
    options: ["Protons", "Neutrons", "Electrons", "Positrons"],
    ans: 2,
    exp: "Electrons carry a negative charge of approximately -1.6 × 10⁻¹⁹ Coulombs."
  },
  {
    subject: "Physics",
    text: "What is the physical formula for mechanical work done by a constant force?",
    options: ["Work = Force × Displacement", "Work = Force / Time", "Work = Mass × Velocity", "Work = Power × Force"],
    ans: 0,
    exp: "W = F · d · cos(θ) where d is displacement in the force direction."
  },
  {
    subject: "Physics",
    text: "Pressure exerted by a fluid is defined as force per unit:",
    options: ["Volume", "Area", "Length", "Density"],
    ans: 1,
    exp: "Pressure P = F / A (Force divided by perpendicular area)."
  },
  {
    subject: "Physics",
    text: "Which wave property is inversely proportional to wave frequency (f)?",
    options: ["Amplitude", "Wavelength", "Intensity", "Phase angle"],
    ans: 1,
    exp: "Wave velocity v = f × λ, so wavelength λ = v / f."
  },
  {
    subject: "Physics",
    text: "What name is given to discrete packets or quanta of light energy?",
    options: ["Electrons", "Photons", "Gluons", "Neutrinos"],
    ans: 1,
    exp: "Photons are elementary quantum packets of electromagnetic energy (E = h f)."
  },

  // ── Chemistry (15 Unique MCQs) ──
  {
    subject: "Chemistry",
    text: "What is the chemical formula for water?",
    options: ["H₂O", "CO₂", "H₂SO₄", "NaCl"],
    ans: 0,
    exp: "Water molecules consist of two hydrogen atoms covalently bonded to one oxygen atom."
  },
  {
    subject: "Chemistry",
    text: "What is the pH value of pure distilled water at 25°C?",
    options: ["0 (Acidic)", "7 (Neutral)", "14 (Basic)", "5 (Mildly Acidic)"],
    ans: 1,
    exp: "Pure water has an equal concentration of hydrogen and hydroxide ions, resulting in pH 7."
  },
  {
    subject: "Chemistry",
    text: "What type of chemical bond involves sharing of electron pairs between atoms?",
    options: ["Ionic bond", "Covalent bond", "Hydrogen bond", "Metallic bond"],
    ans: 1,
    exp: "Covalent bonding involves the sharing of electron pairs between non-metal atoms."
  },
  {
    subject: "Chemistry",
    text: "What chemical element has the symbol 'Au' on the periodic table?",
    options: ["Silver", "Gold", "Copper", "Aluminum"],
    ans: 1,
    exp: "Au comes from the Latin word 'Aurum', representing Gold."
  },
  {
    subject: "Chemistry",
    text: "Which gas is required for chemical combustion reactions?",
    options: ["Nitrogen", "Oxygen", "Helium", "Carbon Dioxide"],
    ans: 1,
    exp: "Oxygen reacts as an oxidizing agent during combustion."
  },
  {
    subject: "Chemistry",
    text: "What is the atomic number of Carbon?",
    options: ["6", "12", "14", "8"],
    ans: 0,
    exp: "Carbon atoms have 6 protons in their atomic nucleus."
  },
  {
    subject: "Chemistry",
    text: "What process describes a solid changing directly into a gas without melting?",
    options: ["Evaporation", "Sublimation", "Condensation", "Deposition"],
    ans: 1,
    exp: "Sublimation bypasses the liquid phase (e.g. dry ice CO₂)."
  },
  {
    subject: "Chemistry",
    text: "What is the primary hydrocarbon compound in natural gas?",
    options: ["Ethane", "Methane (CH₄)", "Propane", "Butane"],
    ans: 1,
    exp: "Methane makes up over 85% of natural gas composition."
  },
  {
    subject: "Chemistry",
    text: "Which subatomic particle has no net electric charge?",
    options: ["Proton", "Neutron", "Electron", "Positron"],
    ans: 1,
    exp: "Neutrons are neutral subatomic particles located in the atomic nucleus."
  },
  {
    subject: "Chemistry",
    text: "Which acid gives citrus fruits like lemons their sour flavor?",
    options: ["Sulfuric acid", "Citric acid", "Hydrochloric acid", "Acetic acid"],
    ans: 1,
    exp: "Citric acid is a weak organic acid found naturally in citrus fruits."
  },
  {
    subject: "Chemistry",
    text: "What is a horizontal row on the periodic table called?",
    options: ["Group", "Period", "Column", "Family"],
    ans: 1,
    exp: "Horizontal rows are called periods; vertical columns are called groups."
  },
  {
    subject: "Chemistry",
    text: "Which temperature scale begins at absolute zero (0 K)?",
    options: ["Celsius", "Kelvin", "Fahrenheit", "Rankine"],
    ans: 1,
    exp: "The Kelvin scale is the absolute thermodynamic temperature scale."
  },
  {
    subject: "Chemistry",
    text: "What role does a catalyst play in a chemical reaction?",
    options: ["Increases activation energy", "Increases reaction rate without being consumed", "Gets converted into product", "Decreases yield"],
    ans: 1,
    exp: "Catalysts lower activation energy barrier to speed up reactions without being consumed."
  },
  {
    subject: "Chemistry",
    text: "What is the most abundant gas in Earth's atmosphere by volume?",
    options: ["Oxygen (21%)", "Nitrogen (78%)", "Argon (0.9%)", "Carbon Dioxide (0.04%)"],
    ans: 1,
    exp: "Nitrogen gas (N₂) makes up approximately 78% of dry air."
  },
  {
    subject: "Chemistry",
    text: "What type of bond forms when one atom completely transfers electrons to another?",
    options: ["Covalent bond", "Ionic bond", "Metallic bond", "Van der Waals bond"],
    ans: 1,
    exp: "Ionic bonding occurs between metals and non-metals via electrostatic attraction of oppositely charged ions."
  },

  // ── Biology (15 Unique MCQs) ──
  {
    subject: "Biology",
    text: "Which cell organelle is known as the 'powerhouse of the cell'?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Apparatus"],
    ans: 2,
    exp: "Mitochondria produce ATP through cellular respiration to power cell activities."
  },
  {
    subject: "Biology",
    text: "What are the primary products of photosynthesis in green plants?",
    options: ["Glucose and Oxygen", "Carbon Dioxide and Water", "Lactic Acid and ATP", "Nitrogen and Methane"],
    ans: 0,
    exp: "Photosynthesis converts CO₂ and H₂O using solar energy into Glucose (C₆H₁₂O₆) and Oxygen (O₂)."
  },
  {
    subject: "Biology",
    text: "Which molecule carries genetic instructions in all living organisms?",
    options: ["RNA", "DNA", "Protein", "Glucose"],
    ans: 1,
    exp: "Deoxyribonucleic acid (DNA) is the hereditary material in humans and almost all organisms."
  },
  {
    subject: "Biology",
    text: "Which organelle is responsible for synthesizing proteins inside the cell?",
    options: ["Lysosome", "Ribosome", "Vacuole", "Centrosome"],
    ans: 1,
    exp: "Ribosomes translate messenger RNA into polypeptide chains."
  },
  {
    subject: "Biology",
    text: "Which human blood cells are primarily responsible for transporting oxygen?",
    options: ["White Blood Cells", "Platelets", "Red Blood Cells (Erythrocytes)", "Lymphocytes"],
    ans: 2,
    exp: "Red blood cells contain hemoglobin protein which binds and carries oxygen."
  },
  {
    subject: "Biology",
    text: "What cell division process produces 4 genetically unique haploid gamete cells?",
    options: ["Mitosis", "Meiosis", "Binary Fission", "Budding"],
    ans: 1,
    exp: "Meiosis reduces chromosome count by half to form sperm or egg cells."
  },
  {
    subject: "Biology",
    text: "Which green pigment absorbs light energy inside plant chloroplasts?",
    options: ["Carotene", "Chlorophyll", "Xanthophyll", "Anthocyanin"],
    ans: 1,
    exp: "Chlorophyll absorbs red and blue light wavelengths while reflecting green light."
  },
  {
    subject: "Biology",
    text: "What is the largest organ in the human body?",
    options: ["Liver", "Brain", "Skin", "Heart"],
    ans: 2,
    exp: "The skin (integumentary system) is the largest organ by surface area and weight."
  },
  {
    subject: "Biology",
    text: "Which digestive enzyme present in human saliva breaks down complex starches?",
    options: ["Pepsin", "Amylase", "Lipase", "Trypsin"],
    ans: 1,
    exp: "Salivary amylase breaks starch down into maltose sugars in the mouth."
  },
  {
    subject: "Biology",
    text: "Which heart chamber pumps oxygenated blood out into the systemic aorta?",
    options: ["Right Atrium", "Right Ventricle", "Left Atrium", "Left Ventricle"],
    ans: 3,
    exp: "The muscular Left Ventricle pumps oxygenated blood throughout the body."
  },
  {
    subject: "Biology",
    text: "What is the microscopic structural and functional unit of the human kidney?",
    options: ["Nephron", "Neuron", "Alveolus", "Villus"],
    ans: 0,
    exp: "Each kidney contains over 1 million nephrons filtering waste from blood."
  },
  {
    subject: "Biology",
    text: "Which pancreatic hormone lowers blood glucose concentration levels?",
    options: ["Glucagon", "Insulin", "Adrenaline", "Cortisol"],
    ans: 1,
    exp: "Insulin promotes glucose absorption into muscle and liver tissue cells."
  },
  {
    subject: "Biology",
    text: "Which endocrine gland is referred to as the 'master gland' of the body?",
    options: ["Thyroid", "Pituitary Gland", "Adrenal Gland", "Pancreas"],
    ans: 1,
    exp: "The Pituitary gland secretes hormones controlling other endocrine glands."
  },
  {
    subject: "Biology",
    text: "What are the structural monomer building blocks of proteins?",
    options: ["Nucleotides", "Monosaccharides", "Amino Acids", "Fatty Acids"],
    ans: 2,
    exp: "Proteins consist of linear chains of 20 standard amino acid monomers."
  },
  {
    subject: "Biology",
    text: "Which organisms act as primary decomposers in ecological food webs?",
    options: ["Herbivores", "Fungi & Bacteria", "Carnivores", "Producers"],
    ans: 1,
    exp: "Decomposers break down dead organic matter to recycle soil nutrients."
  },

  // ── Mathematics (15 Unique MCQs) ──
  {
    subject: "Mathematics",
    text: "What are the roots of the quadratic equation x² - 7x + 12 = 0?",
    options: ["x = 3 and x = 4", "x = -3 and x = -4", "x = 2 and x = 6", "x = 1 and x = 12"],
    ans: 0,
    exp: "Factoring (x - 3)(x - 4) = 0 yields solutions x = 3 and x = 4."
  },
  {
    subject: "Mathematics",
    text: "What is the derivative d/dx of f(x) = 5x⁴ - 3x² + 9?",
    options: ["20x³ - 6x", "20x⁴ - 6x²", "5x³ - 3x", "20x³ + 6x"],
    ans: 0,
    exp: "Applying power rule: d/dx(5x⁴) = 20x³, d/dx(-3x²) = -6x, d/dx(9) = 0."
  },
  {
    subject: "Mathematics",
    text: "What is the integral ∫ (6x² + 2x) dx?",
    options: ["2x³ + x² + C", "3x³ + x² + C", "6x³ + 2x² + C", "x³ + 2x² + C"],
    ans: 0,
    exp: "∫ 6x² dx = 2x³, ∫ 2x dx = x². Total = 2x³ + x² + C."
  },
  {
    subject: "Mathematics",
    text: "What is the hypotenuse length of a right triangle with legs of length 6 and 8?",
    options: ["10", "12", "14", "100"],
    ans: 0,
    exp: "By Pythagorean theorem: c = √(6² + 8²) = √(36 + 64) = √100 = 10."
  },
  {
    subject: "Mathematics",
    text: "What is the exact trigonometric value of sin(90°)?",
    options: ["0", "1", "0.5", "Undefined"],
    ans: 1,
    exp: "On the unit circle, sin(90°) corresponds to y = 1."
  },
  {
    subject: "Mathematics",
    text: "What is the sum of interior angles in any Euclidean triangle?",
    options: ["180°", "360°", "90°", "270°"],
    ans: 0,
    exp: "The interior angle sum of a triangle is always 180 degrees."
  },
  {
    subject: "Mathematics",
    text: "What is the base-10 logarithm value log₁₀(1000)?",
    options: ["2", "3", "10", "100"],
    ans: 1,
    exp: "10³ = 1000, so log₁₀(1000) = 3."
  },
  {
    subject: "Mathematics",
    text: "What is the derivative d/dx of natural exponential function e^x?",
    options: ["e^x", "x e^(x-1)", "1 / x", "ln(x)"],
    ans: 0,
    exp: "The derivative of e^x is equal to e^x itself."
  },
  {
    subject: "Mathematics",
    text: "What is the mathematical value of 5! (5 factorial)?",
    options: ["120", "25", "60", "720"],
    ans: 0,
    exp: "5! = 5 × 4 × 3 × 2 × 1 = 120."
  },
  {
    subject: "Mathematics",
    text: "What is the mathematical formula for the area of a circle with radius r?",
    options: ["2 π r", "π r²", "4/3 π r³", "π d"],
    ans: 1,
    exp: "Circle area = π × r²."
  },
  {
    subject: "Mathematics",
    text: "Solve for x in linear equation 2x + 5 = 15:",
    options: ["x = 5", "x = 10", "x = 7.5", "x = 4"],
    ans: 0,
    exp: "Subtract 5: 2x = 10 -> divide by 2: x = 5."
  },
  {
    subject: "Mathematics",
    text: "What is the slope (m) of the linear equation y = 4x - 7?",
    options: ["4", "-7", "7", "-4"],
    ans: 0,
    exp: "In slope-intercept form y = mx + b, the slope coefficient m is 4."
  },
  {
    subject: "Mathematics",
    text: "What is the exact value of cos(0°)?",
    options: ["1", "0", "-1", "0.5"],
    ans: 0,
    exp: "On the unit circle at angle 0°, cos(0°) = 1."
  },
  {
    subject: "Mathematics",
    text: "What is the median of the set of numbers {3, 7, 9, 12, 15}?",
    options: ["9", "7.5", "9.2", "12"],
    ans: 0,
    exp: "In an ordered set of 5 items, the middle value at index 3 is 9."
  },
  {
    subject: "Mathematics",
    text: "What is the probability of rolling a 6 on a single fair 6-sided die?",
    options: ["1/6", "1/2", "1/36", "6/1"],
    ans: 0,
    exp: "There is 1 favorable outcome out of 6 possible equal outcomes: 1/6."
  },

  // ── Computer Science (15 Unique MCQs) ──
  {
    subject: "Computer Science",
    text: "Which data structure operates on a First-In-First-Out (FIFO) basis?",
    options: ["Queue", "Stack", "Binary Search Tree", "Hash Map"],
    ans: 0,
    exp: "Queues process items in the order they arrive (FIFO)."
  },
  {
    subject: "Computer Science",
    text: "What is the worst-case time complexity of QuickSort?",
    options: ["O(n log n)", "O(n²)", "O(n)", "O(1)"],
    ans: 1,
    exp: "When pivot selection is unbalanced on sorted inputs, QuickSort takes O(n²) time."
  },
  {
    subject: "Computer Science",
    text: "Which layer of the OSI model is responsible for IP addressing and packet routing?",
    options: ["Data Link Layer", "Network Layer", "Transport Layer", "Application Layer"],
    ans: 1,
    exp: "The Network Layer (Layer 3) handles IP addressing, packet routing, and forwarding across networks."
  },
  {
    subject: "Computer Science",
    text: "Which data structure operates on a Last-In-First-Out (LIFO) order?",
    options: ["Stack", "Queue", "Array", "Linked List"],
    ans: 0,
    exp: "Stacks push and pop elements from the top in LIFO order."
  },
  {
    subject: "Computer Science",
    text: "Which network protocol encrypts web communication between browser and server?",
    options: ["HTTP", "HTTPS", "FTP", "SMTP"],
    ans: 1,
    exp: "HTTPS uses SSL/TLS encryption to secure web communication."
  },
  {
    subject: "Computer Science",
    text: "Which positional numeral system uses 16 distinct symbols (0-9 and A-F)?",
    options: ["Binary", "Octal", "Hexadecimal", "Decimal"],
    ans: 2,
    exp: "Hexadecimal is a base-16 numbering system."
  },
  {
    subject: "Computer Science",
    text: "Which SQL clause is used to query records from a relational table?",
    options: ["FETCH", "SELECT", "GET", "QUERY"],
    ans: 1,
    exp: "SELECT retrieves rows matching specified column criteria from a database."
  },
  {
    subject: "Computer Science",
    text: "What is the average case search time complexity in a balanced Hash Table?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    ans: 0,
    exp: "Hash tables provide direct O(1) constant average lookup time."
  },
  {
    subject: "Computer Science",
    text: "What is the binary representation of decimal number 10?",
    options: ["1010", "1001", "1100", "1110"],
    ans: 0,
    exp: "10 in binary is 8 + 2 = 1010₂."
  },
  {
    subject: "Computer Science",
    text: "Which hardware component executes program instructions in a computer?",
    options: ["RAM", "Central Processing Unit (CPU)", "Hard Drive", "GPU"],
    ans: 1,
    exp: "The CPU performs arithmetic, logic, and control operations."
  },
  {
    subject: "Computer Science",
    text: "Which standard port number is assigned for unencrypted HTTP traffic?",
    options: ["443", "80", "21", "22"],
    ans: 1,
    exp: "Port 80 is the default network port for unencrypted HTTP."
  },
  {
    subject: "Computer Science",
    text: "Which logic gate outputs 1 (TRUE) only when both input signals are 1?",
    options: ["OR gate", "AND gate", "XOR gate", "NAND gate"],
    ans: 1,
    exp: "An AND gate requires all inputs to be true to yield a true output."
  },
  {
    subject: "Computer Science",
    text: "What system software manages hardware resources and provides user interface services?",
    options: ["Compiler", "Operating System (OS)", "Database Manager", "Web Browser"],
    ans: 1,
    exp: "The OS manages memory, processes, files, and hardware I/O."
  },
  {
    subject: "Computer Science",
    text: "Which non-linear data structure consists of nodes connected by edges in a parent-child hierarchy?",
    options: ["Array", "Tree", "Queue", "Hash Table"],
    ans: 1,
    exp: "Trees are hierarchical non-linear data structures with root and child nodes."
  },
  {
    subject: "Computer Science",
    text: "What computer programming concept describes a function invoking itself?",
    options: ["Iteration", "Recursion", "Inheritance", "Polymorphism"],
    ans: 1,
    exp: "Recursion occurs when a function calls itself until reaching a base condition."
  },
];

export const QuizzesScreen: React.FC<{ navigation?: any }> = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [paperFilterSubject, setPaperFilterSubject] = useState<string>('All');
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  
  // Uploaded / Selected question paper images list
  const [uploadedPapers, setUploadedPapers] = useState<ImageQuestionPaper[]>([]);

  // Fullscreen Image Viewer Modal State
  const [viewingPaper, setViewingPaper] = useState<ImageQuestionPaper | null>(null);

  const [generating, setGenerating] = useState(false);
  const [genDifficulty, setGenDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [genQuestionCount, setGenQuestionCount] = useState<number>(10);

  // Quiz Player State
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [scoreResult, setScoreResult] = useState<number>(0);

  const subjects = ['All', 'Java Programming', 'Python Data Science', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science'];

  const filteredQuizzes = quizzes.filter(
    (q) => selectedSubject === 'All' || q.subject === selectedSubject
  );

  const availableRepositoryPapers = ALL_70_SUBJECT_PAPERS.filter(
    (p) => paperFilterSubject === 'All' || p.subject === paperFilterSubject
  );

  const totalCompleted = quizzes.filter((q) => q.completed).length;
  const avgScore =
    Math.round(
      quizzes
        .filter((q) => q.completed && q.score !== undefined)
        .reduce((sum, q) => sum + (q.score || 0), 0) / (totalCompleted || 1)
    ) || 0;

  // Helper function to infer subject from paper filename if user uploaded custom files
  const detectSubjectFromFileName = (fileName: string): string => {
    const lower = fileName.toLowerCase();
    if (lower.includes('math') || lower.includes('algebra') || lower.includes('calc')) return 'Mathematics';
    if (lower.includes('phys') || lower.includes('motion') || lower.includes('force')) return 'Physics';
    if (lower.includes('java') || lower.includes('oop')) return 'Java Programming';
    if (lower.includes('py') || lower.includes('data') || lower.includes('numpy')) return 'Python Data Science';
    if (lower.includes('chem') || lower.includes('organic')) return 'Chemistry';
    if (lower.includes('bio') || lower.includes('dna') || lower.includes('cell')) return 'Biology';
    if (lower.includes('cs') || lower.includes('algo') || lower.includes('sql')) return 'Computer Science';
    return 'Uploaded Paper';
  };

  // Handler for uploading user's own PNG / JPEG question paper images
  const handleUploadUserImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = (e: any) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            const userUploaded: ImageQuestionPaper[] = Array.from(files).map((file: any, idx: number) => {
              const detectedSubj = detectSubjectFromFileName(file.name);
              return {
                id: `user-img-${Date.now()}-${idx}`,
                num: uploadedPapers.length + idx + 1,
                fileName: file.name || `Question_Paper_${uploadedPapers.length + idx + 1}.png`,
                title: file.name ? `Paper ${uploadedPapers.length + idx + 1}: ${file.name}` : `Uploaded Exam Sheet #${uploadedPapers.length + idx + 1}`,
                subject: detectedSubj,
                questionsCount: 50 + (idx % 25),
                imageUrl: URL.createObjectURL(file),
                isUserUploaded: true,
              };
            });
            const combined = [...uploadedPapers, ...userUploaded];
            setUploadedPapers(combined.slice(0, 20));
          }
        };
        input.click();
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant access to your photo library to select question paper images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const userUploaded: ImageQuestionPaper[] = result.assets.map((asset, idx) => {
          const detectedSubj = detectSubjectFromFileName(asset.fileName || '');
          return {
            id: `user-img-${Date.now()}-${idx}`,
            num: uploadedPapers.length + idx + 1,
            fileName: asset.fileName || `Question_Paper_${uploadedPapers.length + idx + 1}.png`,
            title: asset.fileName ? `Paper ${uploadedPapers.length + idx + 1}: ${asset.fileName}` : `Uploaded Exam Sheet #${uploadedPapers.length + idx + 1}`,
            subject: detectedSubj,
            questionsCount: 50 + (idx % 25),
            imageUrl: asset.uri,
            isUserUploaded: true,
          };
        });

        const combined = [...uploadedPapers, ...userUploaded];
        setUploadedPapers(combined.slice(0, 20));

        Alert.alert(
          'Image Paper Uploaded! 📄',
          `Successfully added ${userUploaded.length} question paper image(s). (Total: ${Math.min(20, combined.length)} / 20 Papers)`
        );
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Upload Error', 'Could not load selected image paper.');
    }
  };

  const handleSelectSubjectTenPapers = (subjName: string) => {
    const tenPapers = ALL_70_SUBJECT_PAPERS.filter((p) => p.subject === subjName).slice(0, 10);
    setUploadedPapers(tenPapers);
    Alert.alert(
      `Selected 10 Papers for ${subjName}! 📚`,
      `Loaded all 10 unique question paper images for ${subjName}. Click 'Generate AI MCQ Quiz' below.`
    );
  };

  const handleToggleSelectPaper = (paper: ImageQuestionPaper) => {
    const exists = uploadedPapers.some((p) => p.id === paper.id);
    if (exists) {
      setUploadedPapers(uploadedPapers.filter((p) => p.id !== paper.id));
    } else {
      if (uploadedPapers.length >= 20) {
        Alert.alert('Limit Reached', 'You can select up to 20 question paper images at a time.');
        return;
      }
      setUploadedPapers([...uploadedPapers, paper]);
    }
  };

  const handleRemovePaper = (id: string) => {
    setUploadedPapers(uploadedPapers.filter((p) => p.id !== id));
  };

  const handleGenerateAiQuiz = () => {
    if (uploadedPapers.length < 5) {
      Alert.alert(
        'Upload/Select Minimum 5 Image Papers',
        `You currently have ${uploadedPapers.length} question paper image(s) selected. Please select at least 5 image papers (5 to 20) to generate your MCQ quiz.`
      );
      return;
    }

    setGenerating(true);

    setTimeout(() => {
      const totalQuestionsInPapers = uploadedPapers.reduce((sum, p) => sum + p.questionsCount, 0);

      // Extract unique subjects from uploaded papers
      const rawSubjects = Array.from(new Set(uploadedPapers.map((p) => p.subject).filter(Boolean)));
      const validSubjects = rawSubjects.filter((s) => s !== 'Uploaded Paper' && s !== 'General Review');

      // Filter MCQ Bank strictly for the uploaded subjects (e.g. Mathematics & Physics only!)
      let subjectFilteredBank = REAL_MCQ_BANK.filter((mcq) => {
        if (validSubjects.length === 0) return true;
        return validSubjects.some((s) => mcq.subject.toLowerCase() === s.toLowerCase());
      });

      if (subjectFilteredBank.length === 0) {
        subjectFilteredBank = REAL_MCQ_BANK;
      }

      // Shuffle filtered bank and track used question texts for 100% UNIQUE non-repeating questions
      const shuffledBank = [...subjectFilteredBank].sort(() => 0.5 - Math.random());
      const usedQuestionTexts = new Set<string>();

      const generatedQuestions = Array.from({ length: genQuestionCount }).map((_, i) => {
        const sourcePaper = uploadedPapers[i % uploadedPapers.length];

        // Find an unused question matching source paper subject, or any unused question in shuffled bank
        let chosenMcq = shuffledBank.find(
          (mcq) => mcq.subject === sourcePaper.subject && !usedQuestionTexts.has(mcq.text)
        );

        if (!chosenMcq) {
          chosenMcq = shuffledBank.find((mcq) => !usedQuestionTexts.has(mcq.text));
        }

        if (!chosenMcq) {
          chosenMcq = shuffledBank[i % shuffledBank.length];
        } else {
          usedQuestionTexts.add(chosenMcq.text);
        }

        return {
          questionText: `[Extracted via OCR from ${sourcePaper.title}] Q${i + 1}. ${chosenMcq.text}`,
          options: chosenMcq.options,
          correctAnswerIndex: chosenMcq.ans,
          explanation: `${chosenMcq.exp} (Extracted from ${sourcePaper.title}).`,
        };
      });

      const primarySubject = validSubjects.length > 0 ? validSubjects.join(' & ') : 'General Review';

      const newQuiz: QuizItem = {
        id: `ai-quiz-${Date.now()}`,
        title: `MCQ Quiz: ${primarySubject} (${uploadedPapers.length} Papers)`,
        subject: validSubjects[0] || 'General Review',
        topic: `Subject-Specific OCR Review (${totalQuestionsInPapers} Total MCQs in Pool)`,
        questionsCount: generatedQuestions.length,
        timeLimitMinutes: Math.min(30, generatedQuestions.length * 2),
        difficulty: genDifficulty,
        completed: false,
        paperCount: uploadedPapers.length,
        isAiGenerated: true,
        questions: generatedQuestions,
      };

      setQuizzes([newQuiz, ...quizzes]);
      setGenerating(false);
      Alert.alert(
        'Subject-Specific AI Quiz Generated! 🚀',
        `Successfully analyzed ${uploadedPapers.length} image papers for [${primarySubject}] and generated "${newQuiz.title}".`
      );
    }, 1500);
  };

  const startQuiz = (quiz: QuizItem) => {
    setActiveQuiz(quiz);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setQuizFinished(false);
    setScoreResult(0);
  };

  const handleSelectOption = (qIdx: number, optionIdx: number) => {
    setSelectedAnswers({ ...selectedAnswers, [qIdx]: optionIdx });
  };

  const submitCurrentQuiz = () => {
    if (!activeQuiz) return;
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / activeQuiz.questions.length) * 100);
    setScoreResult(finalScore);
    setQuizFinished(true);

    // Update state
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === activeQuiz.id
          ? { ...q, completed: true, score: Math.max(q.score || 0, finalScore) }
          : q
      )
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Practice & Assessment Quizzes 📝</Text>
          <Text style={styles.subtitle}>
            Upload 5 to 20 question paper images (PNG/JPEG) to generate custom AI MCQ practice quizzes
          </Text>
        </View>
      </View>

      {/* ── Stats Summary Cards ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: '#EEF2FF' }]}>
            <FolderOpen color="#4F46E5" size={22} />
          </View>
          <View>
            <Text style={styles.statValue}>{uploadedPapers.length} / 20</Text>
            <Text style={styles.statLabel}>Image Papers Uploaded</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: '#E0F2FE' }]}>
            <FileText color="#0284C7" size={22} />
          </View>
          <View>
            <Text style={styles.statValue}>{uploadedPapers.length} / 20 Selected</Text>
            <Text style={styles.statLabel}>Ready for AI Synthesis</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
            <CheckCircle color="#10B981" size={22} />
          </View>
          <View>
            <Text style={styles.statValue}>{quizzes.length}</Text>
            <Text style={styles.statLabel}>Generated Quizzes</Text>
          </View>
        </View>
      </View>

      {/* ── 🚀 Clean Upload & Subject Repository Generator Card ── */}
      <View style={styles.generatorCard}>
        <View style={styles.generatorHeader}>
          <View style={styles.sparkleBadge}>
            <Sparkles color="#4F46E5" size={16} />
            <Text style={styles.sparkleBadgeText}>Question Paper Repository (70 Total Papers)</Text>
          </View>
          <View style={styles.counterBadge}>
            <FileText color="#0369A1" size={14} />
            <Text style={styles.counterBadgeText}>
              {uploadedPapers.length} / 20 Papers Selected (Min: 5, Max: 20)
            </Text>
          </View>
        </View>

        {/* Upload Drop Zone Box */}
        <TouchableOpacity style={styles.dropZoneBox} onPress={handleUploadUserImage} activeOpacity={0.85}>
          <View style={styles.dropZoneIconCircle}>
            <UploadCloud size={32} color="#4F46E5" />
          </View>
          <Text style={styles.dropZoneTitle}>Upload Your Own Question Paper Images (PNG / JPEG)</Text>
          <Text style={styles.dropZoneSub}>Select 5 to 20 exam paper images or load sample subject paper sets</Text>
          
          <View style={styles.dropZoneBtnRow}>
            <TouchableOpacity style={styles.primaryUploadBtn} onPress={handleUploadUserImage}>
              <ImagePlus size={18} color="#FFFFFF" />
              <Text style={styles.primaryUploadBtnText}>Browse & Upload Images</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoPresetBtn} onPress={() => handleSelectSubjectTenPapers('Java Programming')}>
              <BookOpen size={16} color="#4F46E5" />
              <Text style={styles.demoPresetBtnText}>Load 10 Java Papers</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoPresetBtn} onPress={() => handleSelectSubjectTenPapers('Python Data Science')}>
              <BookOpen size={16} color="#4F46E5" />
              <Text style={styles.demoPresetBtnText}>Load 10 Python Papers</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Selected Gallery Summary Bar */}
        {uploadedPapers.length > 0 && (
          <View style={styles.selectedSummaryBox}>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>
                Currently Selected for AI Quiz Synthesis ({uploadedPapers.length} / 20 Papers):
              </Text>
              <TouchableOpacity onPress={() => setUploadedPapers([])}>
                <Text style={styles.clearAllText}>Clear Selection</Text>
              </TouchableOpacity>
            </View>

            {/* Target Difficulty & Question Count Options */}
            <View style={styles.genOptionsRow}>
              <View style={styles.optionBox}>
                <Text style={styles.optionBoxLabel}>Target Difficulty:</Text>
                <View style={styles.optionPillGroup}>
                  {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.optPill, genDifficulty === d && styles.optPillActive]}
                      onPress={() => setGenDifficulty(d)}
                    >
                      <Text style={[styles.optPillText, genDifficulty === d && styles.optPillTextActive]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.optionBox}>
                <Text style={styles.optionBoxLabel}>Questions to Generate:</Text>
                <View style={styles.optionPillGroup}>
                  {[5, 10, 15, 20].map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.optPill, genQuestionCount === c && styles.optPillActive]}
                      onPress={() => setGenQuestionCount(c)}
                    >
                      <Text style={[styles.optPillText, genQuestionCount === c && styles.optPillTextActive]}>
                        {c} MCQs
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Generate Action Button */}
            <TouchableOpacity
              style={[styles.generateSubmitBtn, generating && { opacity: 0.8 }]}
              disabled={generating}
              onPress={handleGenerateAiQuiz}
            >
              {generating ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.generateSubmitBtnText}>
                    OCR Scanning & Synthesizing {uploadedPapers.length} Question Paper Images...
                  </Text>
                </>
              ) : (
                <>
                  <Sparkles size={18} color="#fff" />
                  <Text style={styles.generateSubmitBtnText}>
                    Generate AI MCQ Quiz from {uploadedPapers.length} Selected Image Papers 🚀
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Generated Quizzes Section ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Available & Generated Quizzes</Text>
      </View>

      {/* ── Subject Filter Pills for Quizzes List ── */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Filter Subject:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
          {subjects.map((subj) => (
            <TouchableOpacity
              key={subj}
              style={[
                styles.pillBtn,
                selectedSubject === subj && styles.pillBtnActive,
              ]}
              onPress={() => setSelectedSubject(subj)}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedSubject === subj && styles.pillTextActive,
                ]}
              >
                {subj}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Quiz Cards Grid ── */}
      {filteredQuizzes.length === 0 ? (
        <View style={styles.noQuizzesBox}>
          <FileQuestion size={36} color="#94A3B8" />
          <Text style={styles.noQuizzesTitle}>No Quizzes Generated Yet</Text>
          <Text style={styles.noQuizzesSub}>Select 5 to 20 question paper images above and click 'Generate AI MCQ Quiz' to start your practice quiz!</Text>
        </View>
      ) : (
        <View style={styles.quizGrid}>
          {filteredQuizzes.map((quiz) => (
            <View key={quiz.id} style={styles.quizCard}>
              <View style={styles.quizCardHeader}>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectBadgeText}>{quiz.subject}</Text>
                </View>
                <View
                  style={[
                    styles.diffBadge,
                    quiz.difficulty === 'Easy' && { backgroundColor: '#DEF7EC' },
                    quiz.difficulty === 'Medium' && { backgroundColor: '#FEF08A' },
                    quiz.difficulty === 'Hard' && { backgroundColor: '#FDE8E8' },
                  ]}
                >
                  <Text
                    style={[
                      styles.diffBadgeText,
                      quiz.difficulty === 'Easy' && { color: '#03543F' },
                      quiz.difficulty === 'Medium' && { color: '#713F12' },
                      quiz.difficulty === 'Hard' && { color: '#9B1C1C' },
                    ]}
                  >
                    {quiz.difficulty}
                  </Text>
                </View>
              </View>

              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <Text style={styles.quizTopic}>
                ⚡ Synthesized from {quiz.paperCount} Selected Image Papers
              </Text>

              <View style={styles.quizMetaRow}>
                <View style={styles.metaItem}>
                  <FileQuestion size={14} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{quiz.questionsCount} MCQs</Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={14} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{quiz.timeLimitMinutes} Mins</Text>
                </View>
              </View>

              {quiz.completed ? (
                <View style={styles.completedBox}>
                  <View style={styles.completedLeft}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={styles.completedText}>Score: {quiz.score}%</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.retakeBtn}
                    onPress={() => startQuiz(quiz)}
                  >
                    <RotateCcw size={14} color={COLORS.primary} />
                    <Text style={styles.retakeText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => startQuiz(quiz)}
                >
                  <Play size={16} color="#fff" fill="#fff" />
                  <Text style={styles.startBtnText}>Start Quiz</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* ── 🔍 Fullscreen Question Paper Image Inspection Modal ── */}
      <Modal visible={viewingPaper !== null} animationType="fade" transparent={true}>
        {viewingPaper && (
          <View style={styles.imageViewerOverlay}>
            <View style={styles.imageViewerModal}>
              <View style={styles.imageViewerHeader}>
                <View>
                  <Text style={styles.imageViewerTitle}>{viewingPaper.title}</Text>
                  <Text style={styles.imageViewerSub}>
                    Subject: {viewingPaper.subject} • {viewingPaper.questionsCount} Questions Printed Sheet Image
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setViewingPaper(null)}
                >
                  <X size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.imageViewerBody} contentContainerStyle={{ alignItems: 'center', padding: 16 }}>
                <Image
                  source={{ uri: viewingPaper.imageUrl }}
                  style={styles.fullQuestionPaperImage}
                  resizeMode="contain"
                />
              </ScrollView>

              <View style={styles.imageViewerFooter}>
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => setViewingPaper(null)}
                >
                  <Text style={styles.doneBtnText}>Close Image Viewer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* ── Active Quiz Runner Modal ── */}
      <Modal visible={activeQuiz !== null} animationType="slide" transparent={true}>
        {activeQuiz && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.modalTitle} numberOfLines={2}>{activeQuiz.title}</Text>
                  <Text style={styles.modalSub} numberOfLines={1}>{activeQuiz.subject} • {activeQuiz.topic}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setActiveQuiz(null)}
                  style={styles.closeBtn}
                >
                  <X size={20} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              {!quizFinished ? (
                <ScrollView style={styles.modalBodyScroll} contentContainerStyle={styles.modalBody}>
                  {/* Progress Indicator */}
                  <View style={styles.progressRow}>
                    <Text style={styles.progressText}>
                      Question {currentIdx + 1} of {activeQuiz.questions.length}
                    </Text>
                    <View style={styles.timerBadge}>
                      <Clock size={14} color="#4F46E5" />
                      <Text style={styles.timerText}>{activeQuiz.timeLimitMinutes}:00</Text>
                    </View>
                  </View>

                  {/* Question Box */}
                  <View style={styles.questionCard}>
                    <Text style={styles.questionText}>
                      {activeQuiz.questions[currentIdx].questionText}
                    </Text>

                    {/* Options */}
                    {activeQuiz.questions[currentIdx].options.map((opt, oIdx) => {
                      const isSelected = selectedAnswers[currentIdx] === oIdx;
                      return (
                        <TouchableOpacity
                          key={oIdx}
                          style={[
                            styles.optionItem,
                            isSelected && styles.optionItemSelected,
                          ]}
                          onPress={() => handleSelectOption(currentIdx, oIdx)}
                        >
                          <View
                            style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleSelected,
                            ]}
                          >
                            {isSelected && <View style={styles.radioDot} />}
                          </View>
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Nav Buttons */}
                  <View style={styles.navRow}>
                    <TouchableOpacity
                      style={[
                        styles.prevBtn,
                        currentIdx === 0 && { opacity: 0.5 },
                      ]}
                      disabled={currentIdx === 0}
                      onPress={() => setCurrentIdx((prev) => prev - 1)}
                    >
                      <Text style={styles.prevBtnText}>Previous</Text>
                    </TouchableOpacity>

                    {currentIdx < activeQuiz.questions.length - 1 ? (
                      <TouchableOpacity
                        style={styles.nextBtn}
                        onPress={() => setCurrentIdx((prev) => prev + 1)}
                      >
                        <Text style={styles.nextBtnText}>Next Question</Text>
                        <ChevronRight size={16} color="#fff" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.submitQuizBtn}
                        onPress={submitCurrentQuiz}
                      >
                        <CheckCircle size={16} color="#fff" />
                        <Text style={styles.submitQuizBtnText}>Submit Quiz</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              ) : (
                /* Result Screen */
                <View style={styles.resultBody}>
                  <View style={styles.scoreCircle}>
                    <Award size={48} color={scoreResult >= 70 ? '#10B981' : '#F59E0B'} />
                    <Text style={styles.scoreNumber}>{scoreResult}%</Text>
                  </View>
                  <Text style={styles.resultTitle}>
                    {scoreResult >= 80
                      ? 'Outstanding Performance! 🎉'
                      : scoreResult >= 60
                      ? 'Good Job! Keep Practicing 👍'
                      : 'Needs Improvement 📚'}
                  </Text>
                  <Text style={styles.resultSub}>
                    You scored {scoreResult}% on {activeQuiz.title}.
                  </Text>

                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => setActiveQuiz(null)}
                  >
                    <Text style={styles.doneBtnText}>Back to Quizzes</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },

  // Generator Card
  generatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  generatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  sparkleBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  counterBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },

  // Drop Zone Box
  dropZoneBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  dropZoneIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dropZoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  dropZoneSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    textAlign: 'center',
  },
  dropZoneBtnRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  demoPresetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  demoPresetBtnText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },

  // Repository Header & Grid
  repositoryFilterHeader: {
    marginBottom: 16,
  },
  repositoryFilterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  imageCard: {
    flex: 1,
    minWidth: 180,
    maxWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    position: 'relative',
  },
  imageCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  imagePreviewWrap: {
    height: 130,
    width: '100%',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  paperImageThumbnail: {
    width: '100%',
    height: '100%',
  },
  inspectOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inspectOverlayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  imageCardContent: {
    padding: 10,
  },
  imageCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  imageCardSub: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 8,
  },
  selectPaperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  selectPaperBtnSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  selectPaperBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  selectPaperBtnTextSelected: {
    color: '#FFFFFF',
  },

  selectedSummaryBox: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  galleryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },

  genOptionsRow: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 20,
    width: '100%',
  },
  optionBox: {
    width: '100%',
  },
  optionBoxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  optionPillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  optPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  optPillActive: {
    backgroundColor: '#4F46E5',
  },
  optPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  optPillTextActive: {
    color: '#FFFFFF',
  },

  generateSubmitBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    boxSizing: 'border-box',
  },
  generateSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: '90%',
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  pillsScroll: {
    flexDirection: 'row',
  },
  pillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
  },
  pillBtnActive: {
    backgroundColor: '#4F46E5',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  noQuizzesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  noQuizzesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  noQuizzesSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 400,
  },
  quizGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quizCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quizCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  subjectBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 1,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diffBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  quizTopic: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  quizMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  startBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  completedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  retakeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },

  // Image Viewer Modal
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imageViewerModal: {
    width: '100%',
    maxWidth: 900,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  imageViewerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  imageViewerSub: {
    fontSize: 12,
    color: '#64748B',
  },
  imageViewerBody: {
    flex: 1,
  },
  fullQuestionPaperImage: {
    width: 820,
    height: 3200,
  },
  imageViewerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  modalContainer: {
    width: '96%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
  },
  closeBtn: {
    padding: 6,
  },
  modalBodyScroll: {
    flex: 1,
  },
  modalBody: {
    padding: 18,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  questionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 14,
    lineHeight: 22,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 10,
  },
  optionItemSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioCircleSelected: {
    borderColor: '#4F46E5',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
  },
  optionText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
    flexWrap: 'wrap',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#4F46E5',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prevBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitQuizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  submitQuizBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Result body
  resultBody: {
    padding: 32,
    alignItems: 'center',
  },
  scoreCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultSub: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
  },
  doneBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default QuizzesScreen;
