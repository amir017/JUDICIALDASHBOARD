import axios from "axios";

class Api {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: "/api",
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
  async getDistrictPostingCount(designation) {
    const res = await this.axiosInstance.get("/dj/getDistrictPostingCount", {
      params: { designation },
    });
    return res.data;
  }
  async getDistrictPostingCountoverAll() {
    const res = await this.axiosInstance.get(
      "/dj/getDistrictPostingCountoverAll",
    );
    return res.data;
  }
  async getOfficerPostingDetail({
    designationId = "ALL",
    districtName = null,
  } = {}) {
    const res = await this.axiosInstance.get("/dj/getOfficerPostingDetail", {
      params: { designationId, districtName },
    });
    return res.data;
  }
  async getDesignationWiseCountWithDistrictFilter(districtName) {
    const res = await this.axiosInstance.get(
      "/dj/getDesignationWiseCountWithDistrictFilter",
      { params: { districtName } },
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
    console.log("officerId ", officerId);
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
}

export default new Api();
