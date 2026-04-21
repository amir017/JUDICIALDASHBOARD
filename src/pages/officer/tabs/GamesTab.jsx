import React from "react";
import GenericRecordsTab from "./GenericRecordsTab";
import { safeText } from "../officerUtils/officerFormat";

/** `OFFICER_HOBB_INTEREST` / games API — tolerate Oracle and legacy column names */
const primaryName = (row) =>
  safeText(
    row?.GAME_NAME ??
      row?.GAMENAME ??
      row?.INTEREST_NAME ??
      row?.HOBBY_NAME ??
      row?.TITLE ??
      row?.NAME,
  );

export default function GamesTab({ gameRows, gameLoading }) {
  return (
    <GenericRecordsTab
      title="Games & hobbies"
      subtitle="Sports, games, and interests (type, frequency, proficiency)"
      rows={gameRows}
      loading={gameLoading}
      getPrimary={primaryName}
      fields={[
        {
          label: "Hobby type",
          pick: (row) =>
            row?.HOBBY_TYPE ??
            row?.HOBBYTYPE ??
            row?.HOBBY_TYPE_DESC ??
            row?.HOBBY_TYPEDESC,
        },
        { label: "Frequency", pick: (row) => row?.FREQUENCY ?? row?.FREQ },
        {
          label: "Proficiency level",
          pick: (row) =>
            row?.PROFICIENCY_LEVEL ?? row?.PROFICIENCYLEVEL ?? row?.PROF_LEVEL,
        },
        {
          label: "Skill level",
          pick: (row) => row?.SKILL_LEVEL ?? row?.SKILLLEVEL,
        },
        { key: "STATUS", label: "Status" },
        { key: "REMARKS", label: "Remarks" },
      ]}
    />
  );
}
