import React from "react";
import GenericRecordsTab from "./GenericRecordsTab";

export default function AchievementsTab({
  achievementRows,
  achievementLoading,
}) {
  return (
    <GenericRecordsTab
      title="Achievements & Rewards"
      subtitle="Recognitions and awards"
      rows={achievementRows}
      loading={achievementLoading}
      primaryField="TITLE"
      fields={[
        { key: "RECOGNITION_TYPE", label: "Recognition Type" },
        { key: "AWARDING_BODY", label: "Awarding Body" },
        { key: "LEVEL_TYPE", label: "Level" },
        { key: "RECOGNITION_DATE", label: "Date" },
        { key: "CERTIFICATE_NO", label: "Certificate No" },
        { key: "DESCRIPTION", label: "Description" },
      ]}
    />
  );
}
