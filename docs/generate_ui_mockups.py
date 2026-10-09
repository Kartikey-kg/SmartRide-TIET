import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

out_dir = r"C:\Users\kkart\.gemini\antigravity\scratch\SmartRideTIET\docs\ui_screenshots"
os.makedirs(out_dir, exist_ok=True)

# Common styling helper for mobile screen cards
def create_mock_mobile(title_header, status_bar_title, elements, filename):
    fig, ax = plt.subplots(figsize=(4.2, 7.5))
    ax.axis('off')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 18)

    # Phone outline & background
    phone_bg = patches.FancyBboxPatch((0.2, 0.2), 9.6, 17.6, boxstyle="round,pad=0.3,rounding_size=0.6",
                                      edgecolor='#1e293b', facecolor='#0f172a', lw=2)
    ax.add_patch(phone_bg)

    # Status Bar
    ax.text(1.0, 17.0, "9:41", color='#94a3b8', fontsize=8, weight='bold')
    ax.text(8.8, 17.0, "5G 100%", color='#94a3b8', fontsize=7.5, ha='right', weight='bold')

    # App Header Bar
    header_rect = patches.Rectangle((0.5, 15.6), 9.0, 1.0, facecolor='#1e1b4b', edgecolor='none')
    ax.add_patch(header_rect)
    ax.text(5.0, 16.1, status_bar_title, color='#c7d2fe', fontsize=10, weight='bold', ha='center')

    # Render dynamic elements
    for el in elements:
        t = el.get('type')
        if t == 'text':
            ax.text(el['x'], el['y'], el['text'], color=el.get('color', '#f8fafc'),
                    fontsize=el.get('size', 9), weight=el.get('weight', 'normal'), ha=el.get('ha', 'left'))
        elif t == 'box':
            box = patches.FancyBboxPatch((el['x'], el['y']), el['w'], el['h'],
                                         boxstyle="round,pad=0.1,rounding_size=0.2",
                                         facecolor=el.get('bg', '#1e293b'),
                                         edgecolor=el.get('border', '#334155'), lw=1.2)
            ax.add_patch(box)
            if 'text' in el:
                ax.text(el['x'] + el['w']/2, el['y'] + el['h']/2, el['text'],
                        color=el.get('textColor', '#f8fafc'), fontsize=el.get('fontSize', 8.5),
                        ha='center', va='center', weight=el.get('weight', 'normal'))
        elif t == 'input':
            box = patches.FancyBboxPatch((el['x'], el['y']), el['w'], el['h'],
                                         boxstyle="round,pad=0.1,rounding_size=0.15",
                                         facecolor='#090d16', edgecolor='#475569', lw=1)
            ax.add_patch(box)
            ax.text(el['x'] + 0.3, el['y'] + el['h']/2, el['placeholder'],
                    color='#64748b', fontsize=8, va='center')
        elif t == 'btn':
            btn = patches.FancyBboxPatch((el['x'], el['y']), el['w'], el['h'],
                                         boxstyle="round,pad=0.15,rounding_size=0.3",
                                         facecolor=el.get('bg', '#4f46e5'), edgecolor='none')
            ax.add_patch(btn)
            ax.text(el['x'] + el['w']/2, el['y'] + el['h']/2, el['label'],
                    color='white', fontsize=9, weight='bold', ha='center', va='center')

    # Bottom Tab Navigation
    tab_bg = patches.Rectangle((0.5, 0.4), 9.0, 1.0, facecolor='#111827', edgecolor='#1f2937')
    ax.add_patch(tab_bg)
    tabs = ["Home", "Rides", "Map", "Wallet", "Profile"]
    for i, tab in enumerate(tabs):
        ax.text(1.2 + i*1.9, 0.9, tab, color='#a5b4fc' if i==0 else '#64748b', fontsize=7.5, ha='center', weight='bold')

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, filename), dpi=200)
    plt.close()

# 4.6.1 Sign In Page
create_mock_mobile("Sign In", "SmartRideTIET Login", [
    {'type': 'text', 'x': 5.0, 'y': 14.2, 'text': 'Welcome to SmartRideTIET', 'size': 12, 'weight': 'bold', 'ha': 'center', 'color': '#a5b4fc'},
    {'type': 'text', 'x': 5.0, 'y': 13.5, 'text': 'Intra-Campus E-Rickshaw Transit', 'size': 8.5, 'ha': 'center', 'color': '#94a3b8'},
    {'type': 'box', 'x': 1.0, 'y': 12.0, 'w': 8.0, 'h': 0.8, 'bg': '#1e1b4b', 'border': '#6366f1', 'text': 'Student  |  Driver  |  Admin', 'textColor': '#c7d2fe'},
    {'type': 'text', 'x': 1.2, 'y': 10.8, 'text': 'University Email (@thapar.edu):', 'size': 8, 'color': '#cbd5e1'},
    {'type': 'input', 'x': 1.0, 'y': 9.8, 'w': 8.0, 'h': 0.8, 'placeholder': 'student@thapar.edu'},
    {'type': 'text', 'x': 1.2, 'y': 8.8, 'text': 'Password:', 'size': 8, 'color': '#cbd5e1'},
    {'type': 'input', 'x': 1.0, 'y': 7.8, 'w': 8.0, 'h': 0.8, 'placeholder': '••••••••••••'},
    {'type': 'btn', 'x': 1.0, 'y': 6.2, 'w': 8.0, 'h': 0.9, 'bg': '#4f46e5', 'label': 'Sign In with Firebase Auth'},
    {'type': 'text', 'x': 5.0, 'y': 5.0, 'text': 'Don\'t have an account? Register', 'size': 8, 'ha': 'center', 'color': '#38bdf8'}
], "fig4_6_1_signin.png")

# 4.6.2 Home Page
create_mock_mobile("Home", "SmartRideTIET — TIET Campus", [
    {'type': 'text', 'x': 1.0, 'y': 14.6, 'text': 'Hi, Student!', 'size': 13, 'weight': 'bold', 'color': '#ffffff'},
    {'type': 'text', 'x': 1.0, 'y': 14.0, 'text': 'Campus E-Rickshaws ready to dispatch', 'size': 8, 'color': '#94a3b8'},
    {'type': 'box', 'x': 1.0, 'y': 11.5, 'w': 8.0, 'h': 2.0, 'bg': '#1e293b', 'border': '#3b82f6',
     'text': '⚡ Flat Rate: ₹10 anywhere on Campus\nActive Rickshaws on Radar: 12\nEst. Pickup Wait Time: ~3-5 mins', 'textColor': '#93c5fd', 'weight': 'bold'},
    {'type': 'btn', 'x': 1.0, 'y': 9.8, 'w': 8.0, 'h': 1.0, 'bg': '#10b981', 'label': '📍 Book an E-Rickshaw Now'},
    {'type': 'text', 'x': 1.0, 'y': 8.8, 'text': 'Quick Landmark Shortcuts:', 'size': 8.5, 'weight': 'bold', 'color': '#cbd5e1'},
    {'type': 'box', 'x': 1.0, 'y': 7.2, 'w': 3.8, 'h': 1.2, 'bg': '#0f172a', 'border': '#475569', 'text': '🏛️ Main Entrance\nGate 1', 'fontSize': 7.5},
    {'type': 'box', 'x': 5.2, 'y': 7.2, 'w': 3.8, 'h': 1.2, 'bg': '#0f172a', 'border': '#475569', 'text': '📚 Central Library\nAcademic', 'fontSize': 7.5},
    {'type': 'box', 'x': 1.0, 'y': 5.6, 'w': 3.8, 'h': 1.2, 'bg': '#0f172a', 'border': '#475569', 'text': '🏫 COS Block\nLectures', 'fontSize': 7.5},
    {'type': 'box', 'x': 5.2, 'y': 5.6, 'w': 3.8, 'h': 1.2, 'bg': '#0f172a', 'border': '#475569', 'text': '🏢 Hostel J/K\nResidences', 'fontSize': 7.5},
    {'type': 'box', 'x': 1.0, 'y': 3.8, 'w': 8.0, 'h': 1.2, 'bg': '#312e81', 'border': '#6366f1', 'text': '💳 Virtual Wallet: ₹140.00 Available\nTop Up with Razorpay UPI', 'fontSize': 8}
], "fig4_6_2_home.png")

# 4.6.3 Location Requesting Message
create_mock_mobile("Location Permission", "Location Authorization", [
    {'type': 'box', 'x': 1.0, 'y': 7.0, 'w': 8.0, 'h': 7.0, 'bg': '#1e293b', 'border': '#3b82f6'},
    {'type': 'text', 'x': 5.0, 'y': 12.8, 'text': '📍 Enable Geolocation', 'size': 12, 'weight': 'bold', 'ha': 'center', 'color': '#60a5fa'},
    {'type': 'text', 'x': 5.0, 'y': 11.5, 'text': 'SmartRideTIET needs device location\nto match you with nearest campus\ne-rickshaws at TIET Patiala.', 'size': 8.5, 'ha': 'center', 'color': '#cbd5e1'},
    {'type': 'text', 'x': 5.0, 'y': 9.8, 'text': 'Campus Geofence: Active (250 Acres)\nWGS84 Calibrated Coordinates', 'size': 7.5, 'ha': 'center', 'color': '#94a3b8'},
    {'type': 'btn', 'x': 2.0, 'y': 8.5, 'w': 6.0, 'h': 0.8, 'bg': '#3b82f6', 'label': 'Allow Precise Location'},
    {'type': 'btn', 'x': 2.0, 'y': 7.4, 'w': 6.0, 'h': 0.8, 'bg': '#334155', 'label': 'Select Landmark Manually'}
], "fig4_6_3_location_request.png")

# 4.6.4 Safe Routes / Campus Landmark Booking Page
create_mock_mobile("Book Ride", "Ride Booking Drawer", [
    {'type': 'text', 'x': 1.0, 'y': 14.8, 'text': 'Trip Route Planning', 'size': 11, 'weight': 'bold', 'color': '#ffffff'},
    {'type': 'text', 'x': 1.0, 'y': 13.8, 'text': 'Pickup Landmark (60+ TIET Spots):', 'size': 8, 'color': '#94a3b8'},
    {'type': 'box', 'x': 1.0, 'y': 12.8, 'w': 8.0, 'h': 0.8, 'bg': '#0f172a', 'border': '#10b981', 'text': '🟢 Pickup: Central Library', 'textColor': '#6ee7b7'},
    {'type': 'text', 'x': 1.0, 'y': 11.8, 'text': 'Destination Landmark:', 'size': 8, 'color': '#94a3b8'},
    {'type': 'box', 'x': 1.0, 'y': 10.8, 'w': 8.0, 'h': 0.8, 'bg': '#0f172a', 'border': '#ef4444', 'text': '🔴 Drop: Hostel M (Boys Residence)', 'textColor': '#fca5a5'},
    {'type': 'box', 'x': 1.0, 'y': 8.4, 'w': 8.0, 'h': 1.8, 'bg': '#1e1b4b', 'border': '#6366f1',
     'text': 'Distance: ~1.1 km  |  Est. Time: 4 mins\nFare Calculation: Flat ₹10 (Campus Fare)\nSurge Multiplier: 1.0x (Normal Hours)', 'fontSize': 8.5, 'textColor': '#c7d2fe'},
    {'type': 'btn', 'x': 1.0, 'y': 6.8, 'w': 8.0, 'h': 1.0, 'bg': '#10b981', 'label': 'Confirm Booking (₹10.00)'},
    {'type': 'text', 'x': 5.0, 'y': 5.8, 'text': 'Payment: Deducted from Campus Wallet', 'size': 7.5, 'ha': 'center', 'color': '#94a3b8'}
], "fig4_6_4_safe_routes.png")

# 4.6.5 Personal Safety Page / Emergency Security
create_mock_mobile("Campus Safety", "Campus Security & Safety", [
    {'type': 'text', 'x': 1.0, 'y': 14.8, 'text': 'Intra-Campus Safety Guardian', 'size': 11, 'weight': 'bold', 'color': '#f87171'},
    {'type': 'box', 'x': 1.0, 'y': 12.2, 'w': 8.0, 'h': 2.0, 'bg': '#450a0a', 'border': '#ef4444',
     'text': '🛡️ TIET Security Control Room: Connected\nEmergency SOS triggers live GPS broadcast\nto Security Gate 1 & Hostels Wardens', 'fontSize': 8, 'textColor': '#fca5a5'},
    {'type': 'box', 'x': 1.0, 'y': 9.8, 'w': 8.0, 'h': 1.8, 'bg': '#1e293b', 'border': '#475569',
     'text': 'Campus Security Helpline: 0175-2393000\nTIET Ambulance / Dispensary: Ext 3112\nWomen Safety Cell: Ext 3555', 'fontSize': 8},
    {'type': 'btn', 'x': 1.0, 'y': 7.5, 'w': 8.0, 'h': 1.2, 'bg': '#dc2626', 'label': '🚨 Emergency Campus SOS'}
], "fig4_6_5_personal_safety.png")

# 4.6.6 Safety Check Page
create_mock_mobile("Safety Check", "Trip Verification & Check-in", [
    {'type': 'text', 'x': 5.0, 'y': 14.5, 'text': '4-Digit Ride Security OTP', 'size': 12, 'weight': 'bold', 'ha': 'center', 'color': '#38bdf8'},
    {'type': 'box', 'x': 2.0, 'y': 11.5, 'w': 6.0, 'h': 2.2, 'bg': '#0f172a', 'border': '#38bdf8',
     'text': '🔑  4 8 2 1', 'fontSize': 18, 'weight': 'bold', 'textColor': '#38bdf8'},
    {'type': 'text', 'x': 5.0, 'y': 10.2, 'text': 'Share this OTP with your Rickshaw Driver\nto authenticate ride before boarding.', 'size': 8.5, 'ha': 'center', 'color': '#cbd5e1'},
    {'type': 'box', 'x': 1.0, 'y': 6.8, 'w': 8.0, 'h': 2.6, 'bg': '#1e293b', 'border': '#475569',
     'text': 'Assigned Driver: Gurmeet Singh\nVehicle: PB-11-ER-3914 (E-Rickshaw)\nRating: ★ 4.9 (184 campus trips)\nStatus: Arrived at Library Portico', 'fontSize': 8.5}
], "fig4_6_6_safety_check.png")

# 4.6.7 My Profile Page
create_mock_mobile("My Profile", "User Account & Role", [
    {'type': 'box', 'x': 3.5, 'y': 12.8, 'w': 3.0, 'h': 2.2, 'bg': '#312e81', 'border': '#6366f1', 'text': '👤\nStudent', 'fontSize': 12, 'textColor': 'white'},
    {'type': 'text', 'x': 5.0, 'y': 12.0, 'text': 'Prabhdeep Singh', 'size': 11, 'weight': 'bold', 'ha': 'center', 'color': 'white'},
    {'type': 'text', 'x': 5.0, 'y': 11.3, 'text': 'Roll No: 2024010078 | MCA Final Year', 'size': 8, 'ha': 'center', 'color': '#94a3b8'},
    {'type': 'box', 'x': 1.0, 'y': 8.5, 'w': 8.0, 'h': 2.2, 'bg': '#1e293b', 'border': '#334155',
     'text': 'Email: psingh_mca@thapar.edu\nPhone: +91 94646 13198\nResidence: Hostel J, Room 214\nVerification: TIET Student Verified', 'fontSize': 8},
    {'type': 'btn', 'x': 1.0, 'y': 6.8, 'w': 8.0, 'h': 0.8, 'bg': '#475569', 'label': 'Edit Profile Details'},
    {'type': 'btn', 'x': 1.0, 'y': 5.6, 'w': 8.0, 'h': 0.8, 'bg': '#dc2626', 'label': 'Sign Out'}
], "fig4_6_7_profile.png")

# 4.6.8 Emergency Contact Page
create_mock_mobile("Emergency Contact", "Emergency Contacts", [
    {'type': 'text', 'x': 1.0, 'y': 14.8, 'text': 'Designated Guardians & Contacts', 'size': 10, 'weight': 'bold', 'color': '#ffffff'},
    {'type': 'box', 'x': 1.0, 'y': 12.2, 'w': 8.0, 'h': 1.8, 'bg': '#1e293b', 'border': '#334155',
     'text': '👤 Contact 1 (Guardian): Rajinder Singh\nRelationship: Father\nPhone: +91 98140 XXXXX', 'fontSize': 8},
    {'type': 'box', 'x': 1.0, 'y': 9.8, 'w': 8.0, 'h': 1.8, 'bg': '#1e293b', 'border': '#334155',
     'text': '🏫 Campus Warden: Dr. K. S. Verma\nLocation: Hostel J Admin\nPhone: Ext 3410', 'fontSize': 8},
    {'type': 'btn', 'x': 1.0, 'y': 8.0, 'w': 8.0, 'h': 0.8, 'bg': '#4f46e5', 'label': '+ Add Trusted Contact'}
], "fig4_6_8_emergency_contact.png")

# 4.6.9 List of Emergency Contacts
create_mock_mobile("Helplines", "Emergency Directory", [
    {'type': 'text', 'x': 1.0, 'y': 14.8, 'text': 'Institutional & National Helplines', 'size': 10, 'weight': 'bold', 'color': '#ffffff'},
    {'type': 'box', 'x': 1.0, 'y': 13.0, 'w': 8.0, 'h': 1.1, 'bg': '#1e293b', 'border': '#475569', 'text': '🚓 Police Helpline: 112', 'fontSize': 8.5},
    {'type': 'box', 'x': 1.0, 'y': 11.5, 'w': 8.0, 'h': 1.1, 'bg': '#1e293b', 'border': '#475569', 'text': '🌸 Women Helpline: 1091', 'fontSize': 8.5},
    {'type': 'box', 'x': 1.0, 'y': 10.0, 'w': 8.0, 'h': 1.1, 'bg': '#1e293b', 'border': '#475569', 'text': '🚑 Ambulance Service: 102', 'fontSize': 8.5},
    {'type': 'box', 'x': 1.0, 'y': 8.5, 'w': 8.0, 'h': 1.1, 'bg': '#1e293b', 'border': '#475569', 'text': '🚒 Fire Emergency: 101', 'fontSize': 8.5},
    {'type': 'box', 'x': 1.0, 'y': 7.0, 'w': 8.0, 'h': 1.1, 'bg': '#1e293b', 'border': '#475569', 'text': '🏛️ TIET Campus Main Gate: 0175-2393000', 'fontSize': 8.5}
], "fig4_6_9_list_contacts.png")

# 4.6.10 Live Sharing / In-Transit Ride
create_mock_mobile("Live Trip", "Trip In-Transit", [
    {'type': 'text', 'x': 5.0, 'y': 14.6, 'text': '🟢 Ride in Progress', 'size': 12, 'weight': 'bold', 'ha': 'center', 'color': '#4ade80'},
    {'type': 'box', 'x': 1.0, 'y': 11.8, 'w': 8.0, 'h': 2.2, 'bg': '#1e293b', 'border': '#22c55e',
     'text': 'En Route to Hostel M\nETA: 2 Minutes  |  Current Speed: 18 km/h\nPassing: COS Block / Synthetic Track', 'fontSize': 8.5},
    {'type': 'btn', 'x': 1.0, 'y': 10.2, 'w': 8.0, 'h': 0.9, 'bg': '#0284c7', 'label': '🔗 Share Live Trip with Friends'},
    {'type': 'box', 'x': 1.0, 'y': 7.2, 'w': 8.0, 'h': 2.4, 'bg': '#0f172a', 'border': '#334155',
     'text': 'Driver: Gurmeet Singh\nVehicle: PB-11-ER-3914\nFare: ₹10.00 (Settled via Wallet)', 'fontSize': 8.5}
], "fig4_6_10_live_sharing.png")

# 4.6.11 Multiple Routes for Destination
create_mock_mobile("Routes", "Campus Route Selection", [
    {'type': 'text', 'x': 1.0, 'y': 14.8, 'text': 'Route Options to Poly Gate', 'size': 10, 'weight': 'bold', 'color': '#ffffff'},
    {'type': 'box', 'x': 1.0, 'y': 12.0, 'w': 8.0, 'h': 2.0, 'bg': '#1e293b', 'border': '#10b981',
     'text': 'Route 1 (Recommended Campus Spine): 0.9 km\nVia Library & Central Park (Lighted Road)\nTime: 3 mins  |  Fare: ₹10', 'fontSize': 8},
    {'type': 'box', 'x': 1.0, 'y': 9.5, 'w': 8.0, 'h': 2.0, 'bg': '#1e293b', 'border': '#475569',
     'text': 'Route 2 (Perimeter Track): 1.4 km\nVia Sports Complex & Athletics Ground\nTime: 5 mins  |  Fare: ₹10', 'fontSize': 8},
    {'type': 'btn', 'x': 1.0, 'y': 8.0, 'w': 8.0, 'h': 0.8, 'bg': '#10b981', 'label': 'Select Route 1 (Safest & Fastest)'}
], "fig4_6_11_multiple_routes.png")

# 4.6.12 Safest Route Selection
create_mock_mobile("Safest Route", "Recommended Campus Route", [
    {'type': 'text', 'x': 1.0, 'y': 14.8, 'text': 'Confirmed Optimal Route', 'size': 11, 'weight': 'bold', 'color': '#ffffff'},
    {'type': 'box', 'x': 1.0, 'y': 10.5, 'w': 8.0, 'h': 3.6, 'bg': '#064e3b', 'border': '#10b981',
     'text': '✅ Verified Well-Lit Campus Arterial\n\nOrigin: Central Library Portico\nWaypoint: COS Main Crossing\nDestination: Polytechnic Gate\n\nStreet Lighting Status: 100% Operational\nCampus Security CCTV Coverage: Continuous', 'fontSize': 8.5, 'textColor': '#a7f3d0'},
    {'type': 'btn', 'x': 1.0, 'y': 9.0, 'w': 8.0, 'h': 0.9, 'bg': '#10b981', 'label': 'Dispatch E-Rickshaw'}
], "fig4_6_12_safest_route.png")

# 4.6.13 Emergency SOS
create_mock_mobile("SOS Alert", "Emergency SOS Screen", [
    {'type': 'text', 'x': 5.0, 'y': 14.8, 'text': 'EMERGENCY SOS', 'size': 13, 'weight': 'bold', 'ha': 'center', 'color': '#ef4444'},
    {'type': 'text', 'x': 5.0, 'y': 13.8, 'text': 'Press button to notify TIET Security', 'size': 8, 'ha': 'center', 'color': '#94a3b8'},
    {'type': 'box', 'x': 2.5, 'y': 8.5, 'w': 5.0, 'h': 4.5, 'bg': '#ef4444', 'border': '#b91c1c', 'text': 'SOS\nALERT', 'fontSize': 16, 'weight': 'bold', 'textColor': 'white'},
    {'type': 'text', 'x': 5.0, 'y': 7.2, 'text': 'Instant notification with GPS sent to\nMain Security Post & Campus Ambulance.', 'size': 8, 'ha': 'center', 'color': '#cbd5e1'}
], "fig4_6_13_emergency_sos.png")

# 4.6.14 Safety Audit
create_mock_mobile("Safety Audit", "Campus Transit Audit", [
    {'type': 'text', 'x': 1.0, 'y': 14.8, 'text': 'Ride Safety Feedback & Audit', 'size': 10, 'weight': 'bold', 'color': '#ffffff'},
    {'type': 'text', 'x': 1.0, 'y': 13.8, 'text': 'How was your campus journey?', 'size': 8.5, 'color': '#94a3b8'},
    {'type': 'box', 'x': 1.0, 'y': 11.8, 'w': 8.0, 'h': 1.4, 'bg': '#1e293b', 'border': '#334155', 'text': 'Driver Courtesy & Punctuality: ★★★★★', 'fontSize': 8.5},
    {'type': 'box', 'x': 1.0, 'y': 10.0, 'w': 8.0, 'h': 1.4, 'bg': '#1e293b', 'border': '#334155', 'text': 'Route Pathway Lighting: Excellent', 'fontSize': 8.5},
    {'type': 'box', 'x': 1.0, 'y': 8.2, 'w': 8.0, 'h': 1.4, 'bg': '#1e293b', 'border': '#334155', 'text': 'Vehicle Condition: E-Rickshaw Clean', 'fontSize': 8.5},
    {'type': 'btn', 'x': 1.0, 'y': 6.5, 'w': 8.0, 'h': 0.9, 'bg': '#4f46e5', 'label': 'Submit Audit Report'}
], "fig4_6_14_safety_audit.png")

print("All 14 UI implementation screenshots generated in:", out_dir)
