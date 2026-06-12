/**
 * Wolf Society - Supabase Integration Pipeline
 * Manages connections, credentials caching, and local storage fallback arrays.
 */

// Retrieve keys from LocalStorage (allows direct preview configurations) or default templates
const cachedUrl = localStorage.getItem("https://tdfkebgapncswtvbtaqy.supabase.co") || "";
const cachedKey = localStorage.getItem("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZmtlYmdhcG5jc3d0dmJ0YXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTg3MzUsImV4cCI6MjA5NjMzNDczNX0.Aj-GtD5sPCtuHWmZ5ZClSStwa3-b6ENtXr0uYaV-UzQ") || "";

// Export globally accessible variables
window.SUPABASE_URL = cachedUrl || "";
window.SUPABASE_ANON_KEY = cachedKey || "";

// Initialize client if credentials are set
window.supabaseClient = null;

if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
  try {
    // Check ifsupabase CDN load status is safe
    if (typeof supabase !== 'undefined') {
      window.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      console.log("Supabase Client gracefully initiated.");
    } else {
      console.error("Supabase CDN script was not loaded. Please verify connection.");
    }
  } catch (err) {
    console.error("Supabase Client initialization crashed:", err);
  }
} else {
  console.log("Supabase Pipeline offline. Falling back to local offline cache.");
}

// Global helper to store mock database state to keep the experience active
const getLocalData = (key, defaultVal) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Storage write error:", e);
  }
};

window.wolfDb = {
  // Recruitment records backup
  getRecruitments: async () => {
    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('recruitment')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return { data, source: 'supabase' };
        console.warn("Supabase fetch failed, loading local fallback data:", error);
      } catch (e) {
        console.warn("Supabase exception, loading local fallback:", e);
      }
    }
    // Fallback data
    const list = getLocalData("WOLF_RECRUITS", [
      {
        id: "mock-1",
        name: "Marcus Vance",
        email: "marcus@vance.io",
        role: "Lead Strategist",
        experience: "6 years in esports arena design and custom team operations.",
        portfolio: "https://vance.io",
        motivation: "Desire to upgrade my systems, tactics, and guild alignment with Wolf protocols.",
        status: "pending",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: "mock-2",
        name: "Elena Rostova",
        email: "elena@rostov-design.ru",
        role: "Digital Designer",
        experience: "3 years creating high-contrast website mockups and branding assets.",
        portfolio: "https://behance.net/rostov",
        motivation: "The premium black-and-gold visual theme of Wolf inspired me to apply.",
        status: "approved",
        created_at: new Date(Date.now() - 3600000 * 48).toISOString()
      }
    ]);
    return { data: list, source: 'local' };
  },

  submitRecruitment: async (formData) => {
    const record = {
      ...formData,
      status: "pending",
      created_at: new Date().toISOString()
    };

    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('recruitment')
          .insert([record])
          .select();
        
        if (!error) {
          return { success: true, source: 'supabase', data };
        }
        console.error("Supabase write failed, details:", error);
        return { success: false, error: error.message, source: 'local_fallback' };
      } catch (e) {
        console.error("Supabase write exception, details:", e);
        return { success: false, error: String(e), source: 'local_fallback' };
      }
    }

    // Save to local storage for instant demo validation
    const list = getLocalData("WOLF_RECRUITS", []);
    record.id = "local-" + Date.now();
    list.unshift(record);
    setLocalData("WOLF_RECRUITS", list);
    return { success: true, source: 'local', data: record };
  },

  updateRecruitmentStatus: async (id, status) => {
    if (window.supabaseClient) {
      try {
        const { error } = await window.supabaseClient
          .from('recruitment')
          .update({ status: status })
          .eq('id', id);
        if (!error) return { success: true, source: 'supabase' };
      } catch (e) {
        console.error(e);
      }
    }

    // fallback
    const list = getLocalData("WOLF_RECRUITS", []);
    const item = list.find(r => String(r.id) === String(id));
    if (item) {
      item.status = status;
      setLocalData("WOLF_RECRUITS", list);
      return { success: true, source: 'local' };
    }
    return { success: false };
  },

  deleteRecruitment: async (id) => {
    if (window.supabaseClient) {
      try {
        const { error } = await window.supabaseClient
          .from('recruitment')
          .delete()
          .eq('id', id);
        if (!error) return { success: true, source: 'supabase' };
      } catch (e) {
        console.error(e);
      }
    }

    // fallback
    let list = getLocalData("WOLF_RECRUITS", []);
    list = list.filter(r => String(r.id) !== String(id));
    setLocalData("WOLF_RECRUITS", list);
    return { success: true, source: 'local' };
  },

  // Contact records backup
  getContacts: async () => {
    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('contact')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return { data, source: 'supabase' };
      } catch (e) {
        console.warn(e);
      }
    }

    const list = getLocalData("WOLF_CONTACTS", [
      {
        id: "mock-c1",
        name: "Reginald Lycan",
        email: "reginald@wolf-command.org",
        subject: "Sponsorship Inquiry",
        message: "We'd love to fund your next esports bracket. Please review our alignment protocol.",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ]);
    return { data: list, source: 'local' };
  },

  submitContact: async (formData) => {
    const record = {
      ...formData,
      created_at: new Date().toISOString()
    };

    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('contact')
          .insert([record])
          .select();
        if (!error) {
          return { success: true, source: 'supabase', data };
        }
        console.error("Supabase write failed, details:", error);
        return { success: false, error: error.message, source: 'local_fallback' };
      } catch (e) {
        console.error(e);
        return { success: false, error: String(e), source: 'local_fallback' };
      }
    }

    const list = getLocalData("WOLF_CONTACTS", []);
    record.id = "local-" + Date.now();
    list.unshift(record);
    setLocalData("WOLF_CONTACTS", list);
    return { success: true, source: 'local', data: record };
  },

  deleteContact: async (id) => {
    if (window.supabaseClient) {
      try {
        const { error } = await window.supabaseClient
          .from('contact')
          .delete()
          .eq('id', id);
        if (!error) return { success: true, source: 'supabase' };
      } catch (e) {
        console.error(e);
      }
    }

    let list = getLocalData("WOLF_CONTACTS", []);
    list = list.filter(c => String(c.id) !== String(id));
    setLocalData("WOLF_CONTACTS", list);
    return { success: true, source: 'local' };
  },

  // User Accounts
  getUsers: async () => {
    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('wolf_users')
          .select('*');
        if (!error && data) return { data, source: 'supabase' };
      } catch (e) {
        console.warn("Supabase getUsers exception:", e);
      }
    }
    const list = getLocalData("WOLF_USERS", []);
    return { data: list, source: 'local' };
  },

  submitUser: async (userData) => {
    const record = {
      ...userData,
      created_at: new Date().toISOString()
    };

    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('wolf_users')
          .insert([record])
          .select();
        if (!error) return { success: true, source: 'supabase', data: data[0] };
        console.error("Supabase submitUser fail:", error);
      } catch (e) {
        console.error("Supabase submitUser exception:", e);
      }
    }

    const list = getLocalData("WOLF_USERS", []);
    record.id = "local-" + Date.now();
    list.push(record);
    setLocalData("WOLF_USERS", list);
    return { success: true, source: 'local', data: record };
  },

  // Store pre-orders
  getOrders: async () => {
    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('store_order')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return { data, source: 'supabase' };
      } catch (e) {
        console.warn("Supabase getOrders exception:", e);
      }
    }
    const list = getLocalData("WOLF_ORDERS", [
      {
        id: "mock-o1",
        name: "KaiKishi",
        email: "admin@wolfsociety.in",
        phone: "+91 99002 21100",
        address: "Wolf Mansion, Bengaluru, IND",
        items: JSON.stringify([{ id: "pro-kit", size: "L", quantity: 1 }]),
        subtotal: 2500,
        discount: 500,
        grand_total: 2000,
        status: "shipped",
        tx_hash: "MK-PRO-A1B2C3",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ]);
    return { data: list, source: 'local' };
  },

  submitOrder: async (orderData) => {
    const record = {
      ...orderData,
      status: "pending",
      created_at: new Date().toISOString()
    };

    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('store_order')
          .insert([record])
          .select();
        if (!error) return { success: true, source: 'supabase', data: data[0] };
        console.error("Supabase submitOrder fail:", error);
      } catch (e) {
        console.error("Supabase submitOrder exception:", e);
      }
    }

    const list = getLocalData("WOLF_ORDERS", []);
    record.id = "local-" + Date.now();
    list.unshift(record);
    setLocalData("WOLF_ORDERS", list);
    return { success: true, source: 'local', data: record };
  },

  updateOrderStatus: async (id, status) => {
    if (window.supabaseClient) {
      try {
        const { error } = await window.supabaseClient
          .from('store_order')
          .update({ status: status })
          .eq('id', id);
        if (!error) return { success: true, source: 'supabase' };
      } catch (e) {
        console.error(e);
      }
    }

    const list = getLocalData("WOLF_ORDERS", []);
    const item = list.find(o => String(o.id) === String(id));
    if (item) {
      item.status = status;
      setLocalData("WOLF_ORDERS", list);
      return { success: true, source: 'local' };
    }
    return { success: false };
  },

  deleteOrder: async (id) => {
    if (window.supabaseClient) {
      try {
        const { error } = await window.supabaseClient
          .from('store_order')
          .delete()
          .eq('id', id);
        if (!error) return { success: true, source: 'supabase' };
      } catch (e) {
        console.error(e);
      }
    }

    let list = getLocalData("WOLF_ORDERS", []);
    list = list.filter(o => String(o.id) !== String(id));
    setLocalData("WOLF_ORDERS", list);
    return { success: true, source: 'local' };
  }
};
