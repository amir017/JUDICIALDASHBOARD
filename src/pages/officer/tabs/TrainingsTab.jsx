import React from "react";
import GenericRecordsTab from "./GenericRecordsTab";
import { safeText } from "../officerUtils/officerFormat";

/** Primary title from SUBJUDICARY.TRAINING_COURSES or legacy payloads */
const courseTitle = (row) =>
  safeText(
    row?.COURSE_NAME ??
      row?.COURSENAME ??
      row?.TRAINING_TITLE ??
      row?.TITLE,
  );

/**
 * SUBJUDICARY-style training row (TRAINING_COURSES + joins), with fallbacks for older APIs.
 * @see Api.getOfficerTrainings JSDoc for reference SQL
 */
export default function TrainingsTab({ trainingRows, trainingLoading }) {
  return (
    <GenericRecordsTab
      title="Trainings"
      subtitle="Courses, provider, location, and dates (SUBJUDICARY TRAINING_COURSES shape)"
      rows={trainingRows}
      loading={trainingLoading}
      getPrimary={courseTitle}
      fields={[
        {
          label: "Received from",
          pick: (r) => r?.RECEIVED_FROM ?? r?.RECEIVEDFROM,
        },
        {
          label: "From date",
          pick: (r) =>
            r?.FROM_DATE ??
            r?.FROMDATE ??
            r?.From_date ??
            r?.FDATE,
        },
        {
          label: "To date",
          pick: (r) => r?.TO_DATE ?? r?.TODATE ?? r?.TDATE,
        },
        {
          label: "Provider",
          pick: (r) => r?.TPROVIDER_NAME ?? r?.TPROVIDERNAME,
        },
        { key: "TRAINING_TYPE_NAME", label: "Training type" },
        {
          label: "City",
          pick: (r) => r?.CITYNAME ?? r?.CITY_NAME ?? r?.CITY,
        },
        {
          label: "Country",
          pick: (r) => r?.COUNTRYNAME ?? r?.COUNTRY_NAME ?? r?.COUNTRY,
        },
        { key: "SCOPE_NAME", label: "Scope" },
        { key: "TRAINERDESC", label: "Trainer" },
        { key: "NOC_NUMBER", label: "NOC No" },
        { key: "NOC_ISS_DATE", label: "NOC Date" },
        { key: "IS_NOC_REQUIRED", label: "NOC Required" },
        { key: "TRAININGADDRESS", label: "Address" },
        { key: "TRAINIMPROVFOCUS", label: "Focus" },
        { key: "GRADING", label: "Grading" },
        { key: "STAY_AT_TRAINING", label: "Stay at training" },
        { key: "RELATION_TYPE", label: "Relation" },
      ]}
    />
  );
}
