import React from "react";
import GenericRecordsTab from "./GenericRecordsTab";

export default function InquiryTab({
  inquiryRows,
  inquiryLoading,
  inquiryDetailRows,
  inquiryDetailLoading,
  inquiryHearingRows,
  inquiryHearingLoading,
  inquiryDecisionRows,
  inquiryDecisionLoading,
}) {
  return (
    <div className="space-y-4">
      <GenericRecordsTab
        title="Inquiry"
        subtitle="Main inquiry records"
        rows={inquiryRows}
        loading={inquiryLoading}
        primaryField="COMPLAINT_NO"
        fields={[
          { key: "INQUIRY_INITIATE", label: "Initiated By" },
          { key: "COMPLAINANTNAME", label: "Complainant" },
          { key: "COMPLAINTGIST", label: "Gist" },
          { key: "COMPLAINTDATE", label: "Date" },
          { key: "O_NAME_A_INQUIRY", label: "Officer" },
          { key: "O_PFNO_A_INQUIRY", label: "PF No" },
          { key: "CPDISTRICTID", label: "CP District" },
          { key: "CPTEHSILNAME", label: "CP Tehsil" },
          { key: "PPDISTRICTID", label: "PP District" },
          { key: "PPTEHSILID", label: "PP Tehsil" },
        ]}
      />

      <GenericRecordsTab
        title="Inquiry Officer Detail"
        subtitle="Inquiry officer details"
        rows={inquiryDetailRows}
        loading={inquiryDetailLoading}
        primaryField="INQUIRYID"
        fields={[
          { key: "INV_OFFT_FROM", label: "From" },
          { key: "INV_OFF_NAME", label: "Officer Name" },
          { key: "INV_OFF_ID", label: "Officer ID" },
          { key: "INV_OFF_DESIG_ID", label: "Designation ID" },
        ]}
      />

      <GenericRecordsTab
        title="Inquiry Hearings"
        subtitle="Hearing records"
        rows={inquiryHearingRows}
        loading={inquiryHearingLoading}
        primaryField="INV_INQUIRY_ID"
        fields={[
          { key: "INV_HEARING_DATE", label: "Hearing Date" },
          { key: "INV_HEARING_STATUS", label: "Status" },
          { key: "INV_HEARING_REMARKS", label: "Remarks" },
          { key: "INV_OFF_NAME", label: "Officer Name" },
        ]}
      />

      <GenericRecordsTab
        title="Inquiry Final Decision"
        subtitle="Final inquiry decision"
        rows={inquiryDecisionRows}
        loading={inquiryDecisionLoading}
        primaryField="FINALDECISION"
        fields={[
          { key: "INV_HEARING_RESULT", label: "Result" },
          { key: "REP_AG_PENALTY", label: "Penalty" },
          { key: "REP_AG_PENALTY_RESULT", label: "Penalty Result" },
          { key: "JUD_REMEDY_AVA_LHC", label: "LHC Remedy" },
          { key: "FATE_JUD_REMEDY_AVAIL_LHC", label: "LHC Fate" },
          { key: "JUD_REMEDY_AVA_SC", label: "SC Remedy" },
          { key: "FATE_JUD_REMEDY_AVAIL_SC", label: "SC Fate" },
          { key: "REMARKS", label: "Remarks" },
        ]}
      />
    </div>
  );
}
