export const ROLES = {
  // Requesters
  REQUESTER: "Requester",
  
  // Managers
  VMANAGER: "Vessel Manager",
  FMANAGER: "Fleet Manager",
  TMANAGER: "Technical Manager",
  ITMANAGER: "IT Manager",
  ACCOUNT_MANAGER: "Account Manager",
  OPERATIONS_MANAGER: "Operations Manager",
  EQUIPMENT_MANAGER: "Equipment Manager",
  LINES_MANAGER: "Lines Manager",
  PROJECT_MANAGER: "Project Manager",
  PURCHASE_MANAGER: "Purchase Manager",
  
  // Heads/Directors
  HEAD_PROCUREMENT: "Head of Procurement",
  HEAD_OF_PROJECT: "Head of Project",
  HEAD_OF_ADMIN: "Head of Admin",
  DIRECTOR_OFO: "Director of Operations",
  DIRECTOR_IT: "Director of IT",
  
  // Management
  MD: "Managing Director",
  CFO: "CFO",
  
  // Specialized Roles
  PROCUREMENT: "Procurement",
  ACCOUNTING: "Accounting",
  SHIPPING: "Shipping",
  DELIVERY_BASE: "Delivery Base",
  DELIVERY_JETTY: "Delivery Jetty",
  DELIVERY_VESSEL: "Delivery Vessel",
  STORE_VESSEL: "Store Vessel",
  STORE_BASE: "Store Base",
  STORE_JETTY: "Store jetty",
  REQUEST_HANDLER: "Request Handler",
  IT_OFFICER: "IT Officer",
  MARINE_OFFICER: "Marine Officer",
  COST_CONTROLLER: "Cost Controller",
  ADMIN_SUPERVISOR: "Admin Supervisor",
};

export const DEPARTMENTS = {
  MARINE: "Marine",
  IT: "IT",
  ACCOUNT: "Account",
  OPERATIONS: "Operations",
  PROCUREMENT: "Procurement",
  PROJECT: "Project",
  PURCHASE: "Purchase",
  COMPLIANCE_QHSE: "Compliance/QHSE",
  HR: "HR",
  PROTOCOL: "Protocol",
  MANAGEMENT: "Management",
};

// Helper function to check if a role is a requester
export const isRequester = (role) => {
  return role === ROLES.REQUESTER;
};

// Helper function to check if a role is a manager
export const isManager = (role) => {
  const managerRoles = [
    ROLES.VMANAGER,
    ROLES.FMANAGER,
    ROLES.ITMANAGER,
    ROLES.ACCOUNT_MANAGER,
    ROLES.OPERATIONS_MANAGER,
    ROLES.EQUIPMENT_MANAGER,
    ROLES.LINES_MANAGER,
    ROLES.PROJECT_MANAGER,
    ROLES.PURCHASE_MANAGER,
  ];
  return managerRoles.includes(role);
};

// Helper function to check if role has first/second approval (Vessel Manager & Fleet Manager)
export const hasDoubleApproval = (role) => {
  return role === ROLES.VMANAGER || role === ROLES.FMANAGER;
};

// Helper function to check if a role is a director
export const isDirector = (role) => {
  const directorRoles = [
    ROLES.DIRECTOR_OFO,
    ROLES.DIRECTOR_IT,
    ROLES.MD,
    ROLES.CFO,
  ];
  return directorRoles.includes(role);
};

// Helper function to get the appropriate table component for a role
export const getTableForRole = (role) => {
  const tableMap = {
    [ROLES.ITMANAGER]: "ITManagerTable",
    [ROLES.PROCUREMENT]: "ProcurementTable",
    [ROLES.PURCHASE_MANAGER]: "ProcurementManagerTable",
    [ROLES.DIRECTOR_IT]: "DirectorTable",
    [ROLES.SHIPPING]: "ShippingTable",
    [ROLES.EQUIPMENT_MANAGER]: "EquipmentManagerTable",
    [ROLES.OPERATIONS_MANAGER]: "OperationManagerTable",
    [ROLES.DIRECTOR_OFO]: "OpDirectorTable",
    [ROLES.LINES_MANAGER]: "LinesManagerTable",
    [ROLES.PROJECT_MANAGER]: "ProjectManagerTable",
    [ROLES.COST_CONTROLLER]: "CostControllerTable",
  };
  return tableMap[role] || "GeneralTable"; // Default to GeneralTable
};