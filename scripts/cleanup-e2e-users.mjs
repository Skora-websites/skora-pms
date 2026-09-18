import mysql from "mysql2/promise";
(async () => {
  const c = await mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", password: "", database: "skoracares_db", multipleStatements: true });
  const q = (s) => c.query(s);
  await q("SET FOREIGN_KEY_CHECKS=0");
  await q("CREATE TEMPORARY TABLE tmp_del_users (id INT PRIMARY KEY)");
  await q(`INSERT INTO tmp_del_users (id)
    SELECT id FROM users WHERE
      name LIKE 'E2E %' OR name LIKE 'Dup%' OR name LIKE 'BadEmail%' OR name LIKE 'NotifPat-%'
      OR name LIKE 'SearchPat-%' OR name LIKE 'QA User%'
      OR email LIKE 'e2e.%' OR email LIKE 'e2eaudit%' OR email LIKE 'staff-%' OR email LIKE 'staffflow-%'
      OR email LIKE 'qa-%' OR email LIKE 'ratelimit-%' OR email LIKE 'e2epatient%'
      OR email LIKE 'e2e.admin.%' OR email LIKE 'e2estaff%' OR email LIKE 'dupapptpat-%' OR email LIKE 'duppat-%'
      OR email LIKE 'notifpat-%' OR email LIKE 'searchpat-%' OR email LIKE 'e2eauditdr%'`);
  const [cnts] = await q("SELECT COUNT(*) n FROM tmp_del_users");
  console.log("test users to delete:", cnts[0].n);
  const [guard] = await q(`SELECT COUNT(*) n FROM tmp_del_users t JOIN users u ON u.id=t.id
    WHERE u.email IN ('doctor@gmail.com','admin@gmail.com')
       OR (u.role='doctor' AND u.name NOT LIKE 'E2E %')`);
  if (guard[0].n > 0) { console.error("GUARD TRIPPED — real account matched, aborting"); process.exit(1); }

  const del = async (label, sql) => { const [r] = await q(sql); console.log(label + ":", r.affectedRows); };

  // Children first, then parents
  await del("consents",          `DELETE c FROM appointment_consult_consents c JOIN appointments a ON a.id=c.appointment_id WHERE a.doctor_id IN (SELECT id FROM tmp_del_users) OR a.patient_id IN (SELECT id FROM tmp_del_users)`);
  await del("consult_meds",      `DELETE x FROM consultation_medications x JOIN consultations cs ON cs.id=x.consultation_id WHERE cs.appointment_id IN (SELECT a.id FROM appointments a WHERE a.doctor_id IN (SELECT id FROM tmp_del_users) OR a.patient_id IN (SELECT id FROM tmp_del_users))`);
  await del("consult_symptoms",  `DELETE x FROM consultation_symptoms x JOIN consultations cs ON cs.id=x.consultation_id WHERE cs.appointment_id IN (SELECT a.id FROM appointments a WHERE a.doctor_id IN (SELECT id FROM tmp_del_users) OR a.patient_id IN (SELECT id FROM tmp_del_users))`);
  await del("consult_exams",     `DELETE x FROM consultation_examinations x JOIN consultations cs ON cs.id=x.consultation_id WHERE cs.appointment_id IN (SELECT a.id FROM appointments a WHERE a.doctor_id IN (SELECT id FROM tmp_del_users) OR a.patient_id IN (SELECT id FROM tmp_del_users))`);
  await del("consult_diag",      `DELETE x FROM consultation_diagnoses x JOIN consultations cs ON cs.id=x.consultation_id WHERE cs.appointment_id IN (SELECT a.id FROM appointments a WHERE a.doctor_id IN (SELECT id FROM tmp_del_users) OR a.patient_id IN (SELECT id FROM tmp_del_users))`);
  await del("consult_lab",       `DELETE x FROM consultation_lab_tests x JOIN consultations cs ON cs.id=x.consultation_id WHERE cs.appointment_id IN (SELECT a.id FROM appointments a WHERE a.doctor_id IN (SELECT id FROM tmp_del_users) OR a.patient_id IN (SELECT id FROM tmp_del_users))`);
  await del("consult_uploads",   `DELETE x FROM consultation_prescription_uploads x JOIN consultations cs ON cs.id=x.consultation_id WHERE cs.appointment_id IN (SELECT a.id FROM appointments a WHERE a.doctor_id IN (SELECT id FROM tmp_del_users) OR a.patient_id IN (SELECT id FROM tmp_del_users))`);
  await del("consultations",     `DELETE cs FROM consultations cs WHERE cs.appointment_id IN (SELECT a.id FROM appointments a WHERE a.doctor_id IN (SELECT id FROM tmp_del_users) OR a.patient_id IN (SELECT id FROM tmp_del_users))`);
  await del("test_booking_tests",`DELETE tbt FROM test_booking_test tbt JOIN test_bookings tb ON tb.id=tbt.test_booking_id WHERE tb.doctor_id IN (SELECT id FROM tmp_del_users) OR tb.patient_id IN (SELECT id FROM tmp_del_users) OR tb.vendor_id IN (SELECT id FROM vendors WHERE name LIKE 'E2E %' OR name LIKE 'Med-%')`);
  await del("test_bookings",     `DELETE tb FROM test_bookings tb WHERE tb.doctor_id IN (SELECT id FROM tmp_del_users) OR tb.patient_id IN (SELECT id FROM tmp_del_users) OR tb.vendor_id IN (SELECT id FROM vendors WHERE name LIKE 'E2E %' OR name LIKE 'Med-%')`);
  await del("vendors",           `DELETE FROM vendors WHERE name LIKE 'E2E %' OR name LIKE 'Med-%'`);
  await del("tests",             `DELETE FROM tests WHERE name LIKE 'E2E %' OR name LIKE 'Med-%'`);
  await del("billings",          `DELETE b FROM billings b WHERE b.doctor_id IN (SELECT id FROM tmp_del_users) OR b.patient_id IN (SELECT id FROM tmp_del_users)`);
  await del("transactions",      `DELETE FROM transactions WHERE description LIKE 'E2E %' OR description LIKE 'Dup%' OR description LIKE 'QA %'`);
  await del("messages",          `DELETE ms FROM messages ms WHERE ms.doctor_id IN (SELECT id FROM tmp_del_users) OR ms.sender_id IN (SELECT id FROM tmp_del_users)`);
  await del("favorites",         `DELETE f FROM favorites f JOIN messages ms ON ms.id=f.message_id WHERE ms.doctor_id IN (SELECT id FROM tmp_del_users) OR ms.sender_id IN (SELECT id FROM tmp_del_users)`);
  await del("chat_settings",     `DELETE ucs FROM user_chat_settings ucs WHERE ucs.user_id IN (SELECT id FROM tmp_del_users)`);
  await del("chat_rooms",        `DELETE cr FROM chat_rooms cr WHERE cr.id IN (SELECT chat_room_id FROM messages WHERE doctor_id IN (SELECT id FROM tmp_del_users) OR sender_id IN (SELECT id FROM tmp_del_users))`);
  await del("model_has_roles",   `DELETE mhr FROM model_has_roles mhr JOIN tmp_del_users t ON t.id=mhr.model_id`);
  await del("model_has_perms",   `DELETE mhp FROM model_has_permissions mhp JOIN tmp_del_users t ON t.id=mhp.model_id`);
  await del("roles",             `DELETE r FROM roles r LEFT JOIN model_has_roles mhr ON mhr.role_id=r.id WHERE mhr.role_id IS NULL AND (r.name LIKE 'E2E %' OR r.name LIKE 'E2EStaff %')`);
  await del("role_has_perms",    `DELETE rhp FROM role_has_permissions rhp LEFT JOIN roles r ON r.id=rhp.role_id WHERE r.id IS NULL`);
  await del("billing_types",     `DELETE FROM billing_types WHERE name LIKE 'E2E %'`);
  await del("income_types",      `DELETE FROM income_types WHERE name LIKE 'E2E %'`);
  await del("expense_types",     `DELETE FROM expense_types WHERE name LIKE 'E2E %'`);
  await del("doctor_clinics",    `DELETE dc FROM doctor_clinics dc JOIN tmp_del_users t ON t.id=dc.doctor_id`);
  await del("doctor_schedules",  `DELETE ds FROM doctor_schedules ds LEFT JOIN doctor_clinics dc ON dc.id=ds.doctor_clinic_id WHERE dc.id IS NULL`);
  await del("medicines",         `DELETE FROM medicines WHERE name LIKE 'E2E %' OR name LIKE 'Med-%'`);
  await del("blogs",             `DELETE FROM blogs WHERE title LIKE 'QA Blog %'`);
  await del("notifications",     `DELETE n FROM notifications n JOIN tmp_del_users t ON t.id=n.user_id`);
  await del("sessions",          `DELETE s FROM sessions s JOIN tmp_del_users t ON t.id=s.user_id`);
  await del("push_subs",         `DELETE ps FROM push_subscriptions ps JOIN tmp_del_users t ON t.id=ps.user_id`);
  await del("sos_requests",      `DELETE sr FROM sos_requests sr JOIN tmp_del_users t ON t.id=sr.patient_id`);
  await del("audit_logs",        `DELETE al FROM audit_logs al JOIN tmp_del_users t ON t.id=al.user_id`);
  await del("appointments",      `DELETE a FROM appointments a WHERE a.doctor_id IN (SELECT id FROM tmp_del_users) OR a.patient_id IN (SELECT id FROM tmp_del_users)`);
  await del("users",             `DELETE u FROM users u JOIN tmp_del_users t ON t.id=u.id`);
  await q("SET FOREIGN_KEY_CHECKS=1");

  const [[left]] = await q("SELECT COUNT(*) n FROM users u JOIN tmp_del_users t ON t.id=u.id");
  console.log("remaining test users:", left);
  const [kept] = await q("SELECT id, role, name, COALESCE(email,'-') email FROM users ORDER BY id");
  console.table(kept);
  const [sums] = await q(`SELECT
    (SELECT COUNT(*) FROM vendors WHERE name LIKE 'E2E %' OR name LIKE 'Med-%') vendors_left,
    (SELECT COUNT(*) FROM tests WHERE name LIKE 'E2E %' OR name LIKE 'Med-%') tests_left,
    (SELECT COUNT(*) FROM transactions WHERE description LIKE 'E2E %') tx_left,
    (SELECT COUNT(*) FROM roles WHERE name LIKE 'E2E %') roles_left,
    (SELECT COUNT(*) FROM medicines WHERE name LIKE 'E2E %' OR name LIKE 'Med-%') meds_left,
    (SELECT COUNT(*) FROM appointments) appts_total`);
  console.table(sums);
  await c.end();
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
