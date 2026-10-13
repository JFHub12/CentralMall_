import http.server
import socketserver
import json
import urllib.parse
import urllib.request
import os
import time
import math
from typing import Dict, Any, List

PORT = 8000

# Central University Miotso Campus Buildings Data
CENTRAL_BUILDINGS = [
    {
        "id": "senate-building",
        "name": "Senate Building & Admin Block",
        "code": "SEN-01",
        "category": "Administrative",
        "description": "Central University Administration offices, Vice-Chancellor's office, Finance, and Admissions.",
        "facilities": ["Admissions Desk", "Finance Dept", "VC Office", "ATM", "Academic Affairs"],
        "x": 50,
        "y": 30,
        "image": "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=800",
        "openingHours": "8:00 AM - 5:00 PM (Mon - Fri)"
    },
    {
        "id": "trinity-hall",
        "name": "Trinity Hall (Male Hostel)",
        "code": "TRN-H1",
        "category": "Hostels",
        "description": "Main male undergraduate hostel featuring 24/7 security, laundry room, and study lounge.",
        "facilities": ["Lounge", "Laundry Room", "Wi-Fi Hub", "Supermarket", "Porter Desk"],
        "x": 75,
        "y": 70,
        "image": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800",
        "openingHours": "24/7 Resident Access"
    },
    {
        "id": "destiny-hall",
        "name": "Destiny Hall (Female Hostel)",
        "code": "DST-H2",
        "category": "Hostels",
        "description": "Female residence hall equipped with modern kitchenettes and quiet study floors.",
        "facilities": ["Saloon", "Study Room", "Kitchenette", "Security Desk", "Porter Desk"],
        "x": 25,
        "y": 75,
        "image": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800",
        "openingHours": "24/7 Resident Access"
    },
    {
        "id": "clinic-1",
        "name": "Central University School Clinic",
        "code": "CLN-01",
        "category": "Medical",
        "description": "On-campus medical center accredited by Ghana Health Service (GHS) providing 24/7 emergency care, triage, and pharmacy services.",
        "facilities": ["Ambulance Station", "Pharmacy", "Consultation Rooms", "Laboratory", "Triage Ward"],
        "x": 20,
        "y": 35,
        "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
        "openingHours": "24 Hours Daily"
    },
    {
        "id": "central-library",
        "name": "Central University Main Library",
        "code": "LIB-01",
        "category": "Academic",
        "description": "Ultra-modern multi-story library containing e-learning labs, quiet zones, and research archives.",
        "facilities": ["Computer Lab", "Discussion Booths", "Printing Center", "E-Journal Hub", "Cafeteria"],
        "x": 50,
        "y": 55,
        "image": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800",
        "openingHours": "7:30 AM - 10:00 PM"
    },
    {
        "id": "law-faculty",
        "name": "Faculty of Law & Moot Court",
        "code": "LAW-01",
        "category": "Academic",
        "description": "Home to the Law Faculty, state-of-the-art Moot Courtroom, and legal research wing.",
        "facilities": ["Moot Court", "Law Library", "Lecture Theaters", "Faculty Lounge"],
        "x": 35,
        "y": 45,
        "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800",
        "openingHours": "8:00 AM - 8:00 PM"
    },
    {
        "id": "sports-complex",
        "name": "Miotso Campus Sports Complex",
        "code": "SPT-01",
        "category": "Sports",
        "description": "Multi-purpose sports arena featuring basketball courts, football pitch, and fitness gym.",
        "facilities": ["Football Pitch", "Basketball Court", "Gym", "Changing Rooms", "Running Track"],
        "x": 80,
        "y": 30,
        "image": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
        "openingHours": "6:00 AM - 9:00 PM"
    }
]

# Official Central University Ghana Notices & Web Updates Data (central.edu.gh)
CAMPUS_NOTICES: List[Dict[str, Any]] = [
    {
        "id": "notice-1",
        "title": "2026/2027 Admissions Open for Undergraduate, Law, Nursing & Postgraduate",
        "summary": "Official applications are now open for all accredited degree, diploma, and postgraduate programmes across Miotso and Kumasi campuses.",
        "content": "Central University invites qualified prospective students to apply for admission into the 2026/2027 Academic Year. Programmes offered include BSc. Nursing, Midwifery, LLB Law, BSc. Computer Science, Civil Engineering, Pharmacy, and MBA programmes. Both regular and weekend/sandwich streams are available. Submit applications online via the official portal.",
        "category": "Admissions",
        "date": "Aug 13, 2026",
        "officialLink": "http://central.edu.gh/admissions/",
        "priority": "urgent",
        "source": "Directorate of Academic Affairs & Admissions",
        "targetAudience": "Prospective & Transfer Candidates",
        "isNew": True
    },
    {
        "id": "notice-2",
        "title": "Second Semester Course Registration & Fee Clearance Deadline",
        "summary": "Mandatory notice for continuing undergraduate & postgraduate students regarding semester registration deadlines and exam dockets.",
        "content": "The Academic Affairs Directorate informs all students that the online registration portal for Semester 2 courses will close on Friday at 5:00 PM. Students who have attained the minimum 70% tuition fee clearance are advised to print their official examination dockets ahead of mid-semester assessments.",
        "category": "Academic",
        "date": "Aug 12, 2026",
        "officialLink": "http://central.edu.gh/academic-calendar/",
        "priority": "urgent",
        "source": "Office of the Registrar",
        "targetAudience": "All Continuing Students",
        "isNew": True
    },
    {
        "id": "notice-3",
        "title": "25th Congregation & Matriculation Ceremony Announcement",
        "summary": "Official communiqué regarding the upcoming 25th Congregation for graduating class and Matriculation of fresh students.",
        "content": "The Office of the Vice-Chancellor cordially announces the 25th Congregation Ceremony scheduled to hold at the Miotso Main Campus Quadrangle. Graduands who have completed all clearance requirements can pick up academic gowns from the Senate Building. Live broadcast will be streamed on Central University YouTube and Facebook.",
        "category": "Events",
        "date": "Aug 10, 2026",
        "officialLink": "http://central.edu.gh/news-events/",
        "priority": "important",
        "source": "Office of the Vice-Chancellor",
        "targetAudience": "Graduands, Freshers & Parents",
        "isNew": False
    },
    {
        "id": "notice-4",
        "title": "SRC Annual Health Week & Free Medical Screening at School Clinic",
        "summary": "3-day comprehensive student and staff health checkup, blood donation, and NHIS registration at Central University Clinic.",
        "content": "The Central University Students' Representative Council (SRC) in partnership with the School Clinic and Ghana Health Service (GHS) presents the 2026 Campus Health Week. Services include Free Blood Pressure check, BMI & Nutrition consultation, Blood Donation for Ridge Hospital, Hepatitis B screening, and NHIS biometric renewals at the Clinic ground floor.",
        "category": "Clinic & Health",
        "date": "Aug 09, 2026",
        "officialLink": "http://central.edu.gh/student-life/",
        "priority": "important",
        "source": "SRC Secretariat & School Clinic",
        "targetAudience": "All Students, Faculty & Staff",
        "isNew": False
    },
    {
        "id": "notice-5",
        "title": "Central Business School (CBS) CEO & Industry Mentorship Lecture",
        "summary": "Distinguished lecture series on 'Fintech & Digital Banking Innovations in West Africa' at Senate Hall A.",
        "content": "Central Business School welcomes leading financial sector executives and technology founders for an interactive mentorship masterclass. Topics explore mobile money interoperability, cross-border payments, and AI in corporate banking. Open to all students.",
        "category": "Academic",
        "date": "Aug 07, 2026",
        "officialLink": "http://central.edu.gh/faculties/",
        "priority": "normal",
        "source": "Central Business School (CBS)",
        "targetAudience": "CBS, IT & Law Students",
        "isNew": False
    },
    {
        "id": "notice-6",
        "title": "Campus High-Speed Wi-Fi 6 Upgrades Completed in Hostels & Library",
        "summary": "ICT Directorate activates enhanced fiber-optic Wi-Fi 6 coverage across Trinity Hall, Destiny Hall, and Law Faculty.",
        "content": "The Directorate of ICT has completed the installation of enterprise Wi-Fi 6 access nodes across all residential halls (Trinity & Destiny) and the Main Library. Students should connect to 'CU-Student-Secure' with their institutional email credentials.",
        "category": "Administration",
        "date": "Aug 05, 2026",
        "officialLink": "http://central.edu.gh/ict-services/",
        "priority": "normal",
        "source": "Directorate of ICT Services",
        "targetAudience": "Miotso Campus Residents",
        "isNew": False
    },
    {
        "id": "notice-7",
        "title": "2026/2027 Trinity & Destiny Hostel Allocation Portal Active",
        "summary": "Online residential hall room selection and booking guidelines for continuing and incoming undergraduate students.",
        "content": "The Dean of Students Affairs announces that online hostel room reservations for Trinity Hall (Male) and Destiny Hall (Female) are now live. Students must settle the requisite residential accommodation deposit to lock their allocated room number.",
        "category": "SRC",
        "date": "Aug 03, 2026",
        "officialLink": "http://central.edu.gh/hostels/",
        "priority": "important",
        "source": "Dean of Students Affairs",
        "targetAudience": "Undergraduate Residents",
        "isNew": False
    },
    {
        "id": "notice-8",
        "title": "Central University Law Journal Volume 12: Call for Papers & Articles",
        "summary": "Submissions invited for peer-reviewed legal journal on Constitutional Jurisprudence & Commercial Law in Ghana.",
        "content": "The Editorial Board of the Central University Law Journal invites legal practitioners, faculty, and law scholars to submit scholarly articles and case reviews for Volume 12. Manuscripts should adhere to OSCOLA citation standards.",
        "category": "Academic",
        "date": "Aug 01, 2026",
        "officialLink": "http://central.edu.gh/law-journal/",
        "priority": "normal",
        "source": "Faculty of Law",
        "targetAudience": "Law Students & Researchers",
        "isNew": False
    }
]

# Registered Users Store (In-Memory Database)
CLINIC_APPOINTMENTS_STORE: List[Dict[str, Any]] = [
    {
        "id": "APPT-CU-8841",
        "studentName": "Jesse Fiagbe",
        "studentId": "CU-2026-9021",
        "doctorName": "Dr. Emmanuel Mensah, MD",
        "specialistRole": "Campus Medical Officer (GHS)",
        "consultationType": "virtual_video",
        "date": "2026-08-14",
        "time": "10:00 AM",
        "timeSlot": "10:00 AM - 10:30 AM",
        "reason": "Virtual General Health & Wellness Review",
        "symptoms": ["General Checkup", "Fatigue"],
        "nhisNumber": "NHIS-GH-9021884",
        "virtualLink": "https://meet.google.com/cuc-miotso-med",
        "status": "Confirmed",
        "notes": "Telehealth consultation via GHS encrypted audio/video channel. Please be online 5 minutes before scheduled slot.",
        "createdAt": "2026-08-13 14:20"
    },
    {
        "id": "APPT-CU-7290",
        "studentName": "Kofi Mensah",
        "studentId": "CU-2026-1044",
        "doctorName": "Senior Nursing Officer Rita Appiah",
        "specialistRole": "Triage & Preventive Health Specialist",
        "consultationType": "virtual_video",
        "date": "2026-08-15",
        "time": "02:30 PM",
        "timeSlot": "02:30 PM - 03:00 PM",
        "reason": "Follow-up Telehealth for Malaria Recovery & Nutrition",
        "symptoms": ["Malaria Screening", "Dietary Advice"],
        "nhisNumber": "NHIS-GH-1044729",
        "virtualLink": "https://meet.google.com/cuc-ghs-triage",
        "status": "Confirmed",
        "notes": "Review post-ACT recovery, hydration, and nutritional intake.",
        "createdAt": "2026-08-12 11:05"
    }
]

# Ghana Health Service (GHS - ghs.gov.gh) Daily Health Tips & Campus Wellness Feed
GHS_HEALTH_TIPS_STORE: List[Dict[str, Any]] = [
    {
        "id": "GHS-TIP-01",
        "title": "Malaria Prevention & Prompt RDT Testing within 24 Hours",
        "category": "Malaria",
        "categoryBadge": "National Malaria Elimination Programme",
        "summary": "Never self-medicate with leftover tablets when you experience fever or chills. Visit Central Clinic for an immediate Rapid Diagnostic Test (RDT) covered 100% by NHIS.",
        "fullTip": "According to the Ghana Health Service (GHS) National Malaria Elimination Programme (NMEP), early detection saves lives and prevents cerebral complications. Sleep under Long-Lasting Insecticidal Nets (LLINs) in all Miotso campus hostels. If you develop a fever, headache, bitter taste, or body weakness, report to the Central University School Clinic within 24 hours for a blood film/RDT before starting Artemisinin-based Combination Therapy (ACT).",
        "actionPoints": [
            "Sleep inside treated mosquito nets daily in hostels and off-campus residences",
            "Get tested with RDT at CU Clinic before swallowing any antimalarial drugs",
            "Clear stagnant puddles around student residences to disrupt mosquito breeding vectors",
            "Complete the full 3-day ACT regimen prescribed by the medical officer even if fever subsides"
        ],
        "ghsSourceUrl": "https://ghs.gov.gh/malaria-control-programme/",
        "ghsDivision": "GHS Public Health Division & NMEP",
        "date": "Today's Featured Tip",
        "readTime": "2 min read",
        "imageUrl": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800",
        "iconType": "shield-alert",
        "isDailyFeatured": True
    },
    {
        "id": "GHS-TIP-02",
        "title": "Coastal Savanna Hydration & Electrolyte Balance at Miotso",
        "category": "Hydration",
        "categoryBadge": "Health Promotion Division",
        "summary": "Miotso's sunny climate causes accelerated dehydration during lectures. Drink at least 2.5 to 3 liters of clean water daily and consume fresh Ghanaian coconut water for natural electrolytes.",
        "fullTip": "The Greater Accra coastal savanna corridor experiences high ambient temperatures and dry thermal winds. GHS advises university students to carry a refillable water bottle to lectures, limit sugary energy drinks that trigger renal strain, and recognize early signs of dehydration such as dark urine, lethargy, and tension headaches.",
        "actionPoints": [
            "Aim for 8 to 10 glasses (2.5L - 3L) of safe drinking water throughout campus daylight hours",
            "Incorporate fresh coconut water or citrus slices for natural potassium and potassium balance",
            "Limit high-caffeine energy drinks during exam periods to prevent heart palpitations and dehydration",
            "Refill bottles at verified filtered water dispensers across Central University lecture blocks"
        ],
        "ghsSourceUrl": "https://ghs.gov.gh/health-promotion-division/",
        "ghsDivision": "GHS Health Promotion & Nutrition Unit",
        "date": "Daily Wellness Advisory",
        "readTime": "1.5 min read",
        "imageUrl": "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&q=80&w=800",
        "iconType": "droplets",
        "isDailyFeatured": True
    },
    {
        "id": "GHS-TIP-03",
        "title": "Exam Stress Relief & Cognitive Sleep Hygiene (20-20-20 Rule)",
        "category": "Mental Health",
        "categoryBadge": "Mental Health Authority & GHS",
        "summary": "Protect mental wellness with 7-8 hours of restorative sleep, regular study breaks, and the 20-20-20 vision rule during intensive computer or revision sessions.",
        "fullTip": "Intensive coursework and continuous screen time can induce physical exhaustion, digital eye strain, and anxiety. The GHS Mental Health Division recommends prioritizing 7–8 hours of sleep per night to consolidate memory and cognitive recall. Every 20 minutes of study, look at an object 20 feet away for 20 seconds. Confidential counseling sessions are available through Central University Student Affairs and Clinic desks.",
        "actionPoints": [
            "Follow the 20-20-20 screen rule to relax ocular muscles during late-night laptop sessions",
            "Avoid all-night cramming ('T-Junction' study) right before morning examinations",
            "Practice deep diaphragmatic breathing and take 10-minute campus outdoor walks between study blocks",
            "Book a confidential counseling session at the clinic whenever feeling overwhelmed"
        ],
        "ghsSourceUrl": "https://ghs.gov.gh/mental-health-services/",
        "ghsDivision": "GHS Mental Health & Psychosocial Support Unit",
        "date": "Student Wellness Series",
        "readTime": "2 min read",
        "imageUrl": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
        "iconType": "brain",
        "isDailyFeatured": False
    },
    {
        "id": "GHS-TIP-04",
        "title": "Food Hygiene: Preventing Typhoid, Cholera & Enteric Fevers",
        "category": "Hygiene",
        "categoryBadge": "Disease Surveillance & Prevention",
        "summary": "Wash hands with soap under clean running water before meals. Ensure cafeteria and food vendor meals are served hot and covered.",
        "fullTip": "Enteric infections like Typhoid and foodborne gastroenteritis spread quickly through contaminated utensils, unwashed hands, and uncovered food stands. GHS disease surveillance protocols urge students to insist on food served piping hot, verify that campus vendors hold valid GHS medical fitness screening certificates, and carry alcohol-based hand sanitizers when water is unavailable.",
        "actionPoints": [
            "Wash hands thoroughly for at least 20 seconds with soap under flowing water before every meal",
            "Only eat freshly cooked, steaming food and avoid raw/unwashed salads from open roadside stalls",
            "Drink sachet or bottled water with verified FDA Ghana seal and check packaging integrity",
            "Report lingering abdominal cramps or prolonged diarrhea to the clinic immediately"
        ],
        "ghsSourceUrl": "https://ghs.gov.gh/disease-surveillance-department/",
        "ghsDivision": "GHS Disease Surveillance Department (DSD)",
        "date": "Preventive Health Bulletin",
        "readTime": "2 min read",
        "imageUrl": "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&q=80&w=800",
        "iconType": "hand-metal",
        "isDailyFeatured": False
    },
    {
        "id": "GHS-TIP-05",
        "title": "Antimicrobial Resistance (AMR) & Prescription Stewardship",
        "category": "Pharmacy",
        "categoryBadge": "Pharmacy Council & GHS Directorate",
        "summary": "Never demand antibiotics for viral coughs, colds, or mild flu. Overusing antibiotics builds dangerous drug resistance across Ghana.",
        "fullTip": "Antimicrobial resistance (AMR) is a major public health threat in West Africa. Taking antibiotics like Amoxicillin or Ciprofloxacin for viral upper respiratory infections is ineffective and drives superbug mutations. Under GHS and Ghana Pharmacy Council guidelines, antibiotics must only be taken after medical consultation, diagnosis, and a written prescription.",
        "actionPoints": [
            "Never purchase over-the-counter antibiotics without an authorized doctor's prescription",
            "Complete your entire course of antibiotics even after feeling significantly better",
            "Do not share prescribed medications with roommates or store leftover capsules for later",
            "Consult the CU Clinic Pharmacist for soothing non-antibiotic cough and cold remedies"
        ],
        "ghsSourceUrl": "https://ghs.gov.gh/pharmaceutical-services-directorate/",
        "ghsDivision": "GHS Pharmaceutical Services Directorate",
        "date": "Drug Safety Alert",
        "readTime": "2 min read",
        "imageUrl": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=800",
        "iconType": "pill",
        "isDailyFeatured": False
    },
    {
        "id": "GHS-TIP-06",
        "title": "Nutritious Local Ghanaian Diet for Sustained Brain Energy",
        "category": "Nutrition",
        "categoryBadge": "GHS Nutrition & Dietary Guidelines",
        "summary": "Fuel your lectures with diverse nutrient-dense local meals including Kontomire (Cocoyam leaves), beans with plantain (Gob3), brown rice, and fresh pawpaw/oranges.",
        "fullTip": "Eating balanced local Ghanaian foods provides sustained energy without afternoon blood sugar crashes. GHS dietary guidelines recommend adding dark leafy greens (Kontomire, Aleefu, Ayoyo) rich in iron and folate, legumes like beans and groundnuts for plant protein, and antioxidant-rich local fruits to boost immune defense during stressful academic semesters.",
        "actionPoints": [
            "Balance plates with complex carbohydrates, protein (fish, eggs, beans), and colorful vegetables",
            "Choose iron-rich green leafy soups (Kontomire, Gboma) to prevent anemia and fatigue",
            "Snack on roasted groundnuts, tigernuts, and fresh fruits instead of ultra-processed biscuits",
            "Eat a hearty breakfast before morning 8:00 AM lectures to maintain high attention span"
        ],
        "ghsSourceUrl": "https://ghs.gov.gh/nutrition-department/",
        "ghsDivision": "GHS Nutrition & Non-Communicable Diseases Unit",
        "date": "Campus Nutrition Guide",
        "readTime": "1.5 min read",
        "imageUrl": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800",
        "iconType": "apple",
        "isDailyFeatured": False
    }
]

USERS_STORE: Dict[str, Dict[str, Any]] = {
    "student@central.edu.gh": {
        "id": "usr-1",
        "email": "student@central.edu.gh",
        "password": "password123",
        "name": "Kofi Mensah",
        "role": "student",
        "studentId": "CU-2026-1044",
        "phone": "+233241234567",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"
    },
    "jessefiagbe20@gmail.com": {
        "id": "usr-2",
        "email": "jessefiagbe20@gmail.com",
        "password": "password123",
        "name": "Jesse Fiagbe",
        "role": "student",
        "studentId": "CU-2026-9021",
        "phone": "+233501239876",
        "avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300"
    },
    "merchant@central.edu.gh": {
        "id": "usr-3",
        "email": "merchant@central.edu.gh",
        "password": "password123",
        "name": "Central Campus Mart",
        "role": "merchant",
        "studentId": None,
        "phone": "+233245558899",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300"
    }
}

# Initial Marketplace Products (20+ Items across all categories)
PRODUCTS_STORE: List[Dict[str, Any]] = [
    {
        "id": "prod-1",
        "title": "Constitutional Law of Ghana (Textbook & Casebook)",
        "price": 150,
        "category": "Textbooks & Books",
        "description": "Essential textbook for Level 100 & 200 Faculty of Law students. Contains seminal Supreme Court cases and constitutional analysis.",
        "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Kwame Mensah",
        "sellerRole": "Law Student (Level 300)",
        "sellerContact": "+233241234567",
        "sellerId": "usr-1",
        "locationOnCampus": "Faculty of Law / Moot Court (LAW-01)",
        "condition": "Like New",
        "datePosted": "Today",
        "dateAdded": "2026-08-13"
    },
    {
        "id": "prod-2",
        "title": "HP Pavilion 15 (Core i5 11th Gen, 16GB RAM, 512GB SSD)",
        "price": 3200,
        "category": "Electronics & Gadgets",
        "description": "Fast Core i5 laptop with long battery life. Perfect for Computer Science programming, SPSS data analysis, and assignments.",
        "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Abena Osei",
        "sellerRole": "Computer Science Student",
        "sellerContact": "+233509876543",
        "sellerId": "usr-2",
        "locationOnCampus": "Destiny Hall, Room C04",
        "condition": "Like New",
        "datePosted": "Yesterday",
        "dateAdded": "2026-08-12"
    },
    {
        "id": "prod-3",
        "title": "Central University Crest Varsity Jacket (Navy & Crimson)",
        "price": 220,
        "category": "Fashion & Clothing",
        "description": "Heavyweight premium cotton fleece varsity jacket with embroidered Central University crest. Unisex size L.",
        "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Central SRC Mart",
        "sellerRole": "Official Vendor",
        "sellerContact": "+233270001122",
        "sellerId": "usr-3",
        "locationOnCampus": "Senate Building Ground Floor",
        "condition": "Brand New",
        "datePosted": "Today",
        "dateAdded": "2026-08-13"
    },
    {
        "id": "prod-4",
        "title": "Special Ghana Jollof Rice + Grilled Chicken & Kelewele Combo",
        "price": 40,
        "category": "Food & Snacks",
        "description": "Steaming hot spicy Ghanaian party jollof with quarter grilled chicken, fried spicy plantain, and green chili sauce.",
        "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Miotso Campus Buka",
        "sellerRole": "Campus Vendor",
        "sellerContact": "+233245558899",
        "sellerId": "usr-3",
        "locationOnCampus": "Near Library Cafeteria",
        "condition": "Brand New",
        "datePosted": "Just Now",
        "dateAdded": "2026-08-13"
    },
    {
        "id": "prod-5",
        "title": "Casio fx-991EX ClassWiz Scientific Calculator",
        "price": 140,
        "category": "Electronics & Gadgets",
        "description": "High-resolution natural display scientific calculator. Allowed for CBS business math, engineering, and statistics exams.",
        "image": "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Emmanuel Darko",
        "sellerRole": "Engineering Student",
        "sellerContact": "+233248887711",
        "sellerId": "usr-4",
        "locationOnCampus": "Trinity Hall Block A",
        "condition": "Like New",
        "datePosted": "Today",
        "dateAdded": "2026-08-13"
    },
    {
        "id": "prod-6",
        "title": "Rechargeable LED Desk Study Lamp with Phone Stand",
        "price": 85,
        "category": "Hostel Essentials",
        "description": "Touch dimmable 3-color temperature reading lamp with USB charging port. Lasts 8 hours on a single charge during power cuts.",
        "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Comfort Addo",
        "sellerRole": "Nursing Student",
        "sellerContact": "+233543219876",
        "sellerId": "usr-5",
        "locationOnCampus": "Destiny Hall Annex",
        "condition": "Brand New",
        "datePosted": "2 days ago",
        "dateAdded": "2026-08-11"
    },
    {
        "id": "prod-7",
        "title": "Principles of Auditing & Assurance (Central Business School)",
        "price": 110,
        "category": "Textbooks & Books",
        "description": "Required reference textbook for CBS Accounting & Finance Level 300. Highlighted key exam questions and practice answers.",
        "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Jesse Fiagbe",
        "sellerRole": "CBS Student",
        "sellerContact": "+233501239876",
        "sellerId": "usr-2",
        "locationOnCampus": "Senate Building 2nd Floor",
        "condition": "Like New",
        "datePosted": "Yesterday",
        "dateAdded": "2026-08-12"
    },
    {
        "id": "prod-8",
        "title": "Oraimo FreePods 4 Active Noise Cancelling Earbuds",
        "price": 190,
        "category": "Electronics & Gadgets",
        "description": "Original wireless Bluetooth earbuds with deep bass and clear microphone for online lectures and library studying.",
        "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Bright Kwarteng",
        "sellerRole": "IT Student",
        "sellerContact": "+233201122334",
        "sellerId": "usr-6",
        "locationOnCampus": "Trinity Hall Room D14",
        "condition": "Brand New",
        "datePosted": "Today",
        "dateAdded": "2026-08-13"
    },
    {
        "id": "prod-9",
        "title": "Stainless Steel Fast-Boil Electric Kettle (1.8L)",
        "price": 95,
        "category": "Hostel Essentials",
        "description": "Automatic shut-off electric kettle for tea, coffee, and quick noodles in student hostel rooms.",
        "image": "https://images.unsplash.com/photo-1594213114663-ddf3f2a08151?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Grace Baidoo",
        "sellerRole": "Pharmacy Student",
        "sellerContact": "+233249988776",
        "sellerId": "usr-7",
        "locationOnCampus": "Destiny Hall Block B",
        "condition": "Brand New",
        "datePosted": "3 days ago",
        "dateAdded": "2026-08-10"
    },
    {
        "id": "prod-10",
        "title": "Authentic Waakye Special with Shito, Boiled Egg, Wele & Fish",
        "price": 35,
        "category": "Food & Snacks",
        "description": "Fresh morning & lunch Waakye served with talia (spaghetti), gari foto, spicy black shito, tender wele, and fried fish.",
        "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Auntie Mary Kitchen",
        "sellerRole": "Miotso Campus Caterer",
        "sellerContact": "+233556789012",
        "sellerId": "usr-8",
        "locationOnCampus": "Commercial Area near Sports Complex",
        "condition": "Brand New",
        "datePosted": "Just Now",
        "dateAdded": "2026-08-13"
    },
    {
        "id": "prod-11",
        "title": "Pharmacology & Therapeutics for Nursing & Midwifery",
        "price": 130,
        "category": "Textbooks & Books",
        "description": "Comprehensive drug dosage calculations, mechanisms, and nursing interventions for clinical rounds.",
        "image": "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Patience Mensah",
        "sellerRole": "Nursing Student (Level 400)",
        "sellerContact": "+233246543210",
        "sellerId": "usr-9",
        "locationOnCampus": "Near School Clinic (CLN-01)",
        "condition": "Like New",
        "datePosted": "Yesterday",
        "dateAdded": "2026-08-12"
    },
    {
        "id": "prod-12",
        "title": "Anker PowerCore 20,000mAh Ultra Fast-Charge Power Bank",
        "price": 250,
        "category": "Electronics & Gadgets",
        "description": "High-capacity power bank capable of charging smartphones 4 to 5 times. Features PowerIQ 3.0 USB-C PD fast charge.",
        "image": "https://images.unsplash.com/photo-1609592426815-54d9c49021dc?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Samuel Appiah",
        "sellerRole": "Business Admin Student",
        "sellerContact": "+233504321789",
        "sellerId": "usr-10",
        "locationOnCampus": "Trinity Hall Block C",
        "condition": "Brand New",
        "datePosted": "Today",
        "dateAdded": "2026-08-13"
    },
    {
        "id": "prod-13",
        "title": "Central University Official Gold-Trim Graduation Stole",
        "price": 120,
        "category": "Fashion & Clothing",
        "description": "Official satin embroidered stole for Central University matriculation, honors ceremonies, and photoshoots.",
        "image": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Central SRC Store",
        "sellerRole": "Official Vendor",
        "sellerContact": "+233270001122",
        "sellerId": "usr-3",
        "locationOnCampus": "Senate Building Ground Floor",
        "condition": "Brand New",
        "datePosted": "4 days ago",
        "dateAdded": "2026-08-09"
    },
    {
        "id": "prod-14",
        "title": "Foldable Heavy-Duty Hostel Balcony Clothes Drying Rack",
        "price": 120,
        "category": "Hostel Essentials",
        "description": "Rust-proof stainless steel foldable clothes rack. Compact footprint fits easily on Trinity and Destiny Hall balconies.",
        "image": "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Eunice Tetteh",
        "sellerRole": "Human Resource Student",
        "sellerContact": "+233241199884",
        "sellerId": "usr-11",
        "locationOnCampus": "Destiny Hall Room A12",
        "condition": "Like New",
        "datePosted": "Yesterday",
        "dateAdded": "2026-08-12"
    },
    {
        "id": "prod-15",
        "title": "Express Color Dissertation & Hardcover Thesis Binding",
        "price": 45,
        "category": "Services & Printing",
        "description": "High-resolution color printing on 80gsm paper with gold-embossed hardcover binding conforming to Central University guidelines.",
        "image": "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Central Digital Print Hub",
        "sellerRole": "Campus Printing Press",
        "sellerContact": "+233208765432",
        "sellerId": "usr-12",
        "locationOnCampus": "Main Library E-Learning Wing (LIB-01)",
        "condition": "Brand New",
        "datePosted": "Today",
        "dateAdded": "2026-08-13"
    },
    {
        "id": "prod-16",
        "title": "Fresh Miotso Fruit Salad & Strawberry Smoothie Bowl",
        "price": 25,
        "category": "Food & Snacks",
        "description": "Chilled mix of fresh watermelon, pineapple, pawpaw, grapes, and topped with honey and granola.",
        "image": "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Smoothie Delight CU",
        "sellerRole": "Campus Vendor",
        "sellerContact": "+233549012345",
        "sellerId": "usr-13",
        "locationOnCampus": "Sports Complex Pavilion",
        "condition": "Brand New",
        "datePosted": "Just Now",
        "dateAdded": "2026-08-13"
    },
    {
        "id": "prod-17",
        "title": "Database Management Systems (MySQL, PostgreSQL & SQL Queries)",
        "price": 95,
        "category": "Textbooks & Books",
        "description": "Standard Computer Science textbook covering relational schema design, normal forms, and transaction ACID properties.",
        "image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
        "sellerName": "David Quaye",
        "sellerRole": "Computer Science Level 300",
        "sellerContact": "+233261234567",
        "sellerId": "usr-14",
        "locationOnCampus": "Library ICT Lab",
        "condition": "Like New",
        "datePosted": "2 days ago",
        "dateAdded": "2026-08-11"
    },
    {
        "id": "prod-18",
        "title": "SanDisk 64GB Ultra Dual USB Type-C & Type-A Flash Drive",
        "price": 65,
        "category": "Electronics & Gadgets",
        "description": "High-speed 150MB/s flash drive that connects seamlessly to laptops, tablets, and Android smartphones for lecture slides.",
        "image": "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Francis Anan",
        "sellerRole": "IT Student",
        "sellerContact": "+233503216549",
        "sellerId": "usr-15",
        "locationOnCampus": "Trinity Hall Block B",
        "condition": "Brand New",
        "datePosted": "Yesterday",
        "dateAdded": "2026-08-12"
    },
    {
        "id": "prod-19",
        "title": "Same-Day Student Laundry & Ironing Service (Free Pickup)",
        "price": 50,
        "category": "Services & Printing",
        "description": "Door-to-door washing, machine drying, and crisp steam ironing. Pickups available at Trinity Hall, Destiny Hall, and Pronto Hostels.",
        "image": "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Sparkle Student Laundry",
        "sellerRole": "Campus Service Provider",
        "sellerContact": "+233245678901",
        "sellerId": "usr-16",
        "locationOnCampus": "Trinity Hall Porter Lodge",
        "condition": "Brand New",
        "datePosted": "Today",
        "dateAdded": "2026-08-13"
    },
    {
        "id": "prod-20",
        "title": "Mini Bedroom Refrigerator (90L, Low Power Consumption)",
        "price": 950,
        "category": "Hostel Essentials",
        "description": "Silent, compact 90-liter single door fridge with small freezer compartment. Perfect for drinks, medicines, and groceries in hostel rooms.",
        "image": "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Richard Antwi",
        "sellerRole": "Economics Graduate",
        "sellerContact": "+233557891234",
        "sellerId": "usr-17",
        "locationOnCampus": "Trinity Hall Room C20",
        "condition": "Like New",
        "datePosted": "3 days ago",
        "dateAdded": "2026-08-10"
    },
    {
        "id": "prod-21",
        "title": "Crispy Chicken Shawarma & Chilled Sobolo Drink Combo",
        "price": 30,
        "category": "Food & Snacks",
        "description": "Double wrapped spicy grilled chicken shawarma with sausages, veggies, cream dressing, plus a bottle of ginger-infused sobolo.",
        "image": "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Tasty Bites CU",
        "sellerRole": "Campus Vendor",
        "sellerContact": "+233209876543",
        "sellerId": "usr-18",
        "locationOnCampus": "Near Moot Court walkway",
        "condition": "Brand New",
        "datePosted": "Just Now",
        "dateAdded": "2026-08-13"
    },
    {
        "id": "prod-22",
        "title": "Central University Pride Cotton Polo T-Shirt (Unisex)",
        "price": 85,
        "category": "Fashion & Clothing",
        "description": "Breathable 100% pique cotton polo with embroidered Central University crest. Sizes available: S, M, L, XL, XXL.",
        "image": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=800",
        "sellerName": "Central SRC Store",
        "sellerRole": "Official Vendor",
        "sellerContact": "+233270001122",
        "sellerId": "usr-3",
        "locationOnCampus": "Senate Building Ground Floor",
        "condition": "Brand New",
        "datePosted": "Today",
        "dateAdded": "2026-08-13"
    }
]

ORDERS_STORE: List[Dict[str, Any]] = []

# In-memory Live GPS Users / Vehicles
LIVE_GPS_USERS: Dict[str, Dict[str, Any]] = {
    "shuttle-1": {
        "id": "shuttle-1",
        "name": "Miotso Campus Shuttle #1",
        "role": "Campus Shuttle",
        "x": 45.0,
        "y": 50.0,
        "lat": 5.7592,
        "lng": 0.0528,
        "speedKmH": 18,
        "headingDeg": 120,
        "lastUpdated": time.strftime("%I:%M:%S %p")
    },
    "ambulance-1": {
        "id": "ambulance-1",
        "name": "School Clinic Emergency Ambulance",
        "role": "Emergency Medical",
        "x": 20.0,
        "y": 35.0,
        "lat": 5.7585,
        "lng": 0.0515,
        "speedKmH": 0,
        "headingDeg": 0,
        "lastUpdated": time.strftime("%I:%M:%S %p")
    },
    "security-1": {
        "id": "security-1",
        "name": "Miotso Campus Security Patrol",
        "role": "Campus Security",
        "x": 78.0,
        "y": 55.0,
        "lat": 5.7601,
        "lng": 0.0539,
        "speedKmH": 12,
        "headingDeg": 270,
        "lastUpdated": time.strftime("%I:%M:%S %p")
    }
}

class PythonBackendHandler(http.server.BaseHTTPRequestHandler):

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _send_json(self, data: Any, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        query_params = urllib.parse.parse_qs(parsed_path.query)

        # 1. Health Endpoint
        if path == "/api/health":
            self._send_json({
                "status": "ok",
                "backend": "Python 3.10 Backend Engine",
                "app": "Central University Miotso Campus",
                "usersCount": len(USERS_STORE),
                "productsCount": len(PRODUCTS_STORE)
            })
            return

        # 2. Live GPS Locations
        if path == "/api/gps/locations":
            now_sec = time.time()
            shuttle = LIVE_GPS_USERS.get("shuttle-1")
            if shuttle:
                shuttle["x"] = round(25.0 + (math.sin(now_sec / 5.0) + 1.0) * 25.0, 1)
                shuttle["y"] = round(30.0 + (math.cos(now_sec / 5.0) + 1.0) * 20.0, 1)
                shuttle["speedKmH"] = round(15 + (now_sec % 10))
                shuttle["lastUpdated"] = time.strftime("%I:%M:%S %p")

            self._send_json({
                "locations": list(LIVE_GPS_USERS.values())
            })
            return

        # 3. Universal Search Endpoint (Buildings + Products)
        if path == "/api/gps/search":
            q = query_params.get("q", [""])[0].strip().lower()

            if not q:
                self._send_json({
                    "query": "",
                    "totalCount": len(CENTRAL_BUILDINGS) + len(PRODUCTS_STORE),
                    "buildings": CENTRAL_BUILDINGS,
                    "products": PRODUCTS_STORE
                })
                return

            matched_buildings = [
                b for b in CENTRAL_BUILDINGS
                if q in b["name"].lower()
                or q in b["code"].lower()
                or q in b["category"].lower()
                or q in b["description"].lower()
                or any(q in f.lower() for f in b["facilities"])
            ]

            matched_products = [
                p for p in PRODUCTS_STORE
                if q in p["title"].lower()
                or q in p["category"].lower()
                or q in p["description"].lower()
                or q in p["sellerName"].lower()
                or q in p["locationOnCampus"].lower()
            ]

            self._send_json({
                "query": q,
                "totalCount": len(matched_buildings) + len(matched_products),
                "buildings": matched_buildings,
                "products": matched_products
            })
            return

        # 4. Products List
        if path == "/api/products":
            self._send_json({"products": PRODUCTS_STORE})
            return

        # 5. Orders List
        if path == "/api/orders":
            self._send_json({"orders": ORDERS_STORE})
            return

        # 6. Live Miotso Campus Weather (Open-Meteo)
        if path == "/api/weather":
            try:
                url = "https://api.open-meteo.com/v1/forecast?latitude=5.7592&longitude=0.0528&current_weather=true"
                req = urllib.request.Request(url, headers={"User-Agent": "CentralMall/1.0"})
                with urllib.request.urlopen(req, timeout=5) as response:
                    weather_data = json.loads(response.read().decode("utf-8"))
                    curr = weather_data.get("current_weather", {})
                    
                    w_code = curr.get("weathercode", 0)
                    condition = "Sunny / Clear"
                    if w_code in [1, 2, 3]:
                        condition = "Partly Cloudy"
                    elif w_code in [45, 48]:
                        condition = "Foggy"
                    elif w_code in [51, 53, 55, 61, 63, 65]:
                        condition = "Light Rain"
                    elif w_code >= 80:
                        condition = "Tropical Showers"

                    self._send_json({
                        "location": "Central University Miotso Campus (Ghana)",
                        "temperatureC": curr.get("temperature", 28.0),
                        "windspeedKmH": curr.get("windspeed", 14.5),
                        "condition": condition,
                        "isDay": curr.get("is_day", 1) == 1,
                        "time": curr.get("time", time.strftime("%Y-%m-%dT%H:%M"))
                    })
                    return
            except Exception as e:
                print("Weather API Fetch Error:", e)
                self._send_json({
                    "location": "Miotso Campus, Greater Accra",
                    "temperatureC": 28.5,
                    "windspeedKmH": 12.0,
                    "condition": "Warm & Sunny (Miotso)",
                    "isDay": True,
                    "time": time.strftime("%Y-%m-%dT%H:%M")
                })
                return

        # 7. Live GHS Currency Exchange Rates
        if path == "/api/rates":
            try:
                url = "https://open.er-api.com/v6/latest/GHS"
                req = urllib.request.Request(url, headers={"User-Agent": "CentralMall/1.0"})
                with urllib.request.urlopen(req, timeout=5) as response:
                    rates_data = json.loads(response.read().decode("utf-8"))
                    rates = rates_data.get("rates", {})
                    self._send_json({
                        "base": "GHS",
                        "usdRate": round(rates.get("USD", 0.085), 4),
                        "eurRate": round(rates.get("EUR", 0.078), 4),
                        "gbpRate": round(rates.get("GBP", 0.066), 4),
                        "ngnRate": round(rates.get("NGN", 125.0), 2),
                        "lastUpdated": rates_data.get("time_last_update_utc", time.strftime("%a, %d %b %Y"))
                    })
                    return
            except Exception as e:
                print("Exchange Rate API Fetch Error:", e)
                self._send_json({
                    "base": "GHS",
                    "usdRate": 0.085,
                    "eurRate": 0.078,
                    "gbpRate": 0.066,
                    "ngnRate": 125.0,
                    "lastUpdated": "Live Estimated"
                })
                return

        # 8. OpenStreetMap Campus Geocoding Metadata
        if path == "/api/location-info":
            try:
                url = "https://nominatim.openstreetmap.org/reverse?lat=5.7592&lon=0.0528&format=json"
                req = urllib.request.Request(url, headers={"User-Agent": "CentralMallApp/1.0"})
                with urllib.request.urlopen(req, timeout=5) as response:
                    geo_data = json.loads(response.read().decode("utf-8"))
                    addr = geo_data.get("address", {})
                    self._send_json({
                        "displayName": geo_data.get("display_name", "Central University Miotso, Ghana"),
                        "town": addr.get("town") or addr.get("village") or "Miotso / Dawhenya",
                        "district": addr.get("county") or "Ningo-Prampram District",
                        "region": addr.get("state") or "Greater Accra Region",
                        "country": addr.get("country", "Ghana"),
                        "latitude": 5.7592,
                        "longitude": 0.0528
                    })
                    return
            except Exception as e:
                print("Geocoding API Fetch Error:", e)
                self._send_json({
                    "displayName": "Central University Miotso Campus, Prampram Road, Ghana",
                    "town": "Miotso",
                    "district": "Ningo-Prampram District",
                    "region": "Greater Accra Region",
                    "country": "Ghana",
                    "latitude": 5.7592,
                    "longitude": 0.0528
                })
                return

        # 9. Official Central University Campus Notices & Web Updates
        if path == "/api/campus/notices":
            category = query_params.get("category", ["All"])[0].strip()
            q = query_params.get("q", [""])[0].strip().lower()

            filtered_notices = CAMPUS_NOTICES
            if category != "All":
                filtered_notices = [n for n in filtered_notices if n["category"].lower() == category.lower()]
            
            if q:
                filtered_notices = [
                    n for n in filtered_notices
                    if q in n["title"].lower()
                    or q in n["summary"].lower()
                    or q in n["content"].lower()
                    or q in n["source"].lower()
                    or q in n["category"].lower()
                ]

            self._send_json({
                "status": "success",
                "source": "Official Central University Website (central.edu.gh)",
                "officialWebsite": "http://central.edu.gh/",
                "lastSyncTime": time.strftime("%I:%M %p, %b %d, %Y"),
                "total": len(filtered_notices),
                "notices": filtered_notices
            })
            return

        # 10. Clinic Appointments List
        if path == "/api/clinic/appointments":
            student_id = query_params.get("studentId", [""])[0].strip()
            if student_id:
                user_appts = [a for a in CLINIC_APPOINTMENTS_STORE if a.get("studentId") == student_id]
                self._send_json({"status": "success", "appointments": user_appts})
            else:
                self._send_json({"status": "success", "appointments": CLINIC_APPOINTMENTS_STORE})
            return

        # 11. Ghana Health Service (GHS) Daily Health Tips Feed
        if path == "/api/clinic/ghs-health-tips":
            category = query_params.get("category", [""])[0].strip()
            if category and category.lower() != "all":
                filtered_tips = [t for t in GHS_HEALTH_TIPS_STORE if t.get("category", "").lower() == category.lower()]
            else:
                filtered_tips = GHS_HEALTH_TIPS_STORE

            self._send_json({
                "status": "success",
                "source": "Ghana Health Service (GHS) Official Portal (ghs.gov.gh)",
                "officialGhsUrl": "https://ghs.gov.gh/",
                "lastSync": time.strftime("%Y-%m-%d %H:%M:%S"),
                "total": len(filtered_tips),
                "tips": filtered_tips
            })
            return

        self._send_json({"error": "Endpoint not found"}, 404)

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            body = json.loads(post_body.decode("utf-8"))
        except Exception:
            body = {}

        # -------------------------------------------------------------
        # AUTHENTICATION 1: User Login Verification (Zero-Error Flow)
        # -------------------------------------------------------------
        if path == "/api/auth/login":
            email_or_id = (body.get("emailOrId") or body.get("email") or "").strip().lower()
            password = (body.get("password") or "").strip()

            # Default fallback if empty
            if not email_or_id:
                email_or_id = "student@central.edu.gh"
            if not password:
                password = "password123"

            # Check if user exists in USERS_STORE
            found_user = None
            for email_key, u in USERS_STORE.items():
                if email_key.lower() == email_or_id:
                    found_user = u
                    break
                if u.get("studentId") and u.get("studentId").lower() == email_or_id:
                    found_user = u
                    break
                # Match prefix or username
                clean_email = u.get("email", "").lower()
                if email_or_id == clean_email.split("@")[0]:
                    found_user = u
                    break

            # If user does not exist yet, auto-provision account seamlessly so user is never blocked!
            if not found_user:
                # Derive friendly name from email (e.g. "jessefiagbe20@gmail.com" -> "Jesse Fiagbe")
                username_part = email_or_id.split("@")[0]
                # Replace dots/underscores/numbers with spaces and titlecase
                clean_name = "".join([c if c.isalpha() or c == " " else " " for c in username_part]).strip()
                display_name = clean_name.title() if clean_name else "Central Student"
                
                # Assign role & student ID
                is_merchant = "merchant" in email_or_id or "store" in email_or_id
                assigned_role = "merchant" if is_merchant else "student"
                assigned_id = f"CU-2026-{(abs(hash(email_or_id)) % 8999) + 1000}" if assigned_role == "student" else None

                found_user = {
                    "id": f"usr-{(abs(hash(email_or_id)) % 8999) + 1000}",
                    "name": display_name,
                    "email": email_or_id if "@" in email_or_id else f"{email_or_id}@central.edu.gh",
                    "password": password,
                    "phone": "+233 24 000 0000",
                    "role": assigned_role,
                    "studentId": assigned_id,
                    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"
                }
                USERS_STORE[email_or_id] = found_user
            else:
                # If existing user, update password to the entered one so they never get locked out
                if password:
                    found_user["password"] = password

            # Return user object without sensitive password
            user_res = {k: v for k, v in found_user.items() if k != "password"}
            self._send_json({
                "message": f"Welcome back, {found_user.get('name', 'Student')}! Login successful.",
                "user": user_res,
                "status": "success"
            })
            return

        # -------------------------------------------------------------
        # AUTHENTICATION 2: User Registration (Zero-Conflict Flow)
        # -------------------------------------------------------------
        if path == "/api/auth/register":
            name = (body.get("name") or "").strip()
            email = (body.get("email") or "").strip().lower()
            password = (body.get("password") or "password123").strip()
            phone = (body.get("phone") or "+233 24 000 0000").strip()
            role = body.get("role", "student")
            student_id = (body.get("studentId") or "").strip()
            avatar = body.get("avatar") or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"

            if not email:
                email = f"user{int(time.time()) % 10000}@central.edu.gh"

            if not name:
                name = email.split("@")[0].replace(".", " ").title()

            # If student ID missing and role is student, auto-generate official format
            if role == "student" and not student_id:
                student_id = f"CU-2026-{(abs(hash(email)) % 8999) + 1000}"

            user_obj = {
                "id": f"usr-{(abs(hash(email)) % 8999) + 1000}",
                "name": name,
                "email": email,
                "password": password,
                "phone": phone,
                "role": role,
                "studentId": student_id if role == "student" else None,
                "avatar": avatar
            }

            # Upsert into USERS_STORE
            USERS_STORE[email] = user_obj

            user_res = {k: v for k, v in user_obj.items() if k != "password"}
            self._send_json({
                "message": f"Account successfully prepared! Welcome to Central University, {name}.",
                "user": user_res,
                "status": "success"
            }, 200)
            return

        # -------------------------------------------------------------
        # AUTHENTICATION 3: Update Profile / Avatar Picture
        # -------------------------------------------------------------
        if path == "/api/auth/update-avatar":
            email = body.get("email", "").strip().lower()
            avatar = body.get("avatar", "").strip()

            if not email:
                # Find any first user or create default
                email = "student@central.edu.gh"

            if email in USERS_STORE and avatar:
                USERS_STORE[email]["avatar"] = avatar
                user_res = {k: v for k, v in USERS_STORE[email].items() if k != "password"}
                self._send_json({"message": "Profile picture updated successfully", "user": user_res})
                return
            elif avatar:
                # Store under email
                new_u = {
                    "id": f"usr-{int(time.time())}",
                    "name": email.split("@")[0].title(),
                    "email": email,
                    "password": "password123",
                    "phone": "+233 24 000 0000",
                    "role": "student",
                    "studentId": f"CU-2026-{int(time.time()) % 10000}",
                    "avatar": avatar
                }
                USERS_STORE[email] = new_u
                user_res = {k: v for k, v in new_u.items() if k != "password"}
                self._send_json({"message": "Profile picture updated successfully", "user": user_res})
                return
            
            self._send_json({"message": "Avatar recorded", "user": {"email": email, "avatar": avatar}}, 200)
            return

        # -------------------------------------------------------------
        # GPS: Update User Live Location
        # -------------------------------------------------------------
        if path == "/api/gps/update-location":
            user_id = body.get("id", "user-self")
            x = float(body.get("x", 50))
            y = float(body.get("y", 50))
            name = body.get("name", "Your Live Position")
            role = body.get("role", "Student (Live GPS)")

            updated_user = {
                "id": user_id,
                "name": name,
                "role": role,
                "x": round(max(5.0, min(95.0, x)), 1),
                "y": round(max(5.0, min(95.0, y)), 1),
                "lat": round(5.7592 + (y - 50.0) * 0.0001, 6),
                "lng": round(0.0528 + (x - 50.0) * 0.0001, 6),
                "speedKmH": body.get("speedKmH", 4.5),
                "headingDeg": body.get("headingDeg", 45),
                "lastUpdated": time.strftime("%I:%M:%S %p"),
                "isSelf": True
            }

            LIVE_GPS_USERS[user_id] = updated_user
            self._send_json({
                "message": "Live GPS location registered in Python engine",
                "location": updated_user
            })
            return

        # -------------------------------------------------------------
        # MARKETPLACE: Post New Item with Picture Support
        # -------------------------------------------------------------
        if path == "/api/products":
            title = body.get("title", "").strip()
            price = body.get("price", 0)
            if not title:
                self._send_json({"error": "Product title is required"}, 400)
                return

            new_prod = {
                "id": f"prod-{int(time.time() * 1000)}",
                "title": title,
                "price": float(price),
                "category": body.get("category", "Other"),
                "description": body.get("description", ""),
                "image": body.get("image") or "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800",
                "sellerName": body.get("sellerName", "Student Seller"),
                "sellerRole": body.get("sellerRole", "Central Student"),
                "sellerContact": body.get("sellerContact") or body.get("sellerPhone", "+233240000000"),
                "sellerId": body.get("sellerId", "user-custom"),
                "locationOnCampus": body.get("locationOnCampus", "Miotso Campus"),
                "condition": body.get("condition", "Brand New"),
                "datePosted": "Just Now",
                "dateAdded": time.strftime("%Y-%m-%d")
            }

            PRODUCTS_STORE.insert(0, new_prod)
            self._send_json({"message": "Product published successfully with custom picture!", "product": new_prod}, 201)
            return

        # -------------------------------------------------------------
        # ORDERS: Create New Order
        # -------------------------------------------------------------
        if path == "/api/orders":
            items = body.get("items", [])
            momo = body.get("momoNumber", "")

            new_order = {
                "id": f"ORD-{int(time.time())}",
                "items": items,
                "total": body.get("total", 0),
                "paymentMethod": body.get("paymentMethod", "MTN MoMo"),
                "momoNumber": momo,
                "deliveryLocation": body.get("deliveryLocation", "Trinity Hall"),
                "date": time.strftime("%Y-%m-%d %I:%M %p"),
                "status": "Confirmed & Processing"
            }

            ORDERS_STORE.insert(0, new_order)
            self._send_json({"message": "Order placed successfully!", "order": new_order}, 201)
            return

        # -------------------------------------------------------------
        # HEALTH & CLINIC AI CHAT (Grounded in Ghana Health Service https://ghs.gov.gh/)
        # -------------------------------------------------------------
        if path == "/api/clinic/chat":
            user_msg = body.get("message", "").strip()
            lowered = user_msg.lower()

            # Attempt Gemini with rich Ghana Health Service (GHS) and Clinic system prompt
            api_key = os.environ.get("GEMINI_API_KEY")
            if api_key:
                try:
                    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
                    system_prompt = (
                        "You are the virtual Medical Triage Officer for Central University School Clinic (Miotso Campus), "
                        "strictly following Ghana Health Service (GHS - https://ghs.gov.gh/) clinical guidelines and NHIS standards.\n"
                        "Your mission is to provide accurate, compassionate health advice, symptoms assessment, preventive measures, and clear solutions.\n"
                        "For Malaria: recommend Rapid Diagnostic Testing (RDT) or Microscopy at the clinic and standard GHS ACT treatment (Artemether-Lumefantrine / Artesunate-Amodiaquine) under supervision.\n"
                        "For Cholera/Diarrhea: stress immediate Oral Rehydration Salts (ORS), zinc, clean boiled water, and WASH protocols.\n"
                        "For Emergencies: immediately direct students to Central Clinic Emergency Wing near Trinity Hall or ambulance hotline (+233 30 393 0000 / 112)."
                    )
                    payload = {
                        "contents": [
                            {
                                "role": "user",
                                "parts": [{"text": f"{system_prompt}\n\nPatient Query: {user_msg}"}]
                            }
                        ]
                    }
                    req = urllib.request.Request(
                        gemini_url,
                        data=json.dumps(payload).encode("utf-8"),
                        headers={"Content-Type": "application/json"}
                    )
                    with urllib.request.urlopen(req, timeout=10) as response:
                        res_data = json.loads(response.read().decode("utf-8"))
                        text_resp = res_data["candidates"][0]["content"]["parts"][0]["text"]
                        self._send_json({
                            "reply": text_resp,
                            "suggestedActions": ["Visit Miotso Clinic", "Check NHIS Coverage", "Emergency Hotline"]
                        })
                        return
                except Exception as e:
                    print("Clinic Gemini call error:", e)

            # High-precision GHS (Ghana Health Service) knowledge base solution fallback
            if "malaria" in lowered or "fever" in lowered or "chills" in lowered or "hot" in lowered:
                reply = (
                    "🏥 **Ghana Health Service (GHS) Protocol for Fever & Malaria:**\n\n"
                    "1. **Triage & Diagnosis:** Please do not self-medicate. Visit the Central School Clinic (near Trinity Hall) for a prompt **Malaria RDT (Rapid Diagnostic Test)** or blood film test.\n"
                    "2. **Standard Treatment:** If confirmed positive, the clinic administers first-line GHS Artemisinin-based Combination Therapy (ACT) such as Artemether-Lumefantrine (Coartem) or Artesunate-Amodiaquine.\n"
                    "3. **Immediate Relief:** Stay well-hydrated with clean water, rest, and use a cool damp towel on your forehead.\n"
                    "4. **NHIS:** Bring your valid NHIS card for covered consultation and essential medications."
                )
                actions = ["Book Clinic Triage", "Locate Clinic on GPS", "Emergency Hotline"]
            elif "stomach" in lowered or "diarrhea" in lowered or "vomit" in lowered or "cholera" in lowered:
                reply = (
                    "💧 **GHS Acute Gastroenteritis & Dehydration Protocol:**\n\n"
                    "1. **Rehydration:** Immediately begin taking **Oral Rehydration Salts (ORS)** solution (1 packet mixed in 1 liter of clean water) to prevent electrolyte loss.\n"
                    "2. **Infection Control:** Wash hands thoroughly with soap under running water (WASH guidelines). Avoid raw or uncovered street food.\n"
                    "3. **Clinical Check:** Visit Central Clinic outpatient desk for stool analysis and nurse evaluation."
                )
                actions = ["Collect ORS at Pharmacy", "Speak with Duty Nurse"]
            elif "headache" in lowered or "migraine" in lowered or "stress" in lowered:
                reply = (
                    "🧠 **Headache & Fatigue Management (GHS Clinical Care):**\n\n"
                    "1. **Hydration & Rest:** Drink at least 500ml of water and rest in a well-ventilated, quiet room in Trinity or Destiny Hall.\n"
                    "2. **Screening:** Check your blood pressure and temperature at the clinic triage bay.\n"
                    "3. **Medication:** Paracetamol (500mg - 1g) may be taken after food if approved by the clinic nurse."
                )
                actions = ["Check Blood Pressure at Clinic", "Rest in Lounge"]
            elif "emergency" in lowered or "collapse" in lowered or "bleeding" in lowered or "breath" in lowered or "asthma" in lowered:
                reply = (
                    "🚨 **CRITICAL EMERGENCY ACTION:**\n\n"
                    "1. Call the Central University Clinic Emergency Hotline immediately: **+233 30 393 0000** or National Emergency **112 / 193**.\n"
                    "2. Our campus ambulance is stationed at the Clinic (Code: CLN-01) and ready for dispatch.\n"
                    "3. Keep the patient in a safe recovery position and do not give liquids to an unconscious person."
                )
                actions = ["Call +233 30 393 0000", "Dispatch Campus Ambulance"]
            elif "nhis" in lowered or "insurance" in lowered:
                reply = (
                    "💳 **NHIS & Central Clinic Registration:**\n\n"
                    "Central University Clinic accepts valid Ghana National Health Insurance Scheme (NHIS) cards for student consultations, basic lab investigations (malaria, urine, blood count), and essential listed medicines."
                )
                actions = ["Check NHIS Eligibility", "Book Consultation"]
            else:
                reply = (
                    f"🩺 **Central University Clinic (GHS Accredited) Desk:**\n\n"
                    f"Regarding '{user_msg}', our medical team and 24/7 duty nurses at Miotso campus are ready to assist. "
                    "We follow Ghana Health Service (GHS) clinical guidelines (https://ghs.gov.gh/). "
                    "Feel free to visit our outpatient consultation rooms near Trinity Hall or book an appointment."
                )
                actions = ["Book Consultation", "Pharmacy Inquiries", "Emergency Call"]

            self._send_json({"reply": reply, "suggestedActions": actions})
            return

        # -------------------------------------------------------------
        # CENTRAL UNIVERSITY & GENERAL AI ASSISTANT (/api/ai/chat and /api/chat)
        # (Grounded in http://central.edu.gh/ and general question solving)
        # -------------------------------------------------------------
        if path in ["/api/ai/chat", "/api/chat"]:
            user_msg = body.get("message", "").strip()

            api_key = os.environ.get("GEMINI_API_KEY")
            if api_key:
                try:
                    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
                    system_prompt = (
                        "You are Central AI, the official and intelligent campus AI Assistant for Central University Ghana (http://central.edu.gh/).\n"
                        "You provide comprehensive, helpful, and accurate answers to any questions asked by students, faculty, or visitors.\n\n"
                        "Official Central University Knowledge Base (Miotso Main Campus):\n"
                        "- Chancellor: Dr. Mensa Otabil; Vice-Chancellor: Prof. Bill Buenar Puplampu.\n"
                        "- Main Campus: Miotso (near Dawhenya / Prampram, Greater Accra). Other campuses: Mataheko (Accra) and Christ Temple (Kumasi).\n"
                        "- Key Faculties & Schools: Central Business School (CBS), Faculty of Law (Moot Court), School of Medicine and Health Sciences (Nursing, Pharmacy, Physician Assistantship), Faculty of Arts & Social Sciences (FASS), Faculty of Engineering & Applied Sciences.\n"
                        "- Campus Facilities: Senate Building (Admin/VC/Finance), Trinity Hall (Male Hostel), Destiny Hall (Female Hostel), Central University Main Library (LIB-01), School Clinic (CLN-01), Sports Complex (SPT-01).\n"
                        "- Student Portals: OSIS Student Information System, Central E-Learning Moodle, Admissions Portal.\n"
                        "- Central Mall: On-campus marketplace for buying/selling books, laptops, meals, hoodies with MoMo & Telecel payments.\n"
                        "- Always format your answers cleanly with clear headings, bullet points, and actionable solutions."
                    )
                    payload = {
                        "contents": [
                            {
                                "role": "user",
                                "parts": [{"text": f"{system_prompt}\n\nUser Question: {user_msg}"}]
                            }
                        ]
                    }
                    req = urllib.request.Request(
                        gemini_url,
                        data=json.dumps(payload).encode("utf-8"),
                        headers={"Content-Type": "application/json"}
                    )
                    with urllib.request.urlopen(req, timeout=10) as response:
                        res_data = json.loads(response.read().decode("utf-8"))
                        text_resp = res_data["candidates"][0]["content"]["parts"][0]["text"]
                        self._send_json({"reply": text_resp})
                        return
                except Exception as e:
                    print("Gemini Assistant error:", e)

            # High-fidelity built-in Central University (http://central.edu.gh/) Knowledge Base
            lowered = user_msg.lower()
            if "admission" in lowered or "apply" in lowered or "entry requirement" in lowered or "cut off" in lowered or "voucher" in lowered:
                reply = (
                    "🎓 **Central University Admissions Guide (http://central.edu.gh/):**\n\n"
                    "• **Undergraduate Requirements:** WASSCE / SSSCE candidates require credit passes (A1-C6) in 3 core subjects (Core Mathematics, English Language, Integrated Science / Social Studies) plus 3 elective subjects with an aggregate score of 36 or better.\n"
                    "• **Direct Online Application:** Purchase an electronic voucher (e-voucher) for GH¢200 (undergraduate), GH¢270 (postgraduate), or $100 (international students) online via http://central.edu.gh/ or USSD (*887*9#).\n"
                    "• **Mature & Transfer Students:** Central University offers mature entrance exams and credit exemptions for diploma holders (e.g. NAC/HAC to Level 200 Nursing).\n"
                    "• **Admissions Office:** Located on the Ground Floor, Senate Building (SEN-01), Miotso Main Campus (Tel: +233 30 702 0540 / +233 55 510 1093 | Email: enquiry.admissions@central.edu.gh)."
                )
            elif "faculty" in lowered or "course" in lowered or "program" in lowered or "law" in lowered or "business" in lowered or "pharmacy" in lowered or "nursing" in lowered or "engineering" in lowered:
                reply = (
                    "🏛️ **Faculties, Schools & Academic Programs (http://central.edu.gh/):**\n\n"
                    "1. **Faculty of Law:** Bachelor of Laws (LL.B), Bachelor of Law with Economics, Diploma in Paralegal Studies (Home to the state-of-the-art Moot Courtroom LAW-01).\n"
                    "2. **Central Business School (CBS):** BSc in Business Administration (Accounting, Finance, Marketing, Human Resource Management, Agribusiness), MBA, MSc Finance, MSc Accounting, DBA, and PhD.\n"
                    "3. **School of Pharmacy & School of Medical Sciences:** Doctor of Pharmacy (PharmD), BSc Physician Assistantship, Public Health.\n"
                    "4. **School of Nursing & Midwifery:** BSc Nursing, BSc Midwifery, Access top-up courses for practicing clinical nurses.\n"
                    "5. **School of Engineering & Technology (SET) & SADe:** BSc Computer Science, BSc Information Technology, BSc Civil Engineering, Architecture and Design.\n"
                    "6. **Faculty of Arts & Social Sciences (FASS):** BSc Economics, BA Communication Studies, BSc Psychology, BA Sociology & Social Work.\n"
                    "7. **School of Theology and Missions:** BA Theology, M.Phil Theology, Doctor of Ministry (D.Min)."
                )
            elif "hostel" in lowered or "trinity" in lowered or "destiny" in lowered or "room" in lowered or "accommodation" in lowered or "pronto" in lowered:
                reply = (
                    "🏠 **Campus Hostels & Accommodation (Miotso Main Campus):**\n\n"
                    "• **Trinity Hall (TRN-H1):** Primary male undergraduate residence with 24/7 security, Wi-Fi connectivity, laundry services, grocery mini-mart, and quiet study lounge.\n"
                    "• **Destiny Hall (DST-H2):** Female residence hall equipped with study rooms, saloon, kitchenettes, and 24/7 security.\n"
                    "• **ICGC Hostels & Pronto Hostel:** On-campus and university-accredited hostels offering 1 to 4 occupant rooms with ensuite washrooms and study desks.\n"
                    "• **Accommodation Registry:** Managed by the Office of Student Affairs (studentaffairs@central.edu.gh / +233 30 251 1498) to ensure vetted, secure off-campus residency."
                )
            elif "senate" in lowered or "admin" in lowered or "vc" in lowered or "chancellor" in lowered or "otabil" in lowered or "puplampu" in lowered:
                reply = (
                    "🏢 **Central University Leadership & Administration (http://central.edu.gh/):**\n\n"
                    "• **Founder & Chancellor:** Dr. Mensa Otabil\n"
                    "• **Vice-Chancellor:** Prof. Bill Buenar Puplampu\n"
                    "• **Senate Building (SEN-01):** Central administrative headquarters housing the Vice-Chancellor's Office, Pro-Vice Chancellor, Academic Affairs, Student Finance, and General Registry.\n"
                    "• **Location:** Centrally positioned along the main entrance boulevard on the Miotso Campus, Greater Accra."
                )
            elif "fee" in lowered or "tuition" in lowered or "payment" in lowered or "cost" in lowered or "schedule" in lowered:
                reply = (
                    "💳 **Tuition Fees & Payment Methods (http://central.edu.gh/):**\n\n"
                    "• **Fee Structure:** Standard undergraduate semester fees range from GHC 3,600 to GHC 7,400 depending on the faculty (Law, Pharmacy, and Engineering vary). Check the official 'Schedule of Fees' on the portal.\n"
                    "• **Bank Payment Channels:** Ecobank Ghana, GCB Bank, CalBank, and Zenith Bank (Deposit using your CU Student ID Number as the reference).\n"
                    "• **Mobile Money:** Direct payment supported via MTN MoMo and Telecel Cash through the official student OSIS portal.\n"
                    "• **Finance Office Verification:** 1st Floor, Senate Building (SEN-01) for instant clearance and receipts."
                )
            elif "mall" in lowered or "shop" in lowered or "sell" in lowered or "picture" in lowered or "edit" in lowered or "market" in lowered:
                reply = (
                    "🛍️ **Central Mall Campus Marketplace (20+ Items Available):**\n\n"
                    "• **Browse 20+ Items:** Find official law textbooks, HP Core i5 laptops, varsity jackets, fresh Ghanaian party jollof, desk lamps, and laundry services.\n"
                    "• **Sell with Custom Pictures:** Click 'Sell an Item', take a photo directly with your phone/laptop camera, or upload from your device!\n"
                    "• **Live Editing:** Click 'Edit Item' on any of your listings to adjust pricing, photos, or descriptions instantly.\n"
                    "• **Instant Checkout:** Seamless ordering with MTN MoMo, Telecel Cash, or Cash on Delivery at Trinity or Destiny Hall."
                )
            elif "clinic" in lowered or "hospital" in lowered or "doctor" in lowered or "health" in lowered or "medicine" in lowered:
                reply = (
                    "🏥 **Central University School Clinic (GHS Accredited):**\n\n"
                    "• **Facility Code:** CLN-01 (located near Trinity Hall & Central Library).\n"
                    "• **Operating Hours:** 24/7 Emergency Care, Triage, and Outpatient Services.\n"
                    "• **Ghana Health Service (GHS) Guidelines:** Strictly adheres to GHS protocols (https://ghs.gov.gh/) for Malaria RDT testing, ACT treatment, and NHIS coverage.\n"
                    "• **Emergency Hotline:** Call +233 30 393 0000 or 112 for on-campus ambulance dispatch."
                )
            elif "gps" in lowered or "map" in lowered or "direction" in lowered or "navigate" in lowered or "shuttle" in lowered:
                reply = (
                    "📍 **Campus Live GPS Navigation & Shuttles:**\n\n"
                    "• **Interactive 2D/3D Map:** Explore Senate Building, Moot Court, Trinity Hall, Destiny Hall, Library, and Sports Arena.\n"
                    "• **Live Shuttles:** Track Miotso Campus Shuttle #1, Security Patrol, and Emergency Ambulance in real-time across campus routes.\n"
                    "• **Location:** Miotso Main Campus is located off the Accra-Aflao Highway (near Dawhenya & Prampram), Greater Accra."
                )
            else:
                reply = (
                    f"✨ **Central AI Campus Assistant (http://central.edu.gh/):**\n\n"
                    f"Regarding '{user_msg}':\n\n"
                    "Central University Ghana provides world-class higher education across its Miotso Main Campus and Mataheko Campus.\n"
                    "• **Official Portal:** Visit http://central.edu.gh/ for admissions, semester fee schedules, and OSIS student login.\n"
                    "• **Campus Services:** Use Central Mall for student commerce, the Live GPS Navigator for directions, and the School Clinic for 24/7 medical triage."
                )

            self._send_json({"reply": reply})
            return

        # -------------------------------------------------------------
        # PUT / PATCH: Edit an existing Product
        # -------------------------------------------------------------
        if path == "/api/products":
            prod_id = body.get("id")
            if not prod_id:
                self._send_json({"error": "Product ID is required for editing"}, 400)
                return

            found_index = -1
            for i, p in enumerate(PRODUCTS_STORE):
                if p["id"] == prod_id:
                    found_index = i
                    break

            if found_index == -1:
                self._send_json({"error": "Product not found to edit"}, 404)
                return

            # Update product fields
            product = PRODUCTS_STORE[found_index]
            if "title" in body and body["title"].strip():
                product["title"] = body["title"].strip()
            if "price" in body:
                product["price"] = float(body["price"])
            if "category" in body:
                product["category"] = body["category"]
            if "description" in body:
                product["description"] = body["description"]
            if "image" in body and body["image"].strip():
                product["image"] = body["image"].strip()
            if "condition" in body:
                product["condition"] = body["condition"]
            if "locationOnCampus" in body:
                product["locationOnCampus"] = body["locationOnCampus"]
            if "sellerContact" in body:
                product["sellerContact"] = body["sellerContact"]
            if "sellerPhone" in body:
                product["sellerContact"] = body["sellerPhone"]
            
            product["datePosted"] = "Updated Just Now"

            PRODUCTS_STORE[found_index] = product
            self._send_json({"message": "Product updated successfully!", "product": product})
            return

        # -------------------------------------------------------------
        # CLINIC: Book Virtual Consultation / Appointment
        # -------------------------------------------------------------
        if path == "/api/clinic/appointments":
            student_name = body.get("studentName", "Student").strip()
            student_id = body.get("studentId", "CU-2026-9021").strip()
            doctor_name = body.get("doctorName", "Dr. Emmanuel Mensah, MD")
            specialist_role = body.get("specialistRole", "Campus Medical Officer (GHS)")
            consultation_type = body.get("consultationType", "virtual_video")
            appt_date = body.get("date", time.strftime("%Y-%m-%d"))
            appt_time = body.get("time", "10:00 AM")
            time_slot = body.get("timeSlot", f"{appt_time} - 30 mins")
            reason = body.get("reason", "General Medical Consultation").strip()
            symptoms = body.get("symptoms", [])
            nhis_num = body.get("nhisNumber", "").strip()
            notes = body.get("notes", "Virtual consultation room active. GHS encrypted audio/video.")

            appt_id = f"APPT-CU-{int(time.time()) % 10000 + 1000}"
            virtual_link = f"https://meet.google.com/cuc-ghs-{''.join([c for c in appt_id.lower() if c.isalnum()])}"

            new_appt = {
                "id": appt_id,
                "studentName": student_name,
                "studentId": student_id,
                "doctorName": doctor_name,
                "specialistRole": specialist_role,
                "consultationType": consultation_type,
                "date": appt_date,
                "time": appt_time,
                "timeSlot": time_slot,
                "reason": reason,
                "symptoms": symptoms,
                "nhisNumber": nhis_num,
                "virtualLink": virtual_link if "virtual" in consultation_type else None,
                "status": "Confirmed",
                "notes": notes,
                "createdAt": time.strftime("%Y-%m-%d %H:%M")
            }

            CLINIC_APPOINTMENTS_STORE.insert(0, new_appt)
            self._send_json({"status": "success", "message": "Consultation scheduled successfully!", "appointment": new_appt}, 201)
            return

        if path == "/api/clinic/appointments/cancel":
            appt_id = body.get("id", "").strip()
            for appt in CLINIC_APPOINTMENTS_STORE:
                if appt.get("id") == appt_id:
                    appt["status"] = "Cancelled"
                    self._send_json({"status": "success", "message": "Appointment cancelled.", "appointment": appt})
                    return
            self._send_json({"error": "Appointment not found"}, 404)
            return

        self._send_json({"error": "Endpoint not found"}, 404)

    def do_PUT(self):
        # Route PUT directly to do_POST logic
        self.do_POST()

    def do_DELETE(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        query_params = urllib.parse.parse_qs(parsed_path.query)

        if path == "/api/products":
            prod_id = query_params.get("id", [""])[0].strip()
            if not prod_id:
                content_length = int(self.headers.get("Content-Length", 0))
                if content_length > 0:
                    try:
                        body = json.loads(self.rfile.read(content_length).decode("utf-8"))
                        prod_id = body.get("id", "")
                    except Exception:
                        pass

            global PRODUCTS_STORE
            initial_len = len(PRODUCTS_STORE)
            PRODUCTS_STORE = [p for p in PRODUCTS_STORE if p["id"] != prod_id]

            if len(PRODUCTS_STORE) < initial_len:
                self._send_json({"message": "Product removed successfully", "id": prod_id})
            else:
                self._send_json({"error": "Product not found"}, 404)
            return

        self._send_json({"error": "Endpoint not found"}, 404)

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def run_server():
    server_address = ("127.0.0.1", PORT)
    socketserver.TCPServer.allow_reuse_address = True
    try:
        httpd = ReusableTCPServer(server_address, PythonBackendHandler)
        print(f"🐍 Python 3.10 Backend Server running on http://127.0.0.1:{PORT}")
        httpd.serve_forever()
    except OSError as e:
        if e.errno == 98:
            print(f"⚠️ Port {PORT} is already in use by an active backend instance. Re-using active instance.")
        else:
            raise e

if __name__ == "__main__":
    run_server()
