import React, { useMemo } from "react";
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

/** Shown only when API returns no rows so the tab is not blank. */
const SAMPLE_HOBBY_ROWS = [
  {
    GAME_NAME: "Book reading",
    HOBBY_TYPE: "Reading",
    FREQUENCY: "Regular",
    SKILL_LEVEL: "—",
    PROFICIENCY_LEVEL: "—",
    STATUS: "Sample",
    REMARKS: "Illustrative row when officer_games has no records.",
  },
  {
    GAME_NAME: "Cricket playing",
    HOBBY_TYPE: "Sport",
    FREQUENCY: "Weekly",
    SKILL_LEVEL: "Intermediate",
    PROFICIENCY_LEVEL: "Intermediate",
    STATUS: "Sample",
    REMARKS: "Illustrative row when officer_games has no records.",
  },
];

export default function GamesTab({ gameRows, gameLoading }) {
  const { displayRows, subtitle } = useMemo(() => {
    const raw = Array.isArray(gameRows) ? gameRows : [];
    const baseSubtitle =
      "Sports, games, and interests (type, frequency, proficiency)";
    if (raw.length > 0) {
      return { displayRows: raw, subtitle: baseSubtitle };
    }
    if (gameLoading) {
      return { displayRows: [], subtitle: baseSubtitle };
    }
    return {
      displayRows: SAMPLE_HOBBY_ROWS,
      subtitle: `${baseSubtitle} · Sample hobbies shown until database rows exist.`,
    };
  }, [gameRows, gameLoading]);

  return (
    <GenericRecordsTab
      title="Games & hobbies"
      subtitle={subtitle}
      rows={displayRows}
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
