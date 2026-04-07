import React from "react";
import GenericRecordsTab from "./GenericRecordsTab";

export default function SkillsTab({ skillRows, skillLoading }) {
  return (
    <GenericRecordsTab
      title="Skills"
      subtitle="Professional and personal skills"
      rows={skillRows}
      loading={skillLoading}
      primaryField="SKILL_SUBTYPE"
      fields={[
        { key: "SKILL_TYPE", label: "Type" },
        { key: "SKILL_LEVEL", label: "Level" },
        { key: "DESCRIPTION", label: "Description" },
      ]}
      tone="violet"
    />
  );
}
