// src/components/DiaryTracking.jsx
import { useState } from "react";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import Layout from "./Layout";
import Api from "../API/Api";

function DiaryTracking({ onLogout }) {
  const [diaryNumber, setDiaryNumber] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return format(date, "dd-MM-yy");
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    return formatInTimeZone(dateStr, "UTC", "dd-MM-yy - HH:mm:ss");
  };

  const handleSearch = async () => {
    setError("");
    setLoading(true);
    setResults([]);

    try {
      const params = {};
      if (diaryNumber.trim()) params.diaryNumber = diaryNumber.trim();
      if (caseNumber.trim()) params.caseNumber = caseNumber.trim();

      if (!params.diaryNumber && !params.caseNumber) {
        setError("Please enter a Diary Number or Case Number to search.");
        setLoading(false);
        return;
      }

      const response = await Api.searchFileByDiaryOrCase(params);
      setResults(response || []);
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="p-4 md:p-6 bg-white shadow rounded-lg w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">
          🔍 File Tracking
        </h2>

        {/* Search Fields */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Diary Number"
            value={diaryNumber}
            onChange={(e) => setDiaryNumber(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <input
            type="text"
            placeholder="Case Number"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {loading && <p>Searching...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {results?.length > 0 && (
          <>
            {/* Desktop Table - Vibrant & Animated */}
            {!loading && results.length > 0 && (
              <div className="hidden sm:block overflow-x-auto mb-8 w-full">
                <table className="min-w-[1000px] w-full border-separate border-spacing-0 rounded-xl overflow-hidden shadow-lg">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white text-left">
                      <th className="p-3 font-semibold">Diary #</th>
                      <th className="p-3 font-semibold">Case #</th>
                      <th className="p-3 font-semibold">Branch</th>
                      <th className="p-3 font-semibold">Inst. Date</th>
                      <th className="p-3 font-semibold">Case Name</th>
                      <th className="p-3 font-semibold">File Receiver</th>
                      <th className="p-3 font-semibold">Designation</th>
                      <th className="p-3 font-semibold">Posting</th>
                      <th className="p-3 font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((file, idx) => (
                      <tr
                        key={file.ID}
                        className={`
              relative
              ${
                idx % 2 === 0
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50"
                  : "bg-gradient-to-r from-pink-50 to-purple-50"
              }
              hover:scale-[1.02] hover:shadow-lg transition-transform duration-300
              border-l-4 ${
                idx % 2 === 0 ? "border-blue-400" : "border-pink-400"
              }
            `}
                      >
                        <td className="p-3">{file.Diary_Number}</td>
                        <td className="p-3">{file.Case_Number}</td>
                        <td className="p-3">{file.Branch}</td>
                        <td className="p-3">
                          {formatDateOnly(file.Institution_Date)}
                        </td>
                        <td className="p-3">{file.Case_Name}</td>
                        <td className="p-3">{file.fullName}</td>
                        <td className="p-3">{file.designation}</td>
                        <td className="p-3">{file.placeOfPosting}</td>
                        <td className="p-3">
                          {formatDateTime(file.ServerDateTime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Card Layout */}
            <div className="sm:hidden mt-4 space-y-3">
              {results.map((file, idx) => (
                <div
                  key={file.ID}
                  className={`p-3 rounded shadow-sm border text-sm ${
                    idx % 2 === 0 ? "bg-blue-50" : "bg-green-50"
                  }`}
                >
                  {/* Diary & Case on one row */}
                  <div className="flex justify-between items-start font-medium text-xs mb-1">
                    <div className="flex gap-2">
                      <div>
                        <span className="font-semibold">Diary:</span>{" "}
                        {file.Diary_Number}
                      </div>
                      <div>
                        <span className="font-semibold">Case:</span>{" "}
                        {file.Case_Number}
                      </div>
                    </div>
                  </div>

                  {/* Case Name */}
                  <div className="text-sm mb-1">
                    <span className="font-semibold">Case Name:</span>{" "}
                    {file.Case_Name}
                  </div>

                  {/* Branch & Inst Date */}
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="font-semibold">Branch:</span> {file.Branch}{" "}
                    | <span className="font-semibold">Date:</span>{" "}
                    {formatDateOnly(file.Institution_Date)}
                  </div>

                  {/* File Receiver, Designation, Posting */}
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="font-semibold">Receiver:</span>{" "}
                    {file.fullName} |{" "}
                    <span className="font-semibold">Designation:</span>{" "}
                    {file.designation}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="font-semibold">Posting:</span>{" "}
                    {file.placeOfPosting} |{" "}
                    <span className="font-semibold">Timestamp:</span>{" "}
                    {formatDateTime(file.ServerDateTime)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default DiaryTracking;
