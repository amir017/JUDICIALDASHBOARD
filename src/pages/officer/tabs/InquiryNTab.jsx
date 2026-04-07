import React from "react";
import GenericRecordsTab from "./GenericRecordsTab";

export default function InquiryNTab({
  inquiryNRows,
  inquiryNLoading,
  inquiryNHearingRows,
  inquiryNHearingLoading,
  inquiryNDecisionRows,
  inquiryNDecisionLoading,
}) {
  return (
    <div className="space-y-4">
      <GenericRecordsTab
        title="Inquiry Against Rule 16(3)"
        subtitle="Main records"
        rows={inquiryNRows}
        loading={inquiryNLoading}
        primaryField="COMPLAINT_NO"
        fields={[
          { key: "INQUIRY_INITIATE", label: "Initiated By" },
          { key: "COMPLAINANTNAME", label: "Complainant" },
          { key: "COMPLAINTGIST", label: "Gist" },
          { key: "COMPLAINTDATE", label: "Date" },
          { key: "O_NAME_A_INQUIRY", label: "Officer" },
          { key: "O_PFNO_A_INQUIRY", label: "PF No" },
          { key: "CPDISTRICTID", label: "CP District" },
          { key: "CPTEHSILID", label: "CP Tehsil" },
          { key: "PPDISTRICTID", label: "PP District" },
          { key: "PPTEHSILID", label: "PP Tehsil" },
        ]}
      />

      <GenericRecordsTab
        title="Rule 16(3) Hearing"
        subtitle="Hearing data"
        rows={inquiryNHearingRows}
        loading={inquiryNHearingLoading}
        primaryField="NOTICE_NUMBER"
        fields={[
          { key: "H_OFF_T_F", label: "From" },
          { key: "H_OFF_ID", label: "Officer ID" },
          { key: "H_OFF_DESIG_ID", label: "Designation ID" },
          { key: "H_OFF_DESIG_NAME", label: "Designation Name" },
          { key: "NOTICE_DATE", label: "Notice Date" },
          { key: "REMARK", label: "Remark" },
        ]}
      />

      <GenericRecordsTab
        title="Rule 16(3) Decision"
        subtitle="Decision data"
        rows={inquiryNDecisionRows}
        loading={inquiryNDecisionLoading}
        primaryField="INQ_N_FINALDECISION"
        fields={[
          { key: "INQ_N_HEARING_STATUS", label: "Status" },
          { key: "INQ_N_HEARING_RESULT", label: "Result" },
          { key: "INQ_N_REP_AG_PENALTY", label: "Penalty" },
          { key: "INQ_N_REP_AG_PENALTY_RESULT", label: "Penalty Result" },
          { key: "INQ_N_JUD_REMEDY_AVA_LHC", label: "LHC Remedy" },
          { key: "INQ_N_FATE_JUD_REM_LHC", label: "LHC Fate" },
          { key: "INQ_N_JUD_REMEDY_AVA_SC", label: "SC Remedy" },
          { key: "INQ_N_FATE_JUD_REM_AVA_SC", label: "SC Fate" },
          { key: "INQ_N_REMARKS", label: "Remarks" },
        ]}
      />
    </div>
  );
}
