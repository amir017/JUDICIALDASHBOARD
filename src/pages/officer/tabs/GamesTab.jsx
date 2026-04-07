import React from "react";
import GenericRecordsTab from "./GenericRecordsTab";

export default function GamesTab({ gameRows, gameLoading }) {
  return (
    <GenericRecordsTab
      title="Games"
      subtitle="Sports and games"
      rows={gameRows}
      loading={gameLoading}
      primaryField="GAME_NAME"
      fields={[
        { key: "SKILL_LEVEL", label: "Skill Level" },
        { key: "STATUS", label: "Status" },
        { key: "REMARKS", label: "Remarks" },
      ]}
    />
  );
}
