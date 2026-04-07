import axios from "axios";

class Api {
  constructor() {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
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

  async getOfficerTrainings({ officerId }) {
    const res = await this.axiosInstance.get("/dj/getOfficerTrainings", {
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
}

export default new Api();
