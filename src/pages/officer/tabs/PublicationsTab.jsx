import React from "react";
import { BookOpen } from "lucide-react";
import GenericRecordsTab from "./GenericRecordsTab";
import { safeDate } from "../officerUtils/officerFormat";

function formatPublicationDate(val) {
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const dd = String(val.getDate()).padStart(2, "0");
    const mm = String(val.getMonth() + 1).padStart(2, "0");
    const yyyy = String(val.getFullYear());
    return `${dd}-${mm}-${yyyy}`;
  }
  return safeDate(val);
}

export default function PublicationsTab({
  publicationRows,
  publicationLoading,
}) {
  return (
    <GenericRecordsTab
      title="Publications"
      subtitle="Books, journals and publications"
      rows={publicationRows}
      loading={publicationLoading}
      icon={BookOpen}
      primaryField="TITLE"
      fields={[
        { key: "PUBLICATION_TYPE", label: "Type" },
        { key: "PUBLISHER_NAME", label: "Publisher" },
        { key: "JOURNAL_NAME", label: "Journal" },
        {
          key: "PUBLICATION_DATE",
          label: "Date",
          pick: (r) =>
            formatPublicationDate(
              r?.PUBLICATION_DATE ??
                r?.publication_date ??
                r?.PUB_DATE ??
                r?.DATE_PUB,
            ),
        },
        { key: "ISBN_ISSN", label: "ISBN/ISSN" },
        { key: "ROLE_TYPE", label: "Role" },
        { key: "SCOPE_TYPE", label: "Scope" },
      ]}
      tone="amber"
    />
  );
}
