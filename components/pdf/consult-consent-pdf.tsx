import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
    padding: 30,
    lineHeight: 1.5,
  },
  header: {
    textAlign: "center",
    borderBottom: "2px solid #0e606e",
    paddingBottom: 16,
    marginBottom: 24,
  },
  headerTitle: {
    color: "#0e606e",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  headerSub: {
    color: "#666",
    fontSize: 11,
    marginTop: 4,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    color: "#0e606e",
    fontSize: 13,
    borderLeft: "3px solid #46bccc",
    paddingLeft: 8,
    marginBottom: 10,
    backgroundColor: "#f8fafc",
    paddingVertical: 4,
  },
  infoGrid: { width: "100%", marginBottom: 14 },
  infoRow: { flexDirection: "row", borderBottom: "1px solid #e2e8f0" },
  infoLabel: {
    width: "30%",
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#444",
  },
  infoValue: {
    width: "20%",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
  },
  infoValueWide: {
    width: "70%",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
  },
  consentBox: {
    fontSize: 10,
    backgroundColor: "#fdfdfd",
    padding: 16,
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    lineHeight: 1.6,
    marginBottom: 10,
  },
  signatureBox: { alignItems: "flex-end", marginTop: 30 },
  digitalStamp: {
    border: "2px solid #28a745",
    color: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    textTransform: "uppercase",
    borderRadius: 4,
    opacity: 0.8,
    transform: "rotate(-5deg)",
  },
  stampMeta: { fontSize: 9, color: "#555", marginTop: 8, textAlign: "right" },
  footer: {
    marginTop: 40,
    borderTop: "1px solid #eee",
    paddingTop: 14,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
});

type ConsentPdfData = {
  appointmentId: number;
  date: string;
  time: string;
  caseType: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  acceptedAt: string;
  appName: string;
  slug: string;
};

export function ConsultConsentPdf({ data }: { data: ConsentPdfData }) {
  const {
    appointmentId,
    date,
    time,
    caseType,
    patientName,
    patientId,
    doctorName,
    acceptedAt,
    appName,
  } = data;

  const caseLabel = caseType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Document title={`Consent - ${patientName}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Consultation Consent Certificate</Text>
          <Text style={styles.headerSub}>Issued by {appName}</Text>
        </View>

        {/* Appointment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Appointment ID</Text>
              <Text style={styles.infoValue}>#{appointmentId}</Text>
              <Text style={styles.infoLabel}>Date &amp; Time</Text>
              <Text style={styles.infoValueWide}>{date} at {time}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Consultation Type</Text>
              <Text style={styles.infoValueWide}>{caseLabel}</Text>
            </View>
          </View>
        </View>

        {/* Patient & Doctor Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient &amp; Doctor Details</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Patient Name</Text>
              <Text style={styles.infoValueWide}>{patientName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Patient ID</Text>
              <Text style={styles.infoValueWide}>{patientId || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Doctor Name</Text>
              <Text style={styles.infoValueWide}>Dr. {doctorName}</Text>
            </View>
          </View>
        </View>

        {/* Consent Declaration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consent Declaration</Text>
          <View style={styles.consentBox}>
            <Text>
              I, {patientName}, hereby provide my full consent for the medical consultation
              as scheduled. I confirm that I have reviewed the consultation documents
              provided by Dr. {doctorName} and agree to proceed with the treatment/advice
              as discussed.{'\n\n'}
              This consent has been provided digitally through the {appName} Patient Portal.
              I understand that this electronic confirmation carries the same weight as a
              physical signature for the purposes of this medical record.
            </Text>
          </View>
        </View>

        {/* Digital Stamp */}
        <View style={styles.signatureBox}>
          <Text style={styles.digitalStamp}>Digitally Accepted</Text>
          <Text style={styles.stampMeta}>
            Accepted On: {acceptedAt}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is a computer-generated document and does not require a physical signature.
          </Text>
          <Text>
            &copy; {new Date().getFullYear()} {appName}. All rights reserved.
          </Text>
        </View>
      </Page>
    </Document>
  );
}