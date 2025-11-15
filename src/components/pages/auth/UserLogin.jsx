import React, { useEffect, useState } from "react";
import GlobalInput from "../../components/GlobalInputs";
import { IoIosEyeOff, IoMdEye } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "../../context/AuthContext"; // ✅ Import AuthContext

const UserLogin = () => {
  const [form, setForm] = useState({ id: "", password: "" });
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
          id: cookies.id || "",
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
        "https://hwfp-backend-s3.onrender.com/api/password-change-time"
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

    if (!form.id || !form.password) {
      setError("Please enter both ID and Password");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "https://hwfp-backend-s3.onrender.com/api/auth/login",
        {
          id: form.id.toLowerCase(),
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
          Cookies.set("id", form.id, { expires: 7 });
          Cookies.set("password", form.password, { expires: 7 });
        } else {
          Cookies.remove("rememberMe");
          Cookies.remove("id");
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
        else if (userRole === "marine officer") navigate("/marine/officer/dashboard");
        else if (userRole === "director of it") navigate("/director/dashboard");
        else if (userRole === "request handler") navigate("/marine/handler/dashboard");
        else if (userRole === "head of procurement") navigate("/procurement/m/dashboard");
        else if (userRole === "cfo") navigate("/cfo/dashboard");
        else if (userRole === "director of operations") navigate("/op/director/dashboard");
        else if (userRole === "head of project") navigate("/headOfProject/dashboard");
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
    <div className="relative h-screen w-screen overflow-hidden bg-gray-200 bg-cover blurred-bg">
      <div className="absolute top-0 left-0 w-full h-full bg-white/30 opacity-30 backdrop-blur-l overflow-hidden"></div>
      <div className="relative z-10 flex items-center justify-center h-full overflow-hidden">
        <form
          onSubmit={handleSubmit}
          className="bg-white/20 backdrop-blur-xl p-10 rounded-xl shadow-2xl w-[650px] min-h-[550px] text-center border border-white/20 flex flex-col justify-center"
        >
          <h1 className="text-3xl font-bold mb-6 tracking-wider text-black">
            LOGIN
          </h1>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          
          <GlobalInput
            label="Email"
            name="id"
            value={form.id}
            placeholder="Enter your Email"
            onChange={handleChange}
            onFocus={handleFocus}
            className="text-black placeholder-white/70 border-b border-white/50 bg-transparent focus:border-white outline-none mt-4 text-center"
            inputHeight="h-14 py-3"
          />
          
          <div className="relative mt-8">
            <GlobalInput
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              placeholder="Enter your password"
              onChange={handleChange}
              onFocus={handleFocus}
              className="text-black placeholder-white/70 border-b border-white/50 bg-transparent focus:border-white outline-none text-center"
              inputHeight="h-14 py-3"
            />
            <span
              className="absolute right-3 top-[2.4rem] text-black cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <IoMdEye /> : <IoIosEyeOff />}
            </span>
          </div>
          
          <div className="flex items-center justify-start mt-6 text-black text-sm">
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
            className={`relative w-full mt-4 px-6 py-3 text-lg font-semibold group transition-all duration-200 ease-out rounded-xl overflow-hidden ${
              loading ? "cursor-not-allowed" : ""
            }`}
          >
            <div
              className={`absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-black rounded-xl ${
                loading
                  ? ""
                  : "group-hover:-translate-x-0 group-hover:-translate-y-0"
              }`}
            ></div>
            <div
              className={`absolute inset-0 w-full h-full bg-white border-2 border-black rounded-xl ${
                loading ? "" : "group-hover:bg-black"
              }`}
            ></div>
            <div
              className={`relative z-10 flex items-center justify-center ${
                loading ? "text-black" : "text-black group-hover:text-white"
              }`}
            >
              {loading ? <div className="loader"></div> : "Sign In"}
            </div>
          </button>
          
          <p className="mt-4 text-black">
            <a
              onClick={() => navigate("/admin")}
              className="hover:underline cursor-pointer"
            >
              Admin Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default UserLogin;