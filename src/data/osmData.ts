// OpenStreetMap (OSM) & Open-Source Places GeoJSON Specification for Central University Miotso, Ghana
export interface OSMGeoJSONFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    category: 'road' | 'amenity' | 'building' | 'gate' | 'service';
    osm_type: 'way' | 'node' | 'relation';
    highway?: string;
    lanes?: string;
    surface?: string;
    lit?: string;
    amenity?: string;
    cuisine?: string;
    shop?: string;
    opening_hours?: string;
    description: string;
    coordinatesText?: string;
    lengthMeters?: number;
    tags: Record<string, string>;
  };
  geometry: {
    type: 'LineString' | 'Point';
    coordinates: number[] | number[][]; // [lng, lat] per GeoJSON RFC 7946
  };
}

export interface OSMGeoJSONCollection {
  type: 'FeatureCollection';
  generator: string;
  copyright: string;
  timestamp: string;
  features: OSMGeoJSONFeature[];
}

export const CAMPUS_OSM_DATASET: OSMGeoJSONCollection = {
  type: 'FeatureCollection',
  generator: 'Central University OpenStreetMap & Overpass Integration Engine v2.4',
  copyright: '© OpenStreetMap contributors, ODbL 1.0 • Free & Open Data',
  timestamp: new Date().toISOString(),
  features: [
    // --- CAMPUS ROADS & LANES (LineStrings) ---
    {
      type: 'Feature',
      id: 'way/cuc-road-boulevard',
      properties: {
        name: 'Central University Boulevard (Main Spine)',
        category: 'road',
        osm_type: 'way',
        highway: 'primary',
        lanes: '2',
        surface: 'asphalt',
        lit: 'yes',
        description: 'Main campus arterial connecting Main Security Gate through Senate Plaza to the Quadrangle.',
        lengthMeters: 450,
        tags: {
          'highway': 'primary',
          'name': 'Central University Boulevard',
          'lanes': '2',
          'maxspeed': '30 km/h',
          'surface': 'asphalt',
          'lit': 'yes',
          'oneway': 'no',
          'access': 'permissive'
        }
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0.0507, 5.7635], // Main Gate
          [0.0515, 5.7630],
          [0.0528, 5.7628],
          [0.0533, 5.7624], // Senate Plaza
          [0.0535, 5.7604]  // Quadrangle Hub
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way/cuc-road-senate-ring',
      properties: {
        name: 'Senate Ring Road & Administration Lane',
        category: 'road',
        osm_type: 'way',
        highway: 'residential',
        lanes: '2',
        surface: 'paved',
        lit: 'yes',
        description: 'Circulating perimeter road wrapping behind Senate and Academic Records.',
        lengthMeters: 280,
        tags: {
          'highway': 'residential',
          'name': 'Senate Ring Road',
          'surface': 'paved_interlocking',
          'lit': 'yes',
          'parking:lane': 'parallel'
        }
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0.0528, 5.7628],
          [0.0538, 5.7631],
          [0.0545, 5.7622],
          [0.0533, 5.7624]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way/cuc-road-trinity-walkway',
      properties: {
        name: 'Trinity Hall Walkway & Access Lane',
        category: 'road',
        osm_type: 'way',
        highway: 'footway',
        surface: 'paved',
        lit: 'yes',
        description: 'Lit pedestrian arterial and shuttle feeder path leading south to Trinity Male Hostel.',
        lengthMeters: 310,
        tags: {
          'highway': 'footway',
          'footway': 'sidewalk',
          'name': 'Trinity Walkway',
          'wheelchair': 'yes',
          'lit': 'yes',
          'surface': 'paved'
        }
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0.0535, 5.7604], // Quadrangle
          [0.0542, 5.7585], // Food court hub
          [0.0552, 5.7584]  // Trinity Hall entrance
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way/cuc-road-destiny-lane',
      properties: {
        name: 'Destiny Hall Pedestrian Avenue',
        category: 'road',
        osm_type: 'way',
        highway: 'footway',
        surface: 'paved',
        lit: 'yes',
        description: 'Direct paved pathway linking East Quadrangle directly to Destiny Hall residential gates.',
        lengthMeters: 220,
        tags: {
          'highway': 'footway',
          'name': 'Destiny Hall Lane',
          'surface': 'paved',
          'lit': 'yes',
          'bicycle': 'yes'
        }
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0.0535, 5.7604],
          [0.0548, 5.7605],
          [0.0558, 5.7604]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way/cuc-road-clinic-lane',
      properties: {
        name: 'Clinic Emergency Ambulance Way',
        category: 'road',
        osm_type: 'way',
        highway: 'service',
        surface: 'asphalt',
        lit: 'yes',
        description: 'Dedicated priority access lane for ambulances and clinic patients leading to Emergency triage.',
        lengthMeters: 190,
        tags: {
          'highway': 'service',
          'service': 'emergency_access',
          'name': 'Central Clinic Emergency Way',
          'emergency': 'designated',
          'surface': 'asphalt'
        }
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0.0528, 5.7616], // Law Plaza junction
          [0.0518, 5.7615],
          [0.0518, 5.7612]  // Clinic entrance
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way/cuc-road-quadrangle',
      properties: {
        name: 'Central Quadrangle Promenade',
        category: 'road',
        osm_type: 'way',
        highway: 'pedestrian',
        surface: 'concrete_tiles',
        lit: 'yes',
        description: 'Pedestrian plaza and civic hub between Library, Law, and Central Business School.',
        lengthMeters: 160,
        tags: {
          'highway': 'pedestrian',
          'name': 'Central Quadrangle',
          'area': 'yes',
          'surface': 'concrete_tiles',
          'bench': 'yes'
        }
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0.0533, 5.7624],
          [0.0535, 5.7604],
          [0.0542, 5.7585]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way/cuc-road-cbs-avenue',
      properties: {
        name: 'Central Business School Avenue',
        category: 'road',
        osm_type: 'way',
        highway: 'secondary',
        surface: 'asphalt',
        lit: 'yes',
        description: 'Two-lane road extending toward the Business School executive halls and parking lot.',
        lengthMeters: 260,
        tags: {
          'highway': 'secondary',
          'name': 'CBS Avenue',
          'surface': 'asphalt',
          'lit': 'yes'
        }
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0.0535, 5.7604],
          [0.0545, 5.7616],
          [0.0555, 5.7620]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way/cuc-road-sports-lane',
      properties: {
        name: 'Sports Complex & Stadium Lane',
        category: 'road',
        osm_type: 'way',
        highway: 'track',
        surface: 'compacted_gravel',
        lit: 'yes',
        description: 'Wide service road reaching the basketball courts, tennis pavilion, and sports fields.',
        lengthMeters: 340,
        tags: {
          'highway': 'track',
          'name': 'Sports Complex Lane',
          'tracktype': 'grade1',
          'lit': 'yes'
        }
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0.0521, 5.7588], // Engineering lane
          [0.0515, 5.7580],
          [0.0512, 5.7576]  // Sports pitch
        ]
      }
    },

    // --- CAMPUS PLACES & POIs (Points with OSM Tagging) ---
    {
      type: 'Feature',
      id: 'node/cuc-clinic-point',
      properties: {
        name: 'Central University Clinic (Miotso)',
        category: 'amenity',
        osm_type: 'node',
        amenity: 'clinic',
        opening_hours: '24/7',
        description: '24/7 campus hospital triage, general practice, lab, and pharmacy.',
        tags: {
          'amenity': 'clinic',
          'healthcare': 'centre',
          'healthcare:speciality': 'general;emergency;pharmacy',
          'name': 'Central University Clinic',
          'opening_hours': '24/7',
          'operator': 'Central University Health Directorate',
          'wheelchair': 'yes'
        }
      },
      geometry: {
        type: 'Point',
        coordinates: [0.0518, 5.7612]
      }
    },
    {
      type: 'Feature',
      id: 'node/cuc-food-court-point',
      properties: {
        name: 'Miotso Central Cafeteria & Food Court',
        category: 'amenity',
        osm_type: 'node',
        amenity: 'restaurant',
        cuisine: 'ghanaian;african;fast_food',
        opening_hours: '06:30-22:00',
        description: 'Campus cafeteria serving Jollof, Waakye, continental meals, drinks, and snacks.',
        tags: {
          'amenity': 'restaurant',
          'cuisine': 'ghanaian;african;fast_food',
          'name': 'Miotso Food Court & Cafeteria',
          'opening_hours': 'Mo-Su 06:30-22:00',
          'takeaway': 'yes',
          'payment:mobile_money': 'yes'
        }
      },
      geometry: {
        type: 'Point',
        coordinates: [0.0542, 5.7585]
      }
    },
    {
      type: 'Feature',
      id: 'node/cuc-library-point',
      properties: {
        name: 'Central University Main Library',
        category: 'amenity',
        osm_type: 'node',
        amenity: 'library',
        opening_hours: 'Mo-Sa 07:30-22:00',
        description: 'State-of-the-art academic library with e-resources, study cubes, and archives.',
        tags: {
          'amenity': 'library',
          'name': 'Central University Main Library',
          'internet_access': 'wlan',
          'opening_hours': 'Mo-Sa 07:30-22:00',
          'wheelchair': 'yes'
        }
      },
      geometry: {
        type: 'Point',
        coordinates: [0.0535, 5.7604]
      }
    },
    {
      type: 'Feature',
      id: 'node/cuc-senate-point',
      properties: {
        name: 'Senate & Administration Headquarters',
        category: 'building',
        osm_type: 'node',
        amenity: 'townhall',
        opening_hours: 'Mo-Fr 08:00-17:00',
        description: 'Vice Chancellor, Registrar, Finance, and Student Academic Affairs.',
        tags: {
          'building': 'civic',
          'amenity': 'townhall',
          'name': 'Senate & Administration Block',
          'opening_hours': 'Mo-Fr 08:00-17:00'
        }
      },
      geometry: {
        type: 'Point',
        coordinates: [0.0533, 5.7624]
      }
    },
    {
      type: 'Feature',
      id: 'node/cuc-trinity-hostel-point',
      properties: {
        name: 'Trinity Hall (Male Hostel)',
        category: 'building',
        osm_type: 'node',
        description: 'Residential male hall with recreational grounds and study lounges.',
        tags: {
          'building': 'dormitory',
          'name': 'Trinity Hall',
          'residential': 'university_students',
          'capacity': '650'
        }
      },
      geometry: {
        type: 'Point',
        coordinates: [0.0552, 5.7584]
      }
    },
    {
      type: 'Feature',
      id: 'node/cuc-destiny-hostel-point',
      properties: {
        name: 'Destiny Hall (Female Hostel)',
        category: 'building',
        osm_type: 'node',
        description: 'Residential female hall with biometric security and salon area.',
        tags: {
          'building': 'dormitory',
          'name': 'Destiny Hall',
          'residential': 'university_students',
          'capacity': '700'
        }
      },
      geometry: {
        type: 'Point',
        coordinates: [0.0558, 5.7604]
      }
    },
    {
      type: 'Feature',
      id: 'node/cuc-cbs-point',
      properties: {
        name: 'Central Business School (CBS)',
        category: 'building',
        osm_type: 'node',
        description: 'Faculty of Accounting, Banking, Finance, and Marketing.',
        tags: {
          'building': 'university',
          'faculty': 'business',
          'name': 'Central Business School'
        }
      },
      geometry: {
        type: 'Point',
        coordinates: [0.0545, 5.7616]
      }
    },
    {
      type: 'Feature',
      id: 'node/cuc-law-point',
      properties: {
        name: 'Faculty of Law & Great Hall',
        category: 'building',
        osm_type: 'node',
        description: 'Law Auditorium, Moot Court, and Grand Convocation Hall.',
        tags: {
          'building': 'university',
          'amenity': 'arts_centre',
          'name': 'Faculty of Law & Great Hall'
        }
      },
      geometry: {
        type: 'Point',
        coordinates: [0.0528, 5.7616]
      }
    },
    {
      type: 'Feature',
      id: 'node/cuc-engineering-point',
      properties: {
        name: 'School of Architecture & Engineering',
        category: 'building',
        osm_type: 'node',
        description: 'Civil, Computer & Electrical engineering workshops and CAD suites.',
        tags: {
          'building': 'university',
          'faculty': 'engineering',
          'name': 'School of Architecture & Engineering'
        }
      },
      geometry: {
        type: 'Point',
        coordinates: [0.0521, 5.7588]
      }
    },
    {
      type: 'Feature',
      id: 'node/cuc-gate-point',
      properties: {
        name: 'Main Campus Gate (Accra-Aflao Road)',
        category: 'gate',
        osm_type: 'node',
        description: 'Primary security checkpoint and campus transit junction.',
        tags: {
          'barrier': 'gate',
          'access': 'permissive',
          'name': 'Central University Main Gate'
        }
      },
      geometry: {
        type: 'Point',
        coordinates: [0.0507, 5.7635]
      }
    },
    {
      type: 'Feature',
      id: 'node/cuc-sports-point',
      properties: {
        name: 'Central University Sports Complex',
        category: 'building',
        osm_type: 'node',
        description: 'Full-size football field, basketball court, and athletic track.',
        tags: {
          'leisure': 'sports_centre',
          'sport': 'soccer;basketball;running',
          'name': 'Central University Sports Complex'
        }
      },
      geometry: {
        type: 'Point',
        coordinates: [0.0512, 5.7576]
      }
    }
  ]
};
