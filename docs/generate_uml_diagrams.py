import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

out_dir = r"C:\Users\kkart\.gemini\antigravity\scratch\SmartRideTIET\docs\uml_diagrams"
os.makedirs(out_dir, exist_ok=True)

# ── 1. Figure 4.1: Block Diagram ──────────────────────────
fig, ax = plt.subplots(figsize=(7, 10))
ax.axis('off')

def draw_oval(ax, x, y, w, h, text):
    ellipse = patches.Ellipse((x, y), w, h, edgecolor='black', facecolor='white', lw=1.5)
    ax.add_patch(ellipse)
    ax.text(x, y, text, ha='center', va='center', fontsize=11, weight='normal')

def draw_rect(ax, x, y, w, h, text):
    rect = patches.Rectangle((x - w/2, y - h/2), w, h, edgecolor='black', facecolor='white', lw=1.5)
    ax.add_patch(rect)
    ax.text(x, y, text, ha='center', va='center', fontsize=10.5, weight='normal')

def draw_diamond(ax, x, y, w, h, text):
    pts = [[x, y + h/2], [x + w/2, y], [x, y - h/2], [x - w/2, y]]
    poly = patches.Polygon(pts, edgecolor='black', facecolor='white', lw=1.5)
    ax.add_patch(poly)
    ax.text(x, y, text, ha='center', va='center', fontsize=9.5, weight='normal')

def draw_arrow(ax, x1, y1, x2, y2, label=None, label_pos=None):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
    if label and label_pos:
        ax.text(label_pos[0], label_pos[1], label, fontsize=9.5)

ax.set_xlim(0, 10)
ax.set_ylim(0, 14)

# Elements matching reference Fig 4.1 layout
draw_oval(ax, 5, 13.2, 2.2, 0.9, "Start")
draw_rect(ax, 5, 11.6, 4.4, 0.8, "User Opens SmartRideTIET App")
draw_rect(ax, 5, 10.0, 5.6, 0.8, "Pickup Landmark & Destination Request")
draw_rect(ax, 5, 8.4, 5.6, 0.8, "Campus Spatial Data & Fleet Processing")

# Two parallel boxes
draw_rect(ax, 2.8, 6.8, 3.6, 0.9, "Landmark Geofencing\n(TIET 60+ Waypoints)")
draw_rect(ax, 7.2, 6.8, 3.6, 0.9, "Surge & Demand\nPrediction (FastAPI ML)")

# Converge
draw_rect(ax, 5, 5.2, 5.6, 0.8, "Ride Dispatched & Driver Assigned")

# Decision Diamond
draw_diamond(ax, 5, 3.6, 2.8, 1.4, "Emergency / \nSecurity Check?")

# Decision branches
draw_rect(ax, 2.5, 1.8, 3.2, 0.8, "Send Alert to Campus\nSecurity / Contact")
draw_rect(ax, 7.5, 1.8, 3.2, 0.8, "Start In-Transit Ride\n(4-Digit OTP Verified)")

draw_oval(ax, 5, 0.5, 2.2, 0.8, "End")

# Connecting arrows
draw_arrow(ax, 5, 12.75, 5, 12.0)
draw_arrow(ax, 5, 11.2, 5, 10.4)
draw_arrow(ax, 5, 9.6, 5, 8.8)

draw_arrow(ax, 3.5, 8.0, 2.8, 7.25)
draw_arrow(ax, 6.5, 8.0, 7.2, 7.25)

draw_arrow(ax, 2.8, 6.35, 3.8, 5.6)
draw_arrow(ax, 7.2, 6.35, 6.2, 5.6)

draw_arrow(ax, 5, 4.8, 5, 4.3)

draw_arrow(ax, 3.6, 3.6, 2.5, 2.2, "Yes", (2.8, 3.8))
draw_arrow(ax, 6.4, 3.6, 7.5, 2.2, "No", (6.8, 3.8))

draw_arrow(ax, 2.5, 1.4, 4.0, 0.7)
draw_arrow(ax, 7.5, 1.4, 6.0, 0.7)

plt.tight_layout()
plt.savefig(os.path.join(out_dir, "fig4_1_block_diagram.png"), dpi=200)
plt.close()

# ── 2. Figure 4.2: Work Breakdown Structure (Gantt Chart style) ─────
fig, ax = plt.subplots(figsize=(11, 6))
phases = [
    "Project Initiation & Architecture",
    "Requirements & Campus Survey",
    "Firebase Firestore & Auth Setup",
    "UI/UX Design & Components",
    "Ride Dispatch State Machine",
    "TIET 60+ Landmarks Calibration",
    "Razorpay & Wallet Integration",
    "Driver Verification & Radar",
    "Python FastAPI ML Server",
    "Admin Dashboard & Telemetry",
    "Testing & Quality Assurance",
    "Packaging & Final Deployment"
]
start_weeks = [1, 2, 3, 3, 5, 6, 7, 7, 8, 8, 9, 10]
duration_weeks = [2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2, 1]

y_pos = range(len(phases))[::-1]
for i in range(len(phases)):
    ax.barh(y_pos[i], duration_weeks[i], left=start_weeks[i], height=0.55,
            color='#1d4ed8' if i % 2 == 0 else '#2563eb', edgecolor='black')

ax.set_yticks(y_pos)
ax.set_yticklabels(phases, fontsize=9.5)
ax.set_xlabel('Project Schedule (Weeks 1 to 10)', fontsize=11, fontweight='bold')
ax.set_xticks(range(1, 12))
ax.set_xticklabels([f'W{w}' for w in range(1, 12)], fontsize=10)
ax.grid(axis='x', linestyle='--', alpha=0.7)
plt.title('Work Breakdown Structure (WBS) & Engineering Gantt Timeline', fontsize=12, fontweight='bold', pad=10)
plt.tight_layout()
plt.savefig(os.path.join(out_dir, "fig4_2_work_breakdown_structure.png"), dpi=200)
plt.close()

# ── 3. Figure 4.3: Class Diagram ──────────────────────────
fig, ax = plt.subplots(figsize=(10, 8))
ax.axis('off')

def draw_uml_class(ax, x, y, w, h, name, attrs, methods):
    # outer box
    rect = patches.Rectangle((x - w/2, y - h/2), w, h, edgecolor='black', facecolor='#f8fafc', lw=1.2)
    ax.add_patch(rect)
    # header line
    ax.plot([x - w/2, x + w/2], [y + h/2 - 0.5, y + h/2 - 0.5], color='black', lw=1)
    ax.text(x, y + h/2 - 0.28, name, ha='center', va='center', fontsize=9.5, weight='bold')
    # attrs
    curr_y = y + h/2 - 0.75
    for a in attrs:
        ax.text(x - w/2 + 0.15, curr_y, a, ha='left', va='center', fontsize=8, family='monospace')
        curr_y -= 0.28
    # sep line
    ax.plot([x - w/2, x + w/2], [curr_y + 0.1, curr_y + 0.1], color='black', lw=1)
    curr_y -= 0.15
    # methods
    for m in methods:
        ax.text(x - w/2 + 0.15, curr_y, m, ha='left', va='center', fontsize=8, family='monospace')
        curr_y -= 0.28

ax.set_xlim(0, 14)
ax.set_ylim(0, 11)

draw_uml_class(ax, 3, 9, 3.2, 2.6, "User", 
               ["-userId: String", "-name: String", "-email: String", "-role: String"],
               ["+login(): Boolean", "+logout(): void", "+updateProfile()"])

draw_uml_class(ax, 7.5, 9, 3.4, 2.6, "Driver", 
               ["-driverId: String", "-vehicleNum: String", "-isVerified: Boolean", "-isOnline: Boolean"],
               ["+acceptRide(): void", "+verifyOTP(): Boolean", "+completeRide()"])

draw_uml_class(ax, 11.8, 9, 3.0, 2.6, "SafetyAlert", 
               ["-alertId: String", "-userId: String", "-location: String"],
               ["+sendSOS(): void", "+notifySecurity()"])

draw_uml_class(ax, 3, 5.2, 3.4, 3.2, "Ride", 
               ["-rideId: String", "-studentId: String", "-pickup: String", "-drop: String", "-fare: Double", "-status: String", "-otp: String"],
               ["+calculateFare()", "+transition()", "+verifyOTP()"])

draw_uml_class(ax, 7.5, 5.2, 3.4, 2.8, "Wallet", 
               ["-walletId: String", "-userId: String", "-balance: Double"],
               ["+credit(amt): void", "+debit(amt): Boolean", "+getBalance(): Double"])

draw_uml_class(ax, 11.8, 5.2, 3.0, 2.8, "PaymentService", 
               ["-orderId: String", "-signature: String"],
               ["+createOrder()", "+verifyHMAC(): Bool", "+processRefund()"])

draw_uml_class(ax, 5.5, 1.6, 4.4, 2.4, "MLPredictionService", 
               ["-modelPath: String", "-endpoint: String"],
               ["+predictDemand(df): Int", "+forecastRevenue(df): Double", "+calcSurge(ratio): Double"])

draw_uml_class(ax, 11.0, 1.6, 3.8, 2.4, "Database (Firestore)", 
               ["-collections: Map"],
               ["+save(obj): Boolean", "+find(query): Object", "+transaction(): void"])

# Connector lines
ax.plot([4.6, 5.8], [9, 9], 'k-', lw=1)
ax.plot([3, 3], [7.7, 6.8], 'k-', lw=1)
ax.plot([4.7, 5.8], [5.2, 5.2], 'k-', lw=1)
ax.plot([9.2, 10.3], [5.2, 5.2], 'k-', lw=1)
ax.plot([5.5, 5.5], [3.6, 2.8], 'k--', lw=1)
ax.plot([11.8, 11.8], [3.8, 2.8], 'k--', lw=1)

plt.tight_layout()
plt.savefig(os.path.join(out_dir, "fig4_3_class_diagram.png"), dpi=200)
plt.close()

# ── 4. Figure 4.4: Use Case Diagram ───────────────────────
fig, ax = plt.subplots(figsize=(9, 7))
ax.axis('off')
ax.set_xlim(0, 12)
ax.set_ylim(0, 10)

# System boundary
rect = patches.Rectangle((3, 0.5), 6, 9, edgecolor='black', facecolor='#ffffff', lw=1.5)
ax.add_patch(rect)
ax.text(6, 9.2, "SmartRideTIET Platform", ha='center', va='center', fontsize=11, weight='bold')

def draw_actor(ax, x, y, label):
    # head
    ax.add_patch(patches.Circle((x, y + 0.4), 0.2, edgecolor='black', facecolor='white', lw=1.2))
    # body
    ax.plot([x, x], [y + 0.2, y - 0.3], 'k-', lw=1.2)
    # arms
    ax.plot([x - 0.3, x + 0.3], [y, y], 'k-', lw=1.2)
    # legs
    ax.plot([x, x - 0.25], [y - 0.3, y - 0.8], 'k-', lw=1.2)
    ax.plot([x, x + 0.25], [y - 0.3, y - 0.8], 'k-', lw=1.2)
    ax.text(x, y - 1.1, label, ha='center', va='center', fontsize=9.5, weight='bold')

def draw_usecase(ax, x, y, text):
    ellipse = patches.Ellipse((x, y), 3.4, 0.75, edgecolor='black', facecolor='#f1f5f9', lw=1.2)
    ax.add_patch(ellipse)
    ax.text(x, y, text, ha='center', va='center', fontsize=8.5, weight='normal')

draw_actor(ax, 1.2, 5.5, "Student")
draw_actor(ax, 10.8, 7.0, "Rickshaw Driver")
draw_actor(ax, 10.8, 3.0, "Campus Admin")

usecases = [
    (6, 8.3, "Sign Up / Login"),
    (6, 7.3, "View Campus Map"),
    (6, 6.3, "Book Campus Ride"),
    (6, 5.3, "Manage Wallet & Top Up"),
    (6, 4.3, "Accept / Fulfill Ride"),
    (6, 3.3, "Verify 4-Digit OTP"),
    (6, 2.3, "Verify Driver Licenses"),
    (6, 1.3, "Audit ML Analytics")
]

for uc in usecases:
    draw_usecase(ax, uc[0], uc[1], uc[2])

# Actor to usecase lines
# Student
for y_c in [8.3, 7.3, 6.3, 5.3]:
    ax.plot([1.5, 4.3], [5.5, y_c], 'k-', lw=0.9)

# Driver
for y_c in [8.3, 4.3, 3.3]:
    ax.plot([10.5, 7.7], [7.0, y_c], 'k-', lw=0.9)

# Admin
for y_c in [8.3, 2.3, 1.3]:
    ax.plot([10.5, 7.7], [3.0, y_c], 'k-', lw=0.9)

plt.tight_layout()
plt.savefig(os.path.join(out_dir, "fig4_4_use_case_diagram.png"), dpi=200)
plt.close()

# ── 5. Figure 4.5: Sequence Diagram ───────────────────────
fig, ax = plt.subplots(figsize=(9, 10))
ax.axis('off')
ax.set_xlim(0, 10)
ax.set_ylim(0, 14)

lifelines = [(1.5, "Student"), (4.5, "SmartRideTIET App"), (8.5, "Database (Firestore)")]

for x, label in lifelines:
    ax.text(x, 13.5, label, ha='center', va='center', fontsize=10, weight='bold',
            bbox=dict(boxstyle="square,pad=0.4", fc="white", ec="black"))
    ax.plot([x, x], [13.0, 0.8], 'k--', lw=1)

def seq_msg(ax, y, x1, x2, text, is_dashed=False):
    style = "-->" if is_dashed else "->"
    ls = '--' if is_dashed else '-'
    ax.annotate('', xy=(x2, y), xytext=(x1, y),
                arrowprops=dict(arrowstyle="->", linestyle=ls, color="black", lw=1.1))
    mid_x = (x1 + x2) / 2
    ax.text(mid_x, y + 0.18, text, ha='center', va='center', fontsize=8.2, family='sans-serif')

events = [
    (12.2, 1.5, 4.5, "Open App / Enter Credentials", False),
    (11.4, 4.5, 8.5, "Validate User & Auth Token", False),
    (10.6, 8.5, 4.5, "Return Auth Status & User Profile", True),
    (9.8, 4.5, 1.5, "Display Student Home Screen", True),
    (9.0, 1.5, 4.5, "Select Pickup & Drop Landmarks", False),
    (8.2, 4.5, 8.5, "Fetch Fare & Active Rickshaws", False),
    (7.4, 8.5, 4.5, "Return ₹10 Flat Fare & Driver Match", True),
    (6.6, 4.5, 1.5, "Display Ride Confirmed & 4-Digit OTP", True),
    (5.8, 1.5, 4.5, "Share OTP verbally with Driver at Pickup", False),
    (5.0, 4.5, 8.5, "Verify OTP & Transition to IN_TRANSIT", False),
    (4.2, 8.5, 4.5, "Confirm State: IN_TRANSIT", True),
    (3.4, 4.5, 1.5, "Show Live Trip In-Progress Screen", True),
    (2.6, 4.5, 8.5, "Complete Ride -> Debit Wallet Balance", False),
    (1.8, 8.5, 4.5, "Return Receipt & Payout Status", True),
    (1.0, 4.5, 1.5, "Display Trip Completed & Rating Prompt", True)
]

for y, x1, x2, text, dashed in events:
    seq_msg(ax, y, x1, x2, text, dashed)

plt.tight_layout()
plt.savefig(os.path.join(out_dir, "fig4_5_sequence_diagram.png"), dpi=200)
plt.close()

print("All 5 UML diagrams generated in:", out_dir)
