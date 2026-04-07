import React from "react";
import GenericRecordsTab from "./GenericRecordsTab";

export default function ComplaintsTab({ complaintRows, complaintLoading }) {
  return (
    <GenericRecordsTab
      title="Complaints"
      subtitle="Complaint records"
      rows={complaintRows}
      loading={complaintLoading}
      primaryField="COMPLAINT_NO"
      fields={[
        { key: "DATE_OF_COMPLAINT", label: "Date" },
        { key: "COMPLAINT", label: "Complaint" },
        { key: "COMPLAINT_MOVEMENT", label: "Movement" },
        { key: "PROCESS", label: "Process" },
      ]}
    />
  );
}
