import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
    padding: 24,
    lineHeight: 1.35,
  },
  container: { border: "1px solid #eee", padding: 18 },
  headerRow: { flexDirection: "row", borderBottom: "1.5px solid #333", paddingBottom: 10, marginBottom: 12 },
  headerCol: { flex: 1 },
  headerRight: { flex: 1, alignItems: "flex-end" },
  doctorName: { color: "#8e44ad", fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  clinicName: { color: "#8e44ad", fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 2, textAlign: "right" },
  headerSub: { fontSize: 8.5, color: "#555", marginTop: 1 },
  headerSubRight: { fontSize: 8.5, color: "#555", marginTop: 1, textAlign: "right" },
  patientBox: { backgroundColor: "#fafafa", border: "1px solid #eee", marginBottom: 12 },
  patientRow: { flexDirection: "row", borderBottom: "1px solid #eee" },
  patientCell: { flex: 1, paddingVertical: 5, paddingHorizontal: 8, fontSize: 9 },
  label: { fontFamily: "Helvetica-Bold", color: "#444" },
  section: { marginBottom: 6, fontSize: 10 },
  sectionLabel: { fontFamily: "Helvetica-Bold", color: "#333" },
  medHeader: {
    marginTop: 10,
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#8e44ad",
    borderBottom: "1.5px solid #8e44ad",
    paddingBottom: 3,
  },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: 12 },
  tableRow: { flexDirection: "row", borderBottom: "1px solid #ddd" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fdfbff",
    borderBottom: "1px solid #ddd",
    borderTop: "1px solid #ddd",
  },
  th: { paddingVertical: 6, paddingHorizontal: 6, fontSize: 8, color: "#8e44ad", fontFamily: "Helvetica-Bold" },
  td: { paddingVertical: 6, paddingHorizontal: 6, fontSize: 8.5 },
  instructions: {
    marginBottom: 12,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderLeft: "3px solid #8e44ad",
    backgroundColor: "#fafafa",
    fontSize: 9,
    color: "#333",
  },
  followUp: {
    marginTop: 12,
    padding: 9,
    backgroundColor: "#fffaf0",
    border: "1px dashed #fad390",
    fontSize: 9,
  },
  footer: { marginTop: 40, alignItems: "flex-end" },
  authLabel: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 28 },
  docName: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 2 },
  signatureLine: { width: 150, borderTop: "1.5px solid #333", marginTop: 2 },
});

function drName(name?: string | null) {
  const n = (name ?? "").trim();
  if (!n) return "Dr.";
  return /^dr\.?\s/i.test(n) ? n : `Dr. ${n}`;
}

function patientAge(dob?: string | null) {
  if (!dob) return "—";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "—";
  const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  return `${age}y`;
}

type PdfData = {
  consultation: {
    id: number;
    consultationDate: Date | null;
    symptomsNote: string | null;
    examinationNote: string | null;
    diagnosisNote: string | null;
    labNote: string | null;
    medicationsNote: string | null;
    medicalHistory: string | null;
    followUpDate: string | null;
  };
  patient: { name: string | null; dob: string | null; gender: string | null; phone: string | null; city: string | null; state: string | null } | undefined;
  doctor: { name: string | null; qualification: string | null; registrationNumber: string | null; phone: string | null } | undefined;
  clinic: { clinicName: string | null; address: string | null; phone: string | null } | undefined;
  medications: {
    medicineName: string | null;
    dose: string | null;
    frequency: string | null;
    whenToTake: string | null;
    duration: string | null;
    note: string | null;
  }[];
};

export function PrescriptionPdf({ data }: { data: PdfData }) {
  const { consultation, patient, doctor, clinic, medications } = data;
  const docName = drName(doctor?.name);
  const clinicName = clinic?.clinicName ?? "SkoraCares Clinic";

  return (
    <Document title={`Prescription - ${patient?.name ?? "Patient"}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerCol}>
              <Text style={styles.doctorName}>{docName}</Text>
              <Text style={styles.headerSub}>{doctor?.qualification ?? "Specialist"}</Text>
              {doctor?.registrationNumber && (
                <Text style={styles.headerSub}>Registration No: {doctor.registrationNumber}</Text>
              )}
              {doctor?.phone && <Text style={styles.headerSub}>Mobile: {doctor.phone}</Text>}
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.clinicName}>{clinicName}</Text>
              {clinic?.address && <Text style={styles.headerSubRight}>{clinic.address}</Text>}
              {clinic?.phone && <Text style={styles.headerSubRight}>Contact: {clinic.phone}</Text>}
            </View>
          </View>

          {/* Patient info */}
          <View style={styles.patientBox}>
            <View style={styles.patientRow}>
              <Text style={styles.patientCell}>
                <Text style={styles.label}>Patient Name: </Text>
                {patient?.name ?? "—"}
              </Text>
              <Text style={styles.patientCell}>
                <Text style={styles.label}>Date: </Text>
                {consultation.consultationDate
                  ? new Date(consultation.consultationDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                  : "—"}
              </Text>
            </View>
            <View style={styles.patientRow}>
              <Text style={styles.patientCell}>
                <Text style={styles.label}>Age / Gender: </Text>
                {patientAge(patient?.dob)}, {patient?.gender ?? "—"}
              </Text>
              <Text style={styles.patientCell}>
                <Text style={styles.label}>Mobile No: </Text>
                {patient?.phone ?? "—"}
              </Text>
            </View>
            <View style={styles.patientRow}>
              <Text style={styles.patientCell}>
                <Text style={styles.label}>Address: </Text>
                {[patient?.city, patient?.state].filter(Boolean).join(", ") || "—"}
              </Text>
              <Text style={styles.patientCell}>
                <Text style={styles.label}>Consultation Type: </Text>
                Routine
              </Text>
            </View>
          </View>

          {/* Notes */}
          {consultation.symptomsNote && (
            <View style={styles.section}>
              <Text>
                <Text style={styles.sectionLabel}>Symptoms: </Text>
                {consultation.symptomsNote}
              </Text>
            </View>
          )}
          {consultation.examinationNote && (
            <View style={styles.section}>
              <Text>
                <Text style={styles.sectionLabel}>Examinations: </Text>
                {consultation.examinationNote}
              </Text>
            </View>
          )}
          {consultation.diagnosisNote && (
            <View style={styles.section}>
              <Text>
                <Text style={styles.sectionLabel}>Diagnosis: </Text>
                {consultation.diagnosisNote}
              </Text>
            </View>
          )}
          {consultation.labNote && (
            <View style={styles.section}>
              <Text>
                <Text style={styles.sectionLabel}>Lab Tests: </Text>
                {consultation.labNote}
              </Text>
            </View>
          )}
          {consultation.medicalHistory && (
            <View style={styles.section}>
              <Text>
                <Text style={styles.sectionLabel}>History: </Text>
                {consultation.medicalHistory}
              </Text>
            </View>
          )}

          {/* Medications */}
          <Text style={styles.medHeader}>Medication (Rx)</Text>
          {medications.length > 0 ? (
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: "6%" }]}>S.NO</Text>
                <Text style={[styles.th, { width: "34%" }]}>MEDICINE</Text>
                <Text style={[styles.th, { width: "15%" }]}>DOSE</Text>
                <Text style={[styles.th, { width: "15%" }]}>FREQUENCY</Text>
                <Text style={[styles.th, { width: "15%" }]}>DURATION</Text>
                <Text style={[styles.th, { width: "15%" }]}>NOTES</Text>
              </View>
              {medications.map((m, i) => (
                <View key={i} style={styles.tableRow} wrap={false}>
                  <Text style={[styles.td, { width: "6%", textAlign: "center" }]}>{i + 1}</Text>
                  <Text style={[styles.td, { width: "34%" }]}>{m.medicineName ?? "—"}</Text>
                  <Text style={[styles.td, { width: "15%" }]}>{m.dose ?? "—"}</Text>
                  <Text style={[styles.td, { width: "15%" }]}>
                    {m.frequency ?? "—"}
                    {m.whenToTake ? `\n(${m.whenToTake})` : ""}
                  </Text>
                  <Text style={[styles.td, { width: "15%" }]}>{m.duration ?? "—"}</Text>
                  <Text style={[styles.td, { width: "15%" }]}>{m.note ?? "—"}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontStyle: "italic", color: "#777", fontSize: 9 }}>No medications prescribed.</Text>
          )}

          {consultation.medicationsNote && (
            <View style={styles.instructions}>
              <Text>
                <Text style={styles.label}>Special Instructions: </Text>
                {consultation.medicationsNote}
              </Text>
            </View>
          )}

          {consultation.followUpDate && (
            <View style={styles.followUp}>
              <Text>
                <Text style={styles.label}>Follow-up: </Text>
                {new Date(consultation.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </Text>
            </View>
          )}

          {/* Signature */}
          <View style={styles.footer}>
            <Text style={styles.authLabel}>Authorized Signature</Text>
            <Text style={styles.docName}>{docName}</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>
      </Page>
    </Document>
  );
}
