// src/pages/student/CampusMap.jsx
// Interactive TIET Campus Map with landmark overlay — Phase 4

import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import {
  CAMPUS_LOCATIONS,
  OFFCAMPUS_LOCATIONS,
  CATEGORY_COLORS,
  CAMPUS_FLAT_FARE,
} from '../../data/locations';
import campusMapImg from '../../assets/campus_map.jpg';
import './CampusMap.css';

// ── All categories for filter sidebar ────────────────────────────
const ALL_CATEGORIES = ['All', 'Gates', 'Academic', 'Research', 'Hostels', 'Sports', 'Food', 'Facilities', 'Religious'];

// ── Map image natural dimensions (px) — used to position pins ────
// The uploaded map is roughly 544×966 (portrait). We use percentage positioning.
// Positions are manually calibrated from the 2D map image.
const LANDMARK_POSITIONS = {
  // Gates
  'Main Entrance':      { x: 7,  y: 89 },
  'Western Gate':       { x: 22, y: 7  },
  'Polytechnic Gate':   { x: 89, y: 50 },
  'TSLAS Gate':         { x: 88, y: 72 },

  // Academic
  'Library':            { x: 38, y: 73 },
  'COS Block':          { x: 40, y: 60 },
  'CS Block':           { x: 52, y: 64 },
  'C Block':            { x: 36, y: 76 },
  'D Block':            { x: 31, y: 77 },
  'E Block':            { x: 25, y: 84 },
  'F Block':            { x: 29, y: 84 },
  'G Block':            { x: 33, y: 70 },
  'H Block':            { x: 18, y: 84 },
  'Mechanical Workshop':{ x: 44, y: 84 },
  'Venture Lab':        { x: 54, y: 87 },
  'TSLAS':              { x: 66, y: 84 },
  'Thapar Polytechnic': { x: 73, y: 60 },

  // Research
  'FRA Block':          { x: 26, y: 16 },
  'FRB Block':          { x: 31, y: 16 },
  'FRC Block':          { x: 36, y: 16 },
  'FRD Block':          { x: 41, y: 16 },
  'FRE Block':          { x: 47, y: 16 },
  'FRF Block':          { x: 47, y: 9  },
  'FRG Block':          { x: 54, y: 9  },
  'TI-FAC CORE':        { x: 62, y: 62 },
  'STEP':               { x: 64, y: 65 },

  // Sports
  'Athletics Track':    { x: 46, y: 28 },
  'Cricket Field':      { x: 62, y: 42 },
  'Football Ground':    { x: 44, y: 42 },
  'Tennis Court':       { x: 57, y: 48 },
  'Swimming Pool':      { x: 61, y: 56 },
  'Sports Complex':     { x: 60, y: 53 },

  // Facilities
  'Auditorium (OAT)':   { x: 42, y: 33 },
  'Fete Area':          { x: 37, y: 44 },
  'Central Park':       { x: 26, y: 53 },
  'Food Court':         { x: 30, y: 59 },
  'Canteen':            { x: 29, y: 68 },
  'Bank Street':        { x: 23, y: 70 },
  'ATM':                { x: 23, y: 72 },
  'Stationery Shop':    { x: 22, y: 71 },
  'Guest House':        { x: 20, y: 68 },
  'SBOP Lawns':         { x: 19, y: 72 },
  'Visitors Lounge':    { x: 24, y: 69 },
  'State Quarters':     { x: 75, y: 65 },

  // Food
  'Cafe':               { x: 21, y: 77 },
  'Waterbody Cafe':     { x: 46, y: 67 },

  // Religious
  'Shiv Mandir':        { x: 34, y: 54 },
  'Gurudwara':          { x: 33, y: 56 },

  // Hostels
  'Meera Hall':         { x: 8,  y: 17 },
  'Prithvi Hall':       { x: 8,  y: 24 },
  'Vyom Hall':          { x: 8,  y: 30 },
  'Amritam Hall':       { x: 8,  y: 37 },
  'Agira Hall':         { x: 8,  y: 44 },
  'Telas Hall':         { x: 17, y: 44 },
  'Viyan Hall':         { x: 17, y: 50 },
  'Anantam Hall':       { x: 17, y: 39 },
  'Ananta Hall':        { x: 77, y: 52 },
  'Vahni Hall':         { x: 17, y: 57 },
  'Vasudha Hall':       { x: 51, y: 55 },
  'Ira Hall':           { x: 55, y: 60 },
  'Ambaram Hall':       { x: 77, y: 42 },
};

// ── Campus Map Page ───────────────────────────────────────────────
const CampusMap = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedLandmark, setSelectedLandmark] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [mapZoomed, setMapZoomed] = useState(false);
  const mapRef = useRef(null);

  // Filter landmarks
  const visibleLandmarks = CAMPUS_LOCATIONS.filter((loc) => {
    const catMatch = activeCategory === 'All' || loc.category === activeCategory;
    const searchMatch = !searchText || loc.label.toLowerCase().includes(searchText.toLowerCase());
    return catMatch && searchMatch && LANDMARK_POSITIONS[loc.label];
  });

  // Sidebar list (filtered, no position needed)
  const sidebarList = CAMPUS_LOCATIONS.filter((loc) => {
    const catMatch = activeCategory === 'All' || loc.category === activeCategory;
    const searchMatch = !searchText || loc.label.toLowerCase().includes(searchText.toLowerCase());
    return catMatch && searchMatch;
  });

  const handlePinClick = (loc, e) => {
    e.stopPropagation();
    setSelectedLandmark(selectedLandmark?.label === loc.label ? null : loc);
  };

  return (
    <>
      <Navbar />
      <div className="campus-map-page">

        {/* ── Page Header ── */}
        <div className="campus-map-header">
          <div className="campus-map-header-content">
            <div>
              <h1 className="campus-map-title">🗺️ TIET Campus Map</h1>
              <p className="campus-map-subtitle">
                Interactive map of all {CAMPUS_LOCATIONS.length} landmarks · 
                <span style={{ color: '#22c55e', fontWeight: 700 }}> Campus rides: ₹{CAMPUS_FLAT_FARE} flat</span>
              </p>
            </div>
            <Link to="/student/book" className="campus-map-book-btn">
              🚗 Book a Ride
            </Link>
          </div>
        </div>

        <div className="campus-map-layout">

          {/* ── Left Sidebar ── */}
          <aside className="campus-map-sidebar">
            {/* Search */}
            <div className="sidebar-search-wrap">
              <span className="sidebar-search-icon">🔍</span>
              <input
                className="sidebar-search-input"
                placeholder="Search landmark…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {searchText && (
                <button className="sidebar-search-clear" onClick={() => setSearchText('')}>✕</button>
              )}
            </div>

            {/* Category filter */}
            <div className="sidebar-categories">
              {ALL_CATEGORIES.map((cat) => {
                const style = cat !== 'All' ? CATEGORY_COLORS[cat] : {};
                return (
                  <button
                    key={cat}
                    className={`sidebar-cat-btn${activeCategory === cat ? ' active' : ''}`}
                    style={activeCategory === cat && cat !== 'All' ? {
                      background: style.bg,
                      borderColor: style.color,
                      color: style.color,
                    } : {}}
                    onClick={() => setActiveCategory(cat)}
                  >{cat}</button>
                );
              })}
            </div>

            {/* Landmark list */}
            <div className="sidebar-landmark-list">
              {sidebarList.length === 0 ? (
                <div className="sidebar-empty">No landmarks found.</div>
              ) : (
                sidebarList.map((loc) => {
                  const catStyle = CATEGORY_COLORS[loc.category] || {};
                  const isSelected = selectedLandmark?.label === loc.label;
                  return (
                    <div
                      key={loc.label}
                      className={`sidebar-landmark-item${isSelected ? ' selected' : ''}`}
                      style={isSelected ? { borderColor: catStyle.color, background: catStyle.bg } : {}}
                      onClick={() => setSelectedLandmark(isSelected ? null : loc)}
                    >
                      <span className="sidebar-landmark-emoji">{loc.emoji}</span>
                      <div className="sidebar-landmark-info">
                        <div className="sidebar-landmark-name">{loc.label}</div>
                        <div className="sidebar-landmark-desc">{loc.description}</div>
                      </div>
                      <span
                        className="sidebar-landmark-cat"
                        style={{ background: catStyle.bg, color: catStyle.color }}
                      >{loc.category}</span>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── Map Area ── */}
          <main className="campus-map-main">

            {/* Zoom toggle */}
            <div className="map-controls">
              <button
                className="map-control-btn"
                onClick={() => setMapZoomed(!mapZoomed)}
                title={mapZoomed ? 'Zoom out' : 'Zoom in'}
              >
                {mapZoomed ? '🔍−' : '🔍+'}
              </button>
              <button
                className="map-control-btn"
                onClick={() => { setSelectedLandmark(null); setSearchText(''); setActiveCategory('All'); }}
                title="Reset"
              >↺ Reset</button>
            </div>

            {/* Map with pin overlay */}
            <div
              className={`campus-map-image-wrap${mapZoomed ? ' zoomed' : ''}`}
              ref={mapRef}
              onClick={() => setSelectedLandmark(null)}
            >
              <img
                src={campusMapImg}
                alt="TIET Campus Map"
                className="campus-map-img"
                draggable={false}
              />

              {/* Landmark pins */}
              {visibleLandmarks.map((loc) => {
                const pos = LANDMARK_POSITIONS[loc.label];
                if (!pos) return null;
                const catStyle = CATEGORY_COLORS[loc.category] || { color: '#c084fc', bg: 'rgba(192,132,252,0.15)' };
                const isSelected = selectedLandmark?.label === loc.label;

                return (
                  <div
                    key={loc.label}
                    className={`map-pin${isSelected ? ' map-pin--selected' : ''}`}
                    style={{
                      left: `${pos.x}%`,
                      top:  `${pos.y}%`,
                      '--pin-color': catStyle.color,
                    }}
                    onClick={(e) => handlePinClick(loc, e)}
                    title={loc.label}
                  >
                    <div className="map-pin-dot" style={{ background: catStyle.color, boxShadow: `0 0 6px ${catStyle.color}` }}>
                      <span className="map-pin-emoji">{loc.emoji}</span>
                    </div>
                    {isSelected && (
                      <div className="map-pin-tooltip" style={{ background: '#13131f', borderColor: catStyle.color }}>
                        <div className="map-pin-tooltip-title">{loc.label}</div>
                        <div className="map-pin-tooltip-desc">{loc.description}</div>
                        <div className="map-pin-tooltip-fare">
                          <span>🏫 Campus Ride: ₹{CAMPUS_FLAT_FARE}</span>
                        </div>
                        <Link
                          to={`/student/book`}
                          className="map-pin-tooltip-book"
                          style={{ background: catStyle.bg, borderColor: catStyle.color, color: catStyle.color }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Book from here →
                        </Link>
                      </div>
                    )}
                    {!isSelected && (
                      <div className="map-pin-label">{loc.label}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="map-legend">
              {Object.entries(CATEGORY_COLORS).filter(([cat]) => ALL_CATEGORIES.includes(cat)).map(([cat, style]) => (
                <div key={cat} className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: style.color }} />
                  <span className="map-legend-label">{cat}</span>
                </div>
              ))}
            </div>

            {/* Campus fare notice */}
            <div className="map-fare-notice">
              🏫 <strong>Any ride within campus = ₹{CAMPUS_FLAT_FARE} flat.</strong>
              <span style={{ color: '#555580', marginLeft: '0.5rem' }}>
                Off-campus rides are fare-metered (₹30 base + ₹12/km).
              </span>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default CampusMap;
