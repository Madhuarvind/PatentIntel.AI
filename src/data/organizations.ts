export interface Organization {
  id: string;
  officialName: string;
  shortName: string | null;
  keywords: string[];
  city: string;
  state: string;
  type: 'College' | 'University' | 'Research Institute' | 'MNC / Tech Firm' | 'Government Agency';
  source: 'predefined' | 'user_added';
  usageCount: number;
  createdAt?: string;
  isVerified?: boolean;
}

export const INITIAL_ORGANIZATIONS: Organization[] = [
  // --- TAMIL NADU COLLEGES & UNIVERSITIES ---
  {
    id: "mkce",
    officialName: "M. Kumarasamy College of Engineering",
    shortName: "MKCE",
    keywords: ["m kumarasamy", "kumarasamy", "mkce", "m.kumarasamy", "mkce karur", "thalavapalayam"],
    city: "Karur",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 120
  },
  {
    id: "cit_cbe",
    officialName: "Coimbatore Institute of Technology",
    shortName: "CIT",
    keywords: ["coimbatore institute of technology", "cit", "cit coimbatore", "cit cbe"],
    city: "Coimbatore",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 95
  },
  {
    id: "psg_tech",
    officialName: "PSG College of Technology",
    shortName: "PSG Tech",
    keywords: ["psg", "psg college of technology", "psg tech", "psg coimbatore", "psgtech"],
    city: "Coimbatore",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 110
  },
  {
    id: "anna_univ",
    officialName: "Anna University",
    shortName: "AU",
    keywords: ["anna university", "anna univ", "au chennai", "ceg", "mit chromepet", "actech"],
    city: "Chennai",
    state: "Tamil Nadu",
    type: "University",
    source: "predefined",
    usageCount: 150
  },
  {
    id: "tce_madurai",
    officialName: "Thiagarajar College of Engineering",
    shortName: "TCE",
    keywords: ["thiagarajar", "thiagarajar college of engineering", "tce", "tce madurai", "thiagarajar madurai"],
    city: "Madurai",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 88
  },
  {
    id: "sastra",
    officialName: "SASTRA Deemed University",
    shortName: "SASTRA",
    keywords: ["sastra", "sastra university", "sastra deemed university", "sastra tanjore", "sastra thanjavur"],
    city: "Thanjavur",
    state: "Tamil Nadu",
    type: "University",
    source: "predefined",
    usageCount: 82
  },
  {
    id: "srm_ist",
    officialName: "SRM Institute of Science and Technology",
    shortName: "SRM",
    keywords: ["srm", "srm university", "srmist", "srm kattankulathur", "srm chennai"],
    city: "Chennai",
    state: "Tamil Nadu",
    type: "University",
    source: "predefined",
    usageCount: 90
  },
  {
    id: "vit_vellore",
    officialName: "Vellore Institute of Technology",
    shortName: "VIT",
    keywords: ["vit", "vit vellore", "vellore institute of technology", "vit chennai", "vit university"],
    city: "Vellore",
    state: "Tamil Nadu",
    type: "University",
    source: "predefined",
    usageCount: 105
  },
  {
    id: "amrita_univ",
    officialName: "Amrita Vishwa Vidyapeetham",
    shortName: "Amrita",
    keywords: ["amrita", "amrita university", "amrita coimbatore", "amrita vishwa vidyapeetham", "avv"],
    city: "Coimbatore",
    state: "Tamil Nadu",
    type: "University",
    source: "predefined",
    usageCount: 78
  },
  {
    id: "ssn_ce",
    officialName: "SSN College of Engineering",
    shortName: "SSN",
    keywords: ["ssn", "ssn college of engineering", "ssn chennai", "siv Subramaniya nadar", "ssn kalavakkam"],
    city: "Chennai",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 85
  },
  {
    id: "kumaraguru",
    officialName: "Kumaraguru College of Technology",
    shortName: "KCT",
    keywords: ["kumaraguru", "kct", "kumaraguru college of technology", "kct coimbatore"],
    city: "Coimbatore",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 76
  },
  {
    id: "srec_cbe",
    officialName: "Sri Ramakrishna Engineering College",
    shortName: "SREC",
    keywords: ["srec", "sri ramakrishna engineering college", "srec coimbatore", "ramakrishna"],
    city: "Coimbatore",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 65
  },
  {
    id: "kongu_eng",
    officialName: "Kongu Engineering College",
    shortName: "KEC",
    keywords: ["kongu", "kec", "kongu engineering college", "kongu erode", "perundurai"],
    city: "Erode",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 70
  },
  {
    id: "bits_sathy",
    officialName: "Bannari Amman Institute of Technology",
    shortName: "BIT",
    keywords: ["bannari amman", "bit sathy", "bannari amman institute of technology", "bitsathy"],
    city: "Sathyamangalam",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 68
  },
  {
    id: "nec_kovilpatti",
    officialName: "National Engineering College",
    shortName: "NEC",
    keywords: ["national engineering college", "nec", "nec kovilpatti", "nec tuticorin"],
    city: "Kovilpatti",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 54
  },
  {
    id: "mepco_schlenk",
    officialName: "Mepco Schlenk Engineering College",
    shortName: "MSEC",
    keywords: ["mepco", "mepco schlenk", "mepco sivakasi", "msec"],
    city: "Sivakasi",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 60
  },
  {
    id: "gct_cbe",
    officialName: "Government College of Technology",
    shortName: "GCT",
    keywords: ["gct", "government college of technology", "gct coimbatore", "gct cbe"],
    city: "Coimbatore",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 72
  },
  {
    id: "accet_karaikudi",
    officialName: "Alagappa Chettiar Government College of Engineering and Technology",
    shortName: "ACCET",
    keywords: ["accet", "alagappa chettiar", "accet karaikudi", "alagappa karaikudi"],
    city: "Karaikudi",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 48
  },
  {
    id: "rit_chennai",
    officialName: "Rajalakshmi Engineering College",
    shortName: "REC",
    keywords: ["rajalakshmi", "rec chennai", "rajalakshmi engineering college", "rec thandalam"],
    city: "Chennai",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 62
  },
  {
    id: "st_joseph_chennai",
    officialName: "St. Joseph's College of Engineering",
    shortName: "SJCE",
    keywords: ["st joseph", "st josephs college of engineering", "st joseph chennai"],
    city: "Chennai",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 58
  },
  {
    id: "karunya_univ",
    officialName: "Karunya Institute of Technology and Sciences",
    shortName: "KITS",
    keywords: ["karunya", "karunya university", "kits coimbatore", "karunya institute"],
    city: "Coimbatore",
    state: "Tamil Nadu",
    type: "University",
    source: "predefined",
    usageCount: 52
  },
  {
    id: "kalasalingam_univ",
    officialName: "Kalasalingam Academy of Research and Education",
    shortName: "KARE",
    keywords: ["kalasalingam", "kare", "kalasalingam university", "kare krishnankoil"],
    city: "Krishnankoil",
    state: "Tamil Nadu",
    type: "University",
    source: "predefined",
    usageCount: 50
  },
  {
    id: "bharathiar_univ",
    officialName: "Bharathiar University",
    shortName: "BU",
    keywords: ["bharathiar", "bharathiar university", "bu coimbatore"],
    city: "Coimbatore",
    state: "Tamil Nadu",
    type: "University",
    source: "predefined",
    usageCount: 45
  },
  {
    id: "madurai_kamaraj",
    officialName: "Madurai Kamaraj University",
    shortName: "MKU",
    keywords: ["madurai kamaraj", "mku", "madurai kamaraj university", "mku madurai"],
    city: "Madurai",
    state: "Tamil Nadu",
    type: "University",
    source: "predefined",
    usageCount: 44
  },
  {
    id: "nitt_trichy",
    officialName: "National Institute of Technology Tiruchirappalli",
    shortName: "NIT Trichy",
    keywords: ["nit trichy", "nitt", "nit tiruchirappalli", "national institute of technology trichy"],
    city: "Tiruchirappalli",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 130
  },
  {
    id: "iitm_chennai",
    officialName: "Indian Institute of Technology Madras",
    shortName: "IIT Madras",
    keywords: ["iit madras", "iitm", "iit chennai", "indian institute of technology madras"],
    city: "Chennai",
    state: "Tamil Nadu",
    type: "University",
    source: "predefined",
    usageCount: 160
  },
  {
    id: "iiitdm_kancheepuram",
    officialName: "Indian Institute of Information Technology Design and Manufacturing",
    shortName: "IIITDM Kancheepuram",
    keywords: ["iiitdm", "iiitdm kancheepuram", "iiit chennai"],
    city: "Chennai",
    state: "Tamil Nadu",
    type: "College",
    source: "predefined",
    usageCount: 56
  },

  // --- MAJOR INDIAN INSTITUTIONS ---
  {
    id: "iisc_bangalore",
    officialName: "Indian Institute of Science",
    shortName: "IISc",
    keywords: ["iisc", "iisc bangalore", "indian institute of science", "iisc bengaluru"],
    city: "Bengaluru",
    state: "Karnataka",
    type: "Research Institute",
    source: "predefined",
    usageCount: 140
  },
  {
    id: "iit_bombay",
    officialName: "Indian Institute of Technology Bombay",
    shortName: "IIT Bombay",
    keywords: ["iit bombay", "iitb", "iit mumbai", "indian institute of technology bombay"],
    city: "Mumbai",
    state: "Maharashtra",
    type: "University",
    source: "predefined",
    usageCount: 135
  },
  {
    id: "iit_delhi",
    officialName: "Indian Institute of Technology Delhi",
    shortName: "IIT Delhi",
    keywords: ["iit delhi", "iitd", "indian institute of technology delhi"],
    city: "New Delhi",
    state: "Delhi",
    type: "University",
    source: "predefined",
    usageCount: 125
  },
  {
    id: "bits_pilani",
    officialName: "Birla Institute of Technology and Science Pilani",
    shortName: "BITS Pilani",
    keywords: ["bits pilani", "bits", "birla institute of technology", "bits hyderabad", "bits goa"],
    city: "Pilani",
    state: "Rajasthan",
    type: "University",
    source: "predefined",
    usageCount: 115
  },
  {
    id: "iiit_hyderabad",
    officialName: "International Institute of Information Technology Hyderabad",
    shortName: "IIIT Hyderabad",
    keywords: ["iiit hyderabad", "iiith", "iiit h", "international institute of information technology"],
    city: "Hyderabad",
    state: "Telangana",
    type: "College",
    source: "predefined",
    usageCount: 95
  },
  {
    id: "delhi_univ",
    officialName: "University of Delhi",
    shortName: "DU",
    keywords: ["delhi university", "du", "university of delhi", "du north campus"],
    city: "New Delhi",
    state: "Delhi",
    type: "University",
    source: "predefined",
    usageCount: 80
  },
  {
    id: "aiims_delhi",
    officialName: "All India Institute of Medical Sciences",
    shortName: "AIIMS",
    keywords: ["aiims", "aiims delhi", "all india institute of medical sciences"],
    city: "New Delhi",
    state: "Delhi",
    type: "Research Institute",
    source: "predefined",
    usageCount: 75
  },

  // --- GOVERNMENT R&D AGENCIES ---
  {
    id: "uspto_gov",
    officialName: "United States Patent and Trademark Office",
    shortName: "USPTO",
    keywords: ["uspto", "us patent office", "patent office", "united states patent office"],
    city: "Alexandria",
    state: "Virginia (USA)",
    type: "Government Agency",
    source: "predefined",
    usageCount: 200
  },
  {
    id: "isro_hq",
    officialName: "Indian Space Research Organisation",
    shortName: "ISRO",
    keywords: ["isro", "indian space research organisation", "isro bangalore", "sac", "vssc"],
    city: "Bengaluru",
    state: "Karnataka",
    type: "Government Agency",
    source: "predefined",
    usageCount: 110
  },
  {
    id: "drdo_hq",
    officialName: "Defence Research and Development Organisation",
    shortName: "DRDO",
    keywords: ["drdo", "defence research and development organisation", "drdo delhi"],
    city: "New Delhi",
    state: "Delhi",
    type: "Government Agency",
    source: "predefined",
    usageCount: 98
  },
  {
    id: "csir_india",
    officialName: "Council of Scientific and Industrial Research",
    shortName: "CSIR",
    keywords: ["csir", "council of scientific and industrial research", "csir clri", "csir cecri"],
    city: "New Delhi",
    state: "Delhi",
    type: "Research Institute",
    source: "predefined",
    usageCount: 92
  },

  // --- MNCs & TECH ORGANIZATIONS ---
  {
    id: "google_inc",
    officialName: "Google LLC / Alphabet Inc.",
    shortName: "Google",
    keywords: ["google", "alphabet", "google research", "google india", "google labs"],
    city: "Mountain View / Bengaluru",
    state: "California / KA",
    type: "MNC / Tech Firm",
    source: "predefined",
    usageCount: 180
  },
  {
    id: "microsoft_corp",
    officialName: "Microsoft Corporation",
    shortName: "Microsoft",
    keywords: ["microsoft", "msft", "microsoft research", "microsoft india"],
    city: "Redmond / Hyderabad",
    state: "Washington / TS",
    type: "MNC / Tech Firm",
    source: "predefined",
    usageCount: 175
  },
  {
    id: "ibm_research",
    officialName: "IBM Research & System Labs",
    shortName: "IBM",
    keywords: ["ibm", "ibm research", "ibm india", "international business machines"],
    city: "Armonk / Bengaluru",
    state: "New York / KA",
    type: "MNC / Tech Firm",
    source: "predefined",
    usageCount: 160
  },
  {
    id: "zoho_corp",
    officialName: "Zoho Corporation",
    shortName: "Zoho",
    keywords: ["zoho", "zoho corp", "zoho chennai", "zoho tenkasi"],
    city: "Chennai / Tenkasi",
    state: "Tamil Nadu",
    type: "MNC / Tech Firm",
    source: "predefined",
    usageCount: 140
  },
  {
    id: "tcs_ltd",
    officialName: "Tata Consultancy Services",
    shortName: "TCS",
    keywords: ["tcs", "tata consultancy services", "tcs chennai", "tcs innovation labs"],
    city: "Mumbai / Chennai",
    state: "Maharashtra / TN",
    type: "MNC / Tech Firm",
    source: "predefined",
    usageCount: 135
  },
  {
    id: "infosys_ltd",
    officialName: "Infosys Limited",
    shortName: "Infosys",
    keywords: ["infosys", "infy", "infosys bangalore", "infosys chennai"],
    city: "Bengaluru / Chennai",
    state: "Karnataka / TN",
    type: "MNC / Tech Firm",
    source: "predefined",
    usageCount: 120
  },
  {
    id: "wipro_ltd",
    officialName: "Wipro Limited",
    shortName: "Wipro",
    keywords: ["wipro", "wipro technologies", "wipro bangalore"],
    city: "Bengaluru",
    state: "Karnataka",
    type: "MNC / Tech Firm",
    source: "predefined",
    usageCount: 110
  },
  {
    id: "hcl_tech",
    officialName: "HCL Technologies",
    shortName: "HCL",
    keywords: ["hcl", "hcl tech", "hcl technologies", "hcl chennai"],
    city: "Noida / Chennai",
    state: "Uttar Pradesh / TN",
    type: "MNC / Tech Firm",
    source: "predefined",
    usageCount: 105
  },
  {
    id: "intel_corp",
    officialName: "Intel Corporation",
    shortName: "Intel",
    keywords: ["intel", "intel india", "intel labs"],
    city: "Santa Clara / Bengaluru",
    state: "California / KA",
    type: "MNC / Tech Firm",
    source: "predefined",
    usageCount: 95
  },
  {
    id: "samsung_rnd",
    officialName: "Samsung R&D Institute",
    shortName: "Samsung R&D",
    keywords: ["samsung", "samsung research", "samsung r&d", "samsung india"],
    city: "Bengaluru / Noida",
    state: "Karnataka / UP",
    type: "MNC / Tech Firm",
    source: "predefined",
    usageCount: 90
  }
];
