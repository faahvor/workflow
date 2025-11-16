// const handleSubmit = async (e) => {
//   e.preventDefault();
//   setLoading(true);
//   setError("");

//   if (!form.username || !form.password) {
//     setError("Please enter both username and Password");
//     setLoading(false);
//     return;
//   }

//   try {
//     const response = await axios.post(
//       "https://hdp-backend-1vcl.onrender.com/api/auth/user/login",
//       {
//         username: form.username.toLowerCase(),
//         password: form.password,
//       }
//     );

//     const data = response.data;
//     console.log("✅ Login Response:", data);

//     if (data.userId && data.token) {
//       // ✅ Store user info in AuthContext
//       login({
//         userId: data.userId,
//         username: data.username,
//         displayName: data.displayName,
//         role: data.role,
//         department: data.department,
//         token: data.token,
//       });

//       console.log("✅ User logged in:", data.user);

//       // ✅ TEMPORARILY SKIP PASSWORD EXPIRY CHECK
//       // We'll add it back later after login works
//       /*
//       // Check password expiry
//       const passwordExpired = await checkPasswordExpiry(
//         data.user.lastPasswordChange
//       );

//       if (passwordExpired) {
//         alert("Your password has expired. Please change your password.");
//         navigate("/password");
//         setLoading(false);
//         return;
//       }
//       */

//       // Handle Remember Me
//       if (rememberMe) {
//         Cookies.set("rememberMe", "true", { expires: 7 });
//         Cookies.set("username", form.username, { expires: 7 });
//         Cookies.set("password", form.password, { expires: 7 });
//       } else {
//         Cookies.remove("rememberMe");
//         Cookies.remove("username");
//         Cookies.remove("password");
//       }

//       // ✅✅✅ SIMPLIFIED ROUTING - Just redirect to /dashboard
//       console.log("🚀 About to navigate to /dashboard");
//       console.log("🚀 Current user from AuthContext:", data.user);
//       navigate("/dashboard");
//       console.log("🚀 Navigate called");
//     }
//   } catch (error) {
//     console.error("❌ Login Error:", error.response?.data || error.message);
//     setError(error.response?.data?.message || "Invalid credentials");
//   } finally {
//     setLoading(false);
//   }
// };