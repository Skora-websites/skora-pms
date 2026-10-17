# DESIGN SYSTEM & UI/UX SPECIFICATION: "SKORACARES CLINIC OS" (PMS)

> **Platform:** SkoraCares Clinic OS / PMS (Practice Management System)  
> **Source Reference:** [https://pms.skorainfotech.com/](https://pms.skorainfotech.com/)  
> **Design Language:** Modern HealthTech Bento Grid • Neo-Clean Medical Minimalism • Mint, Deep Emerald & Clinical Slate  
> **Audience:** Solo Practitioners, Polyclinics, Multi-Branch Hospitals, Lab Technicians, & Staff  

---

## 1. Executive Summary & Aesthetic Architecture

**SkoraCares Clinic OS** translates clinical workflows (OPD, digital prescriptions, multi-vendor lab testing, consent forms, home visits, multi-clinic records) into an intuitive, low-fatigue bento-grid user experience. The interface combines soft continuous corner curvature with high-density data visualizations, ensuring doctors and administrative staff can rapidly act on urgent patient care signals without cognitive overload.

### Core Visual Principles
1. **Clinical Calm & High Legibility:** Ultra-clean off-white/slate backgrounds (`#F8FAF9` / `#ECEEEB`) paired with high-contrast forest green anchors (`#0E382B`, `#114232`) and mint accents (`#1FD186`) that inspire trust and modern hygiene.
2. **Accessible Medical Bento Grid:** Specialized information tiles (Capacity Gauges, Live Prescriptions, Home Visits with GPS indicators, Revenue Ledgers) housed in uniform continuous cards (`radius: 20px - 24px`).
3. **Pattern-Hatched Progress & Capacity Indicators:** 45-degree diagonal hatching used alongside solid fills for clinic load, pending lab test results, and follow-up queues to aid visual differentiation.
4. **Contextual Action Anchors:** Floating status chips ("Online", "Uploaded just now", "Map navigation ready") provide real-time reassurance.

---

## 2. Color System & Design Tokens

### 2.1 Primary & Healthcare Accent Palette
| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| `--color-primary-dark` | `#0E382B` | Primary CTAs ("Book Appointment", "Start Free Trial"), Header text |
| `--color-primary-forest` | `#114232` | Dark hero cards, Active state containers, Doctor badge frames |
| `--color-accent-mint` | `#1FD186` | Logo accents, "Online" status dot, Capacity fill, High priority CTAs |
| `--color-accent-sage` | `#45B387` | Analytics charts, completed appointment tags |
| `--color-accent-light-mint` | `#D2F4E6` | Metric pill badges, active tab background |
| `--color-clinical-blue` | `#0EA5E9` | Lab test integration icons, Prescription uploads |
| `--color-accent-amber` | `#F59E0B` | In-progress home visits, billing pending tags |

### 2.2 Semantic Status Tokens
| Token Name | Hex Code | Semantic Role |
| :--- | :--- | :--- |
| `--status-completed-bg` | `#F1F5F3` | "Completed / Dispensed" badge background |
| `--status-completed-text` | `#114232` | "Completed" label typography |
| `--status-in-progress-bg` | `#FEF6E8` | "In Progress / En Route" badge background |
| `--status-in-progress-text` | `#C68218` | "In Progress" label typography |
| `--status-pending-bg` | `#FDECEE` | "Lab Result Pending / Due" badge background |
| `--status-pending-text` | `#D9534F` | "Pending" label typography |
| `--status-verified` | `#10B981` | HIPAA-grade compliance & Verified Doctor seals |

### 2.3 Neutral Palette & Typography
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `--surface-canvas` | `#ECEEEB` | Global dashboard viewport background |
| `--surface-card` | `#FFFFFF` | Bento cards, Modal surfaces, Data containers |
| `--surface-card-subtle` | `#F8FAF9` | Inner inputs, Search bar, Prescription tables |
| `--text-primary` | `#141716` | Main clinical headers, Doctor names, Metric numbers |
| `--text-secondary` | `#6C7470` | Specialization, Timings, Subtitles, Due dates |
| `--text-muted` | `#9DA4A0` | Keyboard hints (`⌘F`), Axis labels, Metadata |
| `--border-subtle` | `#E2E7E4` | Card outlines, Table borders, Avatar rings |

---

## 3. Typography Hierarchy

**Primary Typeface:** `Plus Jakarta Sans` or `Inter` (sans-serif)  
**Monospace / Numbers:** `JetBrains Mono` or tabular numerals (`font-feature-settings: "tnum"`) for timers, currency (`₹`), and lab parameters.

| Level | Size | Weight | Line Height | Tracking | Component Context |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display H1** | `26px` (`1.625rem`) | 700 (Bold) | `32px` | `-0.02em` | View Title ("Clinic OS Dashboard", "OPD Console") |
| **Card Header H2** | `17px` (`1.0625rem`) | 600 (SemiBold) | `22px` | `-0.01em` | Section Titles ("Patient Analytics", "Follow-up Reminders") |
| **Metric Value** | `34px` (`2.125rem`) | 700 (Bold) | `40px` | `-0.03em` | Primary KPIs (`128`, `32`, `₹48k`, `4.9★`) |
| **Timer / Counter** | `30px` (`1.875rem`) | 600 (SemiBold) | `36px` | `0.02em` | Consultation Timer (`01:24:08`) |
| **Body Primary** | `13px` (`0.8125rem`) | 500 (Medium) | `18px` | `0em` | Doctor names, Patient names, Lab items |
| **Body Secondary** | `12px` (`0.75rem`) | 400 (Regular) | `16px` | `0em` | Symptoms, Specialization, Timings, Clinic branch |
| **Micro Caption** | `10px` (`0.625rem`) | 600 (SemiBold) | `14px` | `+0.04em` | Navigation tags, Compliance chips, "ONLINE" indicator |

---

## 4. Spacing, Geometry & Elevation

- **Base Grid Unit:** `4px` / `8px`
- **Outer Canvas Padding:** `24px`
- **Main Bento Grid Gap:** `16px`
- **Card Border Radius:**
  - Bento Widgets: `24px`
  - Floating Tooltips & Badges: `9999px` (Full round pill)
  - Navigation Buttons: `9999px`
  - Action Chips: `12px` - `16px`
- **Box Shadows:**
  - Standard Bento Tile: `0 1px 3px rgba(0, 0, 0, 0.02), 0 6px 16px rgba(0, 0, 0, 0.02)`
  - Elevated Popover / Active Pill: `0 4px 14px rgba(17, 66, 50, 0.15)`
  - Border: `1px solid #E2E7E4`

---

## 5. Comprehensive Layout & Component Breakdown

```
+--------------------------------------------------------------------------------------------------------------------------------+
| [O] SkoraCares Clinic OS   |  [Q] Search patient, prescription, lab... [Cmd+F]    [@ Notifications] [!] Alerts   [Dr. Aarav S.]|
+----------------------------+---------------------------------------------------------------------------------------------------+
| CLINICAL MODULES           |  CLINIC OS DASHBOARD                                            [ + New Appointment ] [ Add Patient]
|  * Overview / Dashboard    |  Real-time practice intelligence and multi-clinic orchestration.                                 |
|  * Patient Records (50K+)  +-----------------------+---------------------+---------------------+-------------------------------+
|  * OPD & Appointments      | Patients This Week    | Appointments Today  | Monthly Billing     | Patient Rating                |
|  * Digital Prescriptions   | 128                   | 32                  | ₹48,000             | 4.9 ★                         |
|  * Lab Tests (Multi-Vendor)| [↑ 14% vs last week]  | [4 urgent follow-up]| [Ledger Synced]     | [98% positive]                |
|  * Home Visits & Maps      +-----------------------+---------------------+---------------------+-------------------------------+
|  * Inventory & Expenses    | CLINIC OCCUPANCY      | LIVE CONSULTATION   | MULTI-VENDOR LAB & OPD QUEUE                          |
| GENERAL & SETTINGS         | [Bar Chart: S-M-T..]  | Dr. Aarav Sharma    | 1. Develop API / Blood Test (Due: 11:30 am)           |
|  * Multi-Clinic Switcher   | Capacity: 72%         | 02:00 pm - 04:00 pm | 2. Onboarding / Consent Form (Due: 12:00 pm)          |
|  * Staff & Role Mgmt       | Peak Day: Wednesday   | [ Start Tele-OPD ]  | 3. Lipid Profile - Vendor: Lal PathLabs               |
|  * White Label Branding    +-----------------------+---------------------+-----------------------------------------------------+
|  * Consent & Legal         | STAFF & ON-DUTY ROLES               | CLINIC CAPACITY GAUGE  | CONSULTATION TRACKER                 |
| [Download Doctor App]      | Dr. Ranjit Singh - General OPD      | [ 72% Semi-Donut ]     | [ 00:24:18 ]                         |
| 24x7 WhatsApp Support      | Dr. Priya Mehta  - Pediatric Lead   | Clinic Capacity Active | [ (||) Pause ]  [ (Stop/Prescribe) ] |
+----------------------------+-------------------------------------+------------------------+------------------------------------+
```

### 5.1 Left Sidebar (`w: 240px`)
- **Header / Brand:**
  - Mint loop / clinical pulse emblem (`#1FD186`) + bold text **"SkoraCares"** with secondary text **"Clinic OS"**.
- **Clinical Navigation:**
  - `CLINICAL MODULES`:
    - **Dashboard** (Active high-contrast emerald indicator)
    - **Patient Records** (Badge: `50K+` pill)
    - **OPD & Appointments**
    - **Digital Prescriptions** (Quick upload trigger)
    - **Multi-Vendor Lab Tests**
    - **Home Visits** (Integrated Map GPS badge)
    - **I/E Management** (Inventory & Clinic Expenses)
  - `ADMINISTRATION`:
    - **Multi-Clinic Management** (Branch selector)
    - **Staff & Role Management** (Granular access control)
    - **Financial Ledger**
    - **White Label Settings**
- **Sidebar Footer Promo:**
  - Dark forest container (`#0D261E`) with contour lines:
  - "Download Doctor App" • "Manage appointments on the move"
  - CTA Button: "Download App" + 24×7 WhatsApp Support indicator link (`+91 921 7375 831`).

### 5.2 Top Navigation Bar (`h: 68px`)
- **Global Search:**
  - Pill input container (`h: 40px`, `min-w: 360px`, bg: `#FFFFFF`, border: `1px solid #E2E7E4`).
  - Search placeholder: "Search patient by UHID, phone, prescription or lab..."
  - Shortcut chip: `⌘F`
- **Compliance Badges:**
  - Pill chip: `🔒 HIPAA-Grade Security` • `🇮🇳 Made in India`
- **Utility Actions:**
  - Notification bell (with red active dot for pending urgent lab results).
  - Quick WhatsApp sync icon button.
- **Provider Profile:**
  - Doctor avatar initials (`AS`), Name: **Dr. Aarav Sharma** (`13px`, Bold), Subtext: **General Physician · New Delhi** (`11px`, `--text-secondary`), with active **Online** green status pill (`#1FD186`).

### 5.3 KPI Metric Cards (Top Bento Row - 4 Cards)
1. **Patients This Week:**
   - Background: Dark Forest Green (`#114232`), Text: White (`#FFFFFF`).
   - Value: `128` (Bold `34px`).
   - Badge: `[+14%] Increased from last week` (`#1F5441`, mint text `#34D399`).
   - Top right: Circular icon arrow (`↗`).
2. **Appointments Today:**
   - Background: Crisp White (`#FFFFFF`), Border: `1px solid #E2E7E4`.
   - Value: `32`.
   - Subtitle chip: `4 Urgent Follow-ups pending`.
3. **Monthly Billing (Ledger):**
   - Background: Crisp White (`#FFFFFF`), Border: `1px solid #E2E7E4`.
   - Value: `₹48,000`.
   - Subtitle chip: `Integrated Billing & I/E synced`.
4. **Patient Satisfaction:**
   - Background: Crisp White (`#FFFFFF`), Border: `1px solid #E2E7E4`.
   - Value: `4.9 ★`.
   - Subtitle chip: `Based on 2,000+ verified ratings`.

---

### 5.4 Mid Bento Row: Patient Analytics, Reminders & Operational Queue

#### Widget A: "Clinic Occupancy & Analytics" (Bar Chart)
- **Header:** "Patient Traffic & Capacity" (`16px`, semi-bold).
- **Day Distribution:** Sunday (`S`) to Saturday (`S`).
- **Bar Types:**
  - Inactive / Low-traffic days (S, Th, F, Sa): 45° diagonal striped hatch (`#CBD5D0`).
  - Moderate Traffic (M): Solid Sage (`#45B387`).
  - Peak Day (T): Mint highlight (`#1FD186`) with floating tooltip: `72% Peak Capacity`.
  - Heavy OPD Day (W): Deep Forest Green (`#114232`).

#### Widget B: "Consultation Reminders"
- **Header:** "Consultation & OPD Schedule" (`16px`, semi-bold).
- **Primary Block:**
  - Title: "Video Consultation — Follow-up Review"
  - Patient: "Patient: Anita Verma (ID: #SK-8821)"
  - Slot: "Time: 02.00 pm - 04.00 pm"
- **Action:**
  - Pill button: `▶ Start Tele-OPD` (`bg: #114232`, text: `#FFFFFF`, icon: Video camera, `border-radius: 9999px`).

#### Widget C: "Active Queue & Lab Orders"
- **Header:** "Clinical Queue" with right-aligned `+ New Order` pill.
- **Queue Items (5 rows with status icons):**
  1. **Online Prescription Upload** • Due: 11:30 AM • Blue prescription glyph (`#3B82F6`).
  2. **Consent Form Submission** • Due: 12:00 PM • Amber pen-to-paper glyph (`#F59E0B`).
  3. **Multi-Vendor Lab: Complete Blood Count** • Lal PathLabs integration • Teal flask glyph (`#0EA5E9`).
  4. **Home Visit with GPS Route** • En route to Sector 62 • Violet navigation arrow (`#8B5CF6`).
  5. **Ledger Billing Clearance** • Patient: Rajesh Khanna • Emerald rupee coin glyph (`#10B981`).

---

### 5.5 Bottom Bento Row: Staff Rostering, Clinic Gauge & Session Tracker

#### Widget D: "Staff & Role Management"
- **Header:** "Staff On-Duty & Roles" with `+ Add Member` pill button.
- **Rows:**
  1. **Dr. Ranjit Singh** • *General Physician (OPD 1)* • Status: `Completed (18 Consults)` (Soft green pill).
  2. **Dr. Priya Mehta** • *Pediatric Specialist (OPD 2)* • Status: `In Consultation` (Amber pill).
  3. **Dr. Anil Kumar** • *Visiting Cardiologist* • Status: `Next Slot 03:30 PM` (Rose pill).
  4. **Nurse Sunita Rao** • *Triage & Consent Forms* • Status: `Active on Duty` (Amber pill).

#### Widget E: "Clinic Capacity & Completion" (Semi-Donut Gauge)
- **Header:** "Clinic Capacity Load" (`16px`, semi-bold).
- **Visualization:**
  - 180° Semi-circular gauge:
    - Filled Arc: Deep Forest Green (`#114232`) representing 72% occupied appointment capacity.
    - Remaining Arc: Diagonal hatched stroke representing open slots.
  - Center Display: `72%` (`28px`, bold) with subtext "Capacity Occupied".
- **Legend:**
  - Completed (`#1FD186`) • Active OPD (`#114232`) • Available Slots (Hatched monochrome).

#### Widget F: "Consultation Tracker" (Dark Theme Utility Card)
- **Surface:** Deepest forest green (`#0C2B21`) with organic topographic elevation curves.
- **Header:** "Consultation Session Timer" (`13px`, mint-tinted white).
- **Display:** `00:24:18` (`30px`, monospace tabular alignment, pure white).
- **Control Triggers:**
  - **Pause / Hold:** Pill capsule button (`bg: #FFFFFF`, pause glyph).
  - **End & Generate Rx:** Circular action button (`bg: #E54848`, check/stop glyph).

---

## 6. Micro-Interactions & State Specifications

```css
/* Bento Card Elevation */
.bento-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
}
.bento-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px -4px rgba(17, 66, 50, 0.08);
}

/* Primary Medical CTA */
.btn-clinic-primary {
  background-color: #114232;
  color: #FFFFFF;
  border-radius: 9999px;
  padding: 10px 20px;
  font-weight: 600;
  transition: all 0.15s ease-out;
}
.btn-clinic-primary:hover {
  background-color: #16533f;
}
.btn-clinic-primary:active {
  transform: scale(0.97);
}

/* Hatched Bar Chart Pattern */
.bar-hatched {
  background: repeating-linear-gradient(
    45deg,
    #CBD5D0,
    #CBD5D0 3px,
    transparent 3px,
    transparent 6px
  );
}
```

---

## 7. Responsive Breakpoint Mapping

| Breakpoint | Viewport Width | Layout Adjustment |
| :--- | :--- | :--- |
| **Desktop (Default)** | `>= 1280px` | Full 3-column clinical Bento layout, 240px persistent medical sidebar. |
| **Laptop / Clinic Tablet Horiz** | `1024px - 1279px` | Left navigation condenses to icon rail (`72px`). Metric row wraps to 2x2. |
| **Nurse Station Tablet** | `768px - 1023px` | Single-column metric stacking, Bento widgets convert into 2-column flex. |
| **Doctor Mobile Phone** | `< 768px` | Full-width linear stream. Navigation moves to sticky bottom app bar. |

---

## 8. Tailwind CSS Configuration Reference

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        skora: {
          canvas: '#ECEEEB',
          card: '#FFFFFF',
          forest: '#114232',
          forestDark: '#0D261E',
          mint: '#1FD186',
          mintLight: '#D2F4E6',
          border: '#E2E7E4',
          subtext: '#6C7470',
          labBlue: '#0EA5E9',
          alertAmber: '#F59E0B',
        }
      },
      borderRadius: {
        'bento': '24px',
        'badge': '9999px',
      }
    }
  }
}
```
