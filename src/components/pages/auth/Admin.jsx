import React, { useEffect, useState } from "react";
import { IoIosEyeOff, IoMdEye } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "../../context/AuthContext";

const Admin = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Load saved admin credentials (separate cookie keys to avoid cross-fill)
  const handleFocus = () => {
    if (!credentialsLoaded) {
      const adminRemember = Cookies.get("admin_rememberMe");
      if (adminRemember === "true") {
        setRememberMe(true);
        setForm({
          username: Cookies.get("admin_username") || "",
          password: Cookies.get("admin_password") || "",
        });
      }
      setCredentialsLoaded(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.username || !form.password) {
      setError("Please enter both username and password");
      setLoading(false);
      return;
    }

    try {
      const resp = await axios.post(
        "https://hdp-backend-1vcl.onrender.com/api/auth/admin/login",
        {
          username: form.username.toLowerCase(),
          password: form.password,
        }
      );

      const data = resp.data;
      // Expect admin response to include adminId and token and accessLevel
      if (data && data.adminId && data.token && data.accessLevel) {
        // Save auth via AuthContext
        login({
          adminId: data.adminId,
          username: data.username,
          displayName: data.displayName,
          accessLevel: data.accessLevel,
          token: data.token,
        });

        // Remember me (admin-specific cookie keys)
        if (rememberMe) {
          Cookies.set("admin_rememberMe", "true", { expires: 7 });
          Cookies.set("admin_username", form.username, { expires: 7 });
          Cookies.set("admin_password", form.password, { expires: 7 });
        } else {
          Cookies.remove("admin_rememberMe");
          Cookies.remove("admin_username");
          Cookies.remove("admin_password");
        }

        // Redirect admin to admin dashboard
        navigate("/admin/dashboard");
      } else {
        setError("Invalid admin credentials or unexpected response");
      }
    } catch (err) {
      console.error("Admin login error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
        <div
          className="absolute -bottom-40 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        />
      </div>

      {/* Grid pattern background - light mode */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
          linear-gradient(to right, rgba(0, 0, 0, 0.06) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.06) 1px, transparent 1px)
        `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Radial gradient fade for grid */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(255, 255, 255, 0.7) 60%, rgba(255, 255, 255, 0.95) 100%)",
        }}
      />

      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <form
          onSubmit={handleSubmit}
          className="relative bg-[#1a1a1a] p-12 rounded-3xl w-full max-w-[660px] flex flex-col border border-gray-800/50"
          style={{
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.03)",
          }}
        >
          <div className="mb-10 text-center">
            <h1 className="text-[2rem] font-semibold text-white mb-2 tracking-tight leading-tight">
              Admin Sign In
            </h1>
            <p className="text-[0.9375rem] text-gray-400 font-normal">
              Administrative access only. Use your admin credentials.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-[0.8125rem] font-medium">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-5">
            <div className="relative">
              <label className="block text-[0.6875rem] font-semibold text-gray-400 mb-2.5 uppercase tracking-[0.08em] pl-0.5">
                Username
              </label>
              <input
                name="username"
                value={form.username}
                placeholder="admin username"
                onChange={handleChange}
                onFocus={handleFocus}
                className="w-full h-[2.875rem] px-4 text-[0.9375rem] text-white placeholder-gray-500 bg-[#0f0f0f] border border-gray-700/50 rounded-xl focus:outline-none focus:border-gray-600 hover:border-gray-600/70 transition-all duration-200"
              />
            </div>

            <div className="relative">
              <label className="block text-[0.6875rem] font-semibold text-gray-400 mb-2.5 uppercase tracking-[0.08em] pl-0.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  placeholder="password"
                  onChange={handleChange}
                  onFocus={handleFocus}
                  className="w-full h-[2.875rem] px-4 pr-12 text-[0.9375rem] text-white placeholder-gray-500 bg-[#0f0f0f] border border-gray-700/50 rounded-xl focus:outline-none focus:border-gray-600 hover:border-gray-600/70 transition-all duration-200"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200 focus:outline-none p-1"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? (
                    <IoMdEye className="w-[1.125rem] h-[1.125rem]" />
                  ) : (
                    <IoIosEyeOff className="w-[1.125rem] h-[1.125rem]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-start mt-6 text-white text-sm">
            <label className="flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe((s) => !s)}
                className="mr-2 accent-blue-500"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-7 h-[2.875rem] px-6 text-[0.9375rem] font-semibold text-[#0a0a0a] bg-white rounded-xl transition-all duration-200 shadow-sm ${
              loading
                ? "cursor-not-allowed opacity-60"
                : "hover:bg-gray-50 active:scale-[0.98] hover:shadow-md"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2.5">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <span>Sign In</span>
            )}
          </button>

          <div className="mt-4 text-white flex justify-center items-center">
            <a
              onClick={() => navigate("/login")}
              className="hover:underline cursor-pointer"
            >
              User Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Admin;
