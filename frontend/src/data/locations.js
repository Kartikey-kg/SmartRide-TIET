// src/data/locations.js
// All campus and off-campus landmarks for SmartRideTIET
// Campus locations have isCampus: true and flat fare of ₹10

// ── TIET Campus Landmarks ──────────────────────────────────────────
export const CAMPUS_LOCATIONS = [
  // === Main Gates ===
  { label: 'Main Entrance',      lat: 30.3523, lng: 76.3612, category: 'Gates',      emoji: '🏛️', description: 'Main entrance gate of TIET campus', isCampus: true },
  { label: 'Western Gate',       lat: 30.3570, lng: 76.3572, category: 'Gates',      emoji: '🚪', description: 'Western gate (near FRA/FRB blocks)', isCampus: true },
  { label: 'Polytechnic Gate',   lat: 30.3530, lng: 76.3695, category: 'Gates',      emoji: '🚪', description: 'Gate near Thapar Polytechnic College', isCampus: true },
  { label: 'TSLAS Gate',         lat: 30.3490, lng: 76.3685, category: 'Gates',      emoji: '🚪', description: 'Gate near TSLAS building', isCampus: true },

  // === Academic Buildings ===
  { label: 'Library',            lat: 30.3535, lng: 76.3637, category: 'Academic',   emoji: '📚', description: 'Main campus library', isCampus: true },
  { label: 'COS Block',          lat: 30.3540, lng: 76.3628, category: 'Academic',   emoji: '🏫', description: 'Centre of Studies', isCampus: true },
  { label: 'CS Block',           lat: 30.3544, lng: 76.3650, category: 'Academic',   emoji: '💻', description: 'Computer Science Block', isCampus: true },
  { label: 'C Block',            lat: 30.3538, lng: 76.3620, category: 'Academic',   emoji: '🏢', description: 'C Academic Block', isCampus: true },
  { label: 'D Block',            lat: 30.3530, lng: 76.3622, category: 'Academic',   emoji: '🏢', description: 'D Academic Block', isCampus: true },
  { label: 'E Block',            lat: 30.3528, lng: 76.3618, category: 'Academic',   emoji: '🏢', description: 'E Academic Block', isCampus: true },
  { label: 'F Block',            lat: 30.3525, lng: 76.3624, category: 'Academic',   emoji: '🏢', description: 'F Academic Block', isCampus: true },
  { label: 'G Block',            lat: 30.3542, lng: 76.3615, category: 'Academic',   emoji: '🏢', description: 'G Academic Block', isCampus: true },
  { label: 'H Block',            lat: 30.3520, lng: 76.3612, category: 'Academic',   emoji: '🏢', description: 'H Block (near Main Entrance)', isCampus: true },
  { label: 'Mechanical Workshop', lat: 30.3515, lng: 76.3650, category: 'Academic',  emoji: '⚙️', description: 'Mechanical Engineering Workshop', isCampus: true },
  { label: 'Venture Lab',        lat: 30.3512, lng: 76.3660, category: 'Academic',   emoji: '🔬', description: 'Venture Lab / Innovation Center', isCampus: true },
  { label: 'TSLAS',              lat: 30.3495, lng: 76.3672, category: 'Academic',   emoji: '🎓', description: 'Thapar School of Liberal Arts & Sciences', isCampus: true },
  { label: 'Thapar Polytechnic', lat: 30.3537, lng: 76.3688, category: 'Academic',   emoji: '🏫', description: 'Thapar Polytechnic College', isCampus: true },

  // === Research Blocks (FRA–FRG) ===
  { label: 'FRA Block',          lat: 30.3583, lng: 76.3608, category: 'Research',   emoji: '🔭', description: 'Faculty Research Block A', isCampus: true },
  { label: 'FRB Block',          lat: 30.3583, lng: 76.3618, category: 'Research',   emoji: '🔭', description: 'Faculty Research Block B', isCampus: true },
  { label: 'FRC Block',          lat: 30.3583, lng: 76.3628, category: 'Research',   emoji: '🔭', description: 'Faculty Research Block C', isCampus: true },
  { label: 'FRD Block',          lat: 30.3583, lng: 76.3638, category: 'Research',   emoji: '🔭', description: 'Faculty Research Block D', isCampus: true },
  { label: 'FRE Block',          lat: 30.3583, lng: 76.3648, category: 'Research',   emoji: '🔭', description: 'Faculty Research Block E', isCampus: true },
  { label: 'FRF Block',          lat: 30.3592, lng: 76.3623, category: 'Research',   emoji: '🔭', description: 'Faculty Research Block F', isCampus: true },
  { label: 'FRG Block',          lat: 30.3592, lng: 76.3635, category: 'Research',   emoji: '🔭', description: 'Faculty Research Block G', isCampus: true },
  { label: 'TI-FAC CORE',       lat: 30.3548, lng: 76.3668, category: 'Research',   emoji: '🧪', description: 'TI-FAC CORE Research Center', isCampus: true },
  { label: 'STEP',               lat: 30.3550, lng: 76.3675, category: 'Research',   emoji: '🚀', description: 'Science & Technology Entrepreneurs Park', isCampus: true },

  // === Student Facilities ===
  { label: 'Auditorium (OAT)',   lat: 30.3556, lng: 76.3628, category: 'Facilities', emoji: '🎭', description: 'Open Air Theatre / Main Auditorium', isCampus: true },
  { label: 'Sports Complex',     lat: 30.3548, lng: 76.3660, category: 'Sports',     emoji: '🏟️', description: 'Multi-sport complex', isCampus: true },
  { label: 'Swimming Pool',      lat: 30.3545, lng: 76.3665, category: 'Sports',     emoji: '🏊', description: 'Campus swimming pool', isCampus: true },
  { label: 'Tennis Court',       lat: 30.3558, lng: 76.3655, category: 'Sports',     emoji: '🎾', description: 'Tennis courts', isCampus: true },
  { label: 'Cricket Field',      lat: 30.3562, lng: 76.3645, category: 'Sports',     emoji: '🏏', description: 'Cricket ground', isCampus: true },
  { label: 'Athletics Track',    lat: 30.3572, lng: 76.3628, category: 'Sports',     emoji: '🏃', description: 'Synthetic athletics track', isCampus: true },
  { label: 'Football Ground',    lat: 30.3565, lng: 76.3620, category: 'Sports',     emoji: '⚽', description: 'Football ground / sports field', isCampus: true },
  { label: 'Fete Area',          lat: 30.3555, lng: 76.3615, category: 'Facilities', emoji: '🎪', description: 'Annual fete & events area', isCampus: true },
  { label: 'Central Park',       lat: 30.3548, lng: 76.3600, category: 'Facilities', emoji: '🌳', description: 'Central park & green zone', isCampus: true },
  { label: 'Food Court',         lat: 30.3542, lng: 76.3600, category: 'Food',       emoji: '🍽️', description: 'Main food court', isCampus: true },
  { label: 'Canteen',            lat: 30.3538, lng: 76.3605, category: 'Food',       emoji: '🥘', description: 'Main campus canteen', isCampus: true },
  { label: 'Bank Street',        lat: 30.3533, lng: 76.3606, category: 'Facilities', emoji: '🏦', description: 'Bank & ATM row on campus', isCampus: true },
  { label: 'Cafe',               lat: 30.3536, lng: 76.3598, category: 'Food',       emoji: '☕', description: 'Campus café', isCampus: true },
  { label: 'Waterbody Cafe',     lat: 30.3541, lng: 76.3658, category: 'Food',       emoji: '🌊', description: 'Café near the water body', isCampus: true },
  { label: 'Stationery Shop',    lat: 30.3532, lng: 76.3608, category: 'Facilities', emoji: '🖊️', description: 'Stationery and supplies shop', isCampus: true },
  { label: 'ATM',                lat: 30.3531, lng: 76.3607, category: 'Facilities', emoji: '💳', description: 'Campus ATM', isCampus: true },
  { label: 'Guest House',        lat: 30.3530, lng: 76.3598, category: 'Facilities', emoji: '🏨', description: 'Campus guest house', isCampus: true },
  { label: 'SBOP Lawns',         lat: 30.3528, lng: 76.3595, category: 'Facilities', emoji: '🌿', description: 'SBOP lawns area', isCampus: true },
  { label: 'Visitors Lounge',    lat: 30.3534, lng: 76.3602, category: 'Facilities', emoji: '🛋️', description: 'Visitors lounge & reception', isCampus: true },
  { label: 'State Quarters',     lat: 30.3545, lng: 76.3685, category: 'Facilities', emoji: '🏘️', description: 'State government quarters area', isCampus: true },

  // === Hostels / Halls of Residence ===
  { label: 'Meera Hall',         lat: 30.3578, lng: 76.3568, category: 'Hostels',    emoji: '🏠', description: 'Meera Hall of Residence (Girls)', isCampus: true },
  { label: 'Prithvi Hall',       lat: 30.3574, lng: 76.3568, category: 'Hostels',    emoji: '🏠', description: 'Prithvi Hall of Residence', isCampus: true },
  { label: 'Vyom Hall',          lat: 30.3570, lng: 76.3568, category: 'Hostels',    emoji: '🏠', description: 'Vyom Hall of Residence', isCampus: true },
  { label: 'Amritam Hall',       lat: 30.3566, lng: 76.3570, category: 'Hostels',    emoji: '🏠', description: 'Amritam Hall of Residence', isCampus: true },
  { label: 'Agira Hall',         lat: 30.3562, lng: 76.3568, category: 'Hostels',    emoji: '🏠', description: 'Agira Hall of Residence', isCampus: true },
  { label: 'Telas Hall',         lat: 30.3558, lng: 76.3572, category: 'Hostels',    emoji: '🏠', description: 'Telas Hall of Residence', isCampus: true },
  { label: 'Viyan Hall',         lat: 30.3554, lng: 76.3572, category: 'Hostels',    emoji: '🏠', description: 'Viyan Hall of Residence', isCampus: true },
  { label: 'Anantam Hall',       lat: 30.3549, lng: 76.3574, category: 'Hostels',    emoji: '🏠', description: 'Anantam Hall of Residence', isCampus: true },
  { label: 'Ananta Hall',        lat: 30.3553, lng: 76.3686, category: 'Hostels',    emoji: '🏠', description: 'Ananta Hall of Residence (near Polytechnic Gate)', isCampus: true },
  { label: 'Vahni Hall',         lat: 30.3545, lng: 76.3578, category: 'Hostels',    emoji: '🏠', description: 'Vahni Hall of Residence', isCampus: true },
  { label: 'Vasudha Hall',       lat: 30.3548, lng: 76.3632, category: 'Hostels',    emoji: '🏠', description: 'Vasudha Hall of Residence', isCampus: true },
  { label: 'Ira Hall',           lat: 30.3543, lng: 76.3644, category: 'Hostels',    emoji: '🏠', description: 'Ira Hall of Residence', isCampus: true },
  { label: 'Ambaram Hall',       lat: 30.3558, lng: 76.3690, category: 'Hostels',    emoji: '🏠', description: 'Ambaram Hall of Residence', isCampus: true },

  // === Religious Places ===
  { label: 'Shiv Mandir',        lat: 30.3560, lng: 76.3590, category: 'Religious',  emoji: '🛕', description: 'Shiv temple on campus', isCampus: true },
  { label: 'Gurudwara',          lat: 30.3558, lng: 76.3595, category: 'Religious',  emoji: '🕌', description: 'Campus Gurudwara', isCampus: true },
];

// ── Off-Campus / Patiala Locations ────────────────────────────────
export const OFFCAMPUS_LOCATIONS = [
  { label: 'Patiala Railway Station', lat: 30.3398, lng: 76.3869, category: 'Transport', emoji: '🚂', description: 'Patiala Railway Station', isCampus: false },
  { label: 'Patiala Bus Stand',       lat: 30.3375, lng: 76.3860, category: 'Transport', emoji: '🚌', description: 'Main bus stand, Patiala', isCampus: false },
  { label: 'Model Town Patiala',      lat: 30.3482, lng: 76.3900, category: 'City',      emoji: '🏙️', description: 'Model Town area, Patiala', isCampus: false },
  { label: 'Leela Bhawan Market',     lat: 30.3355, lng: 76.3872, category: 'City',      emoji: '🛍️', description: 'Leela Bhawan Market, Patiala', isCampus: false },
  { label: 'Punjabi University',      lat: 30.2342, lng: 76.4088, category: 'Education', emoji: '🎓', description: 'Punjabi University, Patiala', isCampus: false },
];

// ── Combined list (campus first) ──────────────────────────────────
export const ALL_LOCATIONS = [...CAMPUS_LOCATIONS, ...OFFCAMPUS_LOCATIONS];

// ── Fare logic ────────────────────────────────────────────────────
export const CAMPUS_FLAT_FARE = 10;     // ₹10 for any campus-internal trip

/**
 * Returns true if both locations are inside TIET campus.
 */
export const isCampusInternalTrip = (locA, locB) =>
  locA?.isCampus === true && locB?.isCampus === true;

/**
 * Categories with display colours for the map legend.
 */
export const CATEGORY_COLORS = {
  'Gates':      { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  'Academic':   { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  'Research':   { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  'Hostels':    { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  'Sports':     { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  'Food':       { color: '#fb923c', bg: 'rgba(251,146,60,0.15)'  },
  'Facilities': { color: '#67e8f9', bg: 'rgba(103,232,249,0.15)' },
  'Religious':  { color: '#fde68a', bg: 'rgba(253,230,138,0.15)' },
  'Transport':  { color: '#c084fc', bg: 'rgba(192,132,252,0.15)' },
  'Education':  { color: '#86efac', bg: 'rgba(134,239,172,0.15)' },
  'City':       { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
};
