import React from "react";
import GenericRecordsTab from "./GenericRecordsTab";

export default function TrainingsTab({ trainingRows, trainingLoading }) {
  return (
    <GenericRecordsTab
      title="Trainings"
      subtitle="Training history"
      rows={trainingRows}
      loading={trainingLoading}
      primaryField="COURSE_NAME"
      fields={[
        { key: "SCOPE_NAME", label: "Scope" },
        { key: "TRAINING_TYPE_NAME", label: "Training Type" },
        { key: "TPROVIDER_NAME", label: "Provider" },
        { key: "TRAINERDESC", label: "Trainer" },
        { key: "NOC_NUMBER", label: "NOC No" },
        { key: "NOC_ISS_DATE", label: "NOC Date" },
        { key: "IS_NOC_REQUIRED", label: "NOC Required" },
        { key: "COUNTRY_NAME", label: "Country" },
        { key: "CITY_NAME", label: "City" },
        { key: "TRAININGADDRESS", label: "Address" },
        { key: "RECEIVED_FROM", label: "Received From" },
        { key: "TRAINIMPROVFOCUS", label: "Focus" },
        { key: "FROM_DATE", label: "From" },
        { key: "TO_DATE", label: "To" },
        { key: "GRADING", label: "Grading" },
        { key: "STAY_AT_TRAINING", label: "Stay" },
        { key: "RELATION_TYPE", label: "Relation" },
      ]}
    />
  );
}
