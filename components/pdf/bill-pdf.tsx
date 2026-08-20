import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type BillPdfData = {
  billNumber: string;
  billDate: string;
  patientName: string;
  patientId: string;
  patientPhone: string | null;
  patientEmail: string | null;
  doctorName: string;
  doctorQualification: string | null;
  billingTypeName: string;
  totalAmount: string;
  receivedAmount: string;
  pendingAmount: string;
  paymentMethod: string | null;
  status: string;
  notes: string | null;
  printDate: string;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#333",
    padding: 30,
    lineHeight: 1.4,
  },
  headerBg: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  headerTitle: {
    textAlign: "center",
    color: "#0e606e",
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  headerDoctor: {
    textAlign: "center",
    fontSize: 10,
    color: "#444",
    marginTop: 3,
    fontFamily: "Helvetica-Bold",
  },
  headerSub: {
    textAlign: "center",
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#555",
    marginBottom: 2,
  },
  sectionTitle: {
    color: "#0e606e",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    borderLeft: "3px solid #46bccc",
    paddingLeft: 8,
    backgroundColor: "#f1f5f9",
    paddingVertical: 4,
    marginTop: 12,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    borderBottom: "1px solid #eee",
    paddingVertical: 5,
    fontSize: 8.5,
  },
  infoLabel: {
    width: "32%",
    color: "#555",
    fontFamily: "Helvetica-Bold",
  },
  infoValue: {
    width: "68%",
  },
  table: {
    width: "100%",
    borderTop: "1px solid #ddd",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #eee",
    paddingVertical: 6,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    paddingVertical: 5,
    fontFamily: "Helvetica-Bold",
    borderBottom: "1px solid #ccc",
    fontSize: 8.5,
  },
  thDesc: { width: "55%", paddingHorizontal: 6 },
  thAmount: { width: "45%", paddingHorizontal: 6, textAlign: "right" },
  tdDesc: { width: "55%", paddingHorizontal: 6 },
  tdAmount: { width: "45%", paddingHorizontal: 6, textAlign: "right" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  summaryLabel: {
    width: 130,
    textAlign: "right",
    paddingRight: 10,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
  },
  summaryValue: {
    width: 90,
    textAlign: "right",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
  },
  pendingValue: { color: "#dc3545" },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8.5,
    marginTop: 8,
  },
  statusPaid: { color: "#28a745", fontFamily: "Helvetica-Bold" },
  statusPartial: { color: "#ffc107", fontFamily: "Helvetica-Bold" },
  statusPending: { color: "#dc3545", fontFamily: "Helvetica-Bold" },
  notesBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#fafafa",
    fontSize: 8.5,
    borderLeft: "3px solid #46bccc",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 30,
    right: 30,
    borderTop: "1px solid #ddd",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#888",
  },
});

const statusStyle = (status: string) =>
  status === "paid"
    ? styles.statusPaid
    : status === "partial"
      ? styles.statusPartial
      : styles.statusPending;

export function BillPdf({ data }: { data: BillPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBg}>
          <Text style={styles.headerTitle}>MEDICAL BILL</Text>
          <Text style={styles.headerDoctor}>Dr. {data.doctorName}</Text>
          {data.doctorQualification && (
            <Text style={styles.headerSub}>{data.doctorQualification}</Text>
          )}
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <Text>Bill No: {data.billNumber}</Text>
          <Text>Bill Date: {data.billDate}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text>Printed: {data.printDate}</Text>
          <Text>Patient ID: {data.patientId}</Text>
        </View>

        {/* Patient */}
        <Text style={styles.sectionTitle}>PATIENT INFORMATION</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{data.patientName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mobile</Text>
          <Text style={styles.infoValue}>{data.patientPhone ?? "-"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{data.patientEmail ?? "-"}</Text>
        </View>

        {/* Billing summary */}
        <Text style={styles.sectionTitle}>BILLING SUMMARY</Text>
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={styles.thDesc}>Description</Text>
            <Text style={styles.thAmount}>Amount (₹)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tdDesc}>{data.billingTypeName}</Text>
            <Text style={styles.tdAmount}>₹{Number(data.totalAmount).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount:</Text>
          <Text style={styles.summaryValue}>₹{Number(data.totalAmount).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Received Amount:</Text>
          <Text style={styles.summaryValue}>₹{Number(data.receivedAmount).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pending Amount:</Text>
          <Text style={[styles.summaryValue, styles.pendingValue]}>
            ₹{Number(data.pendingAmount).toFixed(2)}
          </Text>
        </View>

        {/* Payment */}
        <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
        <View style={styles.paymentRow}>
          <Text>
            Payment Method:{" "}
            {data.paymentMethod ? data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1) : "-"}
          </Text>
          <Text style={statusStyle(data.status)}>Status: {data.status.toUpperCase()}</Text>
        </View>

        {data.notes && (
          <>
            <Text style={styles.sectionTitle}>NOTES</Text>
            <View style={styles.notesBox}>
              <Text>{data.notes}</Text>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text>Authorized Signature</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", marginTop: 3 }}>Dr. {data.doctorName}</Text>
          </View>
          <Text style={{ textAlign: "right" }}>
            Generated by SkoraCares Clinic OS
            {"\n"}This is a computer-generated invoice.
          </Text>
        </View>
      </Page>
    </Document>
  );
}