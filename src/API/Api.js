import axios from "axios";

class Api {
  constructor() {
    const runtimeBase =
      (typeof window !== "undefined" && window.__API_BASE_URL__) ||
      (typeof window !== "undefined" && window.__APP_CONFIG__?.API_BASE_URL) ||
      "";

    const envBase = import.meta.env.VITE_API_BASE_URL || "";

    // Fallback for production deployments that open by IP/hostname but forgot to rebuild with env.
    // Example: http://10.3.0.101:5173  ->  http://10.3.0.101:5001/api
    const inferredBase =
      typeof window !== "undefined" && window.location?.hostname
        ? `${window.location.protocol}//${window.location.hostname}:5001/api`
        : "";

    const API_BASE_URL = (runtimeBase || envBase || inferredBase).replace(/\/+$/, "");
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 100000000,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token && !config.url.includes("/auth/login")) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if ([401, 403].includes(error?.response?.status)) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      },
    );
  }

  async login(username, password) {
    const res = await this.axiosInstance.post("/auth/login", {
      username,
      password,
    });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    return res.data;
  }

  async logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  async getMenus() {
    const res = await this.axiosInstance.get("/auth/menus");
    return res.data;
  }
  async getMenuserp() {
    const res = await this.axiosInstance.get("/auth/menuserp");
    return res.data;
  }

  async getCaseDetails(params) {
    const res = await this.axiosInstance.get("/case-details", { params });
    return res.data;
  }

  async getPartyDetails(params) {
    const res = await this.axiosInstance.get("/party-details", { params });
    return res.data;
  }

  async getDiaryDetails(params) {
    const res = await this.axiosInstance.get("/diary-basic-details", {
      params,
    });
    return res.data;
  }

  async saveFileMovements(payload) {
    const res = await this.axiosInstance.post("/file-movement/save", payload);
    return res.data;
  }

  async getUserFiles() {
    const res = await this.axiosInstance.get("/file-movement/user-files");
    return res.data;
  }

  async searchFileByDiaryOrCase(params = {}) {
    const res = await this.axiosInstance.get("/file-movement/diary-search", {
      params,
    });
    return res.data;
  }
  async getMyFiles(params) {
    const res = await this.axiosInstance.get("/file-movement/myfiles");
    return res.data;
  }
  async getOverallCount() {
    const res = await this.axiosInstance.get("/dj/getDesignationCount");
    return res.data;
  }
  async getDistrictPostingCount(designation, cadre = "ALL") {
    const res = await this.axiosInstance.get("/dj/getDistrictPostingCount", {
      params: {
        designation,
        cadre,
      },
    });

    return res.data;
  }
  async getDistrictPostingCountoverAll(cadre = "ALL") {
    const res = await this.axiosInstance.get(
      "/dj/getDistrictPostingCountoverAll",
      {
        params: { cadre },
      },
    );

    return res.data;
  }
  async getOfficerPostingDetail({
    designationId = "ALL",
    designation = null,
    districtName = null,
    cadre = "ALL",
  } = {}) {
    const res = await this.axiosInstance.get("/dj/getOfficerPostingDetail", {
      params: { designationId, designation, districtName, cadre },
    });
    return res.data;
  }
  async getDesignationWiseCountWithDistrictFilter(districtName, cadre = "ALL") {
    const res = await this.axiosInstance.get(
      "/dj/getDesignationWiseCountWithDistrictFilter",
      {
        params: { districtName, cadre },
      },
    );
    return res.data;
  }
  async getOfficerProfile({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerProfile", {
      params: { officerId },
    });
    return res.data;
  }
  /**
   * Posting history: when joined to designation (e.g. SUBJUDICARY), expose per-row
   * `MATUREPERIOD` and `SHORTPERIOD` (days) so posting analytics can use designation rules:
   * SELECT d.DESIGNATIONID, d.DESIGNATIONDESC, d.MATUREPERIOD, d.SHORTPERIOD FROM designation d
   */
  async getOfficerPostingHistory({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerPostingHistory", {
      params: { officerId },
    });
    return res.data;
  }
  async getOfficerQualifications({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerQualifications", {
      params: { officerId },
    });
    return res.data;
  }
  async getOfficerLeaves({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerLeaves", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerLeavesYearly({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerLeavesYearly", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerSkills({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerSkills", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerPublications({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerPublications", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerGames({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerGames", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerAchievements({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerAchievements", {
      params: { officerId },
    });
    return res.data;
  }

  /**
   * Officer trainings — backend should run against SUBJUDICARY (or equivalent), e.g.:
   * SELECT t.OFFICERID, t.COURSE_NAME, t.RECEIVED_FROM, t.FROM_DATE, t.TO_DATE,
   *        tp.TPROVIDER_NAME, c.CITYNAME, v.COUNTRYNAME
   * FROM TRAINING_COURSES t
   * LEFT JOIN visited_country_names v ON v.COUNTRY_ID = t.COUNTRYID
   * LEFT JOIN visited_city_names c ON c.CITY_ID = t.CITYID
   * LEFT JOIN training_provider_type tp ON tp.TPROVIDER_TYPE_ID = t.TPROVIDER_TYPE_ID
   * WHERE t.OFFICERID = :officerId
   */
  async getOfficerTrainings({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerTrainings", {
      params: {
        officerId,
        OFFICER_ID: officerId,
      },
    });
    return res.data;
  }

  /**
   * Brother/sister relationship records (SUBJUDICARY), e.g.:
   * SELECT b.OFFICER_ID, b.BS_NAME AS NAME, r.RELATION_TYPE AS RELATION
   * FROM brother_sister b
   * LEFT JOIN relation_type r ON b.RELATIONTYPE = r.RELATION_TYPE
   *
   * Children can be included in same response shape as well, e.g.:
   * SELECT c.OFFICER_ID, c.CHILD_NAME AS NAME, 'Child' AS RELATION,
   *        c.EDUCATION, c.INSTITUTION
   * FROM children c
   * WHERE b.OFFICER_ID = :officerId
   */
  async getOfficerRelationships({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerRelationships", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerComplaints({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerComplaints", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerInquiry({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerInquiry", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerInquiryDetail({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerInquiryDetail", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerInquiryHearing({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerInquiryHearing", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerInquiryDecision({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerInquiryDecision", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerInquiryN({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerInquiryN", {
      params: { officerId },
    });
    return res.data;
  }

  /** jofficerinquiry + hearing + decision; link to complaints via COMPLAINT_NO */
  async getOfficerInquiryJoined({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerInquiryJoined", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerInquiryNHearing({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerInquiryNHearing", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerInquiryNDecision({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerInquiryNDecision", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerExamAttempts({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerExamAttempts", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerExamAttemptDetails({ officerId }) {
    const res = await this.axiosInstance.get(
      "/dj/getOfficerExamAttemptDetails",
      {
        params: { officerId },
      },
    );
    return res.data;
  }

  async getOfficerExamResults({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerExamResults", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerExamRemedy({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerExamRemedy", {
      params: { officerId },
    });
    return res.data;
  }

  async getOfficerACR({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerACR", {
      params: { officerId },
    });
    return res.data;
  }

  /** Complaint schema — PERFORMANCE aggregates by PERSONAL# */
  async getComplaintPerformanceSummary({ personalNo }) {
    const encoded = encodeURIComponent(String(personalNo || "").trim());
    const res = await this.axiosInstance.get(
      `/complaint/performance-summary/${encoded}`,
    );
    return res.data;
  }

  /** Complaint schema — COMPLAINT rows + posting district/tehsil by PERSONAL# */
  async getComplaintSchemaComplaints({ personalNo }) {
    const encoded = encodeURIComponent(String(personalNo || "").trim());
    const res = await this.axiosInstance.get(
      `/complaint/complaint-records/${encoded}`,
    );
    return res.data;
  }
}

export default new Api();
