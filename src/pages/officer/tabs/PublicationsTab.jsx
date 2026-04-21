import React from "react";
import { BookOpen } from "lucide-react";
import GenericRecordsTab from "./GenericRecordsTab";

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
        { key: "PUBLICATION_DATE", label: "Date" },
        { key: "ISBN_ISSN", label: "ISBN/ISSN" },
        { key: "ROLE_TYPE", label: "Role" },
        { key: "SCOPE_TYPE", label: "Scope" },
      ]}
      tone="amber"
    />
  );
}
