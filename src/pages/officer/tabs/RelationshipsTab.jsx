import React from "react";
import GenericRecordsTab from "./GenericRecordsTab";
import { safeText } from "../officerUtils/officerFormat";

const relationName = (row) =>
  safeText(
    row?.NAME ??
      row?.BS_NAME ??
      row?.BROTHER_SISTER_NAME ??
      row?.CHILD_NAME,
  );

export default function RelationshipsTab({ relationshipRows, relationshipLoading }) {
  return (
    <GenericRecordsTab
      title="Relationships"
      subtitle="Brother/sister relation records"
      rows={relationshipRows}
      loading={relationshipLoading}
      getPrimary={relationName}
      fields={[
        { key: "OFFICER_ID", label: "Officer ID" },
        {
          label: "Relation",
          pick: (row) =>
            row?.RELATION ??
            row?.RELATION_TYPE ??
            (safeText(row?.CHILD_NAME) !== "—" ? "Child" : ""),
        },
        { key: "EDUCATION", label: "Education" },
        { key: "INSTITUTION", label: "Institution" },
      ]}
    />
  );
}
