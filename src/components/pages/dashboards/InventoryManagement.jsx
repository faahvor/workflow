import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { IoMdClose } from "react-icons/io";
import {
  MdSearch,
  MdAdd,
  MdCloudUpload,
  MdBusiness,
  MdInventory,
  MdWarning,
  MdEdit,
  MdDelete,
  MdImage,
  MdChevronLeft,
  MdChevronRight,
  MdFileDownload,
  MdPrint,
  MdVerified,
  MdPending,
} from "react-icons/md";
import { useGlobalAlert } from "../../shared/GlobalAlert";
import { useGlobalPrompt } from "../../shared/GlobalPrompt";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 50;
const LOWSTOCK_PAGE_SIZE = 20;

function getStoreLocationFromRole(role) {
  if (!role) return null;
  const r = String(role).toLowerCase();
  if (r === "store base") return "Store Base";
  if (r === "store jetty") return "Store Jetty";
  if (r === "store vessel") return "Store Vessel";
  return null;
}

export default function InventoryManagement() {
  const { getToken, user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [lowStockPages, setLowStockPages] = useState(1);
  const [lowStockTotal, setLowStockTotal] = useState(0);
  const [lowStockLoading, setLowStockLoading] = useState(false);
  const addFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const [addPhotos, setAddPhotos] = useState([]); // File[] selected in Add modal
  const [editPhotos, setEditPhotos] = useState([]); // File[] selected in Edit modal (new files)
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerList, setPhotoViewerList] = useState([]); // array of URLs
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);
  const { showAlert } = useGlobalAlert();
  const { showPrompt } = useGlobalPrompt();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    department: "Marine",
    name: "",
    quantity: 0,
    maker: "",
    makerPartNumber: "",
    isVerified: true,
  });

  const [activeStat, setActiveStat] = useState("all"); // 'all' | 'low'
  const searchDebounceRef = useRef(null);
  const roleLower = String(user?.role || user?.accessLevel || "").toLowerCase();
  const isAdmin = roleLower === "admin";
  const isProcurementManager = roleLower === "procurement manager";
  const storeLocation = getStoreLocationFromRole(user?.role);
  const [showRestockForm, setShowRestockForm] = useState(false);
  const [drawerItem, setDrawerItem] = useState(null);
  const [restockForm, setRestockForm] = useState({
    quantity: "",
    unitPrice: "",
    receivedAt: "",
  });
  const [restockLoading, setRestockLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryMode, setCategoryMode] = useState("edit"); // 'create' | 'edit'
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    code: "",
    accountClass: "",
  });
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryFilterByAccountClass, setCategoryFilterByAccountClass] =
    useState("");
  const [categoryFilterByCode, setCategoryFilterByCode] = useState("");
  const [categoryFilterByName, setCategoryFilterByName] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);
  const CATEGORY_PAGE_SIZE = 50;
  const departmentOptions = [
    { name: "Marine" },
    { name: "IT" },
    { name: "Account" },
    { name: "Legal" },
    { name: "QHSE" },
    { name: "Operations" },
    { name: "Project" },
    { name: "Vessel/Catering" },
    { name: "Purchase" },
    { name: "Protocol" },
    { name: "Store" },
    { name: "HR" },
    { name: "Admin" },
  ];

  const handleRestock = async () => {
    if (!drawerItem?.inventoryId) return;
    setRestockLoading(true);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        quantity: Number(restockForm.quantity),
        unitPrice: Number(restockForm.unitPrice),
        receivedAt: restockForm.receivedAt || new Date().toISOString(),
      };
      await axios.post(
        `${API_BASE}/inventory/${drawerItem.inventoryId}/restock`,
        payload,
        { headers }
      );
      showAlert("Restock successful!");

      // Close modal and reset form
      setShowRestockForm(false);
      setRestockForm({ quantity: "", unitPrice: "", receivedAt: "" });
      setDrawerItem(null);

      // Refresh inventory lists
      await Promise.all([
        fetchInventory(page, search, department),
        fetchLowStock(lowStockPage, search, department),
      ]);
    } catch (err) {
      showAlert(err.response?.data?.message || "Restock failed");
    } finally {
      setRestockLoading(false);
    }
  };

  const filteredInventory =
    isAdmin || isProcurementManager
      ? inventory
      : inventory.filter((item) => item.storeLocation === storeLocation);

  const filteredLowStock =
    isAdmin || isProcurementManager
      ? lowStock
      : lowStock.filter((item) => item.storeLocation === storeLocation);

  const visible = activeStat === "low" ? filteredLowStock : filteredInventory;

  const openPhotoViewerForItem = (item, startIndex = 0) => {
    const photos = Array.isArray(item.photos) ? item.photos : [];
    if (!photos.length) return;
    setPhotoViewerList(photos);
    setPhotoViewerIndex(startIndex);
    setPhotoViewerOpen(true);
  };

  const closePhotoViewer = () => {
    setPhotoViewerOpen(false);
    setPhotoViewerList([]);
    setPhotoViewerIndex(0);
  };

  const photoPrev = () => setPhotoViewerIndex((i) => Math.max(0, i - 1));
  const photoNext = () =>
    setPhotoViewerIndex((i) => Math.min(photoViewerList.length - 1, i + 1));

  const triggerAddFilePicker = () =>
    addFileInputRef.current && addFileInputRef.current.click();
  const triggerEditFilePicker = () =>
    editFileInputRef.current && editFileInputRef.current.click();

  const handleAddFilesSelected = (filesList) => {
    if (!filesList) return;
    const arr = Array.from(filesList);
    setAddPhotos((prev) => {
      const merged = [...prev];
      arr.forEach((f) => {
        const exists = merged.some(
          (e) =>
            e.name === f.name &&
            e.size === f.size &&
            e.lastModified === f.lastModified
        );
        if (!exists) merged.push(f);
      });
      return merged;
    });
  };

  const handleEditFilesSelected = (filesList) => {
    if (!filesList) return;
    const arr = Array.from(filesList);
    setEditPhotos((prev) => {
      const merged = [...prev];
      arr.forEach((f) => {
        const exists = merged.some(
          (e) =>
            e.name === f.name &&
            e.size === f.size &&
            e.lastModified === f.lastModified
        );
        if (!exists) merged.push(f);
      });
      return merged;
    });
  };

  const removeAddPhoto = (idx) =>
    setAddPhotos((p) => p.filter((_, i) => i !== idx));
  const removeEditPhoto = (idx) =>
    setEditPhotos((p) => p.filter((_, i) => i !== idx));

  const onAddDrop = (e) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt && dt.files) handleAddFilesSelected(dt.files);
  };
  const onAddDragOver = (e) => {
    e.preventDefault();
  };
  const onAddDragLeave = (e) => {
    e.preventDefault();
  };

  const onEditDrop = (e) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt && dt.files) handleEditFilesSelected(dt.files);
  };
  const onEditDragOver = (e) => {
    e.preventDefault();
  };
  const onEditDragLeave = (e) => {
    e.preventDefault();
  };

  const downloadPhoto = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = url.split("/").pop().split("?")[0] || "photo";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const printPhoto = (url) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<html><head><title>Print</title></head><body style="margin:0"><img src="${url}" style="width:100%;height:auto"/></body></html>`
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 200);
  };

  const handleAdd = async () => {
    try {
      setLoading(true);
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      if (!token) {
        showAlert("Authentication required.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // If there are photos selected, send multipart/form-data
      if (addPhotos && addPhotos.length > 0) {
        const formData = new FormData();
        formData.append("department", form.department);
        if (form.categoryId) formData.append("categoryId", form.categoryId);

        formData.append("name", form.name);
        formData.append("quantity", Number(form.quantity) || 0);
        if (form.maker) formData.append("maker", form.maker);
        if (form.makerPartNumber)
          formData.append("makerPartNumber", form.makerPartNumber);
        formData.append("storeLocation", form.storeLocation);
        formData.append("minStock", Number(form.minStock));
        if (form.maxStock) formData.append("maxStock", Number(form.maxStock));
        if (form.reorderQuantity)
          formData.append("reorderQuantity", Number(form.reorderQuantity));
        formData.append("pricingMode", form.pricingMode || "batch");
        formData.append("unitPrice", Number(form.unitPrice));
        addPhotos.forEach((file) => {
          formData.append("photos", file);
        });

        const resp = await axios.post(`${API_BASE}/inventory`, formData, {
          headers,
        });

        const created = resp.data?.data || resp.data;
        if (created) {
          await Promise.all([
            fetchInventory(1, search, department),
            fetchLowStock(1, search, department),
          ]);
          setShowAdd(false);
          setForm({
            department: "Marine",
            name: "",
            quantity: 0,
            maker: "",
            makerPartNumber: "",
            storeLocation: storeLocation || "",
            minStock: "",
            maxStock: "",
            reorderQuantity: "",
            pricingMode: "batch",
            unitPrice: "",
          });
          setAddPhotos([]);
          showAlert("Inventory added.");
          return;
        }
      } else {
        // fallback to JSON payload (existing behavior)
        const payload = {
          department: form.department,
          ...(form.categoryId ? { categoryId: form.categoryId } : {}),

          name: form.name,
          quantity: Number(form.quantity) || 0,
          maker: form.maker,
          makerPartNumber: form.makerPartNumber,
          storeLocation: form.storeLocation,
          minStock: Number(form.minStock),
          ...(form.maxStock !== "" && form.maxStock !== undefined
            ? { maxStock: Number(form.maxStock) }
            : {}),
          ...(form.reorderQuantity !== "" && form.reorderQuantity !== undefined
            ? { reorderQuantity: Number(form.reorderQuantity) }
            : {}),
          pricingMode: form.pricingMode || "batch",
          unitPrice: Number(form.unitPrice),
        };
        const resp = await axios.post(`${API_BASE}/inventory`, payload, {
          headers,
        });
        const created = resp.data?.data || resp.data;
        if (created) {
          await Promise.all([
            fetchInventory(1, search, department),
            fetchLowStock(1, search, department),
          ]);
          setShowAdd(false);
          setForm({
            department: "Marine",
            categoryId: "",

            name: "",
            quantity: 0,
            maker: "",
            makerPartNumber: "",
            storeLocation: storeLocation || "",
            minStock: "",
            maxStock: "",
            reorderQuantity: "",
            pricingMode: "batch",
            unitPrice: "",
          });
          showAlert("Inventory added.");
          return;
        }
      }

      throw new Error("Invalid create response");
    } catch (err) {
      // Log the entire error object
      console.error("Error creating inventory:", err);

      // Log the backend response if available
      if (err.response) {
        console.error("Backend error response:", err.response);
        console.error("Backend error data:", err.response.data);
        console.error("Backend error status:", err.response.status);
        console.error("Backend error headers:", err.response.headers);
      }

      showAlert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to create item"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async (p = 1, q = "", dept = "") => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = [`page=${p}`, `limit=${PAGE_SIZE}`];
      if (q) params.push(`search=${encodeURIComponent(q)}`);
      if (dept) params.push(`department=${encodeURIComponent(dept)}`);

      const url = `${API_BASE}/inventory?${params.join("&")}`;
      const resp = await axios.get(url, { headers });

      const body = resp.data || {};
      const data = Array.isArray(body.data)
        ? body.data
        : Array.isArray(body)
        ? body
        : [];
      setInventory(data.map((d) => ({ ...d })));
      setPage(body.page ?? p);
      setPages(
        body.pages ??
          Math.max(1, Math.ceil((body.total ?? data.length) / PAGE_SIZE))
      );
      setTotal(body.total ?? data.length);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(err.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async (
    p = 1,
    q = "",
    dept = "",
    limit = LOWSTOCK_PAGE_SIZE,
    sortBy = "createdAt_desc"
  ) => {
    setLowStockLoading(true);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = [
        `page=${p}`,
        `limit=${limit}`,
        `sortBy=${encodeURIComponent(sortBy)}`,
      ];
      if (q) params.push(`search=${encodeURIComponent(q)}`);
      if (dept) params.push(`department=${encodeURIComponent(dept)}`);

      const url = `${API_BASE}/inventory/low-stock?${params.join("&")}`;
      const resp = await axios.get(url, { headers });
      const body = resp.data || {};
      const data = Array.isArray(body.data)
        ? body.data
        : Array.isArray(body)
        ? body
        : [];

      setLowStock(data.map((d) => ({ ...d })));
      setLowStockPage(body.page ?? p);
      setLowStockPages(
        body.pages ??
          Math.max(1, Math.ceil((body.total ?? data.length) / limit))
      );
      setLowStockTotal(body.total ?? data.length);
    } catch (err) {
      console.error("Error fetching low-stock inventory:", err);
    } finally {
      setLowStockLoading(false);
    }
  };
  const fetchCategories = async () => {
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // includeInactive=false by default (only active categories)
      const resp = await axios.get(`${API_BASE}/categories`, { headers });
      const data = Array.isArray(resp.data?.data)
        ? resp.data.data
        : Array.isArray(resp.data)
        ? resp.data
        : [];
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      // Categories not critical - don't show error to user
    }
  };

  // Create new category
  const handleCreateCategory = async () => {
    if (
      !categoryForm.name.trim() ||
      !categoryForm.code.trim() ||
      !categoryForm.accountClass.trim()
    ) {
      showAlert("Category name, code, and account class are required.");
      return;
    }

    setCategoryLoading(true);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const payload = {
        name: categoryForm.name.trim(),
        code: categoryForm.code.trim().toUpperCase(),
        accountClass: categoryForm.accountClass.trim().toUpperCase(),
      };

      const resp = await axios.post(`${API_BASE}/categories`, payload, {
        headers,
      });
      showAlert("Category created successfully!");

      // Refresh categories list
      await fetchCategories();

      // Reset form and switch to edit mode
      setCategoryForm({ name: "", code: "", accountClass: "" });
      setCategoryMode("edit");
    } catch (err) {
      console.error("Error creating category:", err);
      showAlert(err.response?.data?.message || "Failed to create category");
    } finally {
      setCategoryLoading(false);
    }
  };

  // Update existing category
  const handleUpdateCategory = async () => {
    if (!editingCategory?.categoryId) return;
    if (!categoryForm.name.trim() || !categoryForm.accountClass.trim()) {
      showAlert("Category name and account class are required.");
      return;
    }

    setCategoryLoading(true);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const payload = {
        name: categoryForm.name.trim(),
        accountClass: categoryForm.accountClass.trim().toUpperCase(),
        isActive: true, // Keep active when updating
        // Note: code cannot be changed (immutable)
      };

      await axios.patch(
        `${API_BASE}/categories/${editingCategory.categoryId}`,
        payload,
        { headers }
      );
      showAlert("Category updated successfully!");

      // Refresh categories list
      await fetchCategories();

      // Reset editing state
      setEditingCategory(null);
      setCategoryForm({ name: "", code: "", accountClass: "" });
    } catch (err) {
      console.error("Error updating category:", err);
      showAlert(err.response?.data?.message || "Failed to update category");
    } finally {
      setCategoryLoading(false);
    }
  };

  // Delete (soft delete) category
  const handleDeleteCategory = async (categoryId) => {
    const ok = await showPrompt(
      "Delete this category? This will soft-delete it (set isActive: false)."
    );
    if (!ok) return;

    setCategoryLoading(true);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`${API_BASE}/categories/${categoryId}`, { headers });
      showAlert("Category deleted successfully!");

      // Refresh categories list
      await fetchCategories();

      // If we were editing this category, clear the form
      if (editingCategory?.categoryId === categoryId) {
        setEditingCategory(null);
        setCategoryForm({ name: "", code: "" });
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      showAlert(err.response?.data?.message || "Failed to delete category");
    } finally {
      setCategoryLoading(false);
    }
  };

  // Open category for editing
  const openCategoryEdit = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || "",
      code: category.code || "",
      accountClass: category.accountClass || "",
    });
    setCategoryMode("edit");
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = categorySearch
      ? cat.name?.toLowerCase().includes(categorySearch.toLowerCase()) ||
        cat.code?.toLowerCase().includes(categorySearch.toLowerCase()) ||
        cat.accountClass?.toLowerCase().includes(categorySearch.toLowerCase())
      : true;

    const matchesAccountClass = categoryFilterByAccountClass
      ? cat.accountClass
          ?.toLowerCase()
          .includes(categoryFilterByAccountClass.toLowerCase())
      : true;

    const matchesCode = categoryFilterByCode
      ? cat.code?.toLowerCase().includes(categoryFilterByCode.toLowerCase())
      : true;

    const matchesName = categoryFilterByName
      ? cat.name?.toLowerCase().includes(categoryFilterByName.toLowerCase())
      : true;

    return matchesSearch && matchesAccountClass && matchesCode && matchesName;
  });

  // Paginate filtered categories
  const totalCategoryPages = Math.ceil(
    filteredCategories.length / CATEGORY_PAGE_SIZE
  );
  const paginatedCategories = filteredCategories.slice(
    (categoryPage - 1) * CATEGORY_PAGE_SIZE,
    categoryPage * CATEGORY_PAGE_SIZE
  );

  useEffect(() => {
    fetchLowStock(lowStockPage, search, department);
  }, [lowStockPage]);

  // refresh low-stock when search or department changes
  useEffect(() => {
    setLowStockPage(1);
    fetchLowStock(1, search, department);
  }, [search, department]);

  useEffect(() => {
    fetchInventory(page, search, department);
  }, [page]);

  // debounce search input
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      fetchInventory(1, search, department);
    }, 450);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search, department]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const statsSourceInventory =
    isAdmin || isProcurementManager ? inventory : filteredInventory;
  const statsSourceLowStock =
    isAdmin || isProcurementManager ? lowStock : filteredLowStock;

  const stats = {
    totalItems: statsSourceInventory.length,
    totalQuantity: statsSourceInventory.reduce(
      (s, i) => s + (Number(i.quantity) || 0),
      0
    ),
    lowStock: statsSourceLowStock.length,
  };

  // Open edit modal
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      department: item.department || "",
      categoryId: item.categoryId || "",

      name: item.name || "",
      quantity: item.quantity ?? 0,
      maker: item.maker || "",
      makerPartNumber: item.makerPartNumber || "",
      isVerified: item.isVerified ?? false,
      storeLocation: storeLocation || item.storeLocation || "",
      minStock: item.minStock ?? "",
      maxStock: item.maxStock ?? "",
      reorderQuantity: item.reorderQuantity ?? "",
      pricingMode: item.pricingMode || "batch",
    });
    setEditPhotos([]);
    setShowEdit(true);
  };
  const handleVerifyItem = async (inventoryId) => {
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      if (!token) {
        showAlert("Authentication required.");
        return false;
      }
      const headers = { Authorization: `Bearer ${token}` };

      await axios.patch(
        `${API_BASE}/inventory/${encodeURIComponent(inventoryId)}/verify`,
        {},
        { headers }
      );
      return true;
    } catch (err) {
      console.error("Error verifying inventory:", err);
      showAlert(err.response?.data?.message || "Failed to verify item");
      return false;
    }
  };

  // Save edit (PATCH /api/inventory/:inventoryId)
  const handleSaveEdit = async () => {
    if (!editing?.inventoryId) return;
    try {
      setLoading(true);
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Check if verification status changed from false to true
      const wasUnverified = editing.isVerified === false;
      const nowVerified = form.isVerified === true;
      const needsVerification = wasUnverified && nowVerified;

      // If there are new photos selected for edit, use FormData
      if (editPhotos && editPhotos.length > 0) {
        const formData = new FormData();
        formData.append("department", form.department);
        formData.append("name", form.name);
        formData.append("quantity", Number(form.quantity) || 0);
        if (form.maker) formData.append("maker", form.maker);
        if (form.makerPartNumber)
          formData.append("makerPartNumber", form.makerPartNumber);
        formData.append("storeLocation", form.storeLocation);
        formData.append("minStock", Number(form.minStock));
        if (form.maxStock !== "" && form.maxStock !== undefined)
          formData.append("maxStock", Number(form.maxStock));
        if (form.reorderQuantity !== "" && form.reorderQuantity !== undefined)
          formData.append("reorderQuantity", Number(form.reorderQuantity));
        if (form.pricingMode) formData.append("pricingMode", form.pricingMode);
        if (form.unitPrice)
          formData.append("unitPrice", Number(form.unitPrice));
        editPhotos.forEach((file) => {
          formData.append("photos", file);
        });

        await axios.patch(
          `${API_BASE}/inventory/${encodeURIComponent(editing.inventoryId)}`,
          formData,
          { headers }
        );
      } else {
        // Regular JSON payload (without isVerified - that's handled separately)
        const payload = {
          department: form.department,
          name: form.name,
          quantity: Number(form.quantity) || 0,
          maker: form.maker,
          makerPartNumber: form.makerPartNumber,
          storeLocation: form.storeLocation,
          minStock: Number(form.minStock),
          ...(form.maxStock !== "" && form.maxStock !== undefined
            ? { maxStock: Number(form.maxStock) }
            : {}),
          ...(form.reorderQuantity !== "" && form.reorderQuantity !== undefined
            ? { reorderQuantity: Number(form.reorderQuantity) }
            : {}),
          pricingMode: form.pricingMode || "batch",
          unitPrice: Number(form.unitPrice),
        };
        await axios.patch(
          `${API_BASE}/inventory/${encodeURIComponent(editing.inventoryId)}`,
          payload,
          { headers }
        );
      }

      // If user toggled from unverified to verified, call the verify endpoint
      if (needsVerification) {
        const verified = await handleVerifyItem(editing.inventoryId);
        if (!verified) {
          // Verification failed but other updates succeeded
          showAlert(
            "Item updated but verification failed. Please try verifying again."
          );
        }
      }

      // refresh both lists to get latest server state
      await Promise.all([
        fetchInventory(page, search, department),
        fetchLowStock(lowStockPage, search, department),
      ]);
      setShowEdit(false);
      setEditing(null);
      setEditPhotos([]);
      showAlert("Inventory updated.");
    } catch (err) {
      console.error("Error updating inventory:", err);
      showAlert(err.response?.data?.message || "Failed to update item");
    } finally {
      setLoading(false);
    }
  };

  // Delete (DELETE /api/inventory/:inventoryId)
  const handleDelete = async (inventoryId) => {
    const ok = await showPrompt(
      `Delete inventory item? This action cannot be undone.`
    );
    if (!ok) return;
    try {
      setLoading(true);
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(
        `${API_BASE}/inventory/${encodeURIComponent(inventoryId)}`,
        { headers }
      );
      // optimistic: reload current page (if last item on page and page>1, step back)
      const remaining = inventory.length - 1;
      const newPage = remaining === 0 && page > 1 ? page - 1 : page;
      await Promise.all([
        fetchInventory(newPage, search, department),
        fetchLowStock(lowStockPage, search, department),
      ]);
      showAlert("Inventory deleted.");
    } catch (err) {
      console.error("Error deleting inventory:", err);
      showAlert(err.response?.data?.message || "Failed to delete item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Inventory</h2>
          <p className="text-slate-500 mt-1">Central inventory — live</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <MdSearch className="absolute left-3 top-3 text-slate-400 text-lg" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory..."
              className="pl-10 pr-4 h-11 rounded-xl border-2 border-slate-200 bg-slate-50"
            />
          </div>

          <button
            onClick={() => {
              setShowAdd(true);
              setForm({
                department: "Marine",
                name: "",
                quantity: 0,
                maker: "",
                makerPartNumber: "",
                storeLocation: storeLocation || "",
                minStock: "",
                maxStock: "",
                reorderQuantity: "",
                pricingMode: "batch",
                unitPrice: "",
              });
            }}
            className="px-4 py-2 bg-[#036173] text-white rounded-xl flex items-center gap-2 shadow-lg"
          >
            <MdAdd /> Add
          </button>

          {(isProcurementManager || isAdmin) && (
            <button
              onClick={() => {
                setShowCategoryDrawer(true);
                setCategoryMode("edit");
                setEditingCategory(null);
                setCategoryForm({ name: "", code: "", accountClass: "" });
                setCategoryPage(1);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2 shadow-lg"
            >
              <MdBusiness /> Manage Categories
            </button>
          )}

          <button
            onClick={() =>
              showAlert("Upload (prototype) — Excel import coming soon")
            }
            className="px-4 py-2 bg-white/90 rounded-xl flex items-center gap-2 border border-slate-200"
          >
            <MdCloudUpload className="text-emerald-600" /> Upload
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div
          role="button"
          onClick={() => setActiveStat("all")}
          className={`rounded-2xl p-6 flex items-center gap-4 cursor-pointer transition ${
            activeStat === "all"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
              : "bg-white/90 backdrop-blur-xl border-2 border-slate-200"
          }`}
        >
          <div
            className={`${
              activeStat === "all"
                ? "bg-white/10 text-white"
                : "bg-emerald-500/20 text-emerald-600"
            } w-14 h-14 rounded-xl flex items-center justify-center text-2xl`}
          >
            <MdBusiness />
          </div>
          <div>
            <div
              className={`${
                activeStat === "all" ? "text-white/90" : "text-slate-500"
              } text-xs`}
            >
              Total SKUs
            </div>
            <div
              className={`text-2xl font-bold ${
                activeStat === "all" ? "text-white" : "text-slate-900"
              }`}
            >
              {stats.totalItems ?? 0}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 flex items-center gap-4 transition bg-white/90 backdrop-blur-xl border-2 border-slate-200">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-yellow-500/20 text-yellow-600">
            <MdInventory />
          </div>
          <div>
            <div className="text-slate-500 text-xs">Total Quantity</div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalQuantity}
            </div>
          </div>
        </div>

        <div
          role="button"
          onClick={() => setActiveStat("low")}
          className={`rounded-2xl p-6 flex items-center gap-4 cursor-pointer transition ${
            activeStat === "low"
              ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg"
              : "bg-white/90 backdrop-blur-xl border-2 border-slate-200"
          }`}
        >
          <div
            className={`${
              activeStat === "low"
                ? "bg-white/10 text-white"
                : "bg-red-500/20 text-red-600"
            } w-14 h-14 rounded-xl flex items-center justify-center text-2xl`}
          >
            <MdWarning />
          </div>
          <div>
            <div
              className={`${
                activeStat === "low" ? "text-white/90" : "text-slate-500"
              } text-xs`}
            >
              Low Stock
            </div>
            <div
              className={`text-2xl font-bold ${
                activeStat === "low" ? "text-white" : "text-slate-900"
              }`}
            >
              {stats.lowStock}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-slate-600">
            Loading inventory...
          </div>
        ) : error ? (
          <div className="py-6 text-center text-rose-600">{error}</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Quantity</th>

                  <th className="px-4 py-3">Unit Price</th>

                  <th className="px-4 py-3">Maker</th>
                  <th className="px-4 py-3">Maker PN</th>
                  <th className="px-4 py-3">Store Location</th>
                  <th className="px-4 py-3">Uploads</th>

                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No inventory items found.
                    </td>
                  </tr>
                ) : (
                  visible.map((it) => (
                    <tr
                      key={it.inventoryId}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {it.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {it.department}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {it.categoryId ? (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                            {categories.find(
                              (c) => c.categoryId === it.categoryId
                            )?.name || "Unknown"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2">
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              Number(it.quantity) <= 10
                                ? "bg-red-100 text-red-600"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {it.quantity}
                          </div>
                          {Number(it.quantity) <= 10 && (
                            <span className="text-xs text-red-500">Low</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {it.priceRange ? (
                          <span className="text-xs font-mono">
                            ₦{it.priceRange.min?.toLocaleString()} - ₦
                            {it.priceRange.max?.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{it.maker}</td>
                      <td className="px-4 py-3">{it.makerPartNumber}</td>
                      <td className="px-4 py-3">{it.storeLocation}</td>
                      {/* <-- changed */}
                      <td className="px-4 py-3 text-center">
                        {Array.isArray(it.photos) && it.photos.length > 0 ? (
                          <button
                            onClick={() => openPhotoViewerForItem(it, 0)}
                            className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white border hover:bg-slate-50"
                            title={`${it.photos.length} photo${
                              it.photos.length > 1 ? "s" : ""
                            }`}
                          >
                            <MdImage className="text-lg text-slate-700" />
                            {it.photos.length > 1 && (
                              <span className="text-xs text-slate-500">
                                {it.photos.length}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(it);
                            }}
                            className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-2"
                          >
                            <MdEdit /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrawerItem(it);
                              setShowRestockForm(true);
                            }}
                            className="px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-2"
                          >
                            Restock
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(it.inventoryId);
                            }}
                            className="px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2"
                          >
                            <MdDelete /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              {activeStat === "low" ? (
                <>
                  <div className="text-sm text-slate-600">
                    Page {lowStockPage} of {lowStockPages} — Total:
                    {lowStockTotal}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLowStockPage((p) => Math.max(1, p - 1))}
                      disabled={lowStockPage <= 1}
                      className="px-3 py-1 rounded bg-white border disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        setLowStockPage((p) => Math.min(lowStockPages, p + 1))
                      }
                      disabled={lowStockPage >= lowStockPages}
                      className="px-3 py-1 rounded bg-white border disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-slate-600">
                    Page {page} of {pages} — Total: {total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1 rounded bg-white border disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      disabled={page >= pages}
                      className="px-3 py-1 rounded bg-white border disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowAdd(false);
              setAddPhotos([]);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] md:w-[720px] p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <MdAdd /> Add Inventory
              </h3>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setAddPhotos([]);
                }}
                className="p-2"
              >
                <IoMdClose />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">Department</label>
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  {departmentOptions.map((opt) => (
                    <option key={opt.name} value={opt.name}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">
                  Category (Optional)
                </label>
                <select
                  value={form.categoryId || ""}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- No Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.name} ({cat.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Quantity</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Maker</label>
                <input
                  value={form.maker}
                  onChange={(e) => setForm({ ...form, maker: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">Maker Part No</label>
                <input
                  value={form.makerPartNumber}
                  onChange={(e) =>
                    setForm({ ...form, makerPartNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">
                  Store Location<span className="text-rose-500">*</span>
                </label>
                {storeLocation ? (
                  <input
                    value={storeLocation}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                  />
                ) : (
                  <select
                    value={form.storeLocation || ""}
                    onChange={(e) =>
                      setForm({ ...form, storeLocation: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select location</option>
                    <option value="Store Base">Store Base</option>
                    <option value="Store Jetty">Store Jetty</option>
                    <option value="Store Vessel">Store Vessel</option>
                  </select>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-500">
                  Min Stock<span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.minStock ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, minStock: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Max Stock</label>
                <input
                  type="number"
                  value={form.maxStock ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, maxStock: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">
                  Reorder Quantity
                </label>
                <input
                  type="number"
                  value={form.reorderQuantity ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, reorderQuantity: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">
                  Unit Price<span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.unitPrice ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, unitPrice: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  min={0.01}
                  step="any"
                  placeholder="e.g. 10"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">
                  Pricing Mode<span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.pricingMode || "batch"}
                  onChange={(e) =>
                    setForm({ ...form, pricingMode: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="batch">Batch</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>

              {/* Photo upload dropzone (Add Modal) */}
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">
                  Photos (images only)
                </label>
                <div
                  onDrop={onAddDrop}
                  onDragOver={onAddDragOver}
                  onDragLeave={onAddDragLeave}
                  className="mt-2 flex flex-col gap-2 p-4 rounded-lg border-2 border-slate-200 bg-white"
                >
                  <input
                    ref={addFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAddFilesSelected(e.target.files)}
                  />
                  <div
                    role="button"
                    onClick={triggerAddFilePicker}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <MdImage className="text-xl" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Drag & drop images here or click to select
                      </div>
                      <div className="text-xs text-slate-500">
                        JPG, PNG, GIF, WEBP supported
                      </div>
                    </div>
                  </div>

                  {addPhotos && addPhotos.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {addPhotos.map((f, idx) => {
                        const url = URL.createObjectURL(f);
                        return (
                          <div
                            key={`${f.name}-${f.size}-${idx}`}
                            className="relative bg-slate-50 p-1 rounded"
                          >
                            <img
                              src={url}
                              alt={f.name}
                              className="w-full h-24 object-cover rounded"
                            />
                            <div className="flex items-center justify-between mt-1">
                              <div className="text-xs text-slate-600 truncate">
                                {f.name}
                              </div>
                              <button
                                onClick={() => removeAddPhoto(idx)}
                                className="text-rose-600 p-1"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setAddPhotos([]);
                  setForm({
                    department: "Marine",
                    name: "",
                    quantity: 0,
                    maker: "",
                    makerPartNumber: "",
                    storeLocation: storeLocation || "",
                    minStock: "",
                    maxStock: "",
                    reorderQuantity: "",
                    pricingMode: "batch",
                    unitPrice: "",
                  });
                }}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-lg bg-[#036173] text-white"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Photo Viewer Modal */}
      {photoViewerOpen && photoViewerList && photoViewerList.length > 0 && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closePhotoViewer}
          />
          <div className="fixed left-1/2 transform -translate-x-1/2 top-12 z-50 w-[95%] md:w-[90%] lg:w-[70%] max-h-[85vh]">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-slate-900 truncate max-w-[520px]">
                    Photo {photoViewerIndex + 1} of {photoViewerList.length}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* <button
                    onClick={() => {
                      downloadPhoto(photoViewerList[photoViewerIndex]);
                    }}
                    className="px-3 py-2 bg-white rounded-md border text-sm"
                  >
                    <MdFileDownload /> Download
                  </button>
                  <button
                    onClick={() => printPhoto(photoViewerList[photoViewerIndex])}
                    className="px-3 py-2 bg-white rounded-md border text-sm"
                  >
                    <MdPrint /> Print
                  </button> */}
                  <button
                    onClick={closePhotoViewer}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-md text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-4 relative">
                {photoViewerList.length > 1 && (
                  <>
                    <button
                      onClick={photoPrev}
                      disabled={photoViewerIndex === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white border rounded-full p-2 z-20 shadow"
                    >
                      <MdChevronLeft />
                    </button>
                    <button
                      onClick={photoNext}
                      disabled={photoViewerIndex === photoViewerList.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white border rounded-full p-2 z-20 shadow"
                    >
                      <MdChevronRight />
                    </button>
                  </>
                )}

                <div
                  style={{
                    minHeight: "60vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={photoViewerList[photoViewerIndex]}
                    alt={`photo-${photoViewerIndex}`}
                    className="max-h-[70vh] w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEdit && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowEdit(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] md:w-[720px] p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <MdEdit /> Edit Inventory
              </h3>
              <button onClick={() => setShowEdit(false)} className="p-2">
                <IoMdClose />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">Department</label>
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  {departmentOptions.map((opt) => (
                    <option key={opt.name} value={opt.name}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">
                  Category (Optional)
                </label>
                <select
                  value={form.categoryId || ""}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- No Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.name} ({cat.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Quantity</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Maker</label>
                <input
                  value={form.maker}
                  onChange={(e) => setForm({ ...form, maker: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Maker Part No</label>
                <input
                  value={form.makerPartNumber}
                  onChange={(e) =>
                    setForm({ ...form, makerPartNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">
                  Store Location<span className="text-rose-500">*</span>
                </label>
                {storeLocation ? (
                  <input
                    value={storeLocation}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                  />
                ) : (
                  <select
                    value={form.storeLocation || ""}
                    onChange={(e) =>
                      setForm({ ...form, storeLocation: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select location</option>
                    <option value="Store Base">Store Base</option>
                    <option value="Store Jetty">Store Jetty</option>
                    <option value="Store Vessel">Store Vessel</option>
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-500">
                  Min Stock<span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.minStock ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, minStock: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Max Stock</label>
                <input
                  type="number"
                  value={form.maxStock ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, maxStock: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">
                  Photos (images only)
                </label>
                <div
                  onDrop={onEditDrop}
                  onDragOver={onEditDragOver}
                  onDragLeave={onEditDragLeave}
                  className="mt-2 flex flex-col gap-2 p-4 rounded-lg border-2 border-slate-200 bg-white"
                >
                  <input
                    ref={editFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleEditFilesSelected(e.target.files)}
                  />
                  <div
                    role="button"
                    onClick={triggerEditFilePicker}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <MdImage className="text-xl" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Add more images
                      </div>
                      <div className="text-xs text-slate-500">
                        JPG, PNG, GIF, WEBP supported
                      </div>
                    </div>
                  </div>

                  {/* show existing server photos as thumbnails with open viewer action */}
                  {editing?.photos && editing.photos.length > 0 && (
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {editing.photos.map((url, idx) => (
                        <div
                          key={url + idx}
                          className="relative bg-slate-50 p-1 rounded"
                        >
                          <img
                            src={url}
                            alt={`photo-${idx}`}
                            className="w-full h-20 object-cover rounded cursor-pointer"
                            onClick={() =>
                              openPhotoViewerForItem(
                                { photos: editing.photos },
                                idx
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* show newly selected files for upload */}
                  {editPhotos && editPhotos.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {editPhotos.map((f, idx) => {
                        const url = URL.createObjectURL(f);
                        return (
                          <div
                            key={`${f.name}-${f.size}-${idx}`}
                            className="relative bg-slate-50 p-1 rounded"
                          >
                            <img
                              src={url}
                              alt={f.name}
                              className="w-full h-24 object-cover rounded"
                            />
                            <div className="flex items-center justify-between mt-1">
                              <div className="text-xs text-slate-600 truncate">
                                {f.name}
                              </div>
                              <button
                                onClick={() => removeEditPhoto(idx)}
                                className="text-rose-600 p-1"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowEdit(false);
                  setEditing(null);
                }}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-[#036173] text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Restock Modal */}
      {showRestockForm && drawerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowRestockForm(false);
              setRestockForm({ quantity: "", unitPrice: "", receivedAt: "" });
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] md:w-[520px] p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Restock Inventory
              </h3>
              <button
                onClick={() => {
                  setShowRestockForm(false);
                  setRestockForm({
                    quantity: "",
                    unitPrice: "",
                    receivedAt: "",
                  });
                }}
                className="p-2"
              >
                <IoMdClose />
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <div className="text-sm font-semibold text-slate-900">
                {drawerItem.name}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Current Quantity: {drawerItem.quantity}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs text-slate-500">
                  Quantity to Add<span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockForm.quantity}
                  onChange={(e) =>
                    setRestockForm({ ...restockForm, quantity: e.target.value })
                  }
                  placeholder="Enter quantity"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">
                  Unit Price<span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={restockForm.unitPrice}
                  onChange={(e) =>
                    setRestockForm({
                      ...restockForm,
                      unitPrice: e.target.value,
                    })
                  }
                  placeholder="Enter unit price"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">Received Date</label>
                <input
                  type="datetime-local"
                  value={restockForm.receivedAt}
                  onChange={(e) =>
                    setRestockForm({
                      ...restockForm,
                      receivedAt: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Leave empty to use current date/time
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRestockForm(false);
                  setRestockForm({
                    quantity: "",
                    unitPrice: "",
                    receivedAt: "",
                  });
                }}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                disabled={restockLoading}
                className="px-4 py-2 rounded-lg bg-[#036173] text-white disabled:opacity-50"
              >
                {restockLoading ? "Restocking..." : "Restock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Drawer */}
      {showCategoryDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={() => setShowCategoryDrawer(false)}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full md:w-[30%] bg-white shadow-2xl z-50 flex flex-col transform transition-transform">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-purple-600 text-white">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <MdBusiness /> Manage Categories
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (categoryMode === "create") {
                      setCategoryMode("edit");
                      setCategoryForm({ name: "", code: "", accountClass: "" });
                      setEditingCategory(null);
                    } else {
                      setCategoryMode("create");
                      setCategoryForm({ name: "", code: "", accountClass: "" });
                      setEditingCategory(null);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                    categoryMode === "create"
                      ? "bg-white/20 text-white"
                      : "bg-white text-purple-600"
                  }`}
                >
                  {categoryMode === "create"
                    ? "View Categories"
                    : "Create Category"}
                </button>
                <button
                  onClick={() => setShowCategoryDrawer(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <IoMdClose className="text-xl" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {categoryMode === "create" ? (
                /* Create Category Form */
                <div className="max-w-2xl mx-auto">
                  <h4 className="text-lg font-semibold mb-4">
                    Create New Category
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-xs text-slate-500">
                        Category Name<span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g., General Stationery"
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">
                        Category Code<span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={categoryForm.code}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="e.g., STAT-01"
                        className="w-full px-3 py-2 border rounded-lg font-mono"
                        required
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Code is immutable once created
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">
                        Account Class<span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={categoryForm.accountClass}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            accountClass: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="e.g., EXP-OFFICE"
                        className="w-full px-3 py-2 border rounded-lg font-mono"
                        required
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Accounting classification code
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setCategoryMode("edit");
                        setCategoryForm({
                          name: "",
                          code: "",
                          accountClass: "",
                        });
                      }}
                      className="px-4 py-2 rounded-lg border"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCategory}
                      disabled={categoryLoading}
                      className="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50"
                    >
                      {categoryLoading ? "Creating..." : "Create Category"}
                    </button>
                  </div>
                </div>
              ) : editingCategory ? (
                /* Edit Category Form */
                <div className="max-w-2xl mx-auto">
                  <h4 className="text-lg font-semibold mb-4">Edit Category</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-xs text-slate-500">
                        Category Name<span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">
                        Category Code
                      </label>
                      <input
                        value={categoryForm.code}
                        disabled
                        className="w-full px-3 py-2 border rounded-lg bg-gray-100 font-mono"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Code cannot be changed
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">
                        Account Class<span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={categoryForm.accountClass}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            accountClass: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="e.g., EXP-OFFICE"
                        className="w-full px-3 py-2 border rounded-lg font-mono"
                        required
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Accounting classification code
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({
                          name: "",
                          code: "",
                          accountClass: "",
                        });
                      }}
                      className="px-4 py-2 rounded-lg border"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateCategory}
                      disabled={categoryLoading}
                      className="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50"
                    >
                      {categoryLoading ? "Updating..." : "Update Category"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Categories Table View */
                <div>
                  <h4 className="text-lg font-semibold mb-4">All Categories</h4>

                  {/* Search & Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="relative">
                      <MdSearch className="absolute left-3 top-3 text-slate-400" />
                      <input
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          setCategoryPage(1);
                        }}
                        placeholder="Search categories..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                      />
                    </div>
                    <input
                      value={categoryFilterByAccountClass}
                      onChange={(e) => {
                        setCategoryFilterByAccountClass(e.target.value);
                        setCategoryPage(1);
                      }}
                      placeholder="Filter by Account Class..."
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <input
                      value={categoryFilterByCode}
                      onChange={(e) => {
                        setCategoryFilterByCode(e.target.value);
                        setCategoryPage(1);
                      }}
                      placeholder="Filter by Code..."
                      className="w-full px-3 py-2 border rounded-lg font-mono"
                    />
                    <input
                      value={categoryFilterByName}
                      onChange={(e) => {
                        setCategoryFilterByName(e.target.value);
                        setCategoryPage(1);
                      }}
                      placeholder="Filter by Name..."
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  {/* Results Count */}
                  <div className="text-sm text-slate-600 mb-3">
                    Showing {paginatedCategories.length} of{" "}
                    {filteredCategories.length} categories
                  </div>

                  {/* Table */}
                  {filteredCategories.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      No categories found. Create one to get started.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-slate-500 border-b">
                              <th className="px-3 py-3">Name</th>
                              <th className="px-3 py-3">Code</th>
                              <th className="px-3 py-3">Account Class</th>
                              <th className="px-3 py-3 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {paginatedCategories.map((cat) => (
                              <tr
                                key={cat.categoryId}
                                className="hover:bg-slate-50 transition"
                              >
                                <td className="px-3 py-3 font-semibold text-slate-900">
                                  {cat.name}
                                </td>
                                <td className="px-3 py-3 font-mono text-slate-700">
                                  {cat.code}
                                </td>
                                <td className="px-3 py-3 font-mono text-slate-700">
                                  {cat.accountClass || "N/A"}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => openCategoryEdit(cat)}
                                      className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1"
                                    >
                                      <MdEdit /> Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteCategory(cat.categoryId)
                                      }
                                      className="px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1"
                                    >
                                      <MdDelete /> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalCategoryPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-sm text-slate-600">
                            Page {categoryPage} of {totalCategoryPages}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setCategoryPage((p) => Math.max(1, p - 1))
                              }
                              disabled={categoryPage <= 1}
                              className="px-3 py-1 rounded bg-white border disabled:opacity-50"
                            >
                              <MdChevronLeft />
                            </button>
                            <button
                              onClick={() =>
                                setCategoryPage((p) =>
                                  Math.min(totalCategoryPages, p + 1)
                                )
                              }
                              disabled={categoryPage >= totalCategoryPages}
                              className="px-3 py-1 rounded bg-white border disabled:opacity-50"
                            >
                              <MdChevronRight />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
