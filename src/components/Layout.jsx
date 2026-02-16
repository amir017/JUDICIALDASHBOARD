import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faBars,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import Api from "../API/Api";

/* ---------- Submenu Component ---------- */
function MenuItem({ menu, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (menu.children?.length > 0) setIsOpen(!isOpen);
    else if (menu.Url) onNavigate(menu.Url);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        className="
          flex items-center gap-3 px-4 py-2 rounded-xl
          text-white font-semibold
          hover:bg-white/20 transition-all duration-300
        "
        aria-haspopup={menu.children?.length > 0 ? "true" : "false"}
        aria-expanded={isOpen}
      >
        {menu.Icon ? (
          <i className={`${menu.Icon} w-4 h-4`} aria-hidden />
        ) : (
          <FontAwesomeIcon
            icon={faUserCircle}
            className="text-white/90 w-4 h-4"
          />
        )}
        <span>{menu.MenuName}</span>
        {menu.children?.length > 0 && (
          <FontAwesomeIcon
            icon={isOpen ? faChevronUp : faChevronDown}
            className="text-white text-xs ml-1"
          />
        )}
      </button>

      {isOpen && menu.children?.length > 0 && (
        <div
          className="
            absolute left-0 mt-2 w-56
            bg-white/95 backdrop-blur-md
            shadow-2xl rounded-xl border border-white/60
            p-2 animate-slideDown z-[999] overflow-visible
          "
        >
          {menu.children.map((child) => (
            <div
              key={child.MenuID}
              onClick={() => onNavigate(child.Url)}
              className="
                px-4 py-2 text-sm rounded-lg
                text-gray-700 hover:bg-indigo-50 hover:text-indigo-700
                cursor-pointer transition-all duration-150
              "
            >
              {child.MenuName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Avatar Component ---------- */
function Avatar({ user }) {
  const initials = (user.fullName || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user.fullName || "User avatar"}
      className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-lg"
    />
  ) : (
    <div
      className="
        w-12 h-12 rounded-full flex items-center justify-center
        text-white font-bold text-sm shadow-lg
        bg-gradient-to-br from-pink-500 via-indigo-500 to-yellow-400
        ring-2 ring-white
      "
      aria-hidden
    >
      {initials}
    </div>
  );
}

/* ---------- Main Layout Component ---------- */
export default function Layout({ children, onLogout }) {
  const [menus, setMenus] = useState([]);
  const [user, setUser] = useState({});
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        jwtDecode(token);
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(stored.user || {});

        const menusData = await Api.getMenuserp();
        setMenus(menusData);
      } catch (err) {
        console.error("Error fetching menus:", err);
        navigate("/login");
      }
    };

    fetchMenus();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    onLogout();
    navigate("/login");
  };

  const navigateMenu = (url) => navigate(url);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* ---------- Header ---------- */}
      <header className="sticky top-4 z-50 mx-auto w-[96%] relative">
        {/* Gradient background with overlay for readability */}
        <div
          className="
          bg-gradient-to-r from-indigo-600 via-pink-500 to-yellow-400
          bg-opacity-95 backdrop-blur-md
          border border-white/30 shadow-2xl rounded-2xl
          px-6 py-3 flex items-center justify-between
        "
        >
          {/* overlay */}
          <div className="absolute inset-0 bg-black/25 rounded-2xl pointer-events-none"></div>

          {/* Brand */}
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                className="opacity-95"
              >
                <circle cx="7" cy="7" r="3" fill="#fff" opacity="0.12" />
                <circle cx="17" cy="7" r="3" fill="#fff" opacity="0.2" />
                <rect
                  x="6"
                  y="12"
                  width="12"
                  height="6"
                  rx="2"
                  fill="#fff"
                  opacity="0.08"
                />
              </svg>
            </div>
            <div className="relative z-10">
              {/* Full title on desktop */}
              <h1 className="hidden md:block text-white font-extrabold text-lg tracking-tight drop-shadow-md">
                Integrated Judicial Performance & Management System
              </h1>
              {/* Short title on mobile */}
              <h1 className="block md:hidden text-white font-extrabold text-lg tracking-tight drop-shadow-md">
                IJPMS
              </h1>
              <p className="text-white/90 text-xs drop-shadow-sm">
                {/* You can keep this empty or add a tagline */}
              </p>
            </div>
          </div>

          {/* Menus */}
          <nav className="hidden md:flex items-center gap-4 relative z-10">
            {menus.map((menu) => (
              <MenuItem
                key={menu.MenuID}
                menu={menu}
                onNavigate={navigateMenu}
              />
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-4 relative z-10">
            <div className="hidden md:flex flex-col text-right mr-2">
              <span className="text-white font-semibold">
                {user.fullName || "User"}
              </span>
              <span className="text-white/90 text-xs">
                {user.designation || ""}
              </span>
            </div>

            <Avatar user={user} />

            <button
              onClick={handleLogout}
              className="ml-2 text-sm px-3 py-1.5 rounded-full bg-white/90 hover:bg-white transition-shadow shadow-sm"
            >
              Logout
            </button>

            <button
              className="md:hidden text-white text-2xl p-2"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
        </div>

        {/* ---------- Mobile Menu ---------- */}
        {mobileMenu && (
          <div className="md:hidden mx-auto w-[96%] bg-white/95 backdrop-blur-sm rounded-xl mt-3 p-4 shadow-lg border border-white/40 animate-slideDown z-40">
            <div className="flex flex-col gap-2">
              {menus.map((menu) => (
                <div key={menu.MenuID}>
                  <button
                    onClick={() => {
                      if (menu.children?.length > 0) {
                        if (menu.children[0]?.Url)
                          navigateMenu(menu.children[0].Url);
                      } else if (menu.Url) {
                        navigateMenu(menu.Url);
                      }
                      setMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    {menu.MenuName}
                  </button>
                  {menu.children?.length > 0 && (
                    <div className="pl-4 mt-2 space-y-1">
                      {menu.children.map((c) => (
                        <button
                          key={c.MenuID}
                          onClick={() => {
                            navigateMenu(c.Url);
                            setMobileMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition text-sm"
                        >
                          {c.MenuName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenu(false);
                }}
                className="w-full mt-3 bg-red-500 text-white py-2 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ---------- Main content ---------- */}
      <main className="flex-grow p-6 mt-6">{children}</main>

      {/* ---------- Animations ---------- */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 180ms ease-out; }
      `}</style>
    </div>
  );
}
