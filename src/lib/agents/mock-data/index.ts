export interface MockDataEntry {
  description: string;
  data: unknown;
}

export const MOCK_DATA: Record<string, MockDataEntry> = {
  // ─── LEGAL ────────────────────────────────────────────────
  "LGL-01": {
    description: "Vertragsdaten: 847 aktive Verträge mit Laufzeit- und Kündigungsfrist-Details (Auszug kritischer Fälle)",
    data: {
      total_contracts: 847,
      critical_expiring_soon: [
        { id: "V-2024-0391", vendor: "SAP SE", value_eur: 840000, end_date: "2026-06-15", notice_days: 90, notice_deadline: "2026-03-17", status: "MISSED_DEADLINE", category: "Software-Lizenz" },
        { id: "V-2024-0412", vendor: "AWS EMEA SARL", value_eur: 210000, end_date: "2026-07-01", notice_days: 60, notice_deadline: "2026-05-02", status: "MISSED_DEADLINE", category: "Cloud-Dienste" },
        { id: "V-2025-0088", vendor: "Linde Engineering GmbH", value_eur: 1200000, end_date: "2026-06-30", notice_days: 90, notice_deadline: "2026-04-01", status: "MISSED_DEADLINE", category: "Dienstleistung" },
        { id: "V-2025-0104", vendor: "Rechtsanwälte Müller & Partner", value_eur: 95000, end_date: "2026-08-31", notice_days: 30, notice_deadline: "2026-08-01", status: "AT_RISK", category: "Beratung" },
        { id: "V-2025-0117", vendor: "Telekom Business Solutions", value_eur: 180000, end_date: "2026-09-30", notice_days: 90, notice_deadline: "2026-07-02", status: "AT_RISK", category: "Telekommunikation" },
        { id: "V-2023-1102", vendor: "Siemens AG (Wartung)", value_eur: 320000, end_date: "2026-06-01", notice_days: 90, notice_deadline: "2026-03-04", status: "MISSED_DEADLINE", category: "Wartungsvertrag" },
        { id: "V-2024-0778", vendor: "Daimler Truck AG", value_eur: 450000, end_date: "2026-07-15", notice_days: 60, notice_deadline: "2026-05-16", status: "MISSED_DEADLINE", category: "Einkauf/Lieferung" },
        { id: "V-2025-0203", vendor: "DEKRA SE", value_eur: 78000, end_date: "2026-10-31", notice_days: 30, notice_deadline: "2026-10-01", status: "OK", category: "Zertifizierung" },
        { id: "V-2025-0214", vendor: "Merck KGaA", value_eur: 560000, end_date: "2026-11-30", notice_days: 60, notice_deadline: "2026-10-01", status: "OK", category: "Rohstoffe" },
        { id: "V-2024-0901", vendor: "Microsoft Ireland", value_eur: 340000, end_date: "2026-06-30", notice_days: 90, notice_deadline: "2026-04-01", status: "MISSED_DEADLINE", category: "Software-Lizenz" },
        { id: "V-2025-0312", vendor: "DHL Supply Chain GmbH", value_eur: 280000, end_date: "2026-08-15", notice_days: 60, notice_deadline: "2026-06-16", status: "AT_RISK", category: "Logistik" },
        { id: "V-2024-0555", vendor: "Deloitte GmbH WPG", value_eur: 920000, end_date: "2026-06-30", notice_days: 90, notice_deadline: "2026-04-01", status: "MISSED_DEADLINE", category: "Prüfungsleistung" },
      ],
      summary_by_status: { MISSED_DEADLINE: 8, AT_RISK: 3, OK: 836 },
      total_value_at_risk_eur: 4133000,
    },
  },

  "LGL-02": {
    description: "Marken- und Domain-Monitoring-Ergebnisse: Scan über DE/EU/US-Register (letzter Lauf vor 6 Std.)",
    data: {
      scan_timestamp: "2026-05-09T06:00:00Z",
      trademark_registers_checked: ["DPMA", "EUIPO", "USPTO"],
      domains_monitored: 284,
      trademarks_registered: 47,
      findings: [],
      watchlist_alerts: [],
      domain_expiring_within_90d: [
        { domain: "continuum-audit.biz", expires: "2026-07-12", registrar: "GoDaddy", action: "auto-renew ON" },
      ],
      recently_resolved: [
        { type: "Domain-Squatting", domain: "continuumaudi.de", resolved: "2026-04-18", action: "C&D-Schreiben erfolgreich" },
      ],
      status: "CLEAN",
    },
  },

  "LGL-03": {
    description: "Rückstellungsdaten vs. anhängige Rechtsstreitigkeiten (Berichtsjahr 2026, Stand Q2)",
    data: {
      total_provisions_eur: 1600000,
      litigation_cases: [
        { id: "RS-2024-001", plaintiff: "Lieferant Kern GmbH", subject: "Lieferverzug Schadenersatz", expected_loss_eur: 850000, provision_eur: 200000, gap_eur: 650000, probability: "wahrscheinlich (>70%)", court: "LG Frankfurt", next_hearing: "2026-06-12", counsel: "Freshfields" },
        { id: "RS-2025-003", plaintiff: "Arbeitnehmer J. Becker", subject: "Diskriminierung (AGG)", expected_loss_eur: 120000, provision_eur: 80000, gap_eur: 40000, probability: "möglich (40-60%)", court: "ArbG München", next_hearing: "2026-07-08", counsel: "intern" },
        { id: "RS-2025-011", plaintiff: "Finanzbehörde HB", subject: "Nachzahlung Körperschaftsteuer", expected_loss_eur: 480000, provision_eur: 390000, gap_eur: 90000, probability: "wahrscheinlich (>70%)", court: "FG Bremen", next_hearing: "2026-06-30", counsel: "KPMG Law" },
        { id: "RS-2023-044", plaintiff: "Patentinhaber Tech AG", subject: "Patentrechtsverletzung", expected_loss_eur: 250000, provision_eur: 250000, gap_eur: 0, probability: "möglich (40-60%)", court: "BPatG", next_hearing: "2026-09-15", counsel: "Hogan Lovells" },
        { id: "RS-2026-002", plaintiff: "Ex-GF K. Moritz", subject: "Abfindungsklage", expected_loss_eur: 680000, provision_eur: 680000, gap_eur: 0, probability: "wahrscheinlich (>70%)", court: "LG Hamburg", next_hearing: "2026-05-28", counsel: "Baker McKenzie" },
      ],
      total_expected_loss_eur: 2380000,
      total_gap_eur: 780000,
      auditor_note: "Externe Bewertung von Freshfields ergibt höheren Schadenswert als intern angesetzt",
    },
  },

  // ─── COMPLIANCE ───────────────────────────────────────────
  "CMP-01": {
    description: "Sanktionslistenscreening-Protokoll: 8.412 geprüfte Geschäftspartner (EU/OFAC/UN, letzter Lauf vor 30 Min.)",
    data: {
      run_timestamp: "2026-05-09T11:30:00Z",
      lists_checked: ["EU Consolidated Sanctions List", "OFAC SDN List", "UN Consolidated List", "HM Treasury UK"],
      partners_checked: 8412,
      new_partners_this_run: 23,
      hits: [],
      false_positives_cleared: 2,
      last_list_updates: { EU: "2026-05-08", OFAC: "2026-05-09", UN: "2026-05-07" },
      coverage: "100%",
      next_scheduled_run: "2026-05-09T17:30:00Z",
    },
  },

  "CMP-02": {
    description: "Geschenke & Einladungen Register Q2 2026: Erfassungsrate und Genehmigungsstatus",
    data: {
      quarter: "Q2 2026",
      total_employees: 1240,
      employees_with_reportable_gifts: 148,
      recorded: 124,
      not_recorded_estimated: 24,
      recording_rate: 0.838,
      by_department: [
        { dept: "Vertrieb", reportable: 72, recorded: 58, rate: 0.806 },
        { dept: "Einkauf", reportable: 31, recorded: 28, rate: 0.903 },
        { dept: "Geschäftsführung", reportable: 12, recorded: 11, rate: 0.917 },
        { dept: "IT", reportable: 15, recorded: 12, rate: 0.800 },
        { dept: "Recht", reportable: 18, recorded: 15, rate: 0.833 },
      ],
      unapproved_above_500eur: [
        { id: "G-2026-0441", employee: "M. Schreiber (Vertrieb)", gift_from: "Bayer AG", value_eur: 780, date: "2026-04-22", type: "Einladung Golfturnier", status: "NICHT_ERFASST" },
        { id: "G-2026-0398", employee: "T. Bauer (Einkauf)", gift_from: "Bosch GmbH", value_eur: 520, date: "2026-04-15", type: "Abendessen", status: "ERFASST_NICHT_GENEHMIGT" },
      ],
      trend_recording_rate: [0.92, 0.90, 0.91, 0.89, 0.88, 0.90, 0.90, 0.838],
    },
  },

  "CMP-03": {
    description: "Whistleblower-Hinweise SLA-Tracking Q2 2026: Reaktionszeiten und Bearbeitungsstatus",
    data: {
      quarter: "Q2 2026",
      total_reports: 14,
      within_sla_7days: 11,
      breached_sla: 3,
      avg_response_days: 3.2,
      reports: [
        { id: "WB-2026-041", category: "Finanzbetrug", received: "2026-04-02", first_response: "2026-04-03", days: 1, status: "ABGESCHLOSSEN" },
        { id: "WB-2026-042", category: "Diskriminierung", received: "2026-04-08", first_response: "2026-04-09", days: 1, status: "IN_BEARBEITUNG" },
        { id: "WB-2026-043", category: "Datenmissbrauch", received: "2026-04-14", first_response: "2026-04-18", days: 4, status: "ABGESCHLOSSEN" },
        { id: "WB-2026-044", category: "Korruption", received: "2026-04-19", first_response: "2026-04-21", days: 2, status: "IN_BEARBEITUNG" },
        { id: "WB-2026-045", category: "Sicherheit", received: "2026-04-25", first_response: "2026-05-06", days: 11, status: "OFFEN", sla_breached: true },
        { id: "WB-2026-046", category: "Datenmissbrauch", received: "2026-04-28", first_response: "2026-05-07", days: 9, status: "OFFEN", sla_breached: true },
        { id: "WB-2026-047", category: "Arbeitsrecht", received: "2026-05-01", first_response: "2026-05-02", days: 1, status: "IN_BEARBEITUNG" },
      ],
    },
  },

  "CMP-04": {
    description: "Code-of-Conduct-Schulungsquoten GJ 2026: Abschlussstand nach Bereich (Lauf noch aktiv)",
    data: {
      total_employees: 1240,
      completed: 1191,
      in_progress: 38,
      not_started: 11,
      completion_rate: 0.961,
      overdue_more_than_30d: [
        { name: "K. Hoffmann", dept: "Controlling", overdue_days: 48 },
        { name: "R. Klein", dept: "Recht", overdue_days: 35 },
        { name: "P. Braun", dept: "IT", overdue_days: 31 },
      ],
      by_department: [
        { dept: "Vertrieb", total: 280, completed: 272, rate: 0.971 },
        { dept: "Produktion", total: 340, completed: 338, rate: 0.994 },
        { dept: "Verwaltung", total: 180, completed: 174, rate: 0.967 },
        { dept: "IT", total: 210, completed: 198, rate: 0.943 },
        { dept: "Recht & Compliance", total: 90, completed: 85, rate: 0.944 },
        { dept: "Controlling", total: 140, completed: 124, rate: 0.886 },
      ],
    },
  },

  // ─── DATENSCHUTZ ──────────────────────────────────────────
  "DSG-01": {
    description: "DSGVO Art. 15 Auskunftsersuchen Q2 2026: Bearbeitungszeiten und Fristeneinhaltung",
    data: {
      quarter: "Q2 2026",
      total_requests: 67,
      on_time: 63,
      overdue: 4,
      on_time_rate: 0.940,
      avg_processing_days: 18.4,
      sla_days: 30,
      overdue_cases: [
        { id: "DSR-2026-048", subject: "Anonym", received: "2026-04-01", deadline: "2026-05-01", days_overdue: 8, responsible: "T. Lindner", reason: "Externe Datenbeschaffung ausstehend" },
        { id: "DSR-2026-052", subject: "Anonym", received: "2026-04-05", deadline: "2026-05-05", days_overdue: 4, responsible: "T. Lindner", reason: "Workload-Engpass" },
        { id: "DSR-2026-061", subject: "Anonym", received: "2026-04-18", deadline: "2026-05-18", days_overdue: 0, responsible: "extern (DSB)", reason: "Eskaliert an ext. Datenschutzbeauftragten" },
        { id: "DSR-2026-063", subject: "Anonym", received: "2026-04-22", deadline: "2026-05-22", days_overdue: 0, responsible: "T. Lindner", reason: "Komplex (15+ Systeme betroffen)" },
      ],
    },
  },

  "DSG-02": {
    description: "Verarbeitungsverzeichnis (VVT) Drift-Analyse: Systemverzeichnis vs. dokumentierte Einträge",
    data: {
      total_systems_in_inventory: 184,
      vvt_entries: 161,
      drift_detected: 23,
      drift_details: [
        { system: "Salesforce CRM (EU)", drift_type: "VVT_MISSING", data_categories: ["Kundendaten", "Verhaltensdaten"], legal_basis_documented: false, added_to_inventory: "2026-02-14" },
        { system: "HubSpot Marketing", drift_type: "VVT_OUTDATED", last_vvt_update: "2024-09-01", actual_data_categories: ["E-Mail-Adressen", "Klickdaten", "Scoring"], vvt_data_categories: ["E-Mail-Adressen"] },
        { system: "Workday HCM", drift_type: "VVT_MISSING", data_categories: ["Gehaltsdaten", "Krankmeldungen", "Leistungsdaten"], legal_basis_documented: false },
        { system: "Google Analytics 4", drift_type: "VVT_MISSING", data_categories: ["IP-Adressen", "Nutzerverhalten"], third_country_transfer: "USA", scc_documented: false },
        { system: "Zoom Meetings", drift_type: "VVT_OUTDATED", note: "Video-Recordings seit Q4 2025 aktiviert, nicht im VVT" },
        { system: "ServiceNow ITSM", drift_type: "VVT_MISSING", data_categories: ["Mitarbeiterdaten", "Incident-Details"] },
        { system: "DocuSign", drift_type: "VVT_OUTDATED", note: "Drittlandübermittlung USA nicht mehr durch Privacy Shield abgedeckt, SCC fehlt" },
        { system: "Tableau Online", drift_type: "VVT_MISSING", data_categories: ["Umsatzdaten", "Mitarbeiterleistung"] },
      ],
      high_risk_drifts: 4,
      medium_risk_drifts: 11,
      low_risk_drifts: 8,
    },
  },

  "DSG-03": {
    description: "Auftragsverarbeiter (AVV) Review-Status: 152 aktive AVVs",
    data: {
      total_avvs: 152,
      current: 147,
      review_due_within_90d: 5,
      overdue: 0,
      avvs_due_for_review: [
        { vendor: "Salesforce Ireland Ltd.", last_review: "2025-05-10", next_review: "2026-05-10", days_until: 1, type: "CRM", risk: "HOCH" },
        { vendor: "Microsoft Ireland Operations", last_review: "2025-05-22", next_review: "2026-05-22", days_until: 13, type: "Cloud/M365", risk: "HOCH" },
        { vendor: "Docuware GmbH", last_review: "2025-06-01", next_review: "2026-06-01", days_until: 23, type: "DMS", risk: "MITTEL" },
        { vendor: "Personio GmbH", last_review: "2025-07-15", next_review: "2026-07-15", days_until: 67, type: "HR-Software", risk: "HOCH" },
        { vendor: "DATEV eG", last_review: "2025-07-20", next_review: "2026-07-20", days_until: 72, type: "Steuer/Lohn", risk: "HOCH" },
      ],
    },
  },

  // ─── RECHNUNGSWESEN ───────────────────────────────────────
  "REW-01": {
    description: "Manuelle Buchungen Q2 2026: Alle Journal-Einträge außerhalb Geschäftszeiten (22:00–05:00 Uhr) auf Hochrisiko-Konten",
    data: {
      analysis_period: "2026-04-01 bis 2026-05-09",
      total_manual_entries_offhours: 47,
      high_risk_accounts: ["4000-Umsatzerlöse", "3000-Rückstellungen", "2900-Sonstige Verbindlichkeiten", "4800-Sonstige Erträge"],
      entries: [
        { date: "2026-04-03", time: "23:41", user: "frank.krueger", account: "4000-Umsatzerlöse", amount_eur: 142000, description: "Nachbuchung Q1-Abschluss", authorized: false },
        { date: "2026-04-07", time: "02:18", user: "system_batch_rew", account: "3000-Rückstellungen", amount_eur: -380000, description: "Rückstellungsauflösung Rechtsfälle", authorized: false },
        { date: "2026-04-09", time: "22:55", user: "frank.krueger", account: "4800-Sonstige Erträge", amount_eur: 89000, description: "Korrekturbuchung Vorjahr", authorized: false },
        { date: "2026-04-12", time: "01:33", user: "admin_buchhaltung", account: "4000-Umsatzerlöse", amount_eur: 215000, description: "Umsatzanpassung Projekt Delta", authorized: false },
        { date: "2026-04-15", time: "23:08", user: "frank.krueger", account: "2900-Sonstige Verbindlichkeiten", amount_eur: -95000, description: "Abstimmungsbuchung Intercompany", authorized: true },
        { date: "2026-04-19", time: "03:44", user: "system_batch_rew", account: "4000-Umsatzerlöse", amount_eur: 330000, description: "Batch-Nachverarbeitung ERP-Sync", authorized: false },
        { date: "2026-04-22", time: "22:17", user: "admin_buchhaltung", account: "3000-Rückstellungen", amount_eur: 180000, description: "Rückstellungszuführung Gewährleistungen", authorized: false },
        { date: "2026-04-26", time: "00:52", user: "frank.krueger", account: "4800-Sonstige Erträge", amount_eur: 47000, description: "Ertragsrealisierung Wartungsvertrag", authorized: false },
        { date: "2026-04-29", time: "04:11", user: "system_batch_rew", account: "4000-Umsatzerlöse", amount_eur: 198000, description: "Monatsabschluss Nachläufer", authorized: false },
        { date: "2026-05-03", time: "23:30", user: "admin_buchhaltung", account: "3000-Rückstellungen", amount_eur: -220000, description: "Stornobuchung fehlerhafte Rückstellung", authorized: false },
        { date: "2026-05-07", time: "02:05", user: "frank.krueger", account: "4000-Umsatzerlöse", amount_eur: 410000, description: "Umsatzkorrektur Großkunde Müller AG", authorized: false },
      ],
      summary_stats: {
        unauthorized_entries: 44,
        total_volume_unauthorized_eur: 2308000,
        users_involved: ["frank.krueger", "system_batch_rew", "admin_buchhaltung"],
        peak_hours: ["00:00-03:00", "22:00-24:00"],
        accounts_most_affected: "4000-Umsatzerlöse (18 Buchungen, €1.295.000)"
      }
    },
  },

  "REW-02": {
    description: "Konten-Abstimmungs-Backlog: Offene Posten >60 Tage in Hauptbuch-Konten (Stand: 09.05.2026)",
    data: {
      total_backlog_eur: 412000,
      items_over_60d: 28,
      items_by_age: { "61-90 Tage": 12, "91-120 Tage": 9, "121-180 Tage": 5, ">180 Tage": 2 },
      top_items: [
        { konto: "1200-Forderungen", betrag_eur: 89000, alter_tage: 94, beschreibung: "Forderung Müller Logistik GmbH — Zahlungsstreit", zuständig: "F. Krüger" },
        { konto: "3400-Anzahlungen", betrag_eur: 145000, alter_tage: 187, beschreibung: "Anzahlung Projekt Gamma — Projekt abgebrochen, Rückforderung offen", zuständig: "F. Krüger" },
        { konto: "1800-Intercompany", betrag_eur: 78000, alter_tage: 112, beschreibung: "IC-Abstimmung CH-Tochter Q4 2025 — Kurs-Delta ungeklärt", zuständig: "N. Schwarz" },
        { konto: "1400-Sonstige Forderungen", betrag_eur: 56000, alter_tage: 73, beschreibung: "Reisekostenabrechnung ausstehend — Mitarbeitervorschüsse", zuständig: "HR/Controlling" },
        { konto: "3000-Rückstellungen", betrag_eur: 44000, alter_tage: 68, beschreibung: "Rückstellungsauflösung blockiert — Klärung Rechtsabteilung ausstehend", zuständig: "Dr. M. Weiss" },
      ],
      trend_vs_q1: "+€91.000 (+28%)",
    },
  },

  "REW-03": {
    description: "Periodenabgrenzung Plausibilitätsprüfung: Q2 2026 vs. Q1 2026 und Vorjahresdurchschnitt",
    data: {
      period: "Q2 2026",
      total_accruals_eur: 4280000,
      delta_vs_q1_pct: 1.2,
      benchmark_corridor_pct: { min: -2.0, max: 2.0 },
      within_corridor: true,
      by_category: [
        { category: "Urlaubsrückstellung", q1_eur: 820000, q2_eur: 834000, delta_pct: 1.7, flag: false },
        { category: "Gewährleistungen", q1_eur: 1100000, q2_eur: 1118000, delta_pct: 1.6, flag: false },
        { category: "Personalrückstellungen", q1_eur: 640000, q2_eur: 656000, delta_pct: 2.5, flag: true, note: "Knapp oberhalb Korridor — Gehaltserhöhung Q2" },
        { category: "Wartungsverträge", q1_eur: 890000, q2_eur: 904000, delta_pct: 1.6, flag: false },
        { category: "Rechtsstreitigkeiten", q1_eur: 680000, q2_eur: 768000, delta_pct: 12.9, flag: true, note: "Starker Anstieg wegen neuem Rechtsfall RS-2026-002" },
      ],
    },
  },

  "REW-04": {
    description: "Lieferantenrechnung Duplikat-Screening Q2 2026: 3.847 geprüfte Rechnungen",
    data: {
      invoices_checked: 3847,
      duplicate_suspects: 3,
      confirmed_duplicates: 0,
      suspects_under_review: [
        { invoice_a: "RE-2026-04-8812", invoice_b: "RE-2026-04-8901", vendor: "Office World GmbH", amount_eur: 4280, date_a: "2026-04-12", date_b: "2026-04-19", reason: "Gleicher Betrag, ähnliche Beschreibung, 7 Tage Abstand", status: "GEKLÄRT_KEIN_DUPLIKAT", note: "Zwei Teillieferungen mit identischen Preisen" },
        { invoice_a: "RE-2026-05-0112", invoice_b: "RE-2026-05-0118", vendor: "Linde Gas GmbH", amount_eur: 18750, date_a: "2026-05-02", date_b: "2026-05-02", reason: "Identischer Betrag und Datum, unterschiedliche RE-Nummer", status: "GEKLÄRT_KEIN_DUPLIKAT", note: "Zwei Kostenstellen (Werk A und Werk B)" },
        { invoice_a: "RE-2026-04-7741", invoice_b: "RE-2026-04-7741-K", vendor: "Telekom Business", amount_eur: 2190, date_a: "2026-04-08", date_b: "2026-04-22", reason: "Gleiche RE-Nummer, Storno und Neuausstellung", status: "GEKLÄRT_KEIN_DUPLIKAT", note: "Kreditnote + Neurechnung nach Preiskorrektur" },
      ],
    },
  },

  // ─── FINANZEN ─────────────────────────────────────────────
  "FIN-01": {
    description: "Liquiditätsreserve vs. Kovenanten-Anforderungen: Tagesgenaue Daten per 09.05.2026",
    data: {
      date: "2026-05-09",
      available_liquidity_eur: 38000000,
      covenant_minimum_eur: 20000000,
      headroom_eur: 18000000,
      credit_lines: [
        { bank: "Deutsche Bank", limit_eur: 50000000, drawn_eur: 12000000, available_eur: 38000000, maturity: "2028-06-30" },
        { bank: "Commerzbank (RCF)", limit_eur: 30000000, drawn_eur: 0, available_eur: 30000000, maturity: "2027-12-31" },
      ],
      covenant_tests: [
        { covenant: "Mindestliquidität", threshold_eur: 20000000, actual_eur: 38000000, status: "OK", headroom_pct: 90 },
        { covenant: "Net Debt / EBITDA", threshold: 3.5, actual: 2.1, status: "OK" },
        { covenant: "Interest Coverage", threshold: 3.0, actual: 5.8, status: "OK" },
      ],
      forecast_12m: { min_expected_eur: 24000000, scenario: "Basis" },
    },
  },

  "FIN-02": {
    description: "FX-Exposure Hedging-Analyse: Netto-Fremdwährungspositionen per 09.05.2026",
    data: {
      report_date: "2026-05-09",
      total_fx_exposure_eur: 48500000,
      hedged_eur: 34920000,
      hedging_ratio: 0.720,
      target_ratio: 0.80,
      gap_to_target_eur: 9680000,
      by_currency: [
        { currency: "USD", exposure_eur: 22000000, hedged_eur: 17600000, ratio: 0.80, instruments: ["Forward", "Option"] },
        { currency: "GBP", exposure_eur: 14000000, hedged_eur: 8400000, ratio: 0.60, instruments: ["Forward"], note: "Brexit-Unsicherheit — Hedging-Kosten gestiegen" },
        { currency: "CHF", exposure_eur: 8500000, hedged_eur: 7225000, ratio: 0.85, instruments: ["Forward"] },
        { currency: "JPY", exposure_eur: 4000000, hedged_eur: 1695000, ratio: 0.42, instruments: [], note: "Strategische Entscheidung ungesichert zu lassen" },
      ],
      recent_fx_impact: { q1_2026_eur: -340000, comment: "USD-Schwäche hat Exporterlöse belastet" },
    },
  },

  "FIN-03": {
    description: "Bankverbindungs-Änderungen Q2 2026: Vier-Augen-Prinzip Compliance",
    data: {
      period: "Q2 2026",
      total_changes: 12,
      compliant: 12,
      non_compliant: 0,
      changes_log: [
        { id: "BV-2026-041", vendor: "Linde Engineering GmbH", change_type: "IBAN-Änderung", initiated_by: "R. Meier", approved_by: "B. Hoffmann", date: "2026-04-08", verification: "Rückruf beim Vendor bestätigt" },
        { id: "BV-2026-042", vendor: "SAP SE", change_type: "Neueintrag", initiated_by: "procurement@", approved_by: "B. Hoffmann", date: "2026-04-14", verification: "Offizielle Bankbestätigung archiviert" },
        { id: "BV-2026-043", vendor: "Freelancer K. Bauer", change_type: "IBAN-Änderung", initiated_by: "hr@", approved_by: "J. Fischer", date: "2026-04-22", verification: "Personalakte abgeglichen" },
      ],
      fraud_attempts_detected: 1,
      fraud_detail: { date: "2026-05-03", type: "CEO-Fraud E-Mail", target: "B. Hoffmann", amount_eur: 840000, outcome: "ABGEWEHRT — Vier-Augen-Prüfung hat Betrug verhindert" },
    },
  },

  // ─── CONTROLLING ─────────────────────────────────────────
  "CTR-01": {
    description: "Forecast-Genauigkeit EBIT Q2 2026: Rolling-Forecast vs. Ist-Werte",
    data: {
      period: "Q2 2026 (April–Mai)",
      ebit_forecast_eur: 18400000,
      ebit_actual_apr_eur: 16900000,
      deviation_pct: 8.4,
      target_deviation_pct: 5.0,
      by_segment: [
        { segment: "Industrieprodukte", forecast_eur: 9200000, actual_eur: 8950000, deviation_pct: 2.7, status: "OK" },
        { segment: "Serviceleistungen", forecast_eur: 5800000, actual_eur: 4980000, deviation_pct: 14.1, status: "KRITISCH", note: "Großprojekt Omega verzögert — €820K Umsatz verschoben" },
        { segment: "Lizenz/Software", forecast_eur: 3400000, actual_eur: 2970000, deviation_pct: 12.6, status: "KRITISCH", note: "Renewal-Quote schlechter als erwartet" },
      ],
      root_cause_analysis: "Zwei Segmente massiv über Toleranz. Haupttreiber: Projektverzögerung und schwächere Renewal-Quote.",
    },
  },

  "CTR-02": {
    description: "Kostenstellen-Drift Q2 2026: Abweichung Plan/Ist >15% (von 184 Kostenstellen)",
    data: {
      total_cost_centers: 184,
      within_tolerance: 172,
      above_threshold_15pct: 12,
      threshold_pct: 15,
      drifting_cost_centers: [
        { id: "KST-1140", name: "IT-Infrastruktur", plan_eur: 420000, actual_eur: 534000, deviation_pct: 27.1, reason: "Ungeplanter Server-Austausch nach Hardware-Ausfall" },
        { id: "KST-2210", name: "Vertrieb Nordeuropa", plan_eur: 280000, actual_eur: 231000, deviation_pct: -17.5, reason: "Offene Stellen nicht besetzt — Personalkosten unter Plan" },
        { id: "KST-3301", name: "F&E Materialen", plan_eur: 190000, actual_eur: 227000, deviation_pct: 19.5, reason: "Rohstoffpreise gestiegen +22% vs. Planungszeitpunkt" },
        { id: "KST-4410", name: "Logistik/Lager", plan_eur: 310000, actual_eur: 364000, deviation_pct: 17.4, reason: "Mehrkosten Spedition durch Lieferengpässe" },
      ],
    },
  },

  "CTR-03": {
    description: "CapEx-Genehmigungen Q2 2026: Investitionsanträge über Schwellenwert (>€500k) ohne Board-Approval",
    data: {
      period: "Q2 2026",
      total_capex_requests: 18,
      above_threshold: 5,
      board_approved: 4,
      pending_approval: 1,
      requests: [
        { id: "CAPEX-2026-011", description: "Erweiterung Produktionslinie B", amount_eur: 2800000, requested_by: "Produktion", board_approved: true, approval_date: "2026-04-08", status: "GENEHMIGT" },
        { id: "CAPEX-2026-014", description: "ERP-System Upgrade S/4HANA", amount_eur: 1200000, requested_by: "IT", board_approved: true, approval_date: "2026-04-15", status: "GENEHMIGT" },
        { id: "CAPEX-2026-017", description: "Fuhrpark-Elektrifizierung Phase 2", amount_eur: 680000, requested_by: "Logistik", board_approved: true, approval_date: "2026-04-22", status: "GENEHMIGT" },
        { id: "CAPEX-2026-019", description: "Labortechnik Qualitätssicherung", amount_eur: 540000, requested_by: "Qualität", board_approved: true, approval_date: "2026-04-29", status: "GENEHMIGT" },
        { id: "CAPEX-2026-022", description: "Neubau Lagerhalle Nord", amount_eur: 3400000, requested_by: "Logistik/Immobilien", board_approved: false, status: "AUSSTEHEND", submitted: "2026-05-02", note: "Nächstes Board-Meeting: 2026-05-20" },
      ],
    },
  },

  // ─── IT-SICHERHEIT ────────────────────────────────────────
  "ITS-01": {
    description: "Privilegierte Accounts Review: Vollständige Inventur aller Admin-Accounts per 09.05.2026",
    data: {
      total_privileged_accounts: 127,
      active_employees_with_priv: 96,
      dormant_accounts: 31,
      critical_dormant: [
        { username: "thomas.beck.adm", name: "Thomas Beck", last_login: "2025-08-14", department: "IT (ausgeschieden 2025-09-01)", permissions: ["Domain Admin", "Azure Global Admin"], risk: "KRITISCH" },
        { username: "jan.schulte.sa", name: "Jan Schulte", last_login: "2025-10-22", department: "IT (Elternzeit seit 2025-11-01)", permissions: ["Server Admin", "Backup Admin"], risk: "HOCH" },
        { username: "svc_deploy_prod", name: "Service Account Deployment", last_login: "2025-07-30", owner: "unbekannt", permissions: ["Production Deploy", "DB Write"], risk: "KRITISCH" },
        { username: "lisa.vogel.adm", name: "Lisa Vogel", last_login: "2025-12-01", department: "IT (intern gewechselt zu HR)", permissions: ["AD Admin", "Exchange Admin"], risk: "HOCH" },
        { username: "svc_erp_connect", name: "ERP Connector Service", last_login: "2024-11-15", owner: "SAP-Projekt (abgeschlossen)", permissions: ["ERP Full Access", "DB Read/Write"], risk: "KRITISCH" },
        { username: "kai.bauer.adm", name: "Kai Bauer", last_login: "2026-01-08", department: "IT (Kündigung 2026-01-31)", permissions: ["Network Admin", "Firewall"], risk: "KRITISCH" },
      ],
      accounts_never_rotated_password: 8,
      mfa_not_enforced: 4,
      privileged_access_reviews_overdue: 12,
    },
  },

  "ITS-02": {
    description: "Patch-Compliance Critical Systems: CVEs mit CVSS ≥ 9.0 (SLA: <14 Tage)",
    data: {
      systems_monitored: 284,
      compliant: 253,
      non_compliant: 31,
      compliance_rate: 0.891,
      critical_overdue: [
        { cve: "CVE-2026-1048", cvss: 9.8, system: "Apache HTTP Server 2.4.51 (Web-DMZ)", patch_available: "2026-04-15", days_overdue: 24, owner: "M. Bauer", reason: "Change-Freeze Q1-Abschluss" },
        { cve: "CVE-2026-0987", cvss: 9.4, system: "Windows Server 2019 (DC-PROD-01)", patch_available: "2026-04-18", days_overdue: 21, owner: "M. Bauer", reason: "Testumgebung noch nicht validiert" },
        { cve: "CVE-2026-1231", cvss: 9.1, system: "VMware ESXi 7.0 (Cluster A)", patch_available: "2026-04-22", days_overdue: 17, owner: "extern (MSP)", reason: "MSP-Koordination ausstehend" },
        { cve: "CVE-2025-4891", cvss: 9.6, system: "OpenSSL 3.0.x (mehrere Server)", patch_available: "2026-03-01", days_overdue: 69, owner: "M. Bauer", reason: "Abhängigkeitskonflikte mit Legacy-App" },
      ],
    },
  },

  "ITS-03": {
    description: "Phishing-Simulation Q2 2026: Kampagnenergebnis alle Mitarbeitenden",
    data: {
      campaign_date: "2026-04-28",
      total_recipients: 1240,
      clicked: 51,
      click_rate: 0.041,
      reported_phishing: 384,
      reporting_rate: 0.310,
      by_department: [
        { dept: "Produktion", recipients: 340, clicked: 5, rate: 0.015 },
        { dept: "Vertrieb", recipients: 280, clicked: 18, rate: 0.064 },
        { dept: "Verwaltung", recipients: 180, clicked: 12, rate: 0.067 },
        { dept: "IT", recipients: 210, clicked: 2, rate: 0.010 },
        { dept: "Controlling", recipients: 140, clicked: 9, rate: 0.064 },
        { dept: "Recht", recipients: 90, clicked: 5, rate: 0.056 },
      ],
      repeat_clickers: 3,
      trend_click_rate: [0.082, 0.074, 0.068, 0.062, 0.058, 0.055, 0.054, 0.041],
    },
  },

  // ─── HR ───────────────────────────────────────────────────
  "HR-01": {
    description: "Arbeitszeitgesetz-Verstöße Q2 2026: Überschreitungen 10h-Tag und Mindestruhezeiten (11h)",
    data: {
      period: "2026-04-01 bis 2026-05-09",
      employees_monitored: 1240,
      violations_detected: 28,
      by_type: {
        "10h-Grenze überschritten": 18,
        "11h-Ruhezeit unterschritten": 7,
        "Wochenarbeitszeit >48h": 3
      },
      top_offenders_by_department: [
        { dept: "Vertrieb", violations: 11, employees_affected: 8 },
        { dept: "IT-Projekte", violations: 9, employees_affected: 6 },
        { dept: "Controlling", violations: 5, employees_affected: 4 },
        { dept: "Recht", violations: 3, employees_affected: 3 },
      ],
      critical_cases: [
        { employee_id: "MA-4412", dept: "Vertrieb", violations: 4, max_recorded_hours: 13.5, note: "Quartalsendsprint — Führungskraft informiert" },
        { employee_id: "MA-2891", dept: "IT-Projekte", violations: 3, min_rest_hours: 7.5, note: "ERP-Projektphase — externes Projektteam involviert" },
      ],
      trend: [12, 14, 16, 18, 20, 22, 22, 28],
    },
  },

  "HR-02": {
    description: "Headcount Soll/Ist-Vergleich Q2 2026 nach Bereich",
    data: {
      period: "Q2 2026 (Stand: 09.05.2026)",
      total_budget_fte: 1262,
      total_actual_fte: 1264,
      delta_fte: 2,
      by_department: [
        { dept: "Produktion", budget: 348, actual: 350, delta: 2, comment: "2 Leiharbeiter zur Auftragsspitze" },
        { dept: "Vertrieb", budget: 285, actual: 281, delta: -4, comment: "4 offene Stellen, Rekrutierung läuft" },
        { dept: "IT", budget: 215, actual: 218, delta: 3, comment: "3 Werkstudenten für ERP-Projekt" },
        { dept: "Controlling", budget: 142, actual: 139, delta: -3, comment: "Elternzeit 2 MA, eine Position offen" },
        { dept: "Recht/Compliance", budget: 92, actual: 93, delta: 1, comment: "DSB-Stelle besetzt" },
        { dept: "HR", budget: 88, actual: 87, delta: -1, comment: "Eine Stelle in Besetzung" },
        { dept: "Einkauf", budget: 92, actual: 96, delta: 4, comment: "Projektunterstützung Lieferantenkonsolidierung" },
      ],
    },
  },

  // ─── EINKAUF ─────────────────────────────────────────────
  "PRC-01": {
    description: "Maverick-Buying-Analyse Q2 2026: Einkäufe außerhalb genehmigter Lieferantenliste",
    data: {
      period: "Q2 2026",
      total_purchases: 4182,
      maverick_purchases: 301,
      maverick_rate: 0.072,
      target_rate: 0.05,
      total_value_maverick_eur: 842000,
      by_category: [
        { category: "IT-Hardware/Zubehör", count: 98, value_eur: 214000, typical_vendor: "Amazon Business (nicht gelistet)" },
        { category: "Büromaterial", count: 112, value_eur: 48000, typical_vendor: "Diverse Einzelhändler" },
        { category: "Beratungsleistungen", count: 24, value_eur: 380000, typical_vendor: "Einzelberater ohne Rahmenvertrag" },
        { category: "Reisedienstleistungen", count: 67, value_eur: 200000, typical_vendor: "Diverse (kein Reisebüro-Vertrag)" },
      ],
      top_maverick_buyers: [
        { dept: "IT", value_eur: 318000, reason: "Hardware-Notbeschaffungen ohne Lead-Time" },
        { dept: "Vertrieb", value_eur: 224000, reason: "Kundenveranstaltungen flexibel gebucht" },
      ],
    },
  },

  "PRC-02": {
    description: "Lieferantenbewertung Review-Status GJ 2025: Fällige Jahresbewertungen nach KPI-Set",
    data: {
      total_strategic_vendors: 48,
      reviews_due: 48,
      reviews_completed: 0,
      reviews_in_progress: 12,
      not_started: 36,
      review_criteria: ["Qualität", "Liefertreue", "Preis-Compliance", "Nachhaltigkeit/ESG", "Finanzkraft"],
      overdue_critical_vendors: [
        { vendor: "Linde Engineering GmbH", spend_eur: 1200000, last_review: "2024-06-15", overdue_days: 328, risk_category: "HOCH" },
        { vendor: "SAP SE", spend_eur: 840000, last_review: "2024-07-01", overdue_days: 312, risk_category: "HOCH" },
        { vendor: "Bosch Rexroth AG", spend_eur: 680000, last_review: "2024-05-20", overdue_days: 354, risk_category: "MITTEL" },
        { vendor: "DHL Supply Chain", spend_eur: 540000, last_review: "2024-08-10", overdue_days: 272, risk_category: "MITTEL" },
      ],
      pending_reason: "Verantwortliche Stelle PRC fehlt seit Q3 2025 — Nachfolge noch nicht besetzt",
    },
  },

  // ─── ESG ─────────────────────────────────────────────────
  "ESG-01": {
    description: "CO₂-Emissionen Scope 1+2 Q2 2026: Monatliche Messung vs. Reduktionspfad",
    data: {
      period: "Q2 2026 (April–Mai)",
      baseline_year: 2024,
      baseline_tco2e: 12400,
      target_reduction_by_2026: 0.15,
      target_tco2e: 10540,
      actual_ytd_tco2e: 10912,
      reduction_vs_baseline_pct: -0.12,
      status: "ON_TRACK_SLIGHTLY_BEHIND",
      by_scope: [
        { scope: "Scope 1 (Direktemissionen/Gas/Fuhrpark)", q1_2025_tco2e: 2840, q1_2026_tco2e: 2410, reduction_pct: -15.1 },
        { scope: "Scope 2 (Strom — marktbasiert)", q1_2025_tco2e: 5920, q1_2026_tco2e: 4980, reduction_pct: -15.9 },
      ],
      monthly_data: [
        { month: "Apr 2026", tco2e: 1820, target_tco2e: 1756 },
        { month: "May 2026", tco2e: 1748, target_tco2e: 1756 },
      ],
      highlights: ["PV-Anlage Werk Süd seit März 2026 in Betrieb: -180 tCO₂e/Monat", "Fuhrpark-Elektrifizierung Phase 1 abgeschlossen: -95 tCO₂e/Quartal"],
    },
  },

  "ESG-02": {
    description: "Lieferkettensorgfaltspflichtengesetz (LkSG) Risikoanalysen Q2 2026",
    data: {
      period: "Q2 2026",
      total_tier1_suppliers: 84,
      risk_assessments_due: 84,
      completed: 80,
      open_issues: 4,
      remediation_plans_required: 4,
      open_cases: [
        { supplier: "Textil Asia Manufacturing Co. (Bangladesh)", risk_type: "Menschenrechte — Kinderarbeit Verdacht", severity: "KRITISCH", identified: "2026-04-12", remediation_plan: "AUSSTEHEND", action_taken: "Fabrikaudit beauftragt (Termin: 2026-06-01)", escalated_to_board: true },
        { supplier: "RawMin Cobalt Ltd. (Kongo)", risk_type: "Menschenrechte — Konfliktmineralien", severity: "KRITISCH", identified: "2026-04-28", remediation_plan: "AUSSTEHEND", action_taken: "Lieferstop erwogen — Alternativlieferant gesucht", escalated_to_board: true },
        { supplier: "ChemProd Polska Sp.z.o.o (Polen)", risk_type: "Umwelt — Abwasserverstöße", severity: "HOCH", identified: "2026-03-15", remediation_plan: "IN_BEARBEITUNG", action_taken: "Supplier-Improvement-Plan eingeleitet" },
        { supplier: "IndoLogistics PT (Indonesien)", risk_type: "Arbeitnehmerrechte — Überstunden", severity: "MITTEL", identified: "2026-04-05", remediation_plan: "IN_BEARBEITUNG", action_taken: "Verhaltenskodex-Training angeordnet" },
      ],
      lksg_reporting_deadline: "2026-06-30",
    },
  },
};
