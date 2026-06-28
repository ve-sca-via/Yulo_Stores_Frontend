// ---------------------------------------------------------------------------
// MOCK DATA (fixtures)
// ---------------------------------------------------------------------------
// This is the fake "database" the frontend runs on while the real backend is
// still being built. Edit these values to change what the screens show — add
// menu items, orders, expenses, etc. It is plain JSON-shaped data, so you can
// also move it into .json files later if you prefer.
//
// createSeed() returns a FRESH deep copy each time so mock mutations (add item,
// place order, ...) don't permanently corrupt the fixtures on hot reload.

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const SEED = {
  owner: {
    id: "own_1",
    name: "Aman Gupta",
    email: "owner@yulo.test",
    // Mock login is lenient — any email/password returns this owner.
    password: "password",
  },
  restaurant: {
    id: "rest_1",
    name: "Spice Garden",
    owner: "own_1",
    recipies: [
      {
        id: "rec_1",
        title: "Paneer Tikka",
        ingredients: ["Paneer", "Yogurt", "Spices"],
        price: 280,
      },
      {
        id: "rec_2",
        title: "Butter Chicken",
        ingredients: ["Chicken", "Butter", "Tomato", "Cream"],
        price: 360,
      },
      {
        id: "rec_3",
        title: "Garlic Naan",
        ingredients: ["Flour", "Garlic", "Butter"],
        price: 70,
      },
      {
        id: "rec_4",
        title: "Masala Chai",
        ingredients: ["Tea", "Milk", "Spices"],
        price: 40,
      },
    ],
    staffMembers: [
      {
        id: "stf_1",
        role: "chef",
        name: "Ravi Kumar",
        email: "chef@yulo.test",
        employeeId: "chef01",
      },
      {
        id: "stf_2",
        role: "waiter",
        name: "Sunil Verma",
        email: "waiter@yulo.test",
        employeeId: "waiter01",
      },
    ],
  },
  inventory: [
    { id: "inv_1", name: "Paneer", quantity: 12, unit: "kg", price: 320, available: true },
    { id: "inv_2", name: "Chicken", quantity: 4, unit: "kg", price: 240, available: true },
    { id: "inv_3", name: "Tomato", quantity: 3, unit: "kg", price: 40, available: true },
    { id: "inv_4", name: "Butter", quantity: 0, unit: "kg", price: 520, available: false },
  ],
  expenses: [
    {
      id: "exp_1",
      title: "Monthly rent",
      amount: 45000,
      tags: ["rent"],
      note: "Shop lease",
      time: "2026-06-01T04:00:00.000Z",
    },
    {
      id: "exp_2",
      title: "Vegetable supply",
      amount: 3200,
      tags: ["grocery", "vegetables"],
      note: "Weekly market run",
      time: "2026-06-14T05:30:00.000Z",
    },
  ],
  orders: [
    {
      id: "ord_100001",
      tableNumber: "4",
      time: "2026-06-16T06:15:00.000Z",
      orderStatus: "preparing",
      paymentStatus: "pending",
      items: [
        { recipeId: "rec_1", title: "Paneer Tikka", quantity: 1, price: 280 },
        { recipeId: "rec_3", title: "Garlic Naan", quantity: 2, price: 70 },
      ],
    },
    {
      id: "ord_100002",
      tableNumber: "7",
      time: "2026-06-16T05:50:00.000Z",
      orderStatus: "completed",
      paymentStatus: "paid",
      items: [
        { recipeId: "rec_2", title: "Butter Chicken", quantity: 1, price: 360 },
        { recipeId: "rec_4", title: "Masala Chai", quantity: 2, price: 40 },
      ],
    },
    {
      id: "ord_100003",
      tableNumber: "12",
      time: "2026-06-18T06:30:00.000Z",
      orderStatus: "new",
      paymentStatus: "pending",
      items: [
        { recipeId: "rec_2", title: "Butter Chicken", quantity: 2, price: 360, instructions: "Less spicy, extra gravy" },
        { recipeId: "rec_3", title: "Garlic Naan", quantity: 4, price: 70 },
      ],
    },
    {
      id: "ord_100004",
      tableNumber: "5",
      time: "2026-06-18T06:20:00.000Z",
      orderStatus: "ready",
      paymentStatus: "pending",
      items: [
        { recipeId: "rec_1", title: "Paneer Tikka", quantity: 1, price: 280 },
        { recipeId: "rec_4", title: "Masala Chai", quantity: 2, price: 40 },
      ],
    },
    {
      id: "ord_100005",
      tableNumber: "8",
      time: "2026-06-18T06:10:00.000Z",
      orderStatus: "preparing",
      paymentStatus: "pending",
      items: [
        { recipeId: "rec_2", title: "Butter Chicken", quantity: 1, price: 360 },
        { recipeId: "rec_3", title: "Garlic Naan", quantity: 3, price: 70, instructions: "Extra crispy" },
      ],
    },
    {
      id: "ord_100006",
      tableNumber: "2",
      time: "2026-06-18T05:55:00.000Z",
      orderStatus: "served",
      paymentStatus: "paid",
      items: [
        { recipeId: "rec_1", title: "Paneer Tikka", quantity: 2, price: 280 },
      ],
    },
    {
      id: "ord_100007",
      tableNumber: "",
      channel: "online",
      time: "2026-06-18T06:35:00.000Z",
      orderStatus: "new",
      paymentStatus: "paid",
      items: [
        { recipeId: "rec_2", title: "Butter Chicken", quantity: 1, price: 360 },
        { recipeId: "rec_3", title: "Garlic Naan", quantity: 2, price: 70 },
      ],
    },
    {
      id: "ord_100008",
      tableNumber: "",
      channel: "online",
      time: "2026-06-18T06:05:00.000Z",
      orderStatus: "ready",
      paymentStatus: "paid",
      items: [
        { recipeId: "rec_1", title: "Paneer Tikka", quantity: 1, price: 280 },
        { recipeId: "rec_4", title: "Masala Chai", quantity: 3, price: 40 },
      ],
    },
  ],
  movements: [
    {
      id: "mov_1",
      inventoryId: "inv_1",
      inventoryName: "Paneer",
      type: "restock",
      quantityChange: 5,
      unit: "kg",
      note: "Morning delivery",
      createdAt: "2026-06-16T03:00:00.000Z",
    },
  ],

  // Drives the Figma "Restaurant Owner Dashboard" screen. Pure display data —
  // edit freely to see the dashboard change.
  dashboard: {
    profile: { restaurantName: "Saffron Kitchen", userName: "Alex Mercer", role: "Owner" },
    stats: {
      totalOrders: { value: "128", delta: "+12.5% vs yesterday", up: true },
      revenue: { value: "₹2,45,675", delta: "+18.5% vs yesterday", up: true },
      liveMonitoring: { value: "12", caption: "Active interactions" },
      averageRating: { value: "4.8", caption: "Based on 2,340 reviews" },
    },
    salesOverview: {
      bars: [
        { label: "10 AM", value: 12000 },
        { label: "12 PM", value: 22000 },
        { label: "2 PM", value: 16500 },
        { label: "4 PM", value: 26000 },
        { label: "6 PM", value: 18500 },
        { label: "8 PM", value: 29000 },
        { label: "10 PM", value: 21000 },
      ],
    },
    orderBreakdown: {
      total: "128",
      segments: [
        { label: "Delivered", value: 72, percent: 56, color: "#2E7D32" },
        { label: "Preparing", value: 28, percent: 22, color: "#D9480F" },
        { label: "On The Way", value: 18, percent: 14, color: "#F2A65A" },
        { label: "Cancelled", value: 10, percent: 8, color: "#B11226" },
      ],
    },
    kitchen: {
      pills: [
        { label: "Pending", value: "5", tag: "NEW" },
        { label: "Preparing", value: "3", tag: "ACTIVE" },
        { label: "Ready", value: "4", tag: "PICKUP" },
        { label: "Completed", value: "130", tag: "TODAY" },
      ],
      queue: [
        { table: "T-12", items: "Margherita Pizza, Chicken Tikka...", status: "PAID", time: "12m ago", action: "View Bill" },
        { table: "T-05", items: "Chicken Tikka, Mango Lassi, Mu...", status: "PENDING", time: "4m ago" },
        { table: "T-08", items: "Paneer Butter Masala, 10 Naan...", status: "PREPARING", time: "15m ago" },
        { table: "T-22", items: "Hyderabadi Chicken Biryani", status: "READY TO SERVE", time: "1m ago" },
      ],
    },
    topSelling: [
      { name: "Hyderabadi Chicken Biryani", orders: "128 Orders", price: "₹32,450" },
      { name: "Murgh Makhani (Butter Chicken)", orders: "96 Orders", price: "₹26,880" },
      { name: "Paneer Tikka Masala", orders: "84 Orders", price: "₹21,000" },
      { name: "Hyderabadi Chicken Biryani", orders: "128 Orders", price: "₹32,450" },
    ],
    recentOrders: [
      { id: "#ORD-4098", time: "10:45 AM", items: "2x Paneer Tikka, 1x Naan...", status: "Delivered" },
      { id: "#ORD-4099", time: "10:52 AM", items: "1x Butter Chicken, 2x Roti", status: "On The Way" },
      { id: "#ORD-4100", time: "11:05 AM", items: "3x Dal Makhani, 1x Rice", status: "Preparing" },
      { id: "#ORD-4097", time: "10:30 AM", items: "1x Mutton Biryani", status: "Cancelled" },
    ],
  },

  // Drives the Bill Details screen (/bill) — Figma node 173:1047. Table-wise
  // bill with batched orders, tax/charge summary, and a GST invoice preview.
  billDetails: {
    orderId: "ord_100001",
    paymentStatus: "pending",
    table: "T-10",
    status: "Ready To Bill",
    startedAt: "7:12 PM",
    waiter: "Rahul",
    totalItems: 14,
    totalBatches: 2,
    totalPayable: "₹2,316",
    batches: [
      {
        id: 1,
        time: "7:12 PM",
        status: "PREPARED",
        total: "₹1,060",
        items: [
          { qty: 2, name: "Hyderabadi Chicken Biryani", price: "₹640" },
          { qty: 4, name: "Butter Naan", price: "₹160", tag: "NEW" },
          { qty: 1, name: "Chicken Tikka", price: "₹280" },
        ],
      },
      {
        id: 2,
        time: "8:05 PM",
        status: "PREPARED",
        total: "₹720",
        items: [
          { qty: 2, name: "Chocolate Brownie", price: "₹240" },
          { qty: 2, name: "Cold Coffee", price: "₹300" },
          { qty: 1, name: "French Fries", price: "₹180" },
        ],
      },
    ],
    summary: {
      rows: [
        { label: "Subtotal", value: "₹2,148" },
        { label: "GST (5%)", value: "₹89" },
        { label: "Service Charge (10%)", value: "₹179" },
      ],
      offer: { label: "WELCOME10 APPLIED", value: "−₹100" },
      grandTotal: "₹2,316",
    },
    invoice: {
      restaurant: {
        name: "The Grand Bistro Pvt Ltd",
        gstin: "27AAAAA0000A1Z5",
        address: "Hitech City, Hyderabad, 500081",
      },
      meta: { date: "24 May 2026", time: "20:31:04", posTerminal: "HUB-04" },
      image: "/menu/hyderabadi-biryani.png",
      disclaimer:
        "Computer-generated invoice. No signature required. Thank you for dining with us! For feedback, visit grandbistro.com/feedback.",
    },
  },

  // Drives the Figma "Menu Management" screen (node 186:2680).
  menuManagement: {
    item: {
      name: "Hyderabadi Chicken Biryani",
      description: "Authentic dum biryani with tender chicken.",
      descriptionMax: 200,
      prepTime: "20 min",
      prepTimeOptions: ["10 min", "15 min", "20 min", "25 min", "30 min"],
      categories: ["Biryani", "Main Course", "Starters", "Desserts"],
      activeCategory: "Biryani",
      subCategories: ["Aromatic Biryani", "Chef's choice", "Veg Biryani"],
      activeSubCategory: "Aromatic Biryani",
      foodTypes: ["Veg", "Non-Veg", "Vegan"],
      activeFoodType: "Veg",
      sellingPrice: 299,
      discountedPrice: 0,
    },
    ingredients: [
      { id: "ing_1", name: "Chicken", quantity: 250, unit: "gm", cost: 65 },
      { id: "ing_2", name: "Rice", quantity: 180, unit: "gm", cost: 18 },
    ],
    addons: [
      { id: "add_1", name: "Extra Raita", note: "Side Dish", price: 30, enabled: true },
      { id: "add_2", name: "Double Chicken", note: "Extra Portion", price: 80, enabled: true },
    ],
    currentItems: [
      { id: "mi_1", name: "Hyderabadi Chicken Biryani", category: "Main Course", price: "$18.50", prep: "25 min prep", foodType: "NON-VEG", available: true, image: "/menu/hyderabadi-biryani.png" },
      { id: "mi_2", name: "Paneer Butter Masala", category: "Main Course", price: "$14.00", prep: "20 min prep", foodType: "VEG", available: true, image: "/menu/paneer-butter-masala.png" },
      { id: "mi_3", name: "Margherita Pizza", category: "Main Course", price: "$12.50", prep: "15 min prep", foodType: "VEG", available: false, image: "/menu/margherita-pizza.png" },
      { id: "mi_4", name: "Chicken Tikka", category: "Starter", price: "$10.00", prep: "15 min prep", foodType: "NON-VEG", available: true, image: "/menu/chicken-tikka.png" },
      { id: "mi_5", name: "Mango Lassi", category: "Beverage", price: "$4.50", prep: "5 min prep", foodType: "VEG", available: true, image: "/menu/mango-lassi.png" },
      { id: "mi_6", name: "Chocolate Brownie", category: "Dessert", price: "$6.00", prep: "10 min prep", foodType: "VEG", available: true, image: "/menu/chocolate-brownie.png" },
    ],
  },

  // Drives the QR Management screen (/qr). Tables/counters with QR codes that
  // can be generated, downloaded, activated, and deactivated (PRD §6, §16).
  qrCodes: [
    { id: "qr_1", label: "Table 1", type: "table", context: "T-01", active: true, scans: 142, createdAt: "2026-05-02T10:00:00.000Z" },
    { id: "qr_2", label: "Table 2", type: "table", context: "T-02", active: true, scans: 98, createdAt: "2026-05-02T10:05:00.000Z" },
    { id: "qr_3", label: "Table 3", type: "table", context: "T-03", active: false, scans: 12, createdAt: "2026-05-02T10:08:00.000Z" },
    { id: "qr_4", label: "Counter 1", type: "counter", context: "C-01", active: true, scans: 210, createdAt: "2026-05-04T09:00:00.000Z" },
    { id: "qr_5", label: "Takeaway", type: "counter", context: "TA", active: true, scans: 64, createdAt: "2026-05-06T09:00:00.000Z" },
    { id: "qr_6", label: "Restaurant", type: "restaurant", context: "", active: true, scans: 530, createdAt: "2026-04-20T09:00:00.000Z" },
  ],

  // Drives the Offers & Coupons screen (/offers) — PRD §17. Figma node 149:7.
  offers: [
    { id: "off_1", name: "Table 12 Discount", type: "coupon", code: "12LOCAL", discountType: "percent", discountValue: 50, item: "", minOrder: 0, applicableFor: "dine-in", validFrom: "2026-06-01", validTo: "2026-06-30", status: "active", description: "Flat discount for our table-12 regulars.", image: "" },
    { id: "off_2", name: "Welcome Drink", type: "automatic", code: "", discountType: "free_item", discountValue: 0, item: "Mango Lassi", minOrder: 300, applicableFor: "both", validFrom: "2026-06-01", validTo: "2026-12-31", status: "active", description: "Complimentary welcome drink on orders above ₹300.", image: "" },
    { id: "off_3", name: "Mother's Day", type: "coupon", code: "MOM2024", discountType: "percent", discountValue: 20, item: "", minOrder: 0, applicableFor: "both", validFrom: "2026-05-01", validTo: "2026-05-14", status: "scheduled", description: "20% off to celebrate Mother's Day.", image: "" },
    { id: "off_4", name: "Winter Special", type: "coupon", code: "WINTER010", discountType: "flat", discountValue: 100, item: "", minOrder: 500, applicableFor: "delivery", validFrom: "2025-12-01", validTo: "2025-12-31", status: "expired", description: "₹100 off winter combo meals.", image: "" },
  ],
  offerMeta: {
    items: ["Gourmet Sundae", "Mango Lassi", "Garlic Naan", "Paneer Tikka", "Masala Chai"],
  },

  // Drives the Cancellations screen (/cancellations) — PRD §9.3.
  cancellations: [
    { id: "cxl_1", orderId: "ord_100020", table: "T-12", type: "request", status: "pending", reason: "Customer changed their mind", amount: 540, requestedBy: "Customer", time: "2026-06-18T05:40:00.000Z" },
    { id: "cxl_2", orderId: "ord_100018", table: "T-05", type: "request", status: "pending", reason: "Ordered wrong item", amount: 280, requestedBy: "Customer", time: "2026-06-18T05:20:00.000Z" },
    { id: "cxl_3", orderId: "ord_100012", table: "C-01", type: "cancelled", status: "approved", reason: "Item unavailable in kitchen", amount: 360, requestedBy: "Manager", time: "2026-06-17T12:10:00.000Z" },
    { id: "cxl_4", orderId: "ord_100009", table: "T-08", type: "rejected", status: "rejected", reason: "Restaurant closed for the day", amount: 120, requestedBy: "Manager", time: "2026-06-17T15:30:00.000Z" },
  ],

  // Drives the Store Settings screen (/store-settings) — PRD §13.1. Figma 151:602.
  storeSettings: {
    name: "The Crimson Bistro",
    cuisineType: "Contemporary French",
    email: "contact@crimsonbistro.com",
    phone: "+91 98765 43210",
    website: "https://crimsonbistro.com",
    establishedYear: "2018",
    address: "1248 Gourmet Way, Culinary District, Metro City 90210",
    hours: [
      { day: "Monday", open: "09:00", close: "23:00", closed: false },
      { day: "Tuesday", open: "09:00", close: "23:00", closed: false },
      { day: "Wednesday", open: "09:00", close: "23:00", closed: false },
      { day: "Thursday", open: "09:00", close: "23:00", closed: false },
      { day: "Friday", open: "09:00", close: "23:30", closed: false },
      { day: "Saturday", open: "09:00", close: "23:30", closed: false },
      { day: "Sunday", open: "10:00", close: "22:00", closed: true },
    ],
    delivery: { radiusKm: "12", baseCharge: "5.00", freeThreshold: "75.00", estimatedTime: "30-45 min" },
    business: { legalEntityType: "LLC", registrationNo: "REG-9912002", gstNumber: "27AAQCB2148P1ZT" },
    licenses: { healthPermitId: "H-892-B", licenseExpiry: "2026-12-31" },
  },

  // Drives the Customer QR ordering app (/order/*) — PRD §5–§9.
  customerMenu: {
    restaurant: {
      id: "rest_1",
      name: "Spice Garden",
      tagline: "Authentic North Indian cuisine",
      status: "open",
      rating: 4.7,
      reviews: 2340,
      address: "42 MG Road, Bengaluru",
      timing: "11:00 AM – 11:00 PM",
    },
    categories: ["Recommended", "Biryani", "Main Course", "Starters", "Beverages", "Desserts"],
    items: [
      { id: "cm_1", name: "Hyderabadi Chicken Biryani", description: "Authentic dum biryani with tender chicken, saffron and fried onions.", price: 320, category: "Biryani", foodType: "non-veg", image: "/menu/hyderabadi-biryani.png", available: true, popular: true, rating: 4.8 },
      { id: "cm_2", name: "Veg Biryani", description: "Fragrant basmati rice layered with seasonal vegetables and spices.", price: 240, category: "Biryani", foodType: "veg", image: "/menu/veg-biryani.png", available: true, popular: false, rating: 4.5 },
      { id: "cm_3", name: "Paneer Butter Masala", description: "Cottage cheese cubes in a rich, creamy tomato gravy.", price: 280, category: "Main Course", foodType: "veg", image: "/menu/paneer-butter-masala.png", available: true, popular: true, rating: 4.6 },
      { id: "cm_4", name: "Butter Chicken", description: "Char-grilled chicken simmered in a velvety makhani sauce.", price: 360, category: "Main Course", foodType: "non-veg", image: "/menu/butter-chicken.png", available: true, popular: true, rating: 4.9 },
      { id: "cm_5", name: "Chicken Tikka", description: "Smoky, marinated chicken chunks grilled in the tandoor.", price: 260, category: "Starters", foodType: "non-veg", image: "/menu/chicken-tikka.png", available: true, popular: false, rating: 4.4 },
      { id: "cm_6", name: "Paneer Tikka", description: "Spiced cottage cheese skewered with peppers and onions.", price: 240, category: "Starters", foodType: "veg", image: "/menu/paneer-tikka.png", available: false, popular: false, rating: 4.3 },
      { id: "cm_7", name: "Garlic Naan", description: "Soft tandoori flatbread brushed with garlic and butter.", price: 70, category: "Main Course", foodType: "veg", image: "/menu/garlic-naan.png", available: true, popular: false, rating: 4.7 },
      { id: "cm_8", name: "Mango Lassi", description: "Chilled yogurt smoothie blended with sweet Alphonso mango.", price: 120, category: "Beverages", foodType: "veg", image: "/menu/mango-lassi.png", available: true, popular: true, rating: 4.6 },
      { id: "cm_9", name: "Masala Chai", description: "Spiced milk tea brewed with cardamom and ginger.", price: 40, category: "Beverages", foodType: "veg", image: "/menu/masala-chai.png", available: true, popular: false, rating: 4.5 },
      { id: "cm_10", name: "Gulab Jamun", description: "Warm milk-solid dumplings soaked in rose-cardamom syrup.", price: 90, category: "Desserts", foodType: "veg", image: "/menu/gulab-jamun.png", available: true, popular: false, rating: 4.8 },
    ],
  },

  // Customer-facing active offers shown in the QR app (subset of `offers`).
  customerOffers: [
    { id: "coff_1", title: "20% off Main Course", description: "Flat 20% off on all main course dishes this weekend.", code: "WEEKEND20", tag: "Limited time" },
    { id: "coff_2", title: "Mango Lassi @ ₹105", description: "₹15 off every Mango Lassi between 3–6 PM.", code: "LASSI15", tag: "Happy hour" },
  ],

  // Customer assistance requests (PRD §11.3, §18). Raised by customers, resolved
  // by waiters/managers. Status flow: open → acknowledged → resolved.
  customerRequests: [
    { id: "req_1", table: "5", type: "water", note: "", status: "open", mobile: "9876500005", time: "2026-06-18T06:40:00.000Z" },
    { id: "req_2", table: "12", type: "bill", note: "Paying by card", status: "acknowledged", mobile: "9876500012", time: "2026-06-18T06:32:00.000Z" },
    { id: "req_3", table: "8", type: "cleaning", note: "", status: "open", mobile: "9876500008", time: "2026-06-18T06:28:00.000Z" },
  ],

  // Kitchen alerts — chefs report an item unavailable, manager decides the
  // customer-facing action (PRD §10.2 CHEF-06, §12.3).
  kitchenAlerts: [],

  // Restaurant tables for manager floor management (PRD §16.1). Status flow:
  // available → occupied → preparing → served → cleaning → available.
  restaurantTables: [
    { id: "tbl_1", number: "T-01", seats: 2, status: "available", waiter: "", active: true },
    { id: "tbl_2", number: "T-02", seats: 4, status: "occupied", waiter: "Sunil Verma", active: true },
    { id: "tbl_3", number: "T-05", seats: 4, status: "preparing", waiter: "Sunil Verma", active: true },
    { id: "tbl_4", number: "T-08", seats: 6, status: "preparing", waiter: "Sunil Verma", active: true },
    { id: "tbl_5", number: "T-12", seats: 2, status: "occupied", waiter: "Anita Desai", active: true },
    { id: "tbl_6", number: "T-07", seats: 4, status: "cleaning", waiter: "", active: true },
    { id: "tbl_7", number: "T-09", seats: 8, status: "available", waiter: "", active: true },
    { id: "tbl_8", number: "T-15", seats: 4, status: "inactive", waiter: "", active: false },
  ],

  // Drives the Manager Live Monitoring screen (/manager/live) — Figma node 173:544.
  managerLiveMonitoring: {
    stats: {
      activeVisitors: 28,
      itemsViewed: 154,
      ordersPlaced: 12,
      liveRevenue: 18450,
      qrScans: 86,
    },
    activeVisitors: [
      { id: "av_1", name: "Alex Sharma", phone: "+91 98765 43210", email: "alex.s@email.com", interestedIn: ["Hyderabadi Biryani", "Mango Lassi"], cartValue: 850, timeActive: "2 min", intentScore: 86 },
      { id: "av_2", name: "Priya Verma", phone: "+91 99887 76655", email: "priya.v@email.com", interestedIn: ["Paneer Tikka"], cartValue: 420, timeActive: "5 min", intentScore: 64 },
      { id: "av_3", name: "Rohan Gupta", phone: "+91 91234 56780", email: "rohan.g@email.com", interestedIn: ["Butter Chicken", "Garlic Naan"], cartValue: 1250, timeActive: "1 min", intentScore: 92 },
    ],
    repeatVisitors: [
      { id: "rv_1", name: "Rahul Sharma", favoriteDishes: ["Butter Chicken", "Garlic Naan"], visits: 12, lastVisit: "2 days ago", status: "VIP", lifetimeValue: 19450 },
      { id: "rv_2", name: "Priya Nair", favoriteDishes: ["Paneer Tikka", "Masala Chai"], visits: 8, lastVisit: "5d ago", status: "Regular", lifetimeValue: 9280 },
      { id: "rv_3", name: "Rohan Gupta", favoriteDishes: ["Hyderabadi Biryani"], visits: 23, lastVisit: "1 day ago", status: "VIP", lifetimeValue: 32750 },
    ],
  },

  // Drives the Profile screen (/profile) — owner account + preferences.
  ownerProfile: {
    name: "Aman Gupta",
    email: "owner@yulo.test",
    phone: "+91 91234 56789",
    role: "Restaurant Owner",
    joinedAt: "2025-11-12T09:00:00.000Z",
    notifications: { newOrders: true, cancellations: true, lowStock: true, dailyReport: false },
  },

  // Drives the Platform Admin Portal (/admin/*) — PRD §14.
  admin: {
    stats: {
      totalRestaurants: 48,
      activeRestaurants: 41,
      inactiveRestaurants: 7,
      totalCustomers: 12840,
      totalOrders: 38219,
      activeOffers: 23,
    },
    health: [
      { name: "API", status: "operational" },
      { name: "Database", status: "operational" },
      { name: "OTP Provider", status: "degraded" },
      { name: "Notification Queue", status: "operational" },
    ],
    restaurants: [
      { id: "rest_1", name: "Spice Garden", owner: "Aman Gupta", ownerEmail: "owner@yulo.test", city: "Bengaluru", status: "active", plan: "Pro", orders: 1284, joinedAt: "2025-11-12" },
      { id: "rest_2", name: "The Crimson Bistro", owner: "Neha Rao", ownerEmail: "neha@crimson.in", city: "Mumbai", status: "active", plan: "Pro", orders: 932, joinedAt: "2026-01-04" },
      { id: "rest_3", name: "Tandoori Nights", owner: "Imran Khan", ownerEmail: "imran@tandoori.in", city: "Delhi", status: "active", plan: "Starter", orders: 671, joinedAt: "2026-02-18" },
      { id: "rest_4", name: "Coastal Curry", owner: "Maria Pinto", ownerEmail: "maria@coastal.in", city: "Goa", status: "inactive", plan: "Starter", orders: 88, joinedAt: "2026-03-22" },
      { id: "rest_5", name: "Urban Tadka", owner: "Vikram Singh", ownerEmail: "vikram@urban.in", city: "Pune", status: "active", plan: "Pro", orders: 1450, joinedAt: "2025-09-30" },
      { id: "rest_6", name: "Green Bowl", owner: "Anita Desai", ownerEmail: "anita@greenbowl.in", city: "Hyderabad", status: "inactive", plan: "Starter", orders: 12, joinedAt: "2026-05-01" },
    ],
    users: [
      { id: "u_1", name: "Aman Gupta", contact: "owner@yulo.test", role: "owner", restaurant: "Spice Garden", status: "active" },
      { id: "u_2", name: "Ravi Kumar", contact: "chef01", role: "chef", restaurant: "Spice Garden", status: "active" },
      { id: "u_3", name: "Sunil Verma", contact: "waiter01", role: "waiter", restaurant: "Spice Garden", status: "active" },
      { id: "u_4", name: "Neha Rao", contact: "neha@crimson.in", role: "owner", restaurant: "The Crimson Bistro", status: "active" },
      { id: "u_5", name: "Alex Mercy", contact: "alex@crimson.in", role: "manager", restaurant: "The Crimson Bistro", status: "active" },
      { id: "u_6", name: "Priya Nair", contact: "+91 99887 76655", role: "customer", restaurant: "—", status: "active" },
      { id: "u_7", name: "Rahul Sharma", contact: "+91 98765 43210", role: "customer", restaurant: "—", status: "active" },
      { id: "u_8", name: "Maria Pinto", contact: "maria@coastal.in", role: "owner", restaurant: "Coastal Curry", status: "disabled" },
    ],
    roles: [
      { id: "role_owner", name: "Owner", description: "Full restaurant business control.", members: 48, permissions: ["Manage menu", "Manage offers", "Manage staff", "View reports", "QR setup"] },
      { id: "role_manager", name: "Manager", description: "Live operations and staff oversight.", members: 36, permissions: ["Manage orders", "Manage tables", "Menu availability", "Instant offers"] },
      { id: "role_chef", name: "Chef", description: "Kitchen preparation only.", members: 92, permissions: ["View kitchen orders", "Update prep status", "Report item unavailable"] },
      { id: "role_waiter", name: "Waiter", description: "Table service and manual orders.", members: 110, permissions: ["View assigned tables", "Mark served", "Place manual order"] },
      { id: "role_admin", name: "Platform Admin", description: "System-wide configuration.", members: 4, permissions: ["Manage restaurants", "Manage users", "System settings", "View audit logs"] },
    ],
    orders: [
      { id: "ord_a1", restaurant: "Spice Garden", customer: "Priya N.", amount: 640, status: "preparing", time: "2026-06-18T06:30:00.000Z" },
      { id: "ord_a2", restaurant: "Urban Tadka", customer: "Vikram S.", amount: 1280, status: "completed", time: "2026-06-18T06:10:00.000Z" },
      { id: "ord_a3", restaurant: "The Crimson Bistro", customer: "Rahul S.", amount: 420, status: "ready", time: "2026-06-18T06:05:00.000Z" },
      { id: "ord_a4", restaurant: "Tandoori Nights", customer: "Sara M.", amount: 980, status: "cancelled", time: "2026-06-18T05:40:00.000Z" },
      { id: "ord_a5", restaurant: "Spice Garden", customer: "Imran K.", amount: 360, status: "new", time: "2026-06-18T06:35:00.000Z" },
    ],
    offers: [
      { id: "aoff_1", restaurant: "Spice Garden", title: "Weekend Feast", type: "Coupon", discount: "20% Off", status: "active", validTo: "2026-06-30" },
      { id: "aoff_2", restaurant: "Urban Tadka", title: "Free Lassi", type: "Automatic", discount: "Free Item", status: "active", validTo: "2026-07-15" },
      { id: "aoff_3", restaurant: "Coastal Curry", title: "Mega 90% Off", type: "Coupon", discount: "90% Off", status: "flagged", validTo: "2026-06-25" },
      { id: "aoff_4", restaurant: "Tandoori Nights", title: "Winter Combo", type: "Coupon", discount: "₹100 Off", status: "expired", validTo: "2025-12-31" },
    ],
    qr: [
      { id: "aqr_1", restaurant: "Spice Garden", label: "Table 1", table: "T-01", active: true, scans: 142, createdAt: "2026-05-02" },
      { id: "aqr_2", restaurant: "Spice Garden", label: "Table 2", table: "T-02", active: true, scans: 98, createdAt: "2026-05-02" },
      { id: "aqr_3", restaurant: "Spice Garden", label: "Counter 1", table: "C-01", active: true, scans: 210, createdAt: "2026-05-04" },
      { id: "aqr_4", restaurant: "The Crimson Bistro", label: "Table 1", table: "T-01", active: true, scans: 64, createdAt: "2026-01-06" },
      { id: "aqr_5", restaurant: "The Crimson Bistro", label: "Table 2", table: "T-02", active: false, scans: 9, createdAt: "2026-01-06" },
      { id: "aqr_6", restaurant: "Urban Tadka", label: "Table 5", table: "T-05", active: true, scans: 188, createdAt: "2025-10-01" },
    ],
    activity: [
      { id: "log_1", user: "admin@yulo.test", role: "admin", action: "Deactivated restaurant", entity: "Coastal Curry", time: "2026-06-18T06:20:00.000Z", ip: "10.0.2.14" },
      { id: "log_2", user: "neha@crimson.in", role: "owner", action: "Created offer", entity: "Free Lassi", time: "2026-06-18T05:50:00.000Z", ip: "10.0.4.91" },
      { id: "log_3", user: "admin@yulo.test", role: "admin", action: "Assigned owner", entity: "Green Bowl → Anita Desai", time: "2026-06-17T14:02:00.000Z", ip: "10.0.2.14" },
      { id: "log_4", user: "alex@crimson.in", role: "manager", action: "Cancelled order", entity: "#ORD-7741", time: "2026-06-17T12:30:00.000Z", ip: "10.0.4.55" },
      { id: "log_5", user: "admin@yulo.test", role: "admin", action: "Updated OTP settings", entity: "System Settings", time: "2026-06-16T09:15:00.000Z", ip: "10.0.2.14" },
    ],
    settings: {
      otp: { length: 4, expiryMinutes: 5, resendCooldown: 30, maxAttempts: 5 },
      notifications: { newRestaurant: true, orderSpikes: true, offerExpiry: true, systemHealth: true },
    },
  },
};

export function createSeed() {
  return clone(SEED);
}
