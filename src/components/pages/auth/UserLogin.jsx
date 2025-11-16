import React, { useEffect, useState } from "react";
import GlobalInput from "../../shared/GlobalInputs";
import { IoIosEyeOff, IoMdEye } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "../../context/AuthContext"; // ✅ Import AuthContext

const UserLogin = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ Get login function from AuthContext

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  // Load saved credentials only when an input is clicked
  const handleFocus = () => {
    if (!credentialsLoaded) {
      const cookies = Cookies.get();
      if (cookies.rememberMe === "true") {
        setRememberMe(true);
        setForm({
          username: cookies.username || "",
          password: cookies.password || "",
        });
      }
      setCredentialsLoaded(true);
    }
  };

  // Check if password needs to be changed
  const checkPasswordExpiry = async (lastPasswordChange) => {
    if (!lastPasswordChange) return false;

    try {
      const policyResponse = await axios.get(
        "https://hdp-backend-1vcl.onrender.com/api/password-change-time"
      );
      const requiredDays = policyResponse.data.days;

      const lastChangeDate = new Date(lastPasswordChange);
      const currentDate = new Date();
      const daysDifference = Math.floor(
        (currentDate - lastChangeDate) / (1000 * 60 * 60 * 24)
      );

      return daysDifference >= requiredDays;
    } catch (error) {
      console.error("❌ Error fetching password policy:", error);
      const lastChangeDate = new Date(lastPasswordChange);
      const currentDate = new Date();
      const daysDifference = Math.floor(
        (currentDate - lastChangeDate) / (1000 * 60 * 60 * 24)
      );
      return daysDifference >= 90; // Fallback
    }
  };

  // Handle Login Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.username || !form.password) {
      setError("Please enter both Username and Password");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "https://hdp-backend-1vcl.onrender.com/api/auth/user/login",
        {
          username: form.username.toLowerCase(),
          password: form.password,
        }
      );

      const data = response.data;
      console.log("✅ Login Response:", data);

      if (data.user && data.token) {
        // ✅ Store user info in AuthContext
        login({
          userId: data.user.userId,
          username: data.user.username,
          displayName: data.user.displayName,
          role: data.user.role,
          department: data.user.department,
          token: data.token,
        });

        // Also store in sessionStorage for backward compatibility
        sessionStorage.setItem("userToken", data.token);
        sessionStorage.setItem("userId", data.user.userId);
        sessionStorage.setItem("userData", JSON.stringify(data.user));

        // Check if password needs to be changed
        const passwordExpired = await checkPasswordExpiry(
          data.user.lastPasswordChange
        );

        if (passwordExpired) {
          alert(
            "Your password has expired. Please change your password to continue."
          );
          navigate("/password");
          setLoading(false);
          return;
        }

        // Handle Remember Me
        if (rememberMe) {
          Cookies.set("rememberMe", "true", { expires: 7 });
          Cookies.set("username", form.username, { expires: 7 });
          Cookies.set("password", form.password, { expires: 7 });
        } else {
          Cookies.remove("rememberMe");
          Cookies.remove("username");
          Cookies.remove("password");
        }

        // ✅ Simplified Routing - Navigate to unified dashboard
        const userRole = data.user.role?.toLowerCase() || "unknown";

        // Check if user is a requester
        if (userRole === "requester") {
          navigate("/requester/dashboard");
        }
        // Check if user is a manager (including vessel manager, fleet manager, etc.)
        else if (
          userRole === "vessel manager" ||
          userRole === "fleet manager" ||
          userRole === "it manager" ||
          userRole === "account manager" ||
          userRole === "operations manager" ||
          userRole === "equipment manager" ||
          userRole === "lines manager" ||
          userRole === "project manager" ||
          userRole === "purchase manager"
        ) {
          navigate("/manager/dashboard");
        }
        // Admin
        else if (userRole === "admin") {
          navigate("/admin/dashboard");
        }
        // Other roles (keep existing routing for now)
        else if (userRole === "procurement") navigate("/procurement");
        else if (userRole === "managing director") navigate("/md/dashboard");
        else if (userRole === "accounting") navigate("/account/dashboard");
        else if (userRole === "shipping") navigate("/shipping/dashboard");
        else if (userRole === "delivery base") navigate("/delivery/dashboard");
        else if (userRole === "delivery jetty") navigate("/jetty/dashboard");
        else if (userRole === "delivery vessel") navigate("/vessel/dashboard");
        else if (userRole === "it officer") navigate("/it/officer/dashboard");
        else if (userRole === "marine officer")
          navigate("/marine/officer/dashboard");
        else if (userRole === "director of it") navigate("/director/dashboard");
        else if (userRole === "request handler")
          navigate("/marine/handler/dashboard");
        else if (userRole === "head of procurement")
          navigate("/procurement/m/dashboard");
        else if (userRole === "cfo") navigate("/cfo/dashboard");
        else if (userRole === "director of operations")
          navigate("/op/director/dashboard");
        else if (userRole === "head of project")
          navigate("/headOfProject/dashboard");
        else {
          console.error("❌ Unknown user role:", userRole);
          setError("Unauthorized access");
        }
      }
    } catch (error) {
      console.error("❌ Login Error:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Invalid credentials");
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
          {/* Header Section */}
          <div className="mb-10 text-center">
            <h1 className="text-[2rem] font-semibold text-white mb-2 tracking-tight leading-tight">
              Welcome Back
            </h1>
            <p className="text-[0.9375rem] text-gray-400 font-normal">
              Ready to continue? Let's sign you in
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-[0.8125rem] font-medium flex items-center">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
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
                placeholder="username"
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
                  onClick={() => setShowPassword(!showPassword)}
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
                onChange={() => setRememberMe(!rememberMe)}
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
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              <span>Sign In</span>
            )}
          </button>

            <div className="mt-4 text-white  flex justify-center items-center">
            <a
              onClick={() => navigate("/admin")}
              className="hover:underline cursor-pointer"
            >
              Admin Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserLogin;
